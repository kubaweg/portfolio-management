from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app import get_db
from app.portfolio.schemas.dto import DashboardMainPageInput, DashboardMainPageOutput
from app.portfolio.transformer import DashboardTransformer

from app.portfolio.utils import (
    get_bonds_summary, get_exchange_summary
)

# Nowe routery - do produkcyjnego uruchomienia
dashboard_router = APIRouter()
@dashboard_router.get('/dashboard/main', response_model=DashboardMainPageOutput)
def get_main_table_response(db: Session = Depends(get_db), tickers: list[str] = Query(default=[])):

    input = DashboardMainPageInput(
        bond_response=get_bonds_summary(db, tickers=tickers),
        exchange_response=get_exchange_summary(db, tickers=tickers)
    )

    transformer = DashboardTransformer()
    return transformer.build_dashboard(input_data=input)

