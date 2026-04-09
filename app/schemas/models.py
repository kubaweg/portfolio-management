from app import db
from datetime import datetime
import pytz

class Asset(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    ticker = db.Column(db.String(20), nullable=False, unique=True)
    name = db.Column(db.String(100), nullable=False)
    asset_type = db.Column(db.String(50), nullable=False)
    currency = db.Column(db.String(10), nullable=False, default='PLN') # Waluta notowań (np. EUR, USD)
    
    transactions = db.relationship('Transaction', backref='asset', lazy=True)

    def __init__(self, **kwargs):
        super(Asset, self).__init__(**kwargs)

class Transaction(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    asset_id = db.Column(db.Integer, db.ForeignKey('asset.id'), nullable=False)
    
    # Zmieniamy na DateTime z obsługą stref czasowych
    date = db.Column(db.DateTime(timezone=True), nullable=False)
    transaction_type = db.Column(db.String(10), nullable=False)
    quantity = db.Column(db.Float, nullable=False)
    price_per_unit = db.Column(db.Float, nullable=False) # Cena w walucie aktywa
    exchange_rate = db.Column(db.Float, nullable=False) # Kurs waluty do PLN

    def __init__(self, **kwargs):
        super(Transaction, self).__init__(**kwargs)