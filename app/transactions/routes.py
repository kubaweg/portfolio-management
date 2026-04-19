from flask import render_template, request, redirect, url_for, jsonify
from datetime import datetime
import pytz

from app import db
from app.schemas.database.asset import Asset
from app.schemas.database.transaction import Transaction

from . import add_transaction_bp, list_transactions_bp, delete_transaction_bp

@add_transaction_bp.route('/', methods=['GET', 'POST'])
def add_transaction():
    assets = Asset.query.all()
    return render_template('add_transaction/add_transaction.html', assets=assets)

@add_transaction_bp.route('/api/add', methods=['POST'])
def api_add_transaction():

    # Funkcja pomocnicza: puste stringi zamienia na None, żeby baza nie płakała
    def get_val(key):
        val = data.get(key)
        return val if val and str(val).strip() != "" else None
    
    data = request.get_json()

    try:
        warsaw_tz = pytz.timezone('Europe/Warsaw')
        naive_dt = datetime.strptime(get_val('timestamp') or '9999-12-31T23:59', '%Y-%m-%dT%H:%M')
        
        new_trans = Transaction(
            asset_id=get_val('asset_id'),
            type=get_val('type'),
            timestamp=warsaw_tz.localize(naive_dt),
            quantity=float(get_val('quantity') or -1.0),
            price=float(get_val('price') or -1.0),
            fx_rate=float(get_val('fx_rate') or -1.0),
            notes=get_val('notes')
        )
        db.session.add(new_trans)
        db.session.commit()

        return jsonify({"status": "success", "message": "Pomyślnie dodano transakcję"}), 201

    except:
        return jsonify({"status": "error", "message": "Nieoczekiwany błąd"}), 500

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