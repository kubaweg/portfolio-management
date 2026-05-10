# app/router.py
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app import get_db
from app.schemas.database.asset import Asset
from app.schemas.dto.portfolio import DashboardResponse
from app.portfolio.portfolio_engine import PortfolioEngine

service = PortfolioEngine()
dashboard_router = APIRouter()

@dashboard_router.get('/dashboard', response_model=DashboardResponse)
def dashboard(db: Session = Depends(get_db)):
    assets = db.query(Asset).all()
    portfolio, totals = service.build_portfolio(assets)
    return DashboardResponse(totals=totals, asset_data=portfolio)