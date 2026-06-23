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
    BondInputParams, DashboardBondResponse, BondData, BondBaseData,
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

    assets = db.query(Asset).filter(Asset.asset_type != AssetType.BOND).all()
    portfolio = service.build_portfolio(assets)
    return DashboardExchangeResponse(data=portfolio)


# bond_router = APIRouter()
# @bond_router.get('/bond_summary', response_model=DashboardBondResponse)
def get_bonds_summary(db: Session) -> DashboardBondResponse:

    response = DashboardBondResponse(
        data=[]
    )
    bonds = db.query(Bond).all()

    for bond_db in bonds:

        bond_transactions = db.query(Transaction).filter(Transaction.asset_id == bond_db.id).all()

        params = BondInputParams(
            quantity=sum(
                float(t.quantity) if t.type.value == TransactionType.BUY                        # type: ignore
                else -float(t.quantity) if t.type.value == TransactionType.SELL                 # type: ignore
                else 0
                for t in bond_transactions
            ),
            retail_series_type=bond_db.ticker,                                                  # type: ignore
            issue_date=bond_db.issue_date,                                                      # type: ignore
            maturity_date=bond_db.maturity_date,                                                # type: ignore
            nominal_value=bond_db.nominal_value,                                                # type: ignore
            interest_handling=bond_db.interest_handling,                                        # type: ignore
            coupon_frequency=map_frequency_to_months(bond_db.coupon_frequency),                 # type: ignore
            initial_rate=bond_db.initial_rate,                                                  # type: ignore
            is_indexed=bond_db.is_indexed,                                                      # type: ignore
            margin=bond_db.margin if bond_db.margin is not None else 0.0,                       # type: ignore
            benchmark=bond_db.benchmark,                                                        # type: ignore
            early_redemption_type=resolve_early_redemption_type(bond_db.retail_series_type),    # type: ignore
            early_redemption_penalty=bond_db.early_redemption_penalty                           # type: ignore
        )

        base_data = BondBaseData(
            
            ticker=params.retail_series_type,
            name=bond_db.name,                              # type: ignore
            category1=bond_db.category1,                    # type: ignore
            type=bond_db.asset_type,                        # type: ignore
            category2=bond_db.category2,                    # type: ignore
            issue_date=params.issue_date,
            maturity_date=params.maturity_date,
            nominal_value=params.nominal_value,
            interest_handling=bond_db.interest_handling,    # type: ignore
            coupon_frequency=bond_db.coupon_frequency,      # type: ignore
            initial_rate=params.initial_rate,
            is_indexed=params.is_indexed,
            margin=params.margin,
            benchmark=params.benchmark,
            early_redemption_type=params.early_redemption_type,
            early_redemption_penalty=params.early_redemption_penalty
        )

        calc_date = date.today()
        engine = BondEngine(db=db, params=params, calculation_date=calc_date)
        if params.quantity > 0: 
            engine.build_periods()
            engine.build_positions()
            op, cp = engine.get_positions()

            engine.build_current_data()
            engine.build_summary()
            
            print(f'summary: {engine.get_summary()}')
            response.data.append(BondData(
                base_data=base_data,
                current_data=engine.get_current_data(),
                summary=engine.get_summary(),
                periods=engine.get_all_periods(),

                open_positions=op,
                closed_positions=cp,

                early_redemptions=[]
            ))

    return response

