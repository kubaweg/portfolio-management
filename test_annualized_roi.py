from app import SessionLocal
from app.schemas.database.asset import Asset
from app.core.annualized_roi import calculate_annualized_roi
from app.portfolio.routes import get_exchange_summary
if __name__ == "__main__":

    with SessionLocal() as db:

        summary = get_exchange_summary(db=db)
        
        exchange_data = summary.data[1]
        print('\n', exchange_data.open_positions, '\n')

        roi = calculate_annualized_roi(exchange_data.open_positions, exchange_data.closed_positions)
        print(roi['currency'], roi['pln'])