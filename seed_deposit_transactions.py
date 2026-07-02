import pandas as pd
from datetime import datetime
import sys
import os

# 1. Konfiguracja ścieżek
sys.path.append(os.getcwd())

from app import SessionLocal

from app.schemas.database.transaction import Transaction
from app.schemas.domain.transactions import TransactionType

if __name__ == "__main__":

    cash_data = [
            ("DEPOSIT", datetime(2026, 2, 1, 19, 6), 1000, 'XTB - Kuba'),
            ("DEPOSIT", datetime(2026, 2, 12, 12, 16), 1, 'XTB - Kuba'),
            ("DEPOSIT", datetime(2026, 2, 12, 19, 15), 15000, 'XTB - Kuba'),
            ("DEPOSIT", datetime(2026, 3, 11, 16, 15), 13000, 'XTB - Kuba'),
            ("DEPOSIT", datetime(2026, 3, 23, 16, 16), 750, 'XTB - Kuba'),
            ("DEPOSIT", datetime(2026, 5, 11, 13, 16), 4000, 'XTB - Kuba'),
            ("DEPOSIT", datetime(2026, 6, 12, 12, 15), 6000, 'XTB - Kuba'),
            ("DEPOSIT", datetime(2026, 6, 22, 12, 16), 10000, 'XTB - Kuba'),
        ]

    with SessionLocal() as db:

        added_count = 0
        already_exists_count = 0

        for tx_type, tx_timestamp, value_net, deposit_account in cash_data:

            tx_type = TransactionType(tx_type)

            existing = db.query(Transaction).filter_by(type=tx_type, timestamp=tx_timestamp, value_net=value_net).first()
            if existing:
                already_exists_count += 1
                continue

            new_trans = Transaction(
                type=tx_type,
                timestamp=tx_timestamp,
                value_net=value_net,
                metadata_json={
                    'deposit_account': deposit_account
                }
            )
            print(tx_type, tx_timestamp, value_net)
            db.add(new_trans)
            added_count += 1

        db.commit()

        print("-" * 30)
        print(f"PODSUMOWANIE IMPORTU:")
        print(f"✅ Dodano nowych: {added_count}")
        print(f"ℹ️ Pominięto (już były w bazie): {already_exists_count}")
        print("-" * 30)
                