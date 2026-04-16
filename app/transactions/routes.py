from flask import render_template, request, redirect, url_for
from datetime import datetime
import pytz

from app import db
from app.schemas.database.asset import Asset
from app.schemas.database.transaction import Transaction

from . import add_transaction_bp, list_transactions_bp, delete_transaction_bp

@add_transaction_bp.route('/', methods=['GET', 'POST'])
def add_transaction():
    assets = Asset.query.all()
    if request.method == 'POST':
        warsaw_tz = pytz.timezone('Europe/Warsaw')
        naive_dt = datetime.strptime(request.form.get('date', '9999-12-31T23:59:00'), '%Y-%m-%dT%H:%M')
        
        new_trans = Transaction(
            asset_id=request.form.get('asset_id'),
            type=request.form.get('type'),
            quantity=float(request.form.get('quantity', -1.0)),
            price=float(request.form.get('price', -1.0)),
            fx_rate=float(request.form.get('exchange_rate', -1.0)),
            timestamp=warsaw_tz.localize(naive_dt)
        )
        db.session.add(new_trans)
        db.session.commit()
        return redirect(url_for('dashboard.dashboard'))

    return render_template('add_transaction/add_transaction.html', assets=assets)

@list_transactions_bp.route('/')
def list_transactions():
    transactions = Transaction.query.order_by(Transaction.timestamp.desc()).all()
    return render_template('list_transactions/list_transactions.html', transactions=transactions)

@delete_transaction_bp.route('/delete_transaction/<int:id>', methods=['POST'])
def delete_transaction(id):
    transaction = Transaction.query.get_or_404(id)
    db.session.delete(transaction)
    db.session.commit()
    return redirect(url_for('list_transactions.list_transactions'))