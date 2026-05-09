from flask import render_template, jsonify
import json

from app.schemas.database.asset import Asset
from app.portfolio.portfolio_engine import PortfolioEngine
from . import dashboard_bp

service = PortfolioEngine()

@dashboard_bp.route('/api')
def dashboard():
    assets = Asset.query.all()
    portfolio, totals = service.build_portfolio(assets)

    # Tworzymy prostą listę słowników (tylko to, co chce tabela JS)
    status_data_for_js = []
    for item in portfolio:
        status_data_for_js.append({
            "asset_id": str(item.asset.id), # rzutujemy na str, żeby nie było błędu UUID/Object
            "ticker": item.asset.ticker,
            "name": item.asset.name,
            "currency": item.asset.currency,

            # Formatuje datę tutaj - to najbezpieczniejszy sposób
            "fx_datetime": item.fx_datetime.strftime('%Y-%m-%d %H:%M') if item.fx_datetime else "-",
            "price_datetime": item.current_price_datetime.strftime('%Y-%m-%d %H:%M') if item.current_price_datetime else "-"
        })

    return render_template(
        'dashboard/dashboard.html', 
        portfolio=portfolio, 
        portfolio_json=json.dumps(status_data_for_js),
        total_invested=totals.invested,
        total_current=totals.current_value,
        total_cash_interest=totals.interest,
        total_profit=totals.profit,
        total_roi=totals.roi,
        total_roi_pa=totals.annualized_roi,
        allocation=totals.allocation,
        instrument_data=totals.instrument_data,
        instrument_data_aggregated=totals.instrument_data_aggregated
    )