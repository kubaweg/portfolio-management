from sqlalchemy.orm import Session
from app.schemas.database.asset import Asset, Bond, AssetType
from app.core.exchange.service import ExchangeEngine
from app.core.exchange.schemas.dto import (
    DashboardExchangeResponse
)

from app.core.bonds.service import BondEngine
from app.core.bonds.schemas.dto import DashboardBondResponse

def get_exchange_summary(db: Session, tickers: list[str] = []) -> DashboardExchangeResponse:

    service = ExchangeEngine()

    if tickers:
        exchange_assets = db.query(Asset).filter(
            Asset.asset_type.in_([AssetType.ETF, AssetType.ETC]),
            Asset.ticker.in_(tickers)
        ).all() # typ ETF albo ETC

    else:
        exchange_assets = db.query(Asset).filter(
            Asset.asset_type.in_([AssetType.ETF, AssetType.ETC])
        ).all() # typ ETF albo ETC

    portfolio = service.build_portfolio(exchange_assets)

    return DashboardExchangeResponse(data=portfolio)


def get_bonds_summary(db: Session, tickers: list[str] = []) -> DashboardBondResponse:

    service = BondEngine()

    if tickers:
        bond_assets = db.query(Asset).filter(
            Asset.asset_type.in_([AssetType.BOND]),
            Asset.ticker.in_(tickers)
        ).all()
    else:
        bond_assets = db.query(Asset).filter(
            Asset.asset_type.in_([AssetType.BOND])
        ).all()

    portfolio = service.build_portfolio(bond_assets) # type: ignore

    return DashboardBondResponse(data=[item for item in portfolio if item.current_data.quantity > 0])