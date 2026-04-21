from datetime import date
from dateutil.relativedelta import relativedelta
from app.schemas.domain.bonds import BondAsset

def generate_periods(bond: BondAsset) -> list[tuple[int, date, date]]:
    """
    Kroi czas życia obligacji na okresy odsetkowe.
    Zwraca listę krotek: (numer_okresu, data_początku, data_końca)
    """
    periods = []
    current_start = bond.issue_date
    period_num = 1
    
    # Mapowanie częstotliwości na liczbę miesięcy
    months_step = {
        'MONTHLY': 1,
        'QUARTERLY': 4,
        'SEMI_ANNUALLY': 6,
        'YEARLY': 12
    }.get(bond.coupon_frequency.value, 12)

    while current_start < bond.maturity_date:
        next_date = current_start + relativedelta(months=months_step)
        
        # Korekta na wypadek, gdyby ostatni okres kończył się po dacie zapadalności
        # (w przypadku obligacji detalicznych to się rzadko zdarza, ale dla bezpieczeństwa)
        actual_end = min(next_date, bond.maturity_date)
        
        periods.append((period_num, current_start, actual_end))
        current_start = actual_end
        period_num += 1
        
    return periods