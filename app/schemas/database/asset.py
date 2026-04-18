from app import db
import enum
from datetime import date

# --- ENUMERACJE (SŁOWNIKI) ---

class AssetType(str, enum.Enum):
    ETF = "ETF"
    ETC = "ETC"
    BOND = "Obligacja"
    EQUITY = "Akcja"

class Category1(str, enum.Enum):
    EQUITY = "Akcje"
    MIXED = "Mix"
    BOND = "Obligacje"
    COMMODITY = "Surowce/towary"
    CASH = "Cash"

class Category2(str, enum.Enum):
    EQUITY_GLOBAL = "Akcje ogólnoświatowe"
    EQUITY_REGION = "Akcje regionalne"
    EQUITY_COUNTRY = "Akcje krajowe"
    EQUITY_FACTOR = "Akcje faktorowe"
    EQUITY_SECTOR = "Akcje sektorowe"
    BOND_RETAIL_FIXED_RATE = "Obligacje skarbowe o stopie stałej"
    BOND_RETAIL_INFLATION_LINKED = "Obligacje skarbowe indeksowane inflacją"
    BOND_RETAIL_INTEREST_LINKED = "Obligacje skarbowe indeksowane stopą referencyjną"
    BOND_CORP_FIXED = "Obligacje korporacyjne o stopie stałej"
    BOND_CORP_FLOATING = "Obligacje skarbowe zmiennoprocentowe"
    COMMODITY_GOLD = "Surowce - złoto"
    COMMODITY_SILVER = "Surowce - srebro"
    COMMODITY_BROAD = "Surowce - inne"

# Naprawione: Tylko lokalizacje geograficzne
class GeoRegion(str, enum.Enum):
    GLOBAL = "Cały świat"
    EUROPE = "Europa"
    EUROPE_WEST = "Europa Zachodnia"
    EUROPE_EAST = "Europa Wschodnia"
    ASIA_PACIFIC = "Azja/Pacyfik"
    NORTH_AMERICA = "Ameryka Północna"
    SOUTH_AMERICA = "Ameryka Południowa"
    AFRICA = "Afryka"
    AUSTRALIA = "Australia"

class GeoCountry(str, enum.Enum):
    POLAND = "Polska"
    USA = "USA"
    GERMANY = "Niemcy"
    UK = "Wielka Brytania"
    FRANCE = "Francja"
    JAPAN = "Japonia"
    CHINA = "Chiny"

# Naprawione: Tylko status rozwoju rynku
class MarketType(str, enum.Enum):
    DEVELOPED = "Rynek rozwinięty"
    EMERGING = "Rynek wschodzący"
    FRONTIER = "Rynek nierozwinięty"
    MIXED = "Mix"

class DistributionPolicy(str, enum.Enum):
    ACCUMULATING = "Akumulujący"
    DISTRIBUTING = "Dystrybuujący"

class ReplicationMethod(str, enum.Enum):
    PHYSICAL = "Fizyczna"
    SYNTHETIC = "Syntetyczna"

class CouponFrequency(str, enum.Enum):
    MONTHLY = "Co miesiąc"
    QUARTERLY = "Co kwartał"
    SEMI_ANNUALLY = "Co pół roku"
    YEARLY = "Co roku"
    AT_THE_END = "Przy wykupie"

class InterestHandling(str, enum.Enum):
    PAYOUT = "Wypłata"
    CAPITALIZATION = "Kapitalizacja"


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