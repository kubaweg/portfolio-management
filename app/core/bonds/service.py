from datetime import date
from typing import List, Optional, Tuple
from sqlalchemy.orm import Session
import holidays
import calendar
from datetime import timedelta
from dateutil.relativedelta import relativedelta

# Zakładam takie ścieżki na podstawie Twoich informacji
from app.core.bonds import BondInputParams, BondInterestPeriod, PeriodStatus
from app.schemas.domain.assets import RetailBondBenchmark, InterestHandling
from app.schemas.database.macroeconomics import Inflation, InterestRate

class BondEngine:
    def __init__(self, db: Session, params: BondInputParams, calculation_date: date | None = None):
        self.db = db
        self.params = params
        self.calculation_date = calculation_date or date.today()
        self.periods: List[BondInterestPeriod] = []

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

    def _fetch_benchmark_value(self, target_date: date) -> Tuple[Optional[float], bool]:
        """
        Pobiera wartość benchmarku z bazy danych.
        Dla NBP: największa data <= target_date.
        Dla GUS (Inflacja): odczyt z miesiąca M-2 po kluczu 'YYYY-MM'.
        """
        if not self.params.is_indexed:
            return None, False

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

        return benchmark_val, is_estimated
    
    def _calculate_act_act_interest(self, capital: float, rate: float, start_date: date, end_date: date) -> float:
        """
        Wylicza odsetki brutto zgodnie z konwencją ACT/ACT (ISDA).
        Dzieli okresy na lata kalendarzowe, aby precyzyjnie obsłużyć lata przestępne.
        """
        total_interest = 0.0
        current_date = start_date

        while current_date < end_date:
            current_year = current_date.year
            
            # Szukamy końca bieżącego roku (żeby sprawdzić, czy nie przecinamy sylwestra)
            # data(current_year + 1, 1, 1) to 1 stycznia kolejnego roku
            next_year_start = date(current_year + 1, 1, 1)
            
            # Granicą obliczeń jest albo koniec całego okresu, albo koniec danego roku
            chunk_end_date = min(end_date, next_year_start)
            
            days_in_chunk = (chunk_end_date - current_date).days
            days_in_year = 366 if calendar.isleap(current_year) else 365
            
            # Cząstkowe odsetki za dany rok kalendarzowy
            chunk_interest = float(capital) * float(rate) * (days_in_chunk / days_in_year)
            total_interest += chunk_interest
            
            # Przesuwamy wskaźnik na początek kolejnego roku (lub koniec okresu)
            current_date = chunk_end_date
            
        # Zgodnie z zasadami bankowymi, końcowy wynik zaopatrujemy w zaokrąglenie do 2 miejsc (grosze)
        return round(total_interest, 2)
    
    def _calculate_standard_period_interest(self, base_capital: float, rate: float, frequency: int, quantity: int) -> float:
        """
        Wylicza odsetki brutto dla pełnego okresu odsetkowego wg. zasad MF:
        1. Oblicza zysk dla 1 sztuki (dzieląc roczną stopę przez częstotliwość, np. 12 miesięcy).
        2. Zaokrągla wynik do pełnych groszy.
        3. Dopiero wtedy mnoży przez liczbę posiadanych sztuk.
        """
        # Obliczamy ułamek odsetek dla jednej obligacji
        interest_per_bond = float(base_capital) * float(rate) / (frequency * quantity)
        
        # Bankowe zaokrąglenie do 2 miejsc po przecinku (grosze)
        rounded_interest_per_bond = round(interest_per_bond, 2)
        
        # Ostateczny wynik to zysk z jednej sztuki pomnożony przez wolumen
        return rounded_interest_per_bond * quantity
    
    def _calculate_financials(self):
        """
        Sekwencyjnie oblicza kapitał i odsetki brutto dla każdego okresu.
        Kapitał bazowy kolejnego okresu zależy od kapitalizacji odsetek w poprzednim.
        """
        for i, period in enumerate(self.periods):
            # 1. Ustalenie kapitału bazowego
            if i == 0:
                period.base_capital = float(self.params.nominal_value * self.params.quantity)
            else:
                prev_period = self.periods[i - 1]
                period.base_capital = prev_period.ending_capital

            # 2. Wyliczenie odsetek brutto dla tego okresu (ACT/ACT)
            period.gross_interest = self._calculate_standard_period_interest(
                base_capital=period.base_capital, # Zmień na zmienną śledzącą kapitał 1 sztuki, jeśli obsługujesz EDO/COI
                rate=period.interest_rate,
                frequency=12, # hardcoded!
                quantity=self.params.quantity
            )
            
            # 3. Ustalenie kapitału końcowego
            if period.is_capitalized:
                period.ending_capital = period.base_capital + period.gross_interest
            else:
                period.ending_capital = period.base_capital

    def build_periods(self):
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
                margin=margin_for_period,
                benchmark_value=benchmark_value,
                is_rate_estimated=is_rate_estimated,
                interest_rate=calculated_interest_rate, # <--- Wpisujemy wyliczone oprocentowanie!
                
                # Pola stricte kapitałowe (zależą od poprzednich okresów, więc na razie wyzerowane)
                base_capital=0.0,
                gross_interest=0.0,
                ending_capital=0.0,
                days_elapsed=None,
                accrued_interest_to_date=None,
                early_redemption=None
            )
            
            self.periods.append(period)

        self._calculate_financials()

    def get_all_periods(self) -> List[BondInterestPeriod]:
        """Zwraca gotową listę okresów odsetkowych."""
        return self.periods