from datetime import date
from typing import List, Optional, Tuple
from sqlalchemy.orm import Session
import holidays
import calendar
from datetime import timedelta, datetime, time
from dateutil.relativedelta import relativedelta

# Zakładam takie ścieżki na podstawie Twoich informacji
from app.core.bonds.schemas.dto import (
    BondInputParams, BondCurrentData, BondInterestPeriod, BondSummary, PeriodStatus, 
    EarlyRedemptionType, EarlyRedemptionSimulation, PerBondRedemptionMetrics, TotalRedemptionMetrics, BondEarlyRedemption
)
from app.schemas.domain.assets import RetailBondBenchmark, InterestHandling
from app.schemas.domain.positions import OpenPosition, ClosedPosition
from app.schemas.database.macroeconomics import Inflation, InterestRate

class BondEngine:
    def __init__(self, db: Session, params: BondInputParams, calculation_date: date | None = None):
        self.db = db
        self.TAX_RATE = 0.19
        self.params = params
        self.calculation_date = calculation_date or date.today()
        self.periods: List[BondInterestPeriod] = []
        self.summary: BondSummary | None = None
        self.current_data: BondCurrentData | None = None

        self.early_redemptions: List[BondEarlyRedemption] = []
        self.open_positions: List[OpenPosition] = []
        self.closed_positions: List[ClosedPosition] = []

        # Mapowanie stringów na liczbę okresów w roku (frequency)
        self.FREQUENCY_MAPPING = {
            0: 0,      # np. OTS (odsetki przy wykupie)
            1: 12,     # np. DOR (co miesiąc = 12 razy w roku)
            3: 4,      # np. TOZ (co kwartał = 4 razy w roku)
            6: 2,      # np. COI w specyficznych przypadkach, choć u nas COI to YEARLY
            12: 1,     # np. EDO, COI (co rok = 1 raz w roku)
        }

    def _generate_timeline(self) -> List[tuple[date, date]]:
        """Generuje listę krotek (start_date, end_date) dla okresów odsetkowych."""
        dates = []
        months_step = self.params.coupon_frequency
        
        if months_step == 0:
            return [(self.params.issue_date, self.params.maturity_date)]

        current_start = self.params.issue_date
        while current_start < self.params.maturity_date:
            current_end = current_start + relativedelta(months=months_step)
            if current_end > self.params.maturity_date:
                current_end = self.params.maturity_date
            dates.append((current_start, current_end))
            current_start = current_end
            
        return dates

    def _determine_period_status(self, start_date: date, end_date: date) -> PeriodStatus:
        """Określa status okresu względem daty obliczeń."""
        if self.calculation_date >= end_date:
            return PeriodStatus.PAST
        elif self.calculation_date < start_date:
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

    def _fetch_benchmark_value(self, target_date: date) -> Tuple[float, bool]:
        """
        Pobiera wartość benchmarku z bazy danych.
        Dla NBP: największa data <= target_date.
        Dla GUS (Inflacja): odczyt z miesiąca M-2 po kluczu 'YYYY-MM'.
        """
        if not self.params.is_indexed:
            return 0.0, False

        benchmark_val = None
        is_estimated = False

        if self.params.benchmark == RetailBondBenchmark.CPI.value:
            # LOGIKA BIZNESOWA (M-2): Wskaźnik z miesiąca wpadającego 2 miesiące wstecz
            target_inflation_date = target_date - relativedelta(months=2)
            
            # KWESTIA TECHNICZNA: Zamiana daty na klucz YYYY-MM
            # (Uwaga: zmień 'month' na dokładną nazwę Twojej kolumny ze stringiem)
            month_key = target_inflation_date.strftime("%Y-%m")
            
            record = self.db.query(Inflation).filter(Inflation.month == month_key).first()
            
            if record:
                benchmark_val = record.value
            else:
                # Jeśli szukamy inflacji np. na rok 2028, rekordu nie będzie. 
                # Bierzemy najświeższy odczyt z bazy jako estymację. 
                # Sortowanie malejące po stringu 'YYYY-MM' zachowa właściwą chronologię.
                latest_record = self.db.query(Inflation).order_by(Inflation.month.desc()).first()
                benchmark_val = latest_record.value if latest_record else 0.05 # Awaryjny fallback
                is_estimated = True
                
        elif self.params.benchmark == RetailBondBenchmark.NBP.value:
            # LOGIKA BIZNESOWA: 10. dzień roboczy przed 1. dniem miesiąca startu okresu
            target_nbp_date = self._get_nbp_observation_date(target_date)
            
            # KWESTIA TECHNICZNA: Szukamy stopy obowiązującej w wyznaczonym dniu
            # Zakładamy, że model InterestRate.date to data "obowiązuje od"
            record = self.db.query(InterestRate)\
                .filter(InterestRate.effective_date <= target_nbp_date)\
                .order_by(InterestRate.effective_date.desc())\
                .first()
            if record:
                benchmark_val = record.value
            else:
                latest_record = self.db.query(InterestRate)\
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

    def build_current_data(self, today: date = date.today()) -> None:
        """
        Buduje bieżącą wycenę i parametry odsetkowe dla aktywnej części pakietu obligacji.
        Wykorzystuje przeliczone już wartości accrued_interest_to_date w self.periods.
        """
            
        nominal_per_bond = self.params.nominal_value
        initial_quantity = self.params.quantity
        
        # 1. WYZNACZENIE AKTUALNIE ŻYJĄCEJ LICZBY SZTUK
        total_redeemed_qty = sum(red.quantity for red in self.early_redemptions)
        remaining_qty = max(0.0, initial_quantity - total_redeemed_qty)
        
        # Jeśli pakiet został w całości wykupiony przedterminowo, wycena bieżąca to 0
        if remaining_qty <= 0:
            self.current_data = BondCurrentData(
                price=0.0,
                interest_rate=0.0,
                interest_pln=0.0,
                value_pln=0.0,
                price_datetime=datetime.now()
            )

        # 2. IDENTYFIKACJA BIEŻĄCEGO OKRESU ODSETKOWEGO
        current_period = None
        for period in self.periods:
            if period.start_date <= today <= period.end_date:
                current_period = period
                break

        # 3. KALKULACJA WARTOŚCI
        if current_period:
            interest_rate = current_period.interest_rate
            
            # Cena 1 sztuki = podstawa w tym okresie + odsetki narosłe do dzisiaj
            price = current_period.base_capital_per_bond + current_period.accrued_interest_to_date
            
            # Odsetki ZREALIZOWANE (z wypłaconych kuponów, dotyczy np. COI/TOS po pełnym roku)
            past_realized_interest_per_bond = sum(
                p.gross_interest_per_bond 
                for p in self.periods 
                if p.end_date <= today and not p.is_capitalized
            )
            
            # Odsetki NIEZREALIZOWANE (różnica między bieżącą ceną a początkowym nominałem)
            current_unrealized_interest_per_bond = price - nominal_per_bond
            
            # Łączny zysk odsetkowy (zrealizowany + to co narosło do wyjęcia)
            total_interest_per_bond = current_unrealized_interest_per_bond + past_realized_interest_per_bond
            
            interest_pln = total_interest_per_bond * remaining_qty
            value_pln = price * remaining_qty

        else:
            # Obligacja zapadła (dziś jest po dacie wykupu)
            last_period = self.periods[-1] if self.periods else None
            if last_period and today > last_period.end_date:
                interest_rate = 0.0
                price = last_period.ending_capital_per_bond if last_period.is_capitalized else nominal_per_bond
                
                total_interest_per_bond = sum(p.gross_interest_per_bond for p in self.periods)
                interest_pln = total_interest_per_bond * remaining_qty
                value_pln = price * remaining_qty
            else:
                # Obligacja jeszcze nie wystartowała (data w przyszłości)
                interest_rate = self.params.initial_rate
                price = nominal_per_bond
                interest_pln = 0.0
                value_pln = remaining_qty * nominal_per_bond

        self.current_data = BondCurrentData(
            price=round(price, 2),
            interest_rate=interest_rate,
            interest_pln=round(interest_pln, 2),
            value_pln=round(value_pln, 2),
            price_datetime=datetime.now()
        )
    
    def simulate_early_redemption(self, redemption_date: date, penalty_fee: float) -> EarlyRedemptionSimulation:
        """
        Symuluje wcześniejszy wykup na zadany dzień z uwzględnieniem podatku Belki.
        Zwraca ustrukturyzowany model EarlyRedemptionSimulation.
        """
        if not self.periods or redemption_date <= self.periods[0].start_date:
            raise ValueError("Data wykupu musi być późniejsza niż data zakupu obligacji.")

        active_period = None
        accumulated_capital_per_bond = self.params.nominal_value
        
        for period in self.periods:
            if period.start_date <= redemption_date < period.end_date:
                active_period = period
                accumulated_capital_per_bond = period.base_capital_per_bond
                break
                
        if not active_period:
            raise ValueError("Data wykupu przekracza datę zapadalności obligacji.")

        # 1. Bieżące odsetki ułamkowe (ACT/ACT) do dnia wykupu
        current_period_interest_per_bond = self._calculate_act_act_interest_per_bond(
            base_capital_per_bond=accumulated_capital_per_bond,
            rate=active_period.interest_rate,
            start_date=active_period.start_date,
            end_date=redemption_date
        )

        # 2. Skumulowane odsetki brutto
        total_interest_accrued_per_bond = (accumulated_capital_per_bond - self.params.nominal_value) + current_period_interest_per_bond
        
        # 3. Ochrona kapitału i opłata karna (Logika biznesowa)
        if hasattr(self.params, 'early_redemption_type') and self.params.early_redemption_type == EarlyRedemptionType.FORFEIT_INTEREST:
            # W przypadku utraty odsetek, kara pochłania dokładnie cały wypracowany zysk.
            actual_penalty_per_bond = total_interest_accrued_per_bond
        else:
            # Standardowa opłata pobierana z zysku (FEE) - kapitał podstawowy jest chroniony.
            actual_penalty_per_bond = min(total_interest_accrued_per_bond, penalty_fee)
        
        # 4. Wyliczenie kwoty brutto
        gross_payout_per_bond = self.params.nominal_value + total_interest_accrued_per_bond - actual_penalty_per_bond

        # 5. PODATEK BELKI - podstawa to zysk brutto minus zastosowana kara
        tax_base_per_bond = max(0.0, total_interest_accrued_per_bond - actual_penalty_per_bond)
        tax_per_bond = round(tax_base_per_bond * self.TAX_RATE, 2)
        
        # 6. Wypłata netto
        net_payout_per_bond = gross_payout_per_bond - tax_per_bond

        # --- Tworzenie modeli Pydantic ---
        
        per_bond_metrics = PerBondRedemptionMetrics(
            nominal=self.params.nominal_value,
            accrued_interest=round(total_interest_accrued_per_bond, 2),
            penalty_applied=round(actual_penalty_per_bond, 2),
            gross_payout=round(gross_payout_per_bond, 2),
            tax_applied=tax_per_bond,
            net_payout=round(net_payout_per_bond, 2)
        )
        
        quantity = self.params.quantity
        
        total_metrics = TotalRedemptionMetrics(
            quantity=quantity,
            gross_payout=round(gross_payout_per_bond * quantity, 2),
            total_penalty=round(actual_penalty_per_bond * quantity, 2),
            total_tax=round(tax_per_bond * quantity, 2),
            net_payout=round(net_payout_per_bond * quantity, 2)
        )
        
        return EarlyRedemptionSimulation(
            redemption_date=redemption_date,
            per_bond=per_bond_metrics,
            total=total_metrics
        )

    def _calculate_financials(self, today: date):
        """
        Sekwencyjnie oblicza kapitał i odsetki brutto dla każdego okresu.
        Utrzymuje ścisły podział na logikę per-bond oraz agregację total.
        Wylicza również dni trwania i narosłe odsetki względem daty 'today'.
        """
        frequency = self.FREQUENCY_MAPPING.get(self.params.coupon_frequency, 1)

        # Inicjalizacja kapitału jednostkowego
        current_capital_per_bond = float(self.params.nominal_value)

        for period in self.periods:
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
            if today <= period.start_date:
                # Okres jeszcze się nie zaczął
                period.days_elapsed = 0
                period.accrued_interest_to_date = 0.0
            elif today >= period.end_date:
                # Okres już się w pełni zakończył
                period.days_elapsed = period.days_total
                period.accrued_interest_to_date = period.gross_interest_per_bond
            else:
                # Jesteśmy w trakcie trwania tego okresu
                period.days_elapsed = (today - period.start_date).days
                if period.days_total > 0:
                    fraction = period.days_elapsed / period.days_total
                    period.accrued_interest_to_date = period.gross_interest_per_bond * fraction
                else:
                    period.accrued_interest_to_date = 0.0

            # Obsługa kapitalizacji jednostki
            if period.is_capitalized:
                current_capital_per_bond += period.gross_interest_per_bond
                current_capital_per_bond = round(current_capital_per_bond, 2)
            
            period.ending_capital_per_bond = current_capital_per_bond

            # --- FAZA 2: AGREGACJA PORTFELA (TOTAL) ---
            period.base_capital = period.base_capital_per_bond * self.params.quantity
            period.gross_interest = period.gross_interest_per_bond * self.params.quantity
            period.ending_capital = period.ending_capital_per_bond * self.params.quantity

    def build_periods(self, today: date = date.today()) -> None:
        """
        Główna metoda budująca obiekty BondInterestPeriod na podstawie osi czasu.
        Uwzględnia logikę M-2 oraz podłogę inflacyjną.
        """
        timeline = self._generate_timeline()
        total_periods = len(timeline)
        
        self.periods = []

        for index, (start_dt, end_dt) in enumerate(timeline, start=1):
            status = self._determine_period_status(start_dt, end_dt)
            days_total = (end_dt - start_dt).days
            
            is_capitalized = (
                self.params.interest_handling == InterestHandling.CAPITALIZATION.value 
                and index < total_periods
            )
            
            # Zmienne pomocnicze dla kalkulacji w tym okresie
            benchmark_value = None
            is_rate_estimated = False
            calculated_interest_rate = 0.0
            margin_for_period = self.params.margin if index > 1 else 0.0

            # KROK: Wyznaczenie oprocentowania dla okresu (zależne od typu i roku)
            if index == 1:
                # Pierwszy rok / okres to zawsze stały 'initial_rate' (niezależny od benchmarku)
                calculated_interest_rate = self.params.initial_rate
            else:
                # Kolejne lata indeksowane są benchmarkiem
                benchmark_value, is_rate_estimated = self._fetch_benchmark_value(start_dt)
                
                if self.params.benchmark == RetailBondBenchmark.CPI.value:
                    # Ochrona przed deflacją
                    effective_inflation = max(0.0, benchmark_value)
                    calculated_interest_rate = effective_inflation + margin_for_period
                
                elif self.params.benchmark == RetailBondBenchmark.NBP.value:
                    # LOGIKA BIZNESOWA: Ochrona przed ujemną stopą NBP
                    effective_nbp = max(0.0, benchmark_value)
                    calculated_interest_rate = effective_nbp + margin_for_period
                    
                else:
                    calculated_interest_rate = self.params.initial_rate

            # Tworzymy instancję dla konkretnego okresu
            period = BondInterestPeriod(
                period_number=index,
                start_date=start_dt,
                end_date=end_dt,
                status=status,
                days_total=days_total,
                is_capitalized=is_capitalized,
                margin=margin_for_period if margin_for_period is not None else 0.0,
                benchmark_value=benchmark_value or 0.0,
                is_rate_estimated=is_rate_estimated,
                interest_rate=calculated_interest_rate, # <--- Wpisujemy wyliczone oprocentowanie!
                
                # Pola stricte kapitałowe (zależą od poprzednich okresów, więc na razie wyzerowane)
                base_capital=0.0,
                base_capital_per_bond=0.0,
                gross_interest=0.0,
                gross_interest_per_bond=0.0,
                ending_capital=0.0,
                ending_capital_per_bond=0.0,
                days_elapsed=None,
                accrued_interest_to_date=0.0
            )
            
            self.periods.append(period)

        self._calculate_financials(today=today)

    def build_positions(self, today: date = date.today()) -> None:
        """
        Buduje listy open_positions i closed_positions na podstawie szkieletu (self.periods)
        oraz operacji przedterminowego wykupu, zwracając instancje modeli Pydantic.
        """
            
        ticker = self.params.retail_series_type
        nominal_per_bond = self.params.nominal_value
        
        # Data zakupu to data startu pierwszego okresu odsetkowego
        date_buy = self.periods[0].start_date if self.periods else today
        
        initial_quantity = self.params.quantity
        
        sorted_redemptions = sorted(self.early_redemptions, key=lambda x: x.redemption_date)
        closed_positions: List[ClosedPosition] = []
        
        # --- STRUMIEŃ ZAMKNIĘTY ---
        for red in sorted_redemptions:
            gross_interest_per_bond_at_redemption = 0.0
            
            for period in self.periods:
                if period.end_date <= red.redemption_date:
                    gross_interest_per_bond_at_redemption += period.gross_interest_per_bond
                elif period.start_date <= red.redemption_date < period.end_date:
                    days_total = period.days_total
                    days_elapsed = (red.redemption_date - period.start_date).days
                    
                    if days_total > 0:
                        days_fraction = days_elapsed / days_total
                        current_accrued = period.base_capital_per_bond * period.interest_rate * days_fraction
                        gross_interest_per_bond_at_redemption += current_accrued
                    break
            
            total_interest_for_qty = gross_interest_per_bond_at_redemption * red.quantity
            penalty = red.quantity * red.penalty_per_unit
            realized_profit = max(0.0, total_interest_for_qty - penalty)
            
            value_buy = red.quantity * nominal_per_bond
            value_sell = value_buy + realized_profit
            
            # Wyliczenie ROI
            roi_realized = realized_profit / value_buy if value_buy > 0 else 0.0
            
            closed_positions.append(
                ClosedPosition(
                    ticker=ticker,
                    quantity=red.quantity,
                    date_buy=date_buy,
                    date_sell=red.redemption_date,
                    value_buy=value_buy,
                    value_sell=value_sell,
                    
                    realized_profit_pln=realized_profit, 
                    roi_realized_pln=roi_realized,
                    roi_realized_pa_pln=0.0 # to musi uwzględniać daty wypłat odsetek!
                )
            )
            
        # --- STRUMIEŃ OTWARTY ---
        total_redeemed_qty = sum(p.quantity for p in closed_positions)
        remaining_qty = max(0.0, initial_quantity - total_redeemed_qty)
        
        open_positions: List[OpenPosition] = []
        
        if remaining_qty > 0:
            current_period = None
            for period in self.periods:
                if period.start_date <= today <= period.end_date:
                    current_period = period
                    break
                    
            if current_period:
                bond_value_today = current_period.base_capital_per_bond + current_period.accrued_interest_to_date
                unrealized_profit_per_bond = bond_value_today - nominal_per_bond
                
                unrealized_profit = unrealized_profit_per_bond * remaining_qty
                current_value = bond_value_today * remaining_qty
            else:
                last_period = self.periods[-1] if self.periods else None
                if last_period and today > last_period.end_date:
                    unrealized_profit = 0.0
                    ending_val = last_period.ending_capital_per_bond if last_period.is_capitalized else nominal_per_bond
                    current_value = ending_val * remaining_qty
                else:
                    unrealized_profit = 0.0
                    current_value = remaining_qty * nominal_per_bond
                    
            value_buy = remaining_qty * nominal_per_bond
            
            # 1. Zrealizowany zysk (gotówka z wypłaconych kuponów historycznych dla posiadanych sztuk)
            past_realized_interest_per_bond = sum(
                p.gross_interest_per_bond 
                for p in self.periods 
                if p.end_date <= today and not p.is_capitalized
            )
            realized_profit = past_realized_interest_per_bond * remaining_qty
            
            # 2. Wyliczenie ROI
            roi_unrealized = unrealized_profit / value_buy if value_buy > 0 else 0.0
            roi_realized = realized_profit / value_buy if value_buy > 0 else 0.0
            
            open_positions.append(
                OpenPosition(
                    ticker=ticker,
                    quantity=remaining_qty,
                    date_buy=date_buy,
                    value_buy=value_buy,
                    current_value=current_value,

                    realized_profit_pln=realized_profit,
                    roi_realized_pln=roi_realized,
                    roi_realized_pa_pln=0.0, # to musi uwzględniać daty wypłat odsetek!
                    
                    unrealized_profit_pln=unrealized_profit,
                    roi_unrealized_pln=roi_unrealized,
                    roi_unrealized_pa_pln=0.0
                )
            )
            
        self.open_positions = open_positions
        self.closed_positions = closed_positions

    def build_summary(self, today: date | None = None) -> None:
        """
        Buduje podsumowanie inwestycji w oparciu o oś czasu okresów odsetkowych.
        Stopy zwrotu w skali roku (PA) pozostają wyzerowane zgodnie z założeniami DTO.
        """
        if today is None:
            today = date.today()
            
        quantity = self.params.quantity
        total_invested = quantity * self.params.nominal_value
        
        # Zabezpieczenie przed brakiem okresów
        if not self.periods:
            # Zwracamy wyzerowany obiekt (zakładam, że BondSummary pozwala na zera)
            self.summary = BondSummary(
                quantity=quantity,
                total_invested=total_invested,

                realized_profit_gross=0.0, 
                realized_profit_net=0.0, 
                roi_realized_net=0.0, 
                roi_realized_pa_net=0.0,

                unrealized_profit_gross=0.0, 
                unrealized_profit_net=0.0, 
                roi_unrealized_net=0.0, 
                roi_unrealized_pa_net=0.0,

                interest_profit_net=0.0, 

                total_profit_net=0.0, 
                roi_net=0.0, 
                roi_pa_net=0.0,
                
                days_to_maturity=0, 
                overall_progress_percent=0.0
            )

        start_date = self.periods[0].start_date
        maturity_date = self.periods[-1].end_date
        total_days = max(1, (maturity_date - start_date).days)
        
        # --- CZAS I POSTĘP ---
        if today < start_date:
            days_to_maturity = total_days
            overall_progress_percent = 0.0
        elif today >= maturity_date:
            days_to_maturity = 0
            overall_progress_percent = 100.0
        else:
            days_to_maturity = (maturity_date - today).days
            days_passed = (today - start_date).days
            overall_progress_percent = (days_passed / total_days) * 100.0

        # --- ZYSKI ZREALIZOWANE ---
        # Sumujemy wypłacone kupony (okresy zakończone i niekapitalizowane)
        realized_profit_gross = sum(
            p.gross_interest 
            for p in self.periods 
            if p.end_date <= today and not p.is_capitalized
        )
        
        # --- ZYSKI NIEZREALIZOWANE ---
        unrealized_profit_gross = 0.0
        
        if today < maturity_date:
            current_period = next((p for p in self.periods if p.start_date <= today <= p.end_date), None)
            if current_period:
                # Zysk kapitałowy (z poprzednich lat dla obligacji kapitalizowanych, np. EDO)
                accumulated_capital_profit = current_period.base_capital - total_invested
                # Bieżące odsetki narosłe w obecnym okresie
                current_accrued = current_period.accrued_interest_to_date * quantity
                
                unrealized_profit_gross = accumulated_capital_profit + current_accrued
        else:
            # Jeśli jesteśmy po terminie zapadalności, cała inwestycja staje się zrealizowana.
            # Odsetki z obligacji kapitalizowanych wpadają do worka "zrealizowane".
            total_earned = sum(p.gross_interest for p in self.periods)
            realized_profit_gross = total_earned
            unrealized_profit_gross = 0.0

        # --- PODATKI (19% Belki) ---
        # Uwaga: w polskim systemie podatek zaokrągla się per obligacja.
        # Używamy tu uproszczonego mnożnika 0.81 (100% - 19%) dla całej puli.
        TAX_MULTIPLIER = 1 - self.TAX_RATE
        realized_profit_net = round(realized_profit_gross * TAX_MULTIPLIER, 2)
        unrealized_profit_net = round(unrealized_profit_gross * TAX_MULTIPLIER, 2)
        
        interest_profit_net = realized_profit_net + unrealized_profit_net
        total_profit_net = interest_profit_net # Dla samej osi czasu zysk całkowity to zysk odsetkowy

        # --- STOPY ZWROTU (ROI) ---
        roi_realized_net = realized_profit_net / total_invested if total_invested > 0 else 0.0
        roi_unrealized_net = unrealized_profit_net / total_invested if total_invested > 0 else 0.0
        roi_net = total_profit_net / total_invested if total_invested > 0 else 0.0

        self.summary = BondSummary(
            quantity=quantity,
            total_invested=total_invested,
            
            realized_profit_gross=round(realized_profit_gross, 2),
            realized_profit_net=realized_profit_net,
            roi_realized_net=roi_realized_net,
            roi_realized_pa_net=0.0,
            
            unrealized_profit_gross=round(unrealized_profit_gross, 2),
            unrealized_profit_net=unrealized_profit_net,
            roi_unrealized_net=roi_unrealized_net,
            roi_unrealized_pa_net=0.0,
            
            interest_profit_net=interest_profit_net,
            total_profit_net=total_profit_net,
            roi_net=roi_net,
            roi_pa_net=0.0,
            
            days_to_maturity=days_to_maturity,
            overall_progress_percent=round(overall_progress_percent, 2)
        )

    def get_positions(self) -> Tuple[List[OpenPosition], List[ClosedPosition]]:
        return self.open_positions, self.closed_positions
    
    def get_summary(self) -> BondSummary:
        """Zwraca gotowy model podsumowania portfela obligacji."""
        return self.summary # type: ignore

    def get_current_data(self) -> BondCurrentData:
        """Zwraca komponent bieżącej wyceny (cena i wartość PLN) dla daty obliczeń."""
        return self.current_data # type: ignore

    def get_all_periods(self) -> List[BondInterestPeriod]:
        """Zwraca gotową listę okresów odsetkowych."""
        return self.periods