from app import app

from app.core.macroeconomics.sync import sync_inflation_data, sync_interest_rates
from app.core.macroeconomics.fetch import get_cpi, get_ref

import os

# def init_macro_data():
#     """Funkcja pobierająca i zapisująca dane do bazy."""
#     print("Uruchamianie synchronizacji danych makroekonomicznych...")
    
#     try:
#         # Tutaj wywołujesz swoje parsery
#         df_infl = get_cpi()
#         df_nbp = get_ref()

#         # Zapis do bazy
#         added_infl = sync_inflation_data(db, df_infl)
#         added_nbp = sync_interest_rates(db, df_nbp)
        
#         print(f"Gotowe! Dodano: Inflacja ({added_infl}), NBP ({added_nbp})")

#     except Exception as e:
#         print(f"Błąd podczas synchronizacji: {e}")
#     finally:
#         db.session.close()

# Tworzenie tabel w bazie danych, jeśli jeszcze nie istnieją
with app.app_context():
    from app.schemas.database.asset import Asset
    from app.schemas.database.transaction import Transaction
    db.create_all()

    # init_macro_data()

if __name__ == '__main__':
    app.run(debug=True)