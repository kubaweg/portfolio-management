from typing import List, Tuple
from pydantic import BaseModel

import holidays
import calendar
from datetime import timedelta, date
from dateutil.relativedelta import relativedelta

from app import SessionLocal

from app.core.bonds.schemas.dto import (
    BondInterestPeriod,
    PeriodStatus,
    EarlyRedemptionType, 
    BondEarlyRedemption,
    BondCurrentData,
    map_coupon_frequency_to_months_step, 
    map_coupon_frequency_to_rate_frequency,
    resolve_early_redemption_type,
    BOND_TAX_RATE
)

from app.core.cash.schemas.dto import (
    CashFlowType, CashFlowInstance, CashFlow, CashFlowSummary
)

from app.schemas.domain.transactions import (
    BuyTransaction, TickerTransactions
)
from app.schemas.database.transaction import TransactionType, Transaction
from app.schemas.domain.assets import RetailBondBenchmark, InterestHandling, CouponFrequency
from app.schemas.database.macroeconomics import Inflation, InterestRate

class PortfolioBuilderResult(BaseModel):

    initial_quantity: int
    current_data: BondCurrentData
    periods: List[BondInterestPeriod]
    cash_flows: CashFlowSummary
    early_redemptions: List[BondEarlyRedemption]


class PortfolioBuilder:
    """
    Buduje obecny stan obligacji na podstawie:
        1) pierwszego zakupu,
        2) transakcji przedwczesnego wykupu

    Output: TBD
    """

    # Metoda główna
    def build(self,
            tt: TickerTransactions,
            calculation_date: date,

            nominal_value: float,
            issue_date: date,
            maturity_date: date,
            
            coupon_frequency: CouponFrequency,
            interest_handling: InterestHandling,
            initial_rate: float,

            is_indexed: bool,
            margin: float,
            benchmark: RetailBondBenchmark | None
        ) -> PortfolioBuilderResult:
        """
        tt: TickerTransactions (posortowane po dacie)
        current_price: bieżąca cena instrumentu (w walucie instrumentu)
        """

        periods = self._build_periods(
            calculation_date=calculation_date,
            issue_date=issue_date,
            maturity_date=maturity_date,
            coupon_frequency=coupon_frequency,
            interest_handling=interest_handling,
            initial_rate=initial_rate,
            is_indexed=is_indexed,
            margin=margin,
            benchmark=benchmark
        )

        periods = self._update_periods(
            periods=periods,
            calculation_date=calculation_date,
            coupon_frequency=coupon_frequency,
            nominal_value=nominal_value
        )

        early_redemptions = self._build_early_redemptions(tt=tt)
        buy_transaction, initial_quantity = self._build_buy_transactions(tt=tt)
        cash_flows = self._build_cash_flows(
            calculation_date=calculation_date,
            nominal_value=nominal_value,
            maturity_date=maturity_date,
            buy_transaction=buy_transaction, 
            periods=periods, 
            early_redemptions=early_redemptions,
            tax_rate=BOND_TAX_RATE
        )

        current_data = self._build_current_data(
            calculation_date=calculation_date,
            initial_quantity=initial_quantity,
            nominal_value=nominal_value,
            periods=periods,
            early_redemptions=early_redemptions
        )

        return PortfolioBuilderResult(
            initial_quantity=initial_quantity,
            current_data=current_data,
            periods=periods, 
            cash_flows=cash_flows, 
            early_redemptions=early_redemptions
        )
    

    # Metody pomocnicze
    def _generate_timeline(self,
            coupon_frequency: CouponFrequency, 
            issue_date: date, 
            maturity_date: date
        ) -> List[Tuple[date, date]]:
        """Generuje listę krotek (start_date, end_date) dla okresów odsetkowych."""
        dates = []
        months_step = map_coupon_frequency_to_months_step(coupon_frequency)
        
        if months_step == 0:
            return [(issue_date, maturity_date)]

        current_start = issue_date
        while current_start < maturity_date:
            current_end = current_start + relativedelta(months=months_step)
            if current_end > maturity_date:
                current_end = maturity_date
            dates.append((current_start, current_end))
            current_start = current_end
            
        return dates

    def _determine_period_status(self, calculation_date: date, start_date: date, end_date: date) -> PeriodStatus:
        """Określa status okresu względem daty obliczeń."""
        if calculation_date >= end_date:
            return PeriodStatus.PAST
        elif calculation_date < start_date:
            return PeriodStatus.FUTURE
        else:
            return PeriodStatus.CURRENT
        
    def _get_nbp_observation_date(self, period_start_date: date) -> date:
        """
        Wyznacza 10. dzień roboczy przed pierwszym dniem miesiąca kalendarzowego,
        w którym rozpoczyna się okres odsetkowy (zgodnie z listami emisyjnymi ROR/DOR).
        """
        # Ustawiamy się na 1. dniu miesiąca, w którym startuje okres
        first_day_of_month = period_start_date.replace(day=1)
        
        # Inicjalizujemy polski kalendarz świąt
        pl_holidays = holidays.PL()
        
        current_date = first_day_of_month
        working_days_counted = 0
        
        # Cofamy się w czasie, aż odliczymy 10 dni roboczych
        while working_days_counted < 10:
            current_date -= timedelta(days=1)
            # Sprawdzamy czy to dzień roboczy: pon-pt (weekday < 5) i nie ma święta
            if current_date.weekday() < 5 and current_date not in pl_holidays:
                working_days_counted += 1
                
        return current_date

    def _fetch_benchmark_value(self, target_date: date, is_indexed: bool, benchmark: RetailBondBenchmark | None) -> Tuple[float, bool]:
        """
        Pobiera wartość benchmarku z bazy danych.
        Dla NBP: największa data <= target_date.
        Dla GUS (Inflacja): odczyt z miesiąca M-2 po kluczu 'YYYY-MM'.
        """
        if not is_indexed:
            return 0.0, False

        benchmark_val = None
        is_estimated = False

        with SessionLocal() as db:

            if benchmark == RetailBondBenchmark.CPI:
                # LOGIKA BIZNESOWA (M-2): Wskaźnik z miesiąca wpadającego 2 miesiące wstecz
                target_inflation_date = target_date - relativedelta(months=2)
                
                # KWESTIA TECHNICZNA: Zamiana daty na klucz YYYY-MM
                month_key = target_inflation_date.strftime("%Y-%m")
                
                record = db.query(Inflation).filter(Inflation.month == month_key).first()
                
                if record:
                    benchmark_val = record.value
                else:
                    # Jeśli szukamy inflacji np. na rok 2028, rekordu nie będzie. 
                    # Bierzemy najświeższy odczyt z bazy jako estymację. 
                    # Sortowanie malejące po stringu 'YYYY-MM' zachowa właściwą chronologię.
                    latest_record = db.query(Inflation).order_by(Inflation.month.desc()).first()
                    benchmark_val = latest_record.value if latest_record else 0.05 # Awaryjny fallback
                    is_estimated = True
                    
            elif benchmark == RetailBondBenchmark.NBP:
                # LOGIKA BIZNESOWA: 10. dzień roboczy przed 1. dniem miesiąca startu okresu
                target_nbp_date = self._get_nbp_observation_date(target_date)
                
                # Szukamy stopy obowiązującej w wyznaczonym dniu
                record = db.query(InterestRate)\
                    .filter(InterestRate.effective_date <= target_nbp_date)\
                    .order_by(InterestRate.effective_date.desc())\
                    .first()
                if record:
                    benchmark_val = record.value
                else:
                    latest_record = db.query(InterestRate)\
                        .order_by(InterestRate.effective_date.desc())\
                        .first()
                    benchmark_val = latest_record.value if latest_record else 0.0575
                    is_estimated = True
                    
            if target_date > date.today():
                is_estimated = True

            return float(benchmark_val), is_estimated # type: ignore

    def _calculate_act_act_interest_per_bond(self, base_capital_per_bond: float, rate: float, start_date: date, end_date: date) -> float:
        """
        Wylicza odsetki dla 1 sztuki obligacji (ACT/ACT) do konkretnego dnia.
        Uwzględnia lata przestępne.
        """
        total_interest = 0.0
        current_date = start_date

        while current_date < end_date:
            current_year = current_date.year
            next_year_start = date(current_year + 1, 1, 1)
            chunk_end_date = min(end_date, next_year_start)
            
            days_in_chunk = (chunk_end_date - current_date).days
            days_in_year = 366 if calendar.isleap(current_year) else 365
            
            chunk_interest = base_capital_per_bond * rate * (days_in_chunk / days_in_year)
            total_interest += chunk_interest
            current_date = chunk_end_date
            
        return round(total_interest, 2)
    
    def _calculate_interest_per_bond(self, base_capital_per_bond: float, rate: float, frequency: int) -> float:
        """
        Oblicza odsetki dla pojedynczej obligacji wg. zasad MF (zaokrąglenie do 2 miejsc).
        """
        interest = (base_capital_per_bond * rate) / frequency
        return round(interest, 2)

    def _update_periods(
            self, 
            periods: List[BondInterestPeriod],
            calculation_date: date,
            coupon_frequency: CouponFrequency,
            nominal_value: float,
            quantity: float = 0.0
        ) -> List[BondInterestPeriod]:
        """
        Sekwencyjnie oblicza kapitał i odsetki brutto dla każdego okresu.
        Utrzymuje ścisły podział na logikę per-bond oraz agregację total.
        Wylicza również dni trwania i narosłe odsetki względem daty 'today'.
        """
        frequency = map_coupon_frequency_to_rate_frequency(coupon_frequency)

        # Inicjalizacja kapitału jednostkowego
        current_capital_per_bond = nominal_value

        for period in periods:
            # --- FAZA 1: MATEMATYKA JEDNOSTKOWA (PER BOND) ---
            period.base_capital_per_bond = current_capital_per_bond
            
            if frequency == 0:
                # Zyski liczymy co do dnia (ACT/ACT) z uwzględnieniem przedłużonego czasu
                period.gross_interest_per_bond = self._calculate_act_act_interest_per_bond(
                    base_capital_per_bond=current_capital_per_bond,
                    rate=period.interest_rate,
                    start_date=period.start_date,
                    end_date=period.end_date
                )
            else:
                # Standardowy podział na równe okresy w roku dla innych typów
                period.gross_interest_per_bond = self._calculate_interest_per_bond(
                    base_capital_per_bond=current_capital_per_bond,
                    rate=period.interest_rate,
                    frequency=frequency
                )

            # NOWE: Wyliczenie days_elapsed i accrued_interest_to_date
            if calculation_date <= period.start_date:

                # Okres jeszcze się nie zaczął
                period.days_elapsed = 0
                period.accrued_interest_to_date = 0.0

            elif calculation_date >= period.end_date:

                # Okres już się w pełni zakończył
                period.days_elapsed = period.days_total
                period.accrued_interest_to_date_per_bond = period.gross_interest_per_bond

            else:
                # Jesteśmy w trakcie trwania tego okresu
                period.days_elapsed = (calculation_date - period.start_date).days
                if period.days_total > 0:
                    fraction = period.days_elapsed / period.days_total
                    period.accrued_interest_to_date_per_bond = period.gross_interest_per_bond * fraction
                else:
                    period.accrued_interest_to_date_per_bond = 0.0

            # Obsługa kapitalizacji jednostki
            if period.is_capitalized:
                current_capital_per_bond += period.gross_interest_per_bond
                current_capital_per_bond = round(current_capital_per_bond, 2)
            
            period.ending_capital_per_bond = current_capital_per_bond

            # --- FAZA 2: AGREGACJA PORTFELA (TOTAL) ---
            period.base_capital = period.base_capital_per_bond * quantity
            period.gross_interest = period.gross_interest_per_bond * quantity
            period.ending_capital = period.ending_capital_per_bond * quantity
            period.accrued_interest_to_date = period.accrued_interest_to_date_per_bond * quantity

        return periods
    
    def _build_periods(
            self, 
            calculation_date: date,

            issue_date: date,
            maturity_date: date,
            
            coupon_frequency: CouponFrequency,
            interest_handling: InterestHandling,
            initial_rate: float,

            is_indexed: bool,
            margin: float,
            benchmark: RetailBondBenchmark | None
        ) -> List[BondInterestPeriod]:
        """
        Główna metoda budująca obiekty BondInterestPeriod na podstawie osi czasu.
        Uwzględnia logikę M-2 oraz podłogę inflacyjną.
        """
        timeline = self._generate_timeline(coupon_frequency=coupon_frequency, issue_date=issue_date, maturity_date=maturity_date)
        total_periods = len(timeline)
        
        periods: List[BondInterestPeriod] = []

        for index, (start_dt, end_dt) in enumerate(timeline, start=1):
            status = self._determine_period_status(calculation_date=calculation_date, start_date=start_dt, end_date=end_dt)
            days_total = (end_dt - start_dt).days
            
            is_capitalized = (
                interest_handling == InterestHandling.CAPITALIZATION
                and index < total_periods
            )
            
            # Zmienne pomocnicze dla kalkulacji w tym okresie
            benchmark_value = None
            is_rate_estimated = False
            calculated_interest_rate = 0.0
            margin_for_period = margin if index > 1 else 0.0

            # KROK: Wyznaczenie oprocentowania dla okresu (zależne od typu i roku)
            if index == 1:
                # Pierwszy rok / okres to zawsze stały 'initial_rate' (niezależny od benchmarku)
                calculated_interest_rate = initial_rate
            else:
                # Kolejne lata indeksowane są benchmarkiem
                benchmark_value, is_rate_estimated = self._fetch_benchmark_value(
                    target_date=start_dt, 
                    is_indexed=is_indexed, 
                    benchmark=benchmark
                )
                
                if benchmark == RetailBondBenchmark.CPI:
                    # Ochrona przed deflacją
                    effective_inflation = max(0.0, benchmark_value)
                    calculated_interest_rate = effective_inflation + margin_for_period
                
                elif benchmark == RetailBondBenchmark.NBP:
                    # LOGIKA BIZNESOWA: Ochrona przed ujemną stopą NBP
                    effective_nbp = max(0.0, benchmark_value)
                    calculated_interest_rate = effective_nbp + margin_for_period
                    
                else:
                    calculated_interest_rate = initial_rate

            # Tworzymy instancję dla konkretnego okresu
            period = BondInterestPeriod(
                period_number=index,

                start_date=start_dt,
                end_date=end_dt,

                status=status,
                days_elapsed=None,
                days_total=days_total,

                interest_rate=calculated_interest_rate,

                benchmark_value=benchmark_value or 0.0,
                is_rate_estimated=is_rate_estimated,
                margin=margin_for_period if margin_for_period is not None else 0.0,

                is_capitalized=is_capitalized,
                
                # Pola stricte kapitałowe (zależą od poprzednich okresów, więc na razie wyzerowane)
                base_capital=0.0,
                base_capital_per_bond=0.0,

                gross_interest=0.0,
                gross_interest_per_bond=0.0,

                ending_capital=0.0,
                ending_capital_per_bond=0.0,

                accrued_interest_to_date=0.0,
                accrued_interest_to_date_per_bond=0.0

            )
            
            periods.append(period)

        return periods
    
    def _build_early_redemptions(self, tt: TickerTransactions) -> List[BondEarlyRedemption]:

        early_redemptions: List[BondEarlyRedemption] = []

        with SessionLocal() as db:
            redemption_txs = db.query(Transaction).filter(Transaction.type == TransactionType.SELL and Transaction.is_early_redemption).all()

            for tx in redemption_txs:
                early_redemptions.append(
                    BondEarlyRedemption(
                        redemption_date=tx.timestamp.date(),
                        quantity=float(tx.quantity),                                        # type: ignore
                        penalty_method=resolve_early_redemption_type(tt.ticker),
                        penalty_per_unit=tx.asset.early_redemption_penalty
                    )
                )
        # dodajemy mockowy wykup, bo nie mamy żadnego rzeczywistego
        if tt.ticker == 'DOR1126':
            early_redemptions.append(
                BondEarlyRedemption(
                    redemption_date = date(2026, 6, 30),
                    quantity = 10,
                    penalty_method = EarlyRedemptionType.FEE,
                    penalty_per_unit = 2.0
                )
            )

        return early_redemptions
    
    def _build_buy_transactions(self, tt: TickerTransactions) -> Tuple[BuyTransaction, int]:
        "Filtruje transakcje, wybierając z nich wyłącznie transakcje BUY"

        buy_transactions: List[BuyTransaction] = [tx for tx in tt.transactions if tx.type == TransactionType.BUY]
        assert len(buy_transactions) == 1, "Obligacja może mieć co najwyżej jedną transakcję BUY."

        return buy_transactions[0], int(buy_transactions[0].quantity)
    
    def _get_active_quantity_at_date(
        self, 
        calculation_date: date, 
        initial_quantity: float, 
        early_redemptions: List[BondEarlyRedemption]
    ) -> int:
        """
        Zwraca ilość aktywnych obligacji na podany dzień, 
        odejmując zrealizowane do tego czasu przedterminowe wykupy.
        """
        redeemed_quantity = sum(
            r.quantity for r in early_redemptions 
            if r.redemption_date <= calculation_date
        )
        return max(0, int(initial_quantity - redeemed_quantity))

    def _get_active_period_for_date(
        self, 
        target_date: date, 
        periods: List[BondInterestPeriod]
    ) -> BondInterestPeriod:
        """
        Znajduje okres odsetkowy, w którym przypada wskazana data.
        """
        for period in periods:
            if period.start_date <= target_date <= period.end_date:
                return period
                
        raise ValueError(f"Nie znaleziono okresu odsetkowego obejmującego datę: {target_date}")

    # ################# CURRENT DATA ###############
    def _build_current_data(
        self,
        calculation_date: date,
        initial_quantity: int,
        nominal_value: float,
        periods: List[BondInterestPeriod],
        early_redemptions: List[BondEarlyRedemption],

    ) -> BondCurrentData:
        
        current_quantity = self._get_active_quantity_at_date(calculation_date, initial_quantity, early_redemptions)
        try:
            active_period = self._get_active_period_for_date(calculation_date, periods)
        except ValueError as e:
            return BondCurrentData.empty()

        accrued_today_per_bond = self._calculate_act_act_interest_per_bond(
                base_capital_per_bond=active_period.base_capital_per_bond,
                rate=active_period.interest_rate,
                start_date=active_period.start_date,
                end_date=calculation_date
            )
        
        value_gross_per_bond = nominal_value + accrued_today_per_bond
        value_gross = current_quantity * value_gross_per_bond

        return BondCurrentData(
            quantity=current_quantity,
            value_gross_per_bond=value_gross_per_bond,
            value_gross=value_gross,
            interest_rate=active_period.interest_rate,
            calculation_date=calculation_date
        )
    
    
    # ################# CASH FLOWS #################
    
    def _build_cash_flows(
        self, 
        calculation_date: date,
        nominal_value: float,
        maturity_date: date,
        buy_transaction: BuyTransaction, 
        periods: List[BondInterestPeriod], 
        early_redemptions: List[BondEarlyRedemption],
        tax_rate: float
    ) -> CashFlowSummary:
        
        # 1. Wstępna walidacja
        initial_quantity = int(buy_transaction.quantity)
        empty_cf = CashFlow(realized=[], unrealized=[], total=[])
        
        if not periods or calculation_date < periods[0].start_date or initial_quantity <= 0:
            return CashFlowSummary(gross=empty_cf, net=empty_cf)

        # 2. Ustalenie docelowej liczby sztuk
        if calculation_date > maturity_date:
            final_active_quantity = 0
        else:
            final_active_quantity = self._get_active_quantity_at_date(calculation_date, initial_quantity, early_redemptions)

        rg_list, ug_list, rn_list, un_list = [], [], [], []

        # Wewnętrzna funkcja do agregowania wyników z metod pomocniczych
        def _extend_flows(flows: Tuple[List[CashFlowInstance], ...]):
            rg_list.extend(flows[0])
            ug_list.extend(flows[1])
            rn_list.extend(flows[2])
            un_list.extend(flows[3])

        # --- A. PRZEPŁYWY ZAKUPU ---
        _extend_flows(self._build_buy_flow(
            buy_transaction, initial_quantity, final_active_quantity
        ))

        # --- B. REGULARNE ODSETKI I ZAPADALNOŚĆ ---
        _extend_flows(self._build_interest_and_maturity_flows(
            periods, calculation_date, initial_quantity, early_redemptions, final_active_quantity, nominal_value, tax_rate
        ))

        # --- C. PRZEDTERMINOWE WYKUPY ---
        _extend_flows(self._build_early_redemption_flows(
            early_redemptions, calculation_date, periods, nominal_value, final_active_quantity, tax_rate
        ))

        # --- D. BIEŻĄCA WYCENA ---
        ug, un = self._build_current_valuation_flow(
            calculation_date, periods, nominal_value, final_active_quantity, tax_rate
        )
        ug_list.extend(ug)
        un_list.extend(un)

        # --- FINALNE SORTOWANIE I SKŁADANIE W SUMMARY ---
        rg_list.sort(key=lambda cf: cf.date)
        ug_list.sort(key=lambda cf: cf.date)
        rn_list.sort(key=lambda cf: cf.date)
        un_list.sort(key=lambda cf: cf.date)
        
        gross_cf = CashFlow(
            realized=rg_list,
            unrealized=ug_list,
            total=sorted(rg_list + ug_list, key=lambda cf: cf.date)
        )
        
        net_cf = CashFlow(
            realized=rn_list,
            unrealized=un_list,
            total=sorted(rn_list + un_list, key=lambda cf: cf.date)
        )
        
        return CashFlowSummary(gross=gross_cf, net=net_cf)

    # ==========================================
    # METODY POMOCNICZE (PRIVATE)
    # ==========================================

    def _allocate_proportional_flows(
        self, 
        event_date: date, 
        gross_value: float, 
        net_value: float,
        event_quantity: int, 
        final_active_quantity: int, 
        flow_type: CashFlowType, 
        desc: str
    ) -> Tuple[List[CashFlowInstance], List[CashFlowInstance], List[CashFlowInstance], List[CashFlowInstance]]:
        """Dzieli kwoty brutto i netto na część zrealizowaną i niezrealizowaną na podstawie proporcji sztuk."""
        rg, ug, rn, un = [], [], [], []

        if event_quantity == 0:
            return rg, ug, rn, un

        def _add(val: float, target_list: List[CashFlowInstance], suffix: str):
            if abs(val) > 1e-4:
                full_desc = f"{desc} {suffix}".strip()
                target_list.append(CashFlowInstance(
                    date=event_date, value=val, flow_type=flow_type, description=full_desc
                ))

        unrealized_ratio = final_active_quantity / event_quantity
        
        ug_val = gross_value * unrealized_ratio
        rg_val = gross_value - ug_val
        
        un_val = net_value * unrealized_ratio
        rn_val = net_value - un_val

        _add(rg_val, rg, "[Zrealizowane]")
        _add(ug_val, ug, "[Niezrealizowane]")
        
        _add(rn_val, rn, "[Zrealizowane]")
        _add(un_val, un, "[Niezrealizowane]")

        return rg, ug, rn, un

    def _allocate_fully_realized_flows(
        self, 
        event_date: date, 
        gross_value: float, 
        net_value: float,
        flow_type: CashFlowType, 
        desc: str
    ) -> Tuple[List[CashFlowInstance], List[CashFlowInstance], List[CashFlowInstance], List[CashFlowInstance]]:
        """Przypisuje całą kwotę wyłącznie do przepływów zrealizowanych (np. wcześniejszy lub ostateczny wykup)."""
        rg, ug, rn, un = [], [], [], []
        
        if abs(gross_value) > 1e-4:
            rg.append(CashFlowInstance(date=event_date, value=gross_value, flow_type=flow_type, description=desc))
        if abs(net_value) > 1e-4:
            rn.append(CashFlowInstance(date=event_date, value=net_value, flow_type=flow_type, description=desc))
            
        return rg, ug, rn, un

    def _build_buy_flow(
        self, 
        buy_transaction: BuyTransaction, 
        initial_quantity: int, 
        final_active_quantity: int
    ) -> Tuple[List[CashFlowInstance], List[CashFlowInstance], List[CashFlowInstance], List[CashFlowInstance]]:
        cost_value = -buy_transaction.value_net
        is_exchange_str = "(Zamiana)" if getattr(buy_transaction, 'is_exchange', False) else "(Gotówka)"
        desc = f"Zakup {buy_transaction.quantity} szt. {is_exchange_str}"
        
        # Przy zakupie wartość brutto i netto jest tożsama
        return self._allocate_proportional_flows(
            buy_transaction.timestamp.date(), cost_value, cost_value, initial_quantity, final_active_quantity, CashFlowType.BUY, desc
        )

    def _build_interest_and_maturity_flows(
        self, 
        periods: List[BondInterestPeriod], 
        calculation_date: date, 
        initial_quantity: int, 
        early_redemptions: List[BondEarlyRedemption], 
        final_active_quantity: int,
        nominal_value: float,
        tax_rate: float
    ) -> Tuple[List[CashFlowInstance], List[CashFlowInstance], List[CashFlowInstance], List[CashFlowInstance]]:
        rg, ug, rn, un = [], [], [], []
        
        for i, period in enumerate(periods):
            if period.end_date > calculation_date:
                continue

            active_quantity = self._get_active_quantity_at_date(period.end_date, initial_quantity, early_redemptions)
            if active_quantity <= 0:
                continue 

            # Odsetki (nieskapitalizowane)
            if not period.is_capitalized and period.gross_interest_per_bond > 1e-4:
                gross_val = active_quantity * period.gross_interest_per_bond
                net_val = gross_val * (1.0 - tax_rate)
                desc = f"Wypłata odsetek (okres {period.period_number}) dla {active_quantity} szt."
                
                r_g, u_g, r_n, u_n = self._allocate_proportional_flows(
                    period.end_date, gross_val, net_val, active_quantity, final_active_quantity, CashFlowType.INTEREST, desc
                )
                rg.extend(r_g); ug.extend(u_g); rn.extend(r_n); un.extend(u_n)

            # Wykup terminowy
            if i == len(periods) - 1 and period.ending_capital_per_bond > 1e-4:
                gross_val = active_quantity * period.ending_capital_per_bond
                # Podatek płacimy tylko od zysku (wszystko to, co przekracza bazowy nominał)
                profit = max(0.0, gross_val - (active_quantity * nominal_value))
                net_val = gross_val - (profit * tax_rate)
                
                desc = f"Wykup terminowy (zapadalność) dla {active_quantity} szt."
                r_g, u_g, r_n, u_n = self._allocate_proportional_flows(
                    period.end_date, gross_val, net_val, active_quantity, final_active_quantity, CashFlowType.MATURITY, desc
                )
                rg.extend(r_g); ug.extend(u_g); rn.extend(r_n); un.extend(u_n)
                
        return rg, ug, rn, un

    def _build_early_redemption_flows(
        self, 
        early_redemptions: List[BondEarlyRedemption], 
        calculation_date: date, 
        periods: List[BondInterestPeriod], 
        nominal_value: float, 
        final_active_quantity: int,
        tax_rate: float
    ) -> Tuple[List[CashFlowInstance], List[CashFlowInstance], List[CashFlowInstance], List[CashFlowInstance]]:
        rg, ug, rn, un = [], [], [], []
        
        for redemption in early_redemptions:
            if redemption.redemption_date > calculation_date:
                continue

            active_period = self._get_active_period_for_date(redemption.redemption_date, periods)
            returned_capital = redemption.quantity * nominal_value
            
            accrued_per_bond = self._calculate_act_act_interest_per_bond(
                base_capital_per_bond=active_period.base_capital_per_bond,
                rate=active_period.interest_rate,
                start_date=active_period.start_date,
                end_date=redemption.redemption_date
            )
            accrued_total = redemption.quantity * accrued_per_bond

            # --- LOGIKA KARY ---
            penalty = 0.0
            if redemption.penalty_method == EarlyRedemptionType.FORFEIT_INTEREST:
                penalty = accrued_total
            elif redemption.penalty_method == EarlyRedemptionType.FEE:
                max_penalty = redemption.quantity * redemption.penalty_per_unit
                
                # ZASADA: Tylko w pierwszym okresie chronimy nominał (kara nie może przekroczyć narosłych odsetek).
                # W kolejnych okresach kara jest sztywna i może uszczuplić kapitał (nominal_value).
                is_first_period = (active_period.period_number == 1)
                
                if is_first_period:
                    penalty = min(accrued_total, max_penalty)
                else:
                    penalty = max_penalty

            payout_gross = returned_capital + accrued_total - penalty
            
            # Zysk do opodatkowania:
            # Jeśli payout_gross < returned_capital (kara zjadła część kapitału), 
            # zysk wynosi 0 (podatek 0), a stratę na kapitale "chłoniemy".
            profit = max(0.0, payout_gross - returned_capital)
            payout_net = payout_gross - (profit * tax_rate)
            
            desc = f"Przedterminowy wykup {redemption.quantity} szt. (Kara: {penalty:.2f} zł)"
            
            r_g, u_g, r_n, u_n = self._allocate_fully_realized_flows(
                redemption.redemption_date, payout_gross, payout_net, CashFlowType.EARLY_REDEMPTION, desc
            )
            rg.extend(r_g); ug.extend(u_g); rn.extend(r_n); un.extend(u_n)
            
        return rg, ug, rn, un

    def _build_current_valuation_flow(
        self, 
        calculation_date: date, 
        periods: List[BondInterestPeriod], 
        nominal_value: float, 
        final_active_quantity: int,
        tax_rate: float
    ) -> Tuple[List[CashFlowInstance], List[CashFlowInstance]]:
        ug, un = [], []
        if final_active_quantity > 0:
            active_period = self._get_active_period_for_date(calculation_date, periods)
            accrued_today_per_bond = self._calculate_act_act_interest_per_bond(
                base_capital_per_bond=active_period.base_capital_per_bond,
                rate=active_period.interest_rate,
                start_date=active_period.start_date,
                end_date=calculation_date
            )
            
            gross_val = final_active_quantity * (nominal_value + accrued_today_per_bond)
            profit = final_active_quantity * accrued_today_per_bond
            net_val = gross_val - (profit * tax_rate)
            
            desc = f"Wycena bieżąca {final_active_quantity} szt. na dzień {calculation_date}"
            
            ug.append(CashFlowInstance(
                date=calculation_date, value=gross_val, flow_type=CashFlowType.CURRENT_VALUATION, description=desc
            ))
            un.append(CashFlowInstance(
                date=calculation_date, value=net_val, flow_type=CashFlowType.CURRENT_VALUATION, description=desc
            ))
            
        return ug, un