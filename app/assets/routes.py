from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app import get_db
from app.schemas.database.asset import Asset
from app.schemas.dto.portfolio import DashboardResponse
from app.portfolio.portfolio_engine import PortfolioEngine

from app.schemas.database.asset import (
    Asset, ETF, ETC, Bond, Equity
)

from app.schemas.domain.assets import (AssetType, Category1, Category2, 
    GeoRegion, GeoCountry, MarketType, DistributionPolicy, ReplicationMethod, 
    CouponFrequency, InterestHandling, RetailBondBenchmark
)

service = PortfolioEngine()
enums_router = APIRouter()

@enums_router.get('/assets/meta')
def get_assets_metadata():
    # Zwracamy słowniki z wartościami Enum, aby frontend mógł zbudować selecty
    return {
        "asset_type": [e.value for e in AssetType],
        "category1": [e.value for e in Category1],
        "category2": [e.value for e in Category2],
        "geo_region": [e.value for e in GeoRegion],
        "geo_country": [e.value for e in GeoCountry],
        "market_type": [e.value for e in MarketType],
        "distribution_policy": [e.value for e in DistributionPolicy],
        "replication_method": [e.value for e in ReplicationMethod],
        "coupon_frequency": [e.value for e in CouponFrequency],
        "interest_handling": [e.value for e in InterestHandling],
        "retail_bond_benchmark": [e.value for e in RetailBondBenchmark]
    }