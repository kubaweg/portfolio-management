import yfinance as yf
from typing import Tuple, Optional, List
from datetime import datetime
from app.schemas.dto.charts import ChartDataPoint, VolumeDataPoint
from app.schemas.database.asset import AssetType

import os
import pandas as pd

BOND_PRICES_INPUT_FILE = 'obligacjeskarbowe/StanRachunkuRejestrowego.xls'

def _get_current_bond_price(ticker_symbol: str, input_file: str) -> float:
        
    if not os.path.exists(input_file):
        print(f"BŁĄD: Nie znaleziono pliku {input_file}")
        return -999.0
    
    try:
        # Silnik xlrd obsługuje stare pliki .xls
        df = pd.read_excel(input_file, engine='xlrd')
    except Exception as e:
        print(f"Błąd odczytu Excela: {e}")
        return -999.0
    
    for index, row in df.iterrows():
        total_current_value = float(row.get('WARTOŚĆ AKTUALNA', 0.0))
        ticker = str(row.get('EMISJA', '')).strip().upper()
        total_quantity = int(row.get('DOSTĘPNA LICZBA OBLIGACJI', 0))
        
        if ticker == ticker_symbol: 
            return total_current_value / total_quantity
    
    return 0.0

    
class MarketDataProvider:
    """Klasa odpowiedzialna za pobieranie danych z rynków zewnętrznych."""

    @staticmethod
    def get_asset_price(ticker_symbol: str, asset_type: AssetType, fallback_price: float = 0.0) -> float:
        """Pobiera aktualną cenę instrumentu z Yahoo Finance."""
        if asset_type == AssetType.BOND:
            return _get_current_bond_price(ticker_symbol=ticker_symbol, input_file=BOND_PRICES_INPUT_FILE)

        try:
            ticker_yf = yf.Ticker(ticker_symbol)
            # Używamy fast_info dla szybkości, ale z obsługa błędów
            price = ticker_yf.fast_info.get('lastPrice')
            return price if price is not None else fallback_price
        
        except Exception:
            return fallback_price
       
            
    
        
    @staticmethod
    def get_asset_time(ticker_symbol: str, asset_type: AssetType) -> datetime:
        """Pobiera aktualność ceny instrumentu z Yahoo Finance."""
        if asset_type == AssetType.BOND:
            return datetime.now().replace(second=0, microsecond=0)

        try:
            ticker_yf = yf.Ticker(ticker_symbol)
                
            # Uwaga: .info jest wolne i czasem blokowane przez Yahoo
            timestamp_unix = ticker_yf.info.get('regularMarketTime')
            if timestamp_unix:
                timestamp = datetime.fromtimestamp(timestamp_unix)
                return timestamp
                
            # Jeśli brak danych o czasie w .info, zwracamy czas bieżący
            return datetime.now().replace(second=0, microsecond=0)
                            
        except Exception:
            return datetime.now().replace(second=0, microsecond=0)

    @staticmethod
    def get_fx_rate(currency: str) -> float:
        """Pobiera kurs wymiany waluty na PLN (np. USDPLN=X)."""
        if not currency or currency == 'PLN':
            return 1.0
            
        try:
            pair = f"{currency.upper()}PLN=X"
            fx_yf = yf.Ticker(pair)
            rate = fx_yf.fast_info.get('lastPrice')
            return rate if rate is not None else 1.0
        except Exception:
            return 1.0
        
    @staticmethod
    def get_fx_time(currency: str) -> datetime:
        """Pobiera aktualność kursu wymiany waluty na PLN (np. USDPLN=X)."""
        if not currency or currency == 'PLN':
            return datetime.now().replace(second=0, microsecond=0)
        
        try:
            pair = f"{currency.upper()}PLN=X"
            fx_yf = yf.Ticker(pair)
                
            # Uwaga: .info jest wolne i czasem blokowane przez Yahoo
            timestamp_unix = fx_yf.info.get('regularMarketTime')
            if timestamp_unix:
                timestamp = datetime.fromtimestamp(timestamp_unix)
                return timestamp
                
            # Jeśli brak danych o czasie w .info, zwracamy czas bieżący
            return datetime.now().replace(second=0, microsecond=0)
                            
        except Exception:
            return datetime.now().replace(second=0, microsecond=0)
        
    @staticmethod
    def get_historical_data(ticker_symbol: str, period: str = "1y") -> Tuple[List[ChartDataPoint], List[VolumeDataPoint]]:
        """
        Pobiera historię cen zamknięcia dla danego instrumentu.
        Dostępne okresy: '1mo', '3mo', '6mo', '1y', '5y', 'max'.
        """
        try:
            ticker = yf.Ticker(ticker_symbol)
            # Pobieramy interwał dzienny (interval="1d")
            hist = ticker.history(period=period, interval="1d")
            
            if hist.empty:
                return [], []

            chart_data = []
            volume_data = []
            for timestamp, row in hist.iterrows():
                # Czyścimy dane: resetujemy czas do samej daty i zaokrąglamy cenę
                chart_data.append(ChartDataPoint(
                    date=timestamp.strftime('%Y-%m-%d'),
                    open=round(float(row['Open']), 4),
                    high=round(float(row['High']), 4),
                    low=round(float(row['Low']), 4),
                    close=round(float(row['Close']), 4)
                ))

                volume_data.append(VolumeDataPoint(
                    date=timestamp.strftime('%Y-%m-%d'),
                    volume=int(row['Volume'])
                ))
                
            return chart_data, volume_data

        except Exception as e:
            print(f"Błąd pobierania historii dla {ticker_symbol}: {e}")
            return [], []