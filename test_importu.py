import pandas as pd
from datetime import datetime

def test_bond_import(input_file, output_file):
    print(f"Wczytywanie pliku: {input_file}...")
    try:
        # Używamy xlrd dla starych plików .xls
        df = pd.read_excel(input_file, engine='xlrd')
    except Exception as e:
        print(f"Błąd podczas wczytywania pliku: {e}")
        return

    # Lista, do której będziemy wrzucać przetworzone wiersze
    processed_transactions = []

    for index, row in df.iterrows():
        dyspozycja = str(row.get('RODZAJ DYSPOZYCJI', '')).lower()
        ticker = str(row.get('KOD OBLIGACJI', '')).strip()
        
        # Ignorujemy puste tickery
        if not ticker or ticker == 'nan':
            continue

        raw_date = row.get('DATA DYSPOZYCJI')
        if pd.isna(raw_date):
            continue
            
        # Parsowanie daty
        if isinstance(raw_date, str):
            try:
                date_obj = datetime.strptime(raw_date, '%Y-%m-%d')
            except ValueError:
                try:
                    date_obj = datetime.strptime(raw_date, '%d.%m.%Y')
                except ValueError:
                    date_obj = None
        else:
            date_obj = raw_date
        
        # Ustawienie godziny 09:00 i sformatowanie do czytelnego tekstu
        if date_obj:
            transaction_date = date_obj.replace(hour=9, minute=0, second=0).strftime('%Y-%m-%d %H:%M')
        else:
            transaction_date = "BŁĄD DATY"

        # POBRANIE KWOTY - upewnij się, że kolumna nazywa się dokładnie 'KWOTA'
        try:
            kwota = float(row.get('KWOTA OPERACJI', 0))
        except ValueError:
            kwota = 0.0

        # --- LOGIKA DECYZYJNA ---
        typ_transakcji = None
        ilosc = 0.0
        cena_jednostkowa = 0.0

        if "zakup papierów" in dyspozycja:
            typ_transakcji = 'KUPNO'
            ilosc = kwota / 100.0  # Nominał to 100 zł
            cena_jednostkowa = 100.0
            
        elif "naliczenie odsetek" in dyspozycja:
            ilosc = 1.0
            cena_jednostkowa = kwota
            
            # EDO to kapitalizacja, reszta (np. DOR) to odsetki wypłacane
            if ticker.upper().startswith('EDO'):
                typ_transakcji = 'KAPITALIZACJA'
            else:
                typ_transakcji = 'ODSETKI'

        # Jeśli rozpoznaliśmy transakcję, dodajemy ją do naszej listy
        if typ_transakcji:
            processed_transactions.append({
                'Data': transaction_date,
                'Ticker': ticker.upper(),
                'Typ transakcji': typ_transakcji,
                'Ilość': ilosc,
                'Cena (PLN)': cena_jednostkowa,
                'Suma (Kwota z pliku)': kwota
            })

    # Tworzymy nowego Excela z zebranych danych
    if processed_transactions:
        out_df = pd.DataFrame(processed_transactions)
        out_df.to_excel(output_file, index=False, engine='openpyxl')
        print(f"Sukces! Wygenerowano plik testowy: {output_file}")
        print(f"Znaleziono i przetworzono {len(processed_transactions)} pasujących operacji.")
    else:
        print("Nie znaleziono żadnych wierszy pasujących do kryteriów (zakup / naliczenie odsetek).")

if __name__ == "__main__":
    # Nazwa Twojego pliku wejściowego i nazwa pliku wynikowego
    test_bond_import('HistoriaDyspozycji.xls', 'wynik_testu.xlsx')