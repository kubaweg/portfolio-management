from app import db
from ..domain.transactions import TransactionType

class Transaction(db.Model):
    __tablename__ = "transactions"

    id = db.Column(db.Integer, primary_key=True)

    asset_id = db.Column(db.Integer, db.ForeignKey("assets.id"), nullable=False)
    asset = db.relationship("Asset", back_populates="transactions")

    type = db.Column(db.Enum(TransactionType), nullable=False)

    timestamp = db.Column(db.DateTime, nullable=False, index=True)
    created_at = db.Column(db.DateTime, nullable=False, server_default=db.func.now())

    quantity = db.Column(db.Numeric(18, 8))
    price = db.Column(db.Numeric(18, 8))

    fx_rate = db.Column(db.Numeric(18, 8))

    notes = db.Column(db.String)
    
    def __init__(self, **kwargs):
        super(Transaction, self).__init__(**kwargs)
