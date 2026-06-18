from app import SessionLocal

from app.core.bonds.service import BondEngine
from app.core.bonds import (
    BondInputParams, EarlyRedemptionType, map_frequency_to_months, resolve_early_redemption_type
)
from app.schemas.database.asset import Bond

from datetime import date, timedelta


def test_bond_timeline(db, quantity: int, ticker: str):
    # 1. Wyciągamy obligację z bazy
    bond_db = db.query(Bond).filter(Bond.ticker == ticker).first()
    
    if not bond_db:
        print(f"Błąd: Nie znaleziono obligacji {ticker}")
        return

    # 2. Mapujemy model bazy danych na nasz DTO (BondInputParams)
    params = BondInputParams(
        quantity=quantity,
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
    
    print(f"--- SYMULACJA OBLIGACJI SERII {params.retail_series_type} ({ticker}) ---")
    print(f"Data zakupu: {params.issue_date}")
    print(f"Data wykupu: {params.maturity_date}")
    print(f"Data obliczeń (dzisiaj): {calc_date}")
    print("-" * 85)
    
    # 4. Budujemy okresy (nasza nowa metoda z logiką M-2 i NBP)
    engine.build_periods()
    periods = engine.get_all_periods()
    
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

    # 6. NOWOŚĆ: Symulacja wcześniejszego wykupu na dzień dzisiejszy
    print("\n" + "=" * 85)
    print(f"--- SYMULACJA WCZEŚNIEJSZEGO WYKUPU NA DZIEŃ: {calc_date} ---")
    print("=" * 85)
    
    try:
        redemption_sim = engine.simulate_early_redemption(
            redemption_date=calc_date,
            penalty_fee=params.early_redemption_penalty
        )
        
        print(f"Statystyki dla JEDNEJ sztuki obligacji (Nominał: {redemption_sim.per_bond.nominal:.2f} zł):")
        print(f"  - Narosłe odsetki brutto:    {redemption_sim.per_bond.accrued_interest:>6.2f} zł")
        print(f"  - Zastosowana opłata karna:  {redemption_sim.per_bond.penalty_applied:>6.2f} zł")
        print(f"  - Kwota wypłaty BRUTTO:      {redemption_sim.per_bond.gross_payout:>6.2f} zł")
        print(f"  - Potrącony podatek Belki:   {redemption_sim.per_bond.tax_applied:>6.2f} zł")
        print(f"  - Kwota wypłaty NETTO:       {redemption_sim.per_bond.net_payout:>6.2f} zł")
        print("-" * 50)
        print(f"Podsumowanie łączne dla CAŁEGO PORTFELA ({redemption_sim.total.quantity if hasattr(redemption_sim.total, 'quantity') else params.quantity} szt.):")
        print(f"  - Łączna opłata karna:       {redemption_sim.total.total_penalty:>6.2f} zł")
        print(f"  - Łączny podatek Belki:      {redemption_sim.total.total_tax:>6.2f} zł")
        print(f"  - ŁĄCZNA WYPŁATA BRUTTO:     {redemption_sim.total.gross_payout:>6.2f} zł")
        print(f"  - ŁĄCZNA WYPŁATA NETTO (na rękę): {redemption_sim.total.net_payout:>6.2f} zł")
        
    except ValueError as e:
        print(f"Informacja: Nie można przeprowadzić wcześniejszego wykupu dla tej daty.")
        print(f"Powód: {e}")
    except Exception as e:
        print(f"Błąd podczas generowania symulacji wykupu: {e}")
        
    print("=" * 85)
    
    try:
        summary = engine.get_current_value(
            current_date=calc_date
        )
        
        print(f"Wartość bieżąca bez wypłaconych dotąd odsetek (na dzień {calc_date}): {summary:.2f} PLN")
        
    except ValueError as e:
        print(f"Informacja: Nie można przeprowadzić wcześniejszego wykupu dla tej daty.")
        print(f"Powód: {e}")
    except Exception as e:
        print(f"Błąd podczas generowania symulacji wykupu: {e}")
        
    print("=" * 85)

if __name__ == "__main__":
    
    # Odpalamy skrypt testowy
    with SessionLocal() as db:
        test_bond_timeline(db, quantity=50, ticker='EDO0735')