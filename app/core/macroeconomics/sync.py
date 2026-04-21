import pandas as pd
from flask_sqlalchemy import SQLAlchemy
from app.schemas.database.macroeconomics import Inflation, InterestRate

# Zmień import parsowania na swój własny:
from .fetch import get_cpi, get_ref 

def sync_inflation_data(db: SQLAlchemy, df_infl: pd.DataFrame) -> int:
    """Zrzuca nowe dane o inflacji do bazy i zwraca liczbę dodanych rekordów."""
    if df_infl is None or df_infl.empty:
        return 0

    # 1. Pobierz miesiące, które już są w bazie danych
    existing_records = db.session.query(Inflation.month).all()
    existing_months = [record[0] for record in existing_records] # Set dla szybkiego wyszukiwania

    # 2. Odfiltruj ramkę Pandas - zostaw tylko te miesiące, których nie ma w secie
    df_new = df_infl[~df_infl['Miesiąc'].astype(str).isin(existing_months)]

    if df_new.empty:
        return 0

    # 3. Przygotuj nowe rekordy do zapisu
    new_db_records = []
    for _, row in df_new.iterrows():
        new_db_records.append(
            Inflation(
                month=str(row['Miesiąc']),
                value=float(row['CPI']) # Wymuszenie rzutowania na typy natywne Pythona
            )
        )

    # 4. Zapisz wszystko naraz (Bulk insert)
    db.session.add_all(new_db_records)
    db.session.commit()
    
    return len(new_db_records)

def sync_interest_rates(db: SQLAlchemy, df_rates: pd.DataFrame) -> int:
    """Zrzuca nowe dane o stopach NBP do bazy i zwraca liczbę dodanych rekordów."""
    if df_rates is None or df_rates.empty:
        return 0
    
    # Upewnijmy się, że kolumna daty w Pandas to faktycznie obiekty daty
    df_rates['ObowiązujeOd'] = pd.to_datetime(df_rates['ObowiązujeOd']).dt.date

    # 1. Pobierz daty z bazy danych
    existing_records = db.session.query(InterestRate.effective_date).all()
    existing_dates = {record[0] for record in existing_records}

    # 2. Odfiltruj ramkę Pandas
    df_new = df_rates[~df_rates['ObowiązujeOd'].isin(existing_dates)]

    if df_new.empty:
        return 0

    # 3. Przygotuj nowe rekordy
    new_db_records = []
    for _, row in df_new.iterrows():
        new_db_records.append(
            InterestRate(
                effective_date=row['ObowiązujeOd'],
                value=float(row['StopaReferencyjna'])
            )
        )

    # 4. Zapisz w bazie
    db.session.add_all(new_db_records)
    db.session.commit()
    
    return len(new_db_records)