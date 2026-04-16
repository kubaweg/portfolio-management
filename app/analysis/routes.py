from flask import render_template, request, jsonify
from app.schemas.database.asset import Asset
from app.schemas.dto.charts import ChartResponse, ChartTransactionPoint
from app.portfolio.portfolio_engine import PortfolioEngine
from app.core.market_data import MarketDataProvider

from . import analysis_bp

# Zakładka z wykresami
@analysis_bp.route('/')
def analysis():
    """Główny widok zakładki analizy."""
    # Filtrujemy bazę, żeby wyciągnąć tylko ETF-y
    assets = Asset.query.filter(Asset.asset_type.in_(['ETF', 'ETC'])).with_entities(Asset.ticker).distinct().all()
    tickers = [a.ticker for a in assets]
    return render_template('analysis/analysis.html', tickers=tickers)

@analysis_bp.route('/api/history/<string:ticker>')
def get_asset_history(ticker):
    """
    Endpoint serwujący dane rynkowe + Twoją historię (średnia cena i kropki).
    """
    ticker_upper = ticker.upper()
    period = request.args.get('period', '1y')
    
    # 1. Walidacja okresu
    if period not in ['1mo', '3mo', '6mo', '1y', '5y', 'max']:
        period = '1y'

    # 2. Pobieramy Asset z bazy wraz z jego transakcjami
    asset = Asset.query.filter_by(ticker=ticker_upper).first()
    
    avg_price_val = None
    transaction_points = []

    if asset:
        # Wykorzystujemy nasz silnik do przeliczenia aktualnych statystyk tego assetu
        # Potrzebujemy listy [asset], bo silnik przyjmuje listę
        engine = PortfolioEngine()
        portfolio_data, _ = engine.build_portfolio([asset])
        
        # Pobieramy dane przeliczone dla tego konkretnego aktywa
        if portfolio_data:
            asset_stats = portfolio_data[0]
            # Bierzemy średnią cenę w walucie instrumentu (avg_price_currency), 
            # bo wykres z Yahoo też jest w tej walucie.
            avg_price_val = float(asset_stats.avg_price_currency)
            
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
    historical_market_data, historical_volume_data = MarketDataProvider.get_historical_data(ticker_upper, period=period)

    if not historical_market_data:
        return jsonify({"error": f"Brak danych rynkowych dla {ticker_upper}"}), 404
    
    if not historical_volume_data:
        return jsonify({"error": f"Brak danych wolumenowych dla {ticker_upper}"}), 404

    # 4. Budujemy pancerne Response przy użyciu Pydantic
    response_model = ChartResponse(
        ticker=ticker_upper,
        period=period,
        historical_data=historical_market_data,
        historical_volume=historical_volume_data,
        avg_price=avg_price_val,
        transactions=transaction_points
    )

    # model_dump() w Pydantic v2 zamienia obiekt na dict, który jsonify przerobi na JSON
    return jsonify(response_model.model_dump())