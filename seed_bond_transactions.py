import pandas as pd
from datetime import datetime
import sys
import os

# 1. Konfiguracja ścieżek
sys.path.append(os.getcwd())

from app import SessionLocal

from app.schemas.database.asset import Asset
from app.schemas.database.transaction import Transaction
from app.schemas.domain.transactions import TransactionType

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

    with SessionLocal() as db:

        added_count = 0
        already_exists_count = 0
        skipped_no_asset_count = 0
        
        for i, row in df.iterrows():
            dyspozycja = str(row.get('RODZAJ DYSPOZYCJI', '')).lower()
            ticker = str(row.get('KOD OBLIGACJI', '')).strip().upper()
            
            if not ticker or ticker == 'nan': continue

            asset = db.query(Asset).filter_by(ticker=ticker).first()
            nominal_value = float(asset.nominal_value) # type: ignore

            if not asset:
                skipped_no_asset_count += 1
                continue

            # --- Przetwarzanie daty (pozostaje bez zmian) ---
            tx_date = row.get('DATA DYSPOZYCJI')
            value_net = float(row.get('KWOTA OPERACJI', 0))
            quantity = float(row.get('LICZBA OBLIGACJI', 0))

            if pd.isna(tx_date):
                raise ValueError('Brak daty transakcji w pliku.')

            tx_timestamp = (
                datetime.strptime(tx_date, '%Y-%m-%d') if isinstance(tx_date, str) else tx_date
            ).replace(hour=9, minute=0, second=0)

            # --- Nowa logika mapowania ---
            is_exchange = False
            is_early_redemption = False

            # Pomijamy odsetki i wykupy (tylko BUY i SELL/Early Redemption)
            if "zakup papierów" in dyspozycja and 'zamiana' not in dyspozycja:
                tx_type = TransactionType.BUY
                price = value_net / quantity
                if abs(price-nominal_value) > 0.001: 
                    is_exchange = True
                
            elif "naliczenie wykupu" in dyspozycja:
                # jeszcze nie wiemy jak w danych wygląda przedterminowy wykup
                # tx_type = TransactionType.SELL
                # is_early_redemption = True
                # price = 0.0
                continue

            else:
                # Pomijamy wszystko inne (odsetki, operacje zamiany itp.)
                continue

            # --- Sprawdzenie duplikatu ---
            # Szukamy po asset_id, type, timestamp, quantity, price
            existing = db.query(Transaction).filter_by(
                asset_id=asset.id,
                value_net=value_net,
                type=tx_type,
                timestamp=tx_timestamp,
                quantity=quantity,
                price=price
            ).first()

            if existing:
                already_exists_count += 1
                continue

            # --- Tworzenie nowej transakcji ---
            # Używamy słownika dla pól specyficznych, żeby kod był czytelny
            new_trans = Transaction(
                asset_id=asset.id,
                type=tx_type,
                timestamp=tx_timestamp,
                value_net=value_net,
                fee=0.0,
                tax=0.0,
                quantity=quantity,
                price=price,
                fx_rate=1.0,
                is_exchange=is_exchange,
                is_early_redemption=is_early_redemption
            )
            print(ticker, tx_type, tx_timestamp, value_net, quantity, price, is_exchange)
            db.add(new_trans)
            added_count += 1

        db.commit()
        
        print("-" * 30)
        print(f"PODSUMOWANIE IMPORTU:")
        print(f"✅ Dodano nowych: {added_count}")
        print(f"ℹ️ Pominięto (już były w bazie): {already_exists_count}")
        print(f"⚠️ Pominięto (brak tickera w bazie): {skipped_no_asset_count}")
        print("-" * 30)

if __name__ == "__main__":
    finalize_bond_import('obligacjeskarbowe/Kuba/HistoriaDyspozycji.xls')
    finalize_bond_import('obligacjeskarbowe/Natalka/HistoriaDyspozycji.xls')