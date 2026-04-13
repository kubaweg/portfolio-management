from app import db
import enum
from datetime import date

# --- ENUMERACJE (SŁOWNIKI) ---

class AssetType(str, enum.Enum):
    ETF = "ETF"
    ETC = "ETC"
    BOND = "BOND"

class Category1(str, enum.Enum):
    EQUITY = "EQUITY"
    MIXED = "MIXED"
    BOND = "BOND"
    COMMODITY = "COMMODITY"
    CASH = "CASH"

class Category2(str, enum.Enum):
    EQUITY_GLOBAL = "EQUITY_GLOBAL"
    EQUITY_REGION = "EQUITY_REGION"
    EQUITY_COUNTRY = "EQUITY_COUNTRY"
    EQUITY_FACTOR = "EQUITY_FACTOR"
    EQUITY_SECTOR = "EQUITY_SECTOR"
    BOND_RETAIL_FIXED_RATE = "BOND_RETAIL_FIXED_RATE"
    BOND_RETAIL_INFLATION_LINKED = "BOND_RETAIL_INFLATION_LINKED"
    BOND_RETAIL_INTEREST_LINKED = "BOND_RETAIL_INTEREST_LINKED"
    BOND_CORP_FIXED = "BOND_CORP_FIXED"
    BOND_CORP_FLOATING = "BOND_CORP_FLOATING"
    COMMODITY_GOLD = "COMMODITY_GOLD"
    COMMODITY_SILVER = "COMMODITY_SILVER"
    COMMODITY_BROAD = "COMMODITY_BROAD"

# Naprawione: Tylko lokalizacje geograficzne
class GeoRegion(str, enum.Enum):
    GLOBAL = "GLOBAL"
    EUROPE = "EUROPE"
    ASIA_PACIFIC = "ASIA_PACIFIC"
    NORTH_AMERICA = "NORTH_AMERICA"
    POLAND = "POLAND"
    USA = "USA"
    GERMANY = "GERMANY"
    UK = "UK"
    FRANCE = "FRANCE"
    JAPAN = "JAPAN"
    CHINA = "CHINA"

# Naprawione: Tylko status rozwoju rynku
class MarketType(str, enum.Enum):
    DEVELOPED = "DEVELOPED"
    EMERGING = "EMERGING"
    FRONTIER = "FRONTIER"
    MIXED = "MIXED"

class DistributionPolicy(str, enum.Enum):
    ACCUMULATING = "ACCUMULATING"
    DISTRIBUTING = "DISTRIBUTING"

class ReplicationMethod(str, enum.Enum):
    PHYSICAL = "PHYSICAL"
    SYNTHETIC = "SYNTHETIC"

class CouponFrequency(str, enum.Enum):
    MONTHLY = "MONTHLY"
    QUARTERLY = "QUARTERLY"
    SEMI_ANNUALLY = "SEMI_ANNUALLY"
    YEARLY = "YEARLY"
    AT_THE_END = "AT_THE_END"

class InterestHandling(str, enum.Enum):
    PAYOUT = "PAYOUT"
    CAPITALIZATION = "CAPITALIZATION"


# --- MIXINY (WSPÓLNE POLA DLA GIEŁDY) ---

class ExchangeTradedMixin:
    issuer = db.Column(db.String)
    ter = db.Column(db.Numeric(6, 4))
    listing_venue = db.Column(db.String)
    domicile = db.Column(db.String)


# --- MODELE BAZY DANYCH ---

class Asset(db.Model):
    __tablename__ = "assets"

    id = db.Column(db.Integer, primary_key=True)
    ticker = db.Column(db.String, unique=True, nullable=False)
    name = db.Column(db.String, nullable=False)
    isin = db.Column(db.String, unique=True)

    asset_type = db.Column(db.Enum(AssetType), nullable=False)
    
    category1 = db.Column(db.Enum(Category1), nullable=False)
    category2 = db.Column(db.Enum(Category2))
    
    # Rozłączne pola geografii i typu rynku
    geo_region = db.Column(db.Enum(GeoRegion))
    market_type = db.Column(db.Enum(MarketType))

    currency = db.Column(db.String(3), nullable=False)
    spread = db.Column(db.Numeric(10, 6), default=0)

    active = db.Column(db.Boolean, default=True)
    notes = db.Column(db.Text)

    transactions = db.relationship("Transaction", back_populates="asset")

    __mapper_args__ = {
        "polymorphic_on": asset_type,
        "polymorphic_identity": "BASE"
    }


class ETF(Asset, ExchangeTradedMixin):
    __tablename__ = "etfs"
    id = db.Column(db.Integer, db.ForeignKey('assets.id'), primary_key=True)

    benchmark = db.Column(db.String)
    distribution_policy = db.Column(db.Enum(DistributionPolicy))
    replication_method = db.Column(db.Enum(ReplicationMethod))

    __mapper_args__ = {
        "polymorphic_identity": AssetType.ETF
    }


class ETC(Asset, ExchangeTradedMixin):
    __tablename__ = "etcs"
    id = db.Column(db.Integer, db.ForeignKey('assets.id'), primary_key=True)

    multiplier = db.Column(db.Numeric(14, 6), default=1.0)
    physical_backing = db.Column(db.Boolean, default=True)

    __mapper_args__ = {
        "polymorphic_identity": AssetType.ETC
    }


class Bond(Asset):
    __tablename__ = "bonds"
    id = db.Column(db.Integer, db.ForeignKey('assets.id'), primary_key=True)

    issue_date = db.Column(db.Date)
    maturity_date = db.Column(db.Date, nullable=False)
    nominal_value = db.Column(db.Numeric(20, 8), nullable=False)
    
    interest_handling = db.Column(db.Enum(InterestHandling), nullable=False)
    coupon_frequency = db.Column(db.Enum(CouponFrequency))
    is_indexed = db.Column(db.Boolean, default=False)
    
    initial_rate = db.Column(db.Numeric(6, 4))
    margin = db.Column(db.Numeric(6, 4))
    inflation_index = db.Column(db.String)
    
    retail_series_code = db.Column(db.String)
    early_redemption_penalty = db.Column(db.Numeric(10, 4))
    
    rating = db.Column(db.String)
    seniority = db.Column(db.String)
    secured = db.Column(db.Boolean, default=True)

    __mapper_args__ = {
        "polymorphic_identity": AssetType.BOND
    }