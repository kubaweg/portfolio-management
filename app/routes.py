from flask import render_template, request, redirect, url_for, current_app as app
from datetime import datetime
import pytz

from app import db
from app.models import Asset, Transaction
from app.portfolio_engine import PortfolioEngine

service = PortfolioEngine()

@app.route('/')
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
        total_roi_pa=None,
        allocation=totals.allocation,
        instrument_data=totals.instrument_data
    )

@app.route('/add_transaction', methods=['GET', 'POST'])
def add_transaction():
    assets = Asset.query.all()
    if request.method == 'POST':
        warsaw_tz = pytz.timezone('Europe/Warsaw')
        naive_dt = datetime.strptime(request.form.get('date'), '%Y-%m-%dT%H:%M')
        
        new_trans = Transaction(
            asset_id=request.form.get('asset_id'),
            transaction_type=request.form.get('type'),
            quantity=float(request.form.get('quantity')),
            price_per_unit=float(request.form.get('price')),
            exchange_rate=float(request.form.get('exchange_rate')),
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
            ticker=request.form.get('ticker').upper().strip(),
            name=request.form.get('name').strip(),
            asset_type=request.form.get('asset_type'),
            currency=request.form.get('currency').upper().strip()
        )
        db.session.add(new_asset)
        db.session.commit()
        return redirect(url_for('dashboard'))

    return render_template('add_asset.html')