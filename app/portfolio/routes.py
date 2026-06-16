from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from datetime import date

from app import get_db
from app.schemas.database.asset import Asset, Bond, AssetType
from app.schemas.database.transaction import Transaction, TransactionType
from app.schemas.dto.portfolio import (
    DashboardResponse,
    DashboardBondResponse, DashboardExchangeResponse
)

from app.core.bonds import (
    BondInputParams, EarlyRedemptionType, map_frequency_to_months, resolve_early_redemption_type
)

from app.core.exchange.service import ExchangeEngine
from app.core.bonds.service import BondEngine

service = ExchangeEngine()

# Stary router - do wygaszenia
dashboard_router = APIRouter()
@dashboard_router.get('/dashboard', response_model=DashboardResponse)
def dashboard(db: Session = Depends(get_db)):
    assets = db.query(Asset).all()
    portfolio, totals = service.build_portfolio(assets)
    return DashboardResponse(totals=totals, asset_data=portfolio)

# Nowe routery - do produkcyjnego uruchomienia
exchange_router = APIRouter()
@exchange_router.get('/exchange_summary', response_model=DashboardExchangeResponse)
def get_exchange_summary(db: Session = Depends(get_db)):
    assets = db.query(Asset).filter(Asset.asset_type != AssetType.BOND).all()
    portfolio = service.build_portfolio(assets)
    return DashboardExchangeResponse(data=portfolio)


bond_router = APIRouter()
@bond_router.get('/bond_summary', response_model=DashboardBondResponse)
def get_bonds_summary(db: Session = Depends(get_db)):

    periods = DashboardBondResponse(data={})
    bonds = db.query(Bond).all()

    for bond_db in bonds:

        bond_transactions = db.query(Transaction).filter(Transaction.asset_id == bond_db.id).all()
        # print(bond_db.ticker, bond_transactions, '\n')

        params = BondInputParams(
            quantity=sum(
                t.quantity if t.type == TransactionType.BUY
                # else -t.quantity if t.type == TransactionType.SELL
                else 0
                for t in bond_transactions
            ),
            retail_series_type=bond_db.retail_series_type,
            issue_date=bond_db.issue_date,
            maturity_date=bond_db.maturity_date,
            nominal_value=bond_db.nominal_value,
            interest_handling=bond_db.interest_handling,
            coupon_frequency=map_frequency_to_months(bond_db.coupon_frequency),
            initial_rate=bond_db.initial_rate,
            is_indexed=bond_db.is_indexed,
            margin=bond_db.margin if bond_db.margin is not None else 0.0,
            benchmark=bond_db.benchmark,
            early_redemption_type=resolve_early_redemption_type(bond_db.retail_series_type),
            early_redemption_penalty=bond_db.early_redemption_penalty
        )

        calc_date = date.today()
        engine = BondEngine(db=db, params=params, calculation_date=calc_date)
        engine.build_periods()
        periods.data[bond_db.ticker] = {
            'periods': engine.get_all_periods(), 
            'summary': engine.get_summary()
        }

    return periods

