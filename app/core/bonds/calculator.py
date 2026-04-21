from datetime import date
from dateutil.relativedelta import relativedelta
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy import desc

from app.schemas.domain.bonds import BondAsset
from app.schemas.database.macroeconomics import Inflation, InterestRate

def get_nbp_rate_for_date(db: SQLAlchemy, target_date: date) -> float:
    """
    Pobiera stopę NBP obowiązującą w konkretnym dniu.
    Dla obligacji z reguły szukamy ostatniego dnia roboczego przed startem okresu.
    (Tu w uproszczeniu bierzemy ostatnią stopę ważną na dany dzień).
    """
    # Znajdź najnowszą zmianę stopy, która miała miejsce <= target_date
    rate = db.session.query(InterestRate).filter(
        InterestRate.effective_date <= target_date
    ).order_by(desc(InterestRate.effective_date)).first()
    
    return rate.value if rate else 0.0

def get_cpi_for_period(db: SQLAlchemy, period_start: date) -> float:
    """
    Obligacje skarbowe z reguły biorą inflację r/r za miesiąc, który przypada 
    na 2 miesiące przed miesiącem startu okresu (np. start w maju -> CPI za marzec).
    """
    # Odejmujemy 2 miesiące, by trafić w odpowiedni odczyt GUS
    target_month_date = period_start - relativedelta(months=2)
    target_month_str = target_month_date.strftime('%Y-%m')
    
    inflation = db.session.query(Inflation).filter(
        Inflation.month == target_month_str
    ).first()
    
    return inflation.value - 100 if inflation else 0.0