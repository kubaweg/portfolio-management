from flask import render_template

from app.schemas.database.asset import Asset
from app.portfolio.portfolio_engine import PortfolioEngine
from . import dashboard_bp

service = PortfolioEngine()

@dashboard_bp.route('/')
def dashboard():
    assets = Asset.query.all()
    portfolio_data, totals = service.build_portfolio(assets)

    return render_template(
        'dashboard/dashboard.html', 
        portfolio=portfolio_data, 
        total_invested=totals.invested,
        total_current=totals.current_value,
        total_cash_interest=totals.interest,
        total_profit=totals.profit,
        total_roi=totals.roi,
        total_roi_pa=totals.annualized_roi,
        allocation=totals.allocation,
        instrument_data=totals.instrument_data
    )