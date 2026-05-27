from datetime import date
from typing import List
from sqlalchemy.orm import Session

# UWAGA: Do operacji na miesiącach w finansach absolutnie niezbędna jest biblioteka python-dateutil.
# Zwykłe datetime.timedelta(days=30) nie zadziała, bo luty ma 28 dni, a marzec 31.
# Zainstaluj przez: pip install python-dateutil
from dateutil.relativedelta import relativedelta

# Zmień importy tak, aby pasowały do Twojej ścieżki
from app.core.bonds import BondInputParams, BondInterestPeriod, PeriodStatus

class BondEngine:
    def __init__(self, db: Session, params: BondInputParams, calculation_date: date | None = None):
        self.db = db
        self.params = params
        # Jeśli nie podamy daty obliczeń, przyjmujemy dzisiejszą.
        # Jest to kluczowe, żeby symulacje (np. "ile zarobię za rok") działały poprawnie.
        self.calculation_date = calculation_date or date.today()
        
        # Tu będziemy trzymać wygenerowane okresy
        self.periods: List[BondInterestPeriod] = []

    def _generate_timeline(self) -> List[tuple[date, date]]:
        """
        Dzieli życie obligacji na przedziały czasowe (okresy odsetkowe).
        Zwraca listę krotek: [(data_początku, data_końca), ...]
        """
        dates = []
        months_step = self.params.coupon_frequency
        
        # Obsługa przypadku "Wypłata przy wykupie" (np. obligacje 3-miesięczne OTS)
        # Traktujemy to jako jeden wielki okres odsetkowy.
        if months_step == 0:
            return [(self.params.issue_date, self.params.maturity_date)]

        current_start = self.params.issue_date
        
        while current_start < self.params.maturity_date:
            # relativedelta bezpiecznie dodaje równe miesiące (np. 15.01 + 1 miesiąc = 15.02)
            current_end = current_start + relativedelta(months=months_step)
            
            # Zabezpieczenie na wypadek, gdyby ostatni okres wychodził poza datę zapadalności
            if current_end > self.params.maturity_date:
                current_end = self.params.maturity_date
                
            dates.append((current_start, current_end))
            current_start = current_end
            
        return dates

    def _determine_period_status(self, start_date: date, end_date: date) -> PeriodStatus:
        """
        Ocenia, czy dany okres jest w przeszłości, trwa obecnie, czy jest w przyszłości
        względem daty obliczeń (calculation_date).
        """
        if self.calculation_date > end_date:
            return PeriodStatus.PAST
        elif self.calculation_date < start_date:
            return PeriodStatus.FUTURE
        else:
            return PeriodStatus.CURRENT