from typing import List, Tuple
from pydantic import BaseModel

import holidays
import calendar
from datetime import timedelta, datetime, date
from dateutil.relativedelta import relativedelta

from app import SessionLocal

from app.core.bonds.schemas.dto import (
    BondCurrentData, BondInterestPeriod,
    PeriodStatus,
    EarlyRedemptionType, EarlyRedemptionSimulation, PerBondRedemptionMetrics, TotalRedemptionMetrics, BondEarlyRedemption,
    resolve_early_redemption_type, map_frequency_to_months
)

from app.schemas.domain.transactions import (
    TickerTransactions
)
from app.schemas.domain.cash_flows import CashFlowInstance
from app.schemas.domain.assets import RetailBondBenchmark, InterestHandling, CouponFrequency
from app.schemas.database.macroeconomics import Inflation, InterestRate

class PortfolioBuilderResult(BaseModel):

    periods: List[BondInterestPeriod]
    cash_flows: List[CashFlowInstance]
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
        cash_flows = self._build_cash_flows(periods=periods, early_redemptions=early_redemptions)

        return PortfolioBuilderResult(periods=periods, cash_flows=cash_flows, early_redemptions=early_redemptions)
    

    # Metody pomocnicze
    def _generate_timeline(self,
            coupon_frequency: CouponFrequency, 
            issue_date: date, 
            maturity_date: date
        ) -> List[Tuple[date, date]]:
        """Generuje listę krotek (start_date, end_date) dla okresów odsetkowych."""
        dates = []
        months_step = map_frequency_to_months(coupon_frequency)
        
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

    def simulate_early_redemption(self, redemption_date: date, penalty_fee: float) -> EarlyRedemptionSimulation:
        """
        Symuluje wcześniejszy wykup na zadany dzień z uwzględnieniem podatku Belki.
        Zwraca ustrukturyzowany model EarlyRedemptionSimulation.
        """
    #     if not self.periods or redemption_date <= self.periods[0].start_date:
    #         raise ValueError("Data wykupu musi być późniejsza niż data zakupu obligacji.")

    #     active_period = None
    #     accumulated_capital_per_bond = self.params.nominal_value
        
    #     for period in self.periods:
    #         if period.start_date <= redemption_date < period.end_date:
    #             active_period = period
    #             accumulated_capital_per_bond = period.base_capital_per_bond
    #             break
                
    #     if not active_period:
    #         raise ValueError("Data wykupu przekracza datę zapadalności obligacji.")

    #     # 1. Bieżące odsetki ułamkowe (ACT/ACT) do dnia wykupu
    #     current_period_interest_per_bond = self._calculate_act_act_interest_per_bond(
    #         base_capital_per_bond=accumulated_capital_per_bond,
    #         rate=active_period.interest_rate,
    #         start_date=active_period.start_date,
    #         end_date=redemption_date
    #     )

    #     # 2. Skumulowane odsetki brutto
    #     total_interest_accrued_per_bond = (accumulated_capital_per_bond - self.params.nominal_value) + current_period_interest_per_bond
        
    #     # 3. Ochrona kapitału i opłata karna (Logika biznesowa)
    #     if hasattr(self.params, 'early_redemption_type') and self.params.early_redemption_type == EarlyRedemptionType.FORFEIT_INTEREST:
    #         # W przypadku utraty odsetek, kara pochłania dokładnie cały wypracowany zysk.
    #         actual_penalty_per_bond = total_interest_accrued_per_bond
    #     else:
    #         # Standardowa opłata pobierana z zysku (FEE) - kapitał podstawowy jest chroniony.
    #         actual_penalty_per_bond = min(total_interest_accrued_per_bond, penalty_fee)
        
    #     # 4. Wyliczenie kwoty brutto
    #     gross_payout_per_bond = self.params.nominal_value + total_interest_accrued_per_bond - actual_penalty_per_bond

    #     # 5. PODATEK BELKI - podstawa to zysk brutto minus zastosowana kara
    #     tax_base_per_bond = max(0.0, total_interest_accrued_per_bond - actual_penalty_per_bond)
    #     tax_per_bond = round(tax_base_per_bond * self.TAX_RATE, 2)
        
    #     # 6. Wypłata netto
    #     net_payout_per_bond = gross_payout_per_bond - tax_per_bond

    #     # --- Tworzenie modeli Pydantic ---
        
    #     per_bond_metrics = PerBondRedemptionMetrics(
    #         nominal=self.params.nominal_value,
    #         accrued_interest=round(total_interest_accrued_per_bond, 2),
    #         penalty_applied=round(actual_penalty_per_bond, 2),
    #         gross_payout=round(gross_payout_per_bond, 2),
    #         tax_applied=tax_per_bond,
    #         net_payout=round(net_payout_per_bond, 2)
    #     )
        
    #     quantity = self.params.quantity
        
    #     total_metrics = TotalRedemptionMetrics(
    #         quantity=quantity,
    #         gross_payout=round(gross_payout_per_bond * quantity, 2),
    #         total_penalty=round(actual_penalty_per_bond * quantity, 2),
    #         total_tax=round(tax_per_bond * quantity, 2),
    #         net_payout=round(net_payout_per_bond * quantity, 2)
    #     )
        
        return EarlyRedemptionSimulation.empty()

    def _update_periods(self, 
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
        frequency = map_frequency_to_months(coupon_frequency)

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
    
    def _build_periods(self, 
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

        ...

        return early_redemptions
    
    def _build_cash_flows(self, periods: List[BondInterestPeriod], early_redemptions: List[BondEarlyRedemption]) -> List[CashFlowInstance]:

        cash_flows: List[CashFlowInstance] = []

        return cash_flows