from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from datetime import date

from app import get_db
from app.schemas.database.asset import Asset, Bond, AssetType
from app.schemas.database.transaction import Transaction, TransactionType
from app.portfolio.schemas.dto import DashboardMainPageInput, DashboardMainPageOutput

from app.core.exchange.service import ExchangeEngine
from app.core.exchange.schemas.dto import (
    DashboardExchangeResponse
)

from app.core.bonds.service import BondEngine
from app.core.bonds.schemas.dto import (
    DashboardBondResponse, BondData, BondBaseData,
    map_frequency_to_months, resolve_early_redemption_type
)

from app.portfolio.transformer import DashboardTransformer

# Nowe routery - do produkcyjnego uruchomienia
dashboard_router = APIRouter()
@dashboard_router.get('/dashboard/main', response_model=DashboardMainPageOutput)
def get_main_table_response(db: Session = Depends(get_db)):

    input = DashboardMainPageInput(
        bond_response=get_bonds_summary(db),
        exchange_response=get_exchange_summary(db)
    )

    transformer = DashboardTransformer()
    return transformer.build_dashboard(input_data=input)

# exchange_router = APIRouter()
# @exchange_router.get('/exchange_summary', response_model=DashboardExchangeResponse)
def get_exchange_summary(db: Session) -> DashboardExchangeResponse:

    service = ExchangeEngine()

    exchange_assets = db.query(Asset).filter(Asset.asset_type.in_([AssetType.ETF, AssetType.ETC])).all() # typ ETF albo ETC
    portfolio = service.build_portfolio(exchange_assets)

    return DashboardExchangeResponse(data=portfolio)


# bond_router = APIRouter()
# @bond_router.get('/bond_summary', response_model=DashboardBondResponse)
def get_bonds_summary(db: Session) -> DashboardBondResponse:

    service = BondEngine()

    bond_assets = db.query(Bond).all()
    portfolio = service.build_portfolio(bond_assets)

    return DashboardBondResponse(data=portfolio)

