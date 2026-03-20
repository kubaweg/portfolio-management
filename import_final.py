import pandas as pd
from datetime import datetime
import sys
import os

# 1. Dodajemy bieżący folder do ścieżki, żeby Python widział folder 'app'
sys.path.append(os.getcwd())

# 2. Próbujemy zaimportować instancję aplikacji
try:
    # Próba A: Jeśli masz instancję w app/__init__.py
    from app import app, db
except ImportError:
    try:
        # Próba B: Jeśli używasz Factory Pattern (create_app)
        from app import create_app, db
        app = create_app()
    except ImportError:
        # Próba C: Jeśli app jest zdefiniowana w run.py
        from run import app, db

from app.models import Asset, Transaction

def finalize_bond_import(input_file):
    print(f"Rozpoczynam import finalny z pliku: {input_file}...")
    
    if not os.path.exists(input_file):
        print(f"BŁĄD: Nie znaleziono pliku {input_file} w folderze {os.getcwd()}")
        return

    try:
        df = pd.read_excel(input_file, engine='xlrd')
    except Exception as e:
        print(f"Błąd odczytu Excela: {e}")
        return

    # Używamy kontekstu aplikacji
    with app.app_context():
        added_count = 0
        skipped_count = 0
        
        for index, row in df.iterrows():
            # (Tutaj pozostaje Twoja sprawdzona logika z test_importu)
            dyspozycja = str(row.get('RODZAJ DYSPOZYCJI', '')).lower()
            ticker = str(row.get('KOD OBLIGACJI', '')).strip().upper()
            
            if not ticker or ticker == 'nan':
                continue

            asset = Asset.query.filter_by(ticker=ticker).first()
            if not asset:
                print(f"Pominięto: {ticker} (brak w bazie)")
                skipped_count += 1
                continue

            raw_date = row.get('DATA DYSPOZYCJI')
            if pd.isna(raw_date): continue
            
            if isinstance(raw_date, str):
                try:
                    date_obj = datetime.strptime(raw_date, '%Y-%m-%d')
                except:
                    date_obj = datetime.strptime(raw_date, '%d.%m.%Y')
            else:
                date_obj = raw_date
            
            transaction_date = date_obj.replace(hour=9, minute=0, second=0)
            kwota = float(row.get('KWOTA OPERACJI', 0))

            if "zakup papierów" in dyspozycja:
                typ, ilosc, cena = 'KUPNO', kwota / 100.0, 100.0
            elif "naliczenie odsetek" in dyspozycja:
                ilosc, cena = 1.0, kwota
                typ = 'KAPITALIZACJA' if (ticker.startswith('EDO') or ticker.startswith('TOS')) else 'ODSETKI'
            else:
                continue

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
        print(f"\nSukces! Dodano {added_count} transakcji. Pominięto {skipped_count}.")

if __name__ == "__main__":
    finalize_bond_import('HistoriaDyspozycji.xls')