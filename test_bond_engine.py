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
        quantity=15,
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
    
    print(f"--- SYMULACJA OBLIGACJI SERII {params.retail_series_type} ({bond_ticker}) ---")
    print(f"Data zakupu: {params.issue_date}")
    print(f"Data wykupu: {params.maturity_date}")
    print(f"Data obliczeń (dzisiaj): {calc_date}")
    print("-" * 85)
    
    # 4. Budujemy okresy (nasza nowa metoda z logiką M-2 i NBP)
    engine.build_periods()
    periods = engine.get_all_periods()
    
    # 5. Wyświetlamy szczegóły wyliczonych okresów
    # 5. Wyświetlamy szczegóły wyliczonych okresów
    for p in periods:
        # Formatowanie procentów
        bench_str = f"{p.benchmark_value * 100:.2f}%" if p.benchmark_value is not None else "Brak"
        rate_str = f"{p.interest_rate * 100:.2f}%"
        est_str = "(EST)" if p.is_rate_estimated else "     "
        
        # Formatowanie statusu kapitalizacji
        cap_action = "KAPITALIZACJA" if p.is_capitalized else "WYPŁATA"
        
        print(
            f"Okres {p.period_number:02d}: {p.start_date} do {p.end_date} | "
            f"Status: {p.status.value:<7} | "
            f"Oprocentowanie: {rate_str:>6} {est_str} | "
            f"Start: {p.base_capital:>8.2f} zł | "
            f"Odsetki (brutto): {p.gross_interest:>6.2f} zł | "
            f"Koniec: {p.ending_capital:>8.2f} zł "
            f"[{cap_action}]"
        )

if __name__ == "__main__":
    
    # Odpalamy skrypt testowy
    with SessionLocal() as db:
        test_bond_timeline(db, 'DOR1126')