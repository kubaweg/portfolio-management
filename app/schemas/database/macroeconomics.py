from sqlalchemy import func

# Zakładam, że masz już zdefiniowaną bazę deklaratywną:
from app import db

class Inflation(db.Model):
    __tablename__ = "gus_cpi_rates"

    id = db.Column(db.Integer, primary_key=True, index=True)
    month = db.Column(db.String(7), unique=True, index=True, nullable=False) # Format: 'YYYY-MM'
    value = db.Column(db.Float, nullable=False)
    
    created_at = db.Column(db.DateTime, server_default=func.now())

class InterestRate(db.Model):
    __tablename__ = "nbp_interest_rates"

    id = db.Column(db.Integer, primary_key=True, index=True)
    effective_date = db.Column(db.Date, unique=True, index=True, nullable=False) # Format: YYYY-MM-DD
    value = db.Column(db.Float, nullable=False)

    created_at = db.Column(db.DateTime(timezone=True), server_default=func.now())