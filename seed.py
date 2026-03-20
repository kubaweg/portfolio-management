from app import create_app, db
from app.models import Asset

app = create_app()

def seed_data():
    with app.app_context():
        # Definiujemy ETFy do dodania
        etfs = [
            Asset(ticker="IUSQ.DE", name="iShares MSCI ACWI UCITS ETF", asset_type="ETF", currency='EUR'),
            Asset(ticker="4GLD.DE", name="Xetra-Gold", asset_type="ETF", currency='EUR'),
            Asset(ticker="ETFBTBSP.WA", name="Beta ETF TBSP Portfelowy FIZ", asset_type="ETF", currency='PLN')
        ]
        
        for etf in etfs:
            # Sprawdzamy, czy już nie istnieją, żeby nie dublować
            existing = Asset.query.filter_by(ticker=etf.ticker).first()
            if not existing:
                db.session.add(etf)
                print(f"Dodano: {etf.ticker}")
        
        db.session.commit()
        print("Baza danych została zaktualizowana!")

if __name__ == "__main__":
    seed_data()