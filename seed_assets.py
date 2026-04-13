from app import db, create_app
from app.schemas.asset import (
    Asset, ETF, ETC, Bond,
    AssetType, Category1, Category2, GeoRegion, MarketType,
    DistributionPolicy, ReplicationMethod, CouponFrequency, InterestHandling
)
from datetime import date
from decimal import Decimal

def seed_database():
    app = create_app()
    with app.app_context():
        
        assets_to_add = []

        # ==========================================
        # 1. ETC: Złoto
        # ==========================================
        if not Asset.query.filter_by(ticker="4GLD.DE").first():
            assets_to_add.append(ETC(
                ticker="4GLD.DE",
                name="Xetra-Gold",
                isin="DE000A0S9GB0",
                asset_type=AssetType.ETC,
                category1=Category1.COMMODITY,
                category2=Category2.COMMODITY_GOLD,
                geo_region=GeoRegion.GLOBAL,
                market_type=MarketType.MIXED,
                currency="EUR",
                spread=Decimal("0.001"),
                # Parametry z Mixinu
                issuer="Deutsche Börse Commodities GmbH",
                ter=Decimal("0.0000"), # Xetra-Gold nie ma TER, ma opłatę za przechowanie
                listing_venue="XETRA",
                domicile="Germany",
                # Parametry ETC
                multiplier=Decimal("1.0"),
                physical_backing=True
            ))

        # ==========================================
        # 2. ETF: Akcje Globalne
        # ==========================================
        if not Asset.query.filter_by(ticker="IUSQ.DE").first():
            assets_to_add.append(ETF(
                ticker="IUSQ.DE",
                name="iShares MSCI ACWI UCITS ETF (Acc)",
                isin="IE00B6R52259",
                asset_type=AssetType.ETF,
                category1=Category1.EQUITY,
                category2=Category2.EQUITY_GLOBAL,
                geo_region=GeoRegion.GLOBAL,
                market_type=MarketType.MIXED,
                currency="EUR",
                spread=Decimal("0.001"),
                
                # Parametry z Mixinu
                issuer="BlackRock",
                ter=Decimal("0.0020"),
                listing_venue="XETRA",
                domicile="Ireland",
                
                # Parametry ETF
                benchmark="MSCI ACWI",
                distribution_policy=DistributionPolicy.ACCUMULATING,
                replication_method=ReplicationMethod.PHYSICAL
            ))

        # ==========================================
        # 3. ETF: Polskie Obligacje Skarbowe (TBSP)
        # ==========================================
        if not Asset.query.filter_by(ticker="ETFBTBSP.WA").first():
            assets_to_add.append(ETF(
                ticker="ETFBTBSP.WA",
                name="Beta ETF TBSP Portfelowy FIZ",
                isin="PLBTBSP00012",
                asset_type=AssetType.ETF,
                category1=Category1.BOND,
                category2=Category2.BOND_RETAIL_FIXED_RATE, # Traktujemy jako stałokuponowe
                geo_region=GeoRegion.POLAND,
                market_type=MarketType.DEVELOPED,
                currency="PLN",
                spread=Decimal("0.0020"),
                
                # Parametry z Mixinu
                issuer="AgioFunds TFI (Beta ETF)",
                ter=Decimal("0.0050"),
                listing_venue="GPW",
                domicile="Poland",
                
                # Parametry ETF
                benchmark="Treasury BondSpot Poland Index",
                distribution_policy=DistributionPolicy.ACCUMULATING,
                replication_method=ReplicationMethod.PHYSICAL
            ))

        # ==========================================
        # 4. OBLIGACJE DETALICZNE
        # ==========================================
        
        # Konfiguracja dla poszczególnych typów obligacji na podstawie przedrostków
        bond_configs = {
            "OTS": {"tenor": 1, "cat2": Category2.BOND_RETAIL_FIXED_RATE, "freq": CouponFrequency.AT_THE_END, "handling": InterestHandling.PAYOUT, "idx": False, "idx_name": None, "penalty": "0.50"},
            "ROR": {"tenor": 1, "cat2": Category2.BOND_RETAIL_INTEREST_LINKED, "freq": CouponFrequency.MONTHLY, "handling": InterestHandling.PAYOUT, "idx": True, "idx_name": "NBP", "penalty": "0.70"},
            "DOR": {"tenor": 2, "cat2": Category2.BOND_RETAIL_INTEREST_LINKED, "freq": CouponFrequency.MONTHLY, "handling": InterestHandling.PAYOUT, "idx": True, "idx_name": "NBP", "penalty": "0.70"},
            "TOS": {"tenor": 3, "cat2": Category2.BOND_RETAIL_FIXED_RATE,      "freq": CouponFrequency.YEARLY,  "handling": InterestHandling.CAPITALIZATION, "idx": False, "idx_name": None, "penalty": "0.70"},
            "COI": {"tenor": 4, "cat2": Category2.BOND_RETAIL_INFLATION_LINKED,"freq": CouponFrequency.YEARLY,  "handling": InterestHandling.PAYOUT, "idx": True, "idx_name": "CPI", "penalty": "0.70"},
        }

        # Dane odczytane ze zdjęcia: (Ticker, Data wykupu)
        bonds_data = [
            ("OTS0326", date(2026, 3, 26)),
            ("ROR0526", date(2026, 5, 5)),
            ("DOR1126", date(2026, 11, 28)),
            ("DOR1226", date(2026, 12, 3)),
            ("TOS0428", date(2028, 4, 3)),
            ("TOS0628", date(2028, 6, 27)),
            ("TOS0828", date(2028, 8, 25)),
            ("COI1228", date(2028, 12, 3)),
            ("COI0329", date(2029, 3, 20)),
            ("COI0429", date(2029, 4, 15)),
            ("COI1129", date(2029, 11, 28)),
        ]

        for ticker, maturity in bonds_data:
            if not Asset.query.filter_by(ticker=ticker).first():
                prefix = ticker[:3]
                cfg = bond_configs[prefix]
                
                # Wyliczamy datę emisji cofając się o odpowiednią liczbę lat (tenor)
                issue = date(maturity.year - cfg["tenor"], maturity.month, maturity.day)

                assets_to_add.append(Bond(
                    ticker=ticker,
                    name=("Obligacje Skarbowe 3-miesięczne (OTS)" if ticker.startswith('OTS') else f"Obligacje Skarbowe {cfg['tenor']}-letnie ({prefix})"),
                    asset_type=AssetType.BOND,
                    category1=Category1.BOND,
                    category2=cfg["cat2"],
                    geo_region=GeoRegion.POLAND,
                    market_type=MarketType.DEVELOPED,
                    currency="PLN",
                    
                    # Pola specyficzne dla Bond
                    issue_date=issue,
                    maturity_date=maturity,
                    nominal_value=Decimal("100.00"),
                    interest_handling=cfg["handling"],
                    coupon_frequency=cfg["freq"],
                    is_indexed=cfg["idx"],
                    inflation_index=cfg["idx_name"],
                    retail_series_code=ticker,
                    early_redemption_penalty=Decimal(cfg["penalty"])
                ))

        if assets_to_add:
            db.session.add_all(assets_to_add)
            db.session.commit()
            print(f"Sukces! Dodano {len(assets_to_add)} nowych instrumentów do bazy.")
        else:
            print("Wszystkie instrumenty już istnieją w bazie.")

if __name__ == "__main__":
    seed_database()