from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, Literal, Union, Annotated
from datetime import date

# --- 1. BAZA (Wspólne pola dla każdego aktywa) ---
class AssetBase(BaseModel):
    ticker: str = Field(..., min_length=1, max_length=20, examples=["VWCE.DE"])
    name: str = Field(..., min_length=1)
    currency: str = Field(default="PLN", max_length=3)
    category1: str
    category2: Optional[str] = None
    geo_region: Optional[str] = None
    geo_country: Optional[str] = None
    market_type: str
    active: bool = True
    notes: Optional[str] = None

    # Pozwala Pydanticowi współpracować z modelami SQLAlchemy (jeśli ich używasz)
    model_config = ConfigDict(from_attributes=True)

# --- 2. MODELE SZCZEGÓŁOWE (Mixiny/Specyficzne pola) ---

class ETFAsset(AssetBase):
    asset_type: Literal["ETF"]

    # MIXIN
    isin: str
    issuer: str
    ter: float = 0.0
    listing_venue: Optional[str] = None
    domicile: Optional[str] = None
    spread: float = 0.0

    # Specific
    benchmark: Optional[str] = None
    distribution_policy: str
    replication_method: str


class EquityAsset(AssetBase):
    asset_type: Literal["Akcja"]

    # MIXIN
    isin: str
    issuer: str
    ter: float = 0.0
    listing_venue: Optional[str] = None
    domicile: Optional[str] = None
    spread: float = 0.0

    # Specific
    # not needed for now

class ETCAsset(AssetBase):
    asset_type: Literal["ETC"]

    # MIXIN
    isin: str
    issuer: str
    ter: float = 0.0
    listing_venue: Optional[str] = None
    domicile: Optional[str] = None
    spread: float = 0.0

    # Specific
    multiplier: float = 1.0
    physical_backing: bool = True

class CryptoAsset(AssetBase):
    asset_type: Literal["Kryptowaluta"]

    # MIXIN
    isin: str
    issuer: str
    ter: float = 0.0
    listing_venue: Optional[str] = None
    domicile: Optional[str] = None
    spread: float = 0.0

    # Specific
    # not needed for now

class BondAsset(AssetBase):
    asset_type: Literal["Obligacja"]

    # Specific
    retail_series_type: Optional[str] = None
    issue_date: Optional[date] = None
    maturity_date: Optional[date] = None
    nominal_value: float = 100.0
    interest_handling: str
    coupon_frequency: str
    initial_rate: Optional[float] = None
    is_indexed: bool = False
    margin: Optional[float] = None
    early_redemption_penalty: float
    rating: str
    secured: bool = False

# --- 3. FINALNY MODEL POLIMORFICZNY ---
# To jest ten "AddAsset", który wrzucasz jako typ argumentu w FastAPI
AddAsset = Annotated[
    Union[ETFAsset, EquityAsset, ETCAsset, CryptoAsset, BondAsset],
    Field(discriminator="asset_type")
]