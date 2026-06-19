from app import SessionLocal
from app.schemas.database.asset import Asset
from app.core.exchange.annualized_roi import calculate_annualized_roi
from app.portfolio.routes import get_exchange_summary
if __name__ == "__main__":

    with SessionLocal() as db:

        summary = get_exchange_summary(db=db)
        
        exchange_data = summary.data[0]

        roi = calculate_annualized_roi(exchange_data.open_positions, [])
        print(f"Wszystkie pozycje otwarte | waluta: {roi.roi_pa} | pln: {roi.roi_pa_pln}\n")

        roi = calculate_annualized_roi([], exchange_data.closed_positions)
        print(f"Wszystkie pozycje zamknięte | waluta: {roi.roi_pa} | pln: {roi.roi_pa_pln}\n")

        roi = calculate_annualized_roi(exchange_data.open_positions, exchange_data.closed_positions)
        print(f"Wszystkie pozycje | waluta: {roi.roi_pa} | pln: {roi.roi_pa_pln}\n")

        for i, pos in enumerate(exchange_data.open_positions):
            roi = calculate_annualized_roi([pos], [])
            print(f"Pozycja {i+1} | waluta: {roi.roi_pa} | pln: {roi.roi_pa_pln}")