from app import db
from ..domain.assets import (
    AssetType, Category1, Category2, GeoRegion, GeoCountry, MarketType, DistributionPolicy, ReplicationMethod, InterestHandling, CouponFrequency
)
from datetime import date


# --- MIXINY (WSPÓLNE POLA DLA GIEŁDY) ---

class ExchangeTradedMixin:
    isin = db.Column(db.String, unique=True, nullable=False)
    issuer = db.Column(db.String)
    ter = db.Column(db.Numeric(6, 4))
    listing_venue = db.Column(db.String)
    domicile = db.Column(db.String)
    spread = db.Column(db.Numeric(10, 6), default=0, nullable=False)



# --- MODELE BAZY DANYCH ---

class Asset(db.Model):
    __tablename__ = "assets"

    id = db.Column(db.Integer, primary_key=True)
    ticker = db.Column(db.String, unique=True, nullable=False)
    name = db.Column(db.String, nullable=False)

    asset_type = db.Column(db.Enum(AssetType), nullable=False)
    
    category1 = db.Column(db.Enum(Category1), nullable=False)
    category2 = db.Column(db.Enum(Category2))
    
    # Rozłączne pola geografii i typu rynku
    geo_region = db.Column(db.Enum(GeoRegion), nullable=False)
    geo_country = db.Column(db.Enum(GeoCountry))
    market_type = db.Column(db.Enum(MarketType), nullable=False)

    currency = db.Column(db.String(3), nullable=False)

    active = db.Column(db.Boolean, default=True)
    notes = db.Column(db.Text)

    transactions = db.relationship("Transaction", back_populates="asset")

    __mapper_args__ = {
        "polymorphic_on": asset_type,
        "polymorphic_identity": "BASE"
    }


class ETF(Asset, ExchangeTradedMixin):
    __tablename__ = "assets_etf"

    id = db.Column(db.Integer, db.ForeignKey('assets.id'), primary_key=True)

    benchmark = db.Column(db.String)
    distribution_policy = db.Column(db.Enum(DistributionPolicy))
    replication_method = db.Column(db.Enum(ReplicationMethod))

    __mapper_args__ = {
        "polymorphic_identity": AssetType.ETF
    }


class ETC(Asset, ExchangeTradedMixin):
    __tablename__ = "assets_etc"

    id = db.Column(db.Integer, db.ForeignKey('assets.id'), primary_key=True)

    multiplier = db.Column(db.Numeric(14, 6), default=1.0)
    physical_backing = db.Column(db.Boolean, default=True)

    __mapper_args__ = {
        "polymorphic_identity": AssetType.ETC
    }

class EQUITY(Asset, ExchangeTradedMixin):
    __tablename__ = "assets_akcje"

    id = db.Column(db.Integer, db.ForeignKey('assets.id'), primary_key=True)

    __mapper_args__ = {
        "polymorphic_identity": AssetType.EQUITY
    }


class Bond(Asset):
    __tablename__ = "assets_obligacje"

    id = db.Column(db.Integer, db.ForeignKey('assets.id'), primary_key=True)

    retail_series_type = db.Column(db.String)

    issue_date = db.Column(db.Date, nullable=False)
    maturity_date = db.Column(db.Date, nullable=False)
    nominal_value = db.Column(db.Numeric(20, 4), nullable=False)
    
    interest_handling = db.Column(db.Enum(InterestHandling), nullable=False)
    coupon_frequency = db.Column(db.Enum(CouponFrequency))
    
    initial_rate = db.Column(db.Numeric(6, 4))

    is_indexed = db.Column(db.Boolean, default=False)
    margin = db.Column(db.Numeric(6, 4))
    benchmark = db.Column(db.String)
    
    early_redemption_penalty = db.Column(db.Numeric(10, 4))
    
    rating = db.Column(db.String)
    secured = db.Column(db.Boolean, default=False)

    __mapper_args__ = {
        "polymorphic_identity": AssetType.BOND
    }