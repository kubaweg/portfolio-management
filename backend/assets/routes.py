from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from backend import get_db
from backend.schemas.dto.add_asset import AddAsset

from backend.schemas.database.asset import (
    ETF, ETC, Bond, Equity, Crypto
)

from backend.schemas.domain.assets import (AssetType, Category1, Category2, 
    GeoRegion, GeoCountry, MarketType, DistributionPolicy, ReplicationMethod, 
    CouponFrequency, InterestHandling, RetailBondBenchmark
)

add_asset_router = APIRouter()
@add_asset_router.post("/assets/add")
async def create_asset(asset: AddAsset, db: Session = Depends(get_db)):

    if asset.asset_type == 'ETF':
        asset = ETF(**asset.model_dump())
    elif asset.asset_type == 'ETC':
        asset = ETC(**asset.model_dump())
    elif asset.asset_type == 'Akcja':
        asset = Equity(**asset.model_dump())
    elif asset.asset_type == 'Crypto':
        asset = Crypto(**asset.model_dump())
    elif asset.asset_type == 'Obligacja':
        asset = Bond(**asset.model_dump())
    else:
        raise HTTPException(status_code=400, detail=f"Błędny rodzaj aktywa: {asset.asset_type}")

    # Tutaj 'asset' jest już konkretnym obiektem, np. ETFAsset
    print(f"Dodaję {asset.asset_type}: {asset.ticker}")

    try:
        db.add(asset)
        db.commit()
        db.refresh(asset)
        
        return {"status": "success", "name": asset.name, "type": asset.asset_type, "message": "Aktywo dodane!"}
        
    except Exception as e:
        db.rollback()
        # Warto zalogować błąd: print(f"Error: {e}")
        raise HTTPException(status_code=400, detail=f"Błąd zapisu: {str(e)}")
    
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