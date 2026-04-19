import pandas as pd
import requests
import xml.etree.ElementTree as ET
import os

def get_cpi():
    
    filename = os.listdir('gus')[0]
    df = pd.read_excel(f'gus/{filename}')

    if df.empty:
        print(f"Błąd: Pobrany arkusz jest pusty.")
        return None

    df = df[df['Sposób prezentacji'] == 'Analogiczny miesiąc poprzedniego roku = 100']

    df['Miesiąc'] = pd.to_datetime(
        df[['Rok', 'Miesiąc']].assign(day=1).rename(columns={'Rok': 'year', 'Miesiąc': 'month'})
    ).dt.to_period('M')

    df = df.rename(columns={'Wartość': 'CPI'})
    df = df[['Miesiąc', 'CPI']]
    df = df.sort_values('Miesiąc')
    df = df.dropna()

    return df


def get_ref():
    try:
        # 1. Pobieranie danych z URL
        headers = {'User-Agent': 'Mozilla/5.0'}
        response = requests.get('https://static.nbp.pl/dane/stopy/stopy_procentowe_archiwum.xml', headers=headers)
        response.raise_for_status() # Sprawdza, czy nie ma błędu 404/500
        
        # 2. Parsowanie XML z tekstu
        root = ET.fromstring(response.content)
        data_list = []

        # 3. Iteracja po strukturze
        for pozycje in root.findall('pozycje'):
            data_str = pozycje.get('obowiazuje_od', '')
            
            for pozycja in pozycje.findall('pozycja'):
                rate_id = pozycja.get('id', '')
                # NBP używa przecinków, zamieniamy na kropki dla float
                value_str = pozycja.get('oprocentowanie', '').replace(',', '.')
                
                data_list.append({
                    'Data': data_str,
                    'Typ': rate_id,
                    'Wartosc': float(value_str)
                })

        # 4. Tworzenie DataFrame i transformacja
        df_long = pd.DataFrame(data_list)
        
        # Pivot zamienia typy stóp na osobne kolumny
        df_wide = df_long.pivot(index='Data', columns='Typ', values='Wartosc')
        
        # Konwersja indeksu na format daty i sortowanie od najnowszych
        df_wide.index = pd.to_datetime(df_wide.index)
        df_wide = df_wide.sort_index()
        df_wide = df_wide['ref'].dropna().reset_index()
        df_wide = df_wide.rename(columns={'Data': 'ObowiązujeOd', 'ref': 'StopaReferencyjna'})

        return df_wide

    except Exception as e:
        print(f"Błąd podczas pobierania lub parsowania: {e}")
        return pd.DataFrame()


if __name__ == "__main__":
    print("Próba pobrania danych...")
    df_inflacja = get_cpi()
    
    if df_inflacja is not None:
        print("\n--- INFLACJA GUS (Ostatnie rekordy) ---")
        print(df_inflacja.tail())

    # Uruchomienie
    url_archiwum = "https://static.nbp.pl/dane/stopy/stopy_procentowe_archiwum.xml"
    df_stopy = get_ref()

    if df_stopy is not None:
        print("\n--- STOPA REFERENCYJNA (Ostatnie rekordy) ---")
        print(df_stopy.tail())