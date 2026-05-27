from app import SessionLocal

from app.core.bonds.service import BondEngine
from app.core.bonds import (
    BondInputParams, EarlyRedemptionType, map_frequency_to_months, resolve_early_redemption_type
)
from app.schemas.database.asset import Bond

from datetime import date

def test_bond_timeline(db, bond_ticker: str):
    # 1. Wyciągamy obligację z bazy
    bond_db = db.query(Bond).filter(Bond.ticker == bond_ticker).first()
    
    if not bond_db:
        print(f"Błąd: Nie znaleziono obligacji {bond_ticker}")
        return

    # 2. Mapujemy model bazy danych na nasz DTO (BondInputParams)
    params = BondInputParams(
        quantity=10,
        retail_series_type=bond_db.retail_series_type,
        issue_date=bond_db.issue_date,
        maturity_date=bond_db.maturity_date,
        nominal_value=bond_db.nominal_value,
        interest_handling=bond_db.interest_handling,
        coupon_frequency=map_frequency_to_months(bond_db.coupon_frequency),
        initial_rate=bond_db.initial_rate,
        is_indexed=bond_db.is_indexed,
        margin=bond_db.margin,
        benchmark=bond_db.benchmark,
        early_redemption_type=resolve_early_redemption_type(bond_db.retail_series_type),
        early_redemption_penalty=bond_db.early_redemption_penalty
    )

    # 3. Odpalamy silnik dla konkretnej daty wyliczeń (np. dzisiaj)
    calc_date = date.today()
    engine = BondEngine(db=db, params=params, calculation_date=calc_date)
    
    print(f"--- SYMULACJA OBLIGACJI SERII {params.retail_series_type} ---")
    print(f"Data wykupu: {params.maturity_date}")
    print(f"Data obliczeń (dzisiaj): {calc_date}")
    print("-" * 50)
    
    # 4. Generujemy oś czasu i testujemy statusy
    timeline = engine._generate_timeline()
    
    for i, (start_dt, end_dt) in enumerate(timeline, start=1):
        status = engine._determine_period_status(start_dt, end_dt)
        print(f"Okres {i:02d}: {start_dt} do {end_dt} | Status: {status.value}")

if __name__ == "__main__":
    
    # Odpalamy skrypt testowy
    with SessionLocal() as db:
        test_bond_timeline(db, 'COI1228')
    