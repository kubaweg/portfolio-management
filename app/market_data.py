import yfinance as yf
from typing import Tuple, Optional

class MarketDataProvider:
    """Klasa odpowiedzialna za pobieranie danych z rynków zewnętrznych."""

    @staticmethod
    def get_asset_price(ticker_symbol: str, asset_type: str, fallback_price: float = 0) -> float:
        """Pobiera aktualną cenę instrumentu z Yahoo Finance."""
        if asset_type == 'Obligacja':
            return 100.0

        try:
            ticker_yf = yf.Ticker(ticker_symbol)
            # Używamy fast_info dla szybkości, ale z obsługa błędów
            price = ticker_yf.fast_info.get('lastPrice')
            return price if price is not None else fallback_price
        except Exception:
            return fallback_price

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