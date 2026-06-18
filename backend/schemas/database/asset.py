# Nowy kod (Czyste SQLAlchemy dla FastAPI)
from sqlalchemy import Column, Integer, Numeric, String, Enum, Boolean, Text, ForeignKey, Date
from sqlalchemy.orm import relationship
from backend import Base # Importujemy naszą bazę

from ..domain.assets import (
    AssetType, 
    Category1, Category2, 
    GeoRegion, GeoCountry, MarketType, 
    DistributionPolicy, ReplicationMethod, 
    
    InterestHandling, CouponFrequency, RetailBondBenchmark
)


# --- MODELE BAZY DANYCH ---

class Asset(Base):
    __tablename__ = "assets"

    id = Column(Integer, primary_key=True)
    ticker = Column(String, unique=True, nullable=False)
    name = Column(String, nullable=False)

    asset_type = Column(Enum(AssetType), nullable=False)
    
    category1 = Column(Enum(Category1), nullable=False)
    category2 = Column(Enum(Category2))
    
    # Rozłączne pola geografii i typu rynku
    geo_region = Column(Enum(GeoRegion), nullable=False)
    geo_country = Column(Enum(GeoCountry))
    market_type = Column(Enum(MarketType), nullable=False)

    currency = Column(String(3), nullable=False)

    active = Column(Boolean, default=True)
    notes = Column(Text)

    transactions = relationship("Transaction", back_populates="asset")

    __mapper_args__ = {
        "polymorphic_on": asset_type,
        "polymorphic_identity": "BASE"
    }

# --- MIXINY (WSPÓLNE POLA DLA GIEŁDY) ---

class ExchangeTradedMixin:
    isin = Column(String, unique=True, nullable=False)
    issuer = Column(String)
    ter = Column(Numeric(6, 4))
    listing_venue = Column(String)
    domicile = Column(String)
    spread = Column(Numeric(10, 6), default=0, nullable=False)


class ETF(Asset, ExchangeTradedMixin):
    __tablename__ = "assets_etf"

    id = Column(Integer, ForeignKey('assets.id'), primary_key=True)

    benchmark = Column(String)
    distribution_policy = Column(Enum(DistributionPolicy))
    replication_method = Column(Enum(ReplicationMethod))

    __mapper_args__ = {
        "polymorphic_identity": AssetType.ETF
    }


class ETC(Asset, ExchangeTradedMixin):
    __tablename__ = "assets_etc"

    id = Column(Integer, ForeignKey('assets.id'), primary_key=True)

    multiplier = Column(Numeric(14, 6), default=1.0)
    physical_backing = Column(Boolean, default=True)

    __mapper_args__ = {
        "polymorphic_identity": AssetType.ETC
    }

class Equity(Asset, ExchangeTradedMixin):
    __tablename__ = "assets_akcje"

    id = Column(Integer, ForeignKey('assets.id'), primary_key=True)

    __mapper_args__ = {
        "polymorphic_identity": AssetType.EQUITY
    }

class Crypto(Asset, ExchangeTradedMixin):
    __tablename__ = "assets_crypto"

    id = Column(Integer, ForeignKey('assets.id'), primary_key=True)

    __mapper_args__ = {
        "polymorphic_identity": AssetType.CRYPTO
    }


class Bond(Asset):
    __tablename__ = "assets_obligacje"

    id = Column(Integer, ForeignKey('assets.id'), primary_key=True)

    retail_series_type = Column(String)

    issue_date = Column(Date, nullable=False)
    maturity_date = Column(Date, nullable=False)
    
    nominal_value = Column(Numeric(20, 4), nullable=False)
    
    interest_handling = Column(Enum(InterestHandling), nullable=False)
    coupon_frequency = Column(Enum(CouponFrequency))
    
    initial_rate = Column(Numeric(6, 4))

    is_indexed = Column(Boolean, default=False)
    margin = Column(Numeric(6, 4))
    benchmark = Column(Enum(RetailBondBenchmark))
    
    early_redemption_penalty = Column(Numeric(10, 4))
    
    rating = Column(String)
    secured = Column(Boolean, default=False)

    __mapper_args__ = {
        "polymorphic_identity": AssetType.BOND
    }