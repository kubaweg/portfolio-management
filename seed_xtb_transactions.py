import pandas as pd
from app import SessionLocal
from app.schemas.database.asset import Asset
from app.schemas.database.transaction import Transaction
from app.schemas.domain.transactions import TransactionType
from decimal import Decimal

def import_from_excel(file_path):

    with SessionLocal() as db:
        
        added_count = 0
        already_exists_count = 0
        skipped_no_asset_count = 0
        
        try:
            df = pd.read_excel(file_path)
        except Exception as e:
            print(f"Błąd podczas czytania pliku: {e}")
            return

        for index, row in df.iterrows():
            ticker = str(row['ticker']).strip()
            
            asset = db.query(Asset).filter_by(ticker=ticker).first()
            if not asset:
                print(f"BŁĄD: Nie znaleziono '{ticker}' (wiersz {index}).")
                skipped_no_asset_count += 1
                continue

            try:
                
                # pandas.to_datetime bez problemu połknie format "2026-03-12T09:05:00"
                # i zamieni go na obiekt Timestamp (kompatybilny z db.DateTime)
                ts_value = pd.to_datetime(row['timestamp'])

                tx_type_str = str(row['type']).upper().strip()
                tx_type = TransactionType[tx_type_str]
                
                # --- KLUCZOWY MOMENT: Sprawdzenie duplikatu ---
                # Szukamy czy identyczna transakcja już jest w bazie
                existing = db.query(Transaction).filter_by(
                    asset_id=asset.id,
                    type=tx_type,
                    timestamp=ts_value,
                    quantity=row['quantity'],
                    price=row['price']
                ).first()

                if existing:
                    already_exists_count += 1
                    # Logujemy tylko co jakiś czas, żeby nie zaśmiecać konsoli przy 1000 rekordów
                    if already_exists_count % 10 == 0:
                        print(f"Info: Znaleziono już {already_exists_count} istniejących rekordów...")
                    continue

                new_tx = Transaction(
                    asset_id=asset.id,
                    type=tx_type,
                    timestamp=ts_value, # Przekazujemy pełny timestamp z godziną
                    quantity=Decimal(str(row['quantity'])),
                    price=Decimal(str(row['price'])),
                    fx_rate=Decimal(str(row['fx_rate'])),
                    notes=str(row['notes']) if pd.notna(row['notes']) else None
                )

                db.add(new_tx)
                added_count += 1
                
            except Exception as e:
                print(f"BŁĄD w wierszu {index} ({ticker}): {e}")
                skipped_no_asset_count += 1

        db.commit()
        print("-" * 30)
        print(f"PODSUMOWANIE IMPORTU:")
        print(f"✅ Dodano nowych: {added_count}")
        print(f"ℹ️ Pominięto (już były w bazie): {already_exists_count}")
        print(f"⚠️ Pominięto (brak tickera w bazie): {skipped_no_asset_count}")
        print("-" * 30)

if __name__ == "__main__":
    import_from_excel("xtb/HistoriaTransakcji.xlsx")