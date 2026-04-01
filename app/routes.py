from flask import render_template, jsonify, request, redirect, url_for, current_app as app
from datetime import datetime
import pytz

from app import db
from app.market_data import MarketDataProvider
from .models import Asset, Transaction
from .portfolio_engine import PortfolioEngine
from .schemas import ChartDataPoint, ChartResponse, ChartTransactionPoint

service = PortfolioEngine()

@app.route('/')
@app.route('/dashboard')
def dashboard():
    assets = Asset.query.all()
    portfolio_data, totals = service.get_portfolio_summary(assets)

    return render_template(
        'dashboard.html', 
        portfolio=portfolio_data, 
        total_invested=totals.invested,
        total_current=totals.current_value,
        total_cash_interest=totals.interest,
        total_profit=totals.profit,
        total_roi=totals.roi,
        total_roi_pa=totals.annualized_roi,
        allocation=totals.allocation,
        instrument_data=totals.instrument_data
    )

@app.route('/add_transaction', methods=['GET', 'POST'])
def add_transaction():
    assets = Asset.query.all()
    if request.method == 'POST':
        warsaw_tz = pytz.timezone('Europe/Warsaw')
        naive_dt = datetime.strptime(request.form.get('date', '9999-12-31T23:59:00'), '%Y-%m-%dT%H:%M')
        
        new_trans = Transaction(
            asset_id=request.form.get('asset_id'),
            transaction_type=request.form.get('type'),
            quantity=float(request.form.get('quantity', -1.0)),
            price_per_unit=float(request.form.get('price', -1.0)),
            exchange_rate=float(request.form.get('exchange_rate', -1.0)),
            date=warsaw_tz.localize(naive_dt)
        )
        db.session.add(new_trans)
        db.session.commit()
        return redirect(url_for('dashboard'))

    return render_template('add_transaction.html', assets=assets)

@app.route('/transactions')
def list_transactions():
    transactions = Transaction.query.order_by(Transaction.date.desc()).all()
    return render_template('list_transactions.html', transactions=transactions)

@app.route('/delete_transaction/<int:id>', methods=['POST'])
def delete_transaction(id):
    transaction = Transaction.query.get_or_404(id)
    db.session.delete(transaction)
    db.session.commit()
    return redirect(url_for('list_transactions'))

@app.route('/add_asset', methods=['GET', 'POST'])
def add_asset():
    if request.method == 'POST':
        new_asset = Asset(
            ticker=request.form.get('ticker', '').upper().strip(),
            name=request.form.get('name', '').strip(),
            asset_type=request.form.get('asset_type', ''),
            currency=request.form.get('currency', '').upper().strip()
        )
        db.session.add(new_asset)
        db.session.commit()
        return redirect(url_for('dashboard'))

    return render_template('add_asset.html')


# Zakładka z wykresami
@app.route('/analysis')
def analysis():
    """Główny widok zakładki analizy."""
    # Filtrujemy bazę, żeby wyciągnąć tylko ETF-y
    assets = Asset.query.filter_by(asset_type='ETF').with_entities(Asset.ticker).distinct().all()
    tickers = [a.ticker for a in assets]
    return render_template('analysis.html', tickers=tickers)

@app.route('/api/history/<string:ticker>')
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
        portfolio_data, _ = engine.get_portfolio_summary([asset])
        
        # Pobieramy dane przeliczone dla tego konkretnego aktywa
        if portfolio_data:
            asset_stats = portfolio_data[0]
            # Bierzemy średnią cenę w walucie instrumentu (avg_price_currency), 
            # bo wykres z Yahoo też jest w tej walucie.
            avg_price_val = float(asset_stats.avg_price_currency)
            
            # Mapujemy transakcje na punkty wykresu
            for t in asset.transactions:
                transaction_points.append(ChartTransactionPoint(
                    date=t.date.strftime('%Y-%m-%d'),
                    type=t.transaction_type, # 'KUPNO', 'SPRZEDAZ', itp.
                    quantity=float(t.quantity),
                    price=float(t.price_per_unit)
                ))

    # 3. Pobieramy dane rynkowe (Yahoo Finance)
    # MarketDataProvider zwraca List[ChartDataPoint]
    historical_market_data = MarketDataProvider.get_historical_data(ticker_upper, period=period)
    print(historical_market_data)

    if not historical_market_data:
        return jsonify({"error": f"Brak danych rynkowych dla {ticker_upper}"}), 404

    # 4. Budujemy pancerne Response przy użyciu Pydantic
    response_model = ChartResponse(
        ticker=ticker_upper,
        period=period,
        historical_data=historical_market_data,
        avg_price=avg_price_val,
        transactions=transaction_points
    )

    # model_dump() w Pydantic v2 zamienia obiekt na dict, który jsonify przerobi na JSON
    return jsonify(response_model.model_dump())