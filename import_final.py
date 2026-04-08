import pandas as pd
from datetime import datetime
import sys
import os

# 1. Konfiguracja ścieżek
sys.path.append(os.getcwd())


from app import create_app, db
app = create_app()


from app.models import Asset, Transaction

def finalize_bond_import(input_file):
    print(f"Rozpoczynam inteligentny import z pliku: {input_file}...")
    
    if not os.path.exists(input_file):
        print(f"BŁĄD: Nie znaleziono pliku {input_file}")
        return

    try:
        # Silnik xlrd obsługuje stare pliki .xls
        df = pd.read_excel(input_file, engine='xlrd')
    except Exception as e:
        print(f"Błąd odczytu Excela: {e}")
        return

    with app.app_context():
        added_count = 0
        already_exists_count = 0
        skipped_no_asset_count = 0
        
        for index, row in df.iterrows():
            dyspozycja = str(row.get('RODZAJ DYSPOZYCJI', '')).lower()
            ticker = str(row.get('KOD OBLIGACJI', '')).strip().upper()
            
            if not ticker or ticker == 'nan':
                continue

            asset = Asset.query.filter_by(ticker=ticker).first()
            if not asset:
                skipped_no_asset_count += 1
                continue

            # --- Przetwarzanie daty ---
            raw_date = row.get('DATA DYSPOZYCJI')
            if pd.isna(raw_date): continue
            
            if isinstance(raw_date, str):
                try:
                    date_obj = datetime.strptime(raw_date, '%Y-%m-%d')
                except:
                    date_obj = datetime.strptime(raw_date, '%d.%m.%Y')
            else:
                date_obj = raw_date
            
            # Standaryzujemy godzinę na 09:00, tak jak w poprzednim skrypcie
            transaction_date = date_obj.replace(hour=9, minute=0, second=0)
            kwota = float(row.get('KWOTA OPERACJI', 0))

            # --- Mapowanie typów ---
            if "zakup papierów" in dyspozycja:
                typ, ilosc, cena = 'KUPNO', kwota / 100.0, 100.0
            elif "naliczenie wykupu" in dyspozycja:
                # Wykup kapitału: kwota operacji to ilosc sztuk * 100 PLN
                # Traktujemy to jako SPRZEDAŻ, aby zdjąć jednostki ze stanu
                typ, ilosc, cena = 'SPRZEDAŻ', kwota / 100.0, 100.0
            elif "naliczenie odsetek" in dyspozycja or "wykup - odsetki" in dyspozycja:
                ilosc, cena = 1.0, kwota
                typ = 'KAPITALIZACJA' if (ticker.startswith('EDO') or ticker.startswith('TOS')) else 'ODSETKI'
            else:
                continue

            # --- KLUCZOWY MOMENT: Sprawdzenie duplikatu ---
            # Szukamy czy identyczna transakcja już jest w bazie
            existing = Transaction.query.filter_by(
                asset_id=asset.id,
                transaction_type=typ,
                date=transaction_date,
                quantity=ilosc,
                price_per_unit=cena
            ).first()

            if existing:
                already_exists_count += 1
                # Logujemy tylko co jakiś czas, żeby nie zaśmiecać konsoli przy 1000 rekordów
                if already_exists_count % 10 == 0:
                    print(f"Info: Znaleziono już {already_exists_count} istniejących rekordów...")
                continue

            # Jeśli nie ma duplikatu - dodajemy
            new_trans = Transaction(
                asset_id=asset.id,
                transaction_type=typ,
                quantity=ilosc,
                price_per_unit=cena,
                exchange_rate=1.0,
                date=transaction_date
            )
            db.session.add(new_trans)
            added_count += 1

        db.session.commit()
        
        print("-" * 30)
        print(f"PODSUMOWANIE IMPORTU:")
        print(f"✅ Dodano nowych: {added_count}")
        print(f"ℹ️ Pominięto (już były w bazie): {already_exists_count}")
        print(f"⚠️ Pominięto (brak tickera w bazie): {skipped_no_asset_count}")
        print("-" * 30)

if __name__ == "__main__":
    finalize_bond_import('HistoriaDyspozycji (1).xls')