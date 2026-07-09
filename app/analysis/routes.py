# app/router.py
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app import get_db
from app.schemas.database.asset import Asset
from app.analysis.schemas.dto import ChartTransactionPoint, ChartResponse, ChartDataPoint

from app.core.exchange.service import ExchangeEngine
from app.core.market_data import MarketDataProvider

ticker_history_router = APIRouter()
@ticker_history_router.get('/history', response_model=ChartResponse)
def get_asset_history(ticker: str, period: str, db: Session = Depends(get_db)):
    """
    Endpoint serwujący dane rynkowe + Twoją historię (średnia cena i kropki).
    """
    ticker = ticker.upper()
    period = period.lower()
    
    # 1. Walidacja okresu
    if period not in ['1mo', '3mo', '6mo', '1y', '5y', 'max']:
        period = '1y'

    # 2. Pobieramy Asset z bazy wraz z jego transakcjami
    asset = db.query(Asset).filter_by(ticker=ticker).first()
    
    avg_price = None
    transaction_points = []

    if asset:
        # Wykorzystujemy nasz silnik do przeliczenia aktualnych statystyk tego assetu
        # Potrzebujemy listy [asset], bo silnik przyjmuje listę
        engine = ExchangeEngine()
        portfolio = engine.build_portfolio([asset])
        
        # Pobieramy dane przeliczone dla tego konkretnego aktywa
        if portfolio:
            asset_data = portfolio[0]
            # Bierzemy średnią cenę w walucie instrumentu (avg_price), 
            # bo wykres z Yahoo też jest w tej walucie.
            avg_price = float(asset_data.summary.avg_price)
            
            # Mapujemy transakcje na punkty wykresu
            for t in asset.transactions:
                transaction_points.append(ChartTransactionPoint(
                    date=t.timestamp.strftime('%Y-%m-%d'),
                    type=t.type, # 'BUY', 'SELL', itp.
                    quantity=float(t.quantity),
                    price=float(t.price)
                ))

    # 3. Pobieramy dane rynkowe (Yahoo Finance)
    # MarketDataProvider zwraca List[ChartDataPoint]
    historical_market_data, historical_volume_data = MarketDataProvider.get_historical_data(ticker, period=period)

    if not historical_market_data:
        print(f"Brak danych rynkowych dla {ticker}")

    if not historical_volume_data:
        print(f"Brak danych wolumenowych dla {ticker}")

    # 4. Budujemy pancerne Response przy użyciu Pydantic
    return ChartResponse(
        ticker=ticker,
        period=period,
        historical_data=historical_market_data,
        historical_volume=historical_volume_data,
        avg_price=avg_price,
        transactions=transaction_points
    )