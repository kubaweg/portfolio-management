from app import SessionLocal
from app.schemas.database.asset import (
    Asset, ETF, ETC, Bond,
    AssetType, Category1, Category2, GeoRegion, GeoCountry, MarketType,
    DistributionPolicy, ReplicationMethod, CouponFrequency, InterestHandling, RetailBondBenchmark
)
from datetime import date
from dateutil.relativedelta import relativedelta
from decimal import Decimal

def seed_database():
    
    with SessionLocal() as db:
        
        assets_to_add = []

        # ==========================================
        # 1. ETC: Złoto
        # ==========================================
        if not db.query(Asset).filter_by(ticker="4GLD.DE").first():
            assets_to_add.append(ETC(
                ticker="4GLD.DE",
                name="Xetra-Gold",

                asset_type=AssetType.ETC,

                category1=Category1.COMMODITY,
                category2=Category2.COMMODITY_GOLD,
                geo_region=GeoRegion.GLOBAL,
                market_type=MarketType.MIXED,
                currency="EUR",
                spread=Decimal("0.001"),

                # Parametry z Mixinu
                isin="DE000A0S9GB0",
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
        if not db.query(Asset).filter_by(ticker="IUSQ.DE").first():
            assets_to_add.append(ETF(
                ticker="IUSQ.DE",
                name="iShares MSCI ACWI UCITS ETF (Acc)",
    
                asset_type=AssetType.ETF,

                category1=Category1.EQUITY,
                category2=Category2.EQUITY_GLOBAL,

                geo_region=GeoRegion.GLOBAL,
                market_type=MarketType.MIXED,

                currency="EUR",
                
                # Parametry z Mixinu
                isin="IE00B6R52259",
                issuer="BlackRock",
                ter=Decimal("0.0020"),
                listing_venue="XETRA",
                domicile="Ireland",
                spread=Decimal("0.001"),
                
                # Parametry ETF
                benchmark="MSCI All Country World Index",
                distribution_policy=DistributionPolicy.ACCUMULATING,
                replication_method=ReplicationMethod.PHYSICAL
            ))

        # ==========================================
        # 3. ETF: Polskie Obligacje Skarbowe (TBSP)
        # ==========================================
        if not db.query(Asset).filter_by(ticker="ETFBTBSP.WA").first():
            assets_to_add.append(ETF(
                ticker="ETFBTBSP.WA",
                name="Beta ETF TBSP Portfelowy FIZ",
                isin="PLBTBSP00012",
                asset_type=AssetType.ETF,
                category1=Category1.BOND,
                category2=Category2.BOND_RETAIL_FIXED_RATE, # Traktujemy jako stałokuponowe

                geo_region=GeoRegion.EUROPE_EAST,
                geo_country=GeoCountry.POLAND,
                market_type=MarketType.EMERGING,

                currency="PLN",
                
                # Parametry z Mixinu
                issuer="AgioFunds TFI (Beta ETF)",
                ter=Decimal("0.0050"),
                listing_venue="Giełda Papierów Wartościowych w Warszawie",
                domicile="Poland",
                spread=Decimal("0.0020"),

                
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
            "OTS": {"tenor": 1, "cat2": Category2.BOND_RETAIL_FIXED_RATE, "freq": CouponFrequency.AT_THE_END, "handling": InterestHandling.PAYOUT, "idx": False, "idx_name": None},
            "ROR": {"tenor": 1, "cat2": Category2.BOND_RETAIL_INTEREST_LINKED, "freq": CouponFrequency.MONTHLY, "handling": InterestHandling.PAYOUT, "idx": True, "idx_name": RetailBondBenchmark.NBP},
            "DOR": {"tenor": 2, "cat2": Category2.BOND_RETAIL_INTEREST_LINKED, "freq": CouponFrequency.MONTHLY, "handling": InterestHandling.PAYOUT, "idx": True, "idx_name": RetailBondBenchmark.NBP},
            "TOS": {"tenor": 3, "cat2": Category2.BOND_RETAIL_FIXED_RATE,      "freq": CouponFrequency.YEARLY,  "handling": InterestHandling.CAPITALIZATION, "idx": False, "idx_name": None},
            "COI": {"tenor": 4, "cat2": Category2.BOND_RETAIL_INFLATION_LINKED,"freq": CouponFrequency.YEARLY,  "handling": InterestHandling.PAYOUT, "idx": True, "idx_name": RetailBondBenchmark.CPI},
            "EDO": {"tenor": 10, "cat2": Category2.BOND_RETAIL_INFLATION_LINKED, "freq": CouponFrequency.AT_THE_END, "handling": InterestHandling.CAPITALIZATION, "idx": True, "idx_name": RetailBondBenchmark.CPI}
        }

        # Dane odczytane ze zdjęcia: (Ticker, Data wykupu, Kara za przedterminowy wykup, Stopa początkowa, Marża ponad benchmark, Aktywny)
        bonds_data = [
            ("OTS0326", date(2026, 3, 16), "0.00", "0.0250", None, False),
            ("ROR0625", date(2025, 6, 4), "0.50", "0.0595", "0.0", False),
            ("ROR1025", date(2025, 10, 17), "0.50", "0.0575", "0.0", False),
            ("ROR1225", date(2025, 12, 4), "0.50", "0.0575", "0.0", False),
            ("ROR0326", date(2026, 3, 3), "0.50", "0.0575", "0.0", False),
            ("ROR0526", date(2026, 5, 5), "0.50", "0.0575", "0.0", False),
            ("ROR0626", date(2026, 6, 6), "0.50", "0.0525", "0.0", False),
            ("DOR1126", date(2026, 11, 28), "0.70", "0.0590", "0.015", False),
            ("DOR1226", date(2026, 12, 3), "0.70", "0.0590", "0.015", False),
            ("TOS0428", date(2028, 4, 3), "1.00", "0.0595", None, False),
            ("TOS0628", date(2028, 6, 27), "1.00", "0.0565", None, False),
            ("TOS0828", date(2028, 8, 25), "1.00", "0.0540", None, False),
            ("COI1026", date(2026, 10, 1), "0.70", "0.07", "0.01", False),
            ("COI0927", date(2027, 9, 1), "0.70", "0.07", "0.01", False),
            ("COI1228", date(2028, 12, 3), "2.00", "0.0630", "0.0150", False),
            ("COI0329", date(2029, 3, 20), "2.00", "0.0630", "0.0150", False),
            ("COI0429", date(2029, 4, 15), "2.00", "0.0630", "0.0150", False),
            ("COI1129", date(2029, 11, 28), "2.00", "0.0525", "0.0150", False),
            ("EDO0735", date(2035, 7, 4), "3.00", "0.0625", "0.02", False),
            ("EDO1035/1", date(2035, 10, 12), "3.00", "0.06", "0.02", False),
            ("EDO1035/2", date(2035, 10, 17), "3.00", "0.06", "0.02", False)
        ]

        for ticker, maturity_date, penalty, initial_rate, margin, active in bonds_data:
            if not db.query(Bond).filter_by(ticker=ticker, maturity_date=maturity_date).first():
                prefix = ticker[:3]
                cfg = bond_configs[prefix]
                
                # Wyliczamy datę emisji cofając się o odpowiednią liczbę lat (tenor)
                issue = (
                    maturity_date - relativedelta(month=3)
                    if ticker.startswith('OTS')
                    else maturity_date - relativedelta(year=cfg['tenor'])
                )

                assets_to_add.append(Bond(
                    ticker=ticker,
                    name=("Obligacje Skarbowe 3-miesięczne (OTS)" if ticker.startswith('OTS') else f"Obligacje Skarbowe {cfg['tenor']}-letnie ({prefix})"),

                    asset_type=AssetType.BOND,

                    category1=Category1.BOND,
                    category2=cfg["cat2"],

                    geo_region=GeoRegion.EUROPE,
                    geo_country=GeoCountry.POLAND,
                    market_type=MarketType.EMERGING,

                    currency="PLN",

                    active=active,
                    
                    # Pola specyficzne dla Bond
                    retail_series_type=ticker[:3],
                    
                    issue_date=issue,
                    maturity_date=maturity_date,

                    nominal_value=Decimal("100.00"),

                    interest_handling=cfg["handling"],
                    coupon_frequency=cfg["freq"],

                    initial_rate=initial_rate,

                    is_indexed=cfg["idx"],
                    margin=margin,

                    benchmark=cfg["idx_name"],

                    early_redemption_penalty=Decimal(penalty),

                    rating='A-',
                    secured=False
                ))

        if assets_to_add:
            db.add_all(assets_to_add)
            db.commit()
            print(f"Sukces! Dodano {len(assets_to_add)} nowych instrumentów do bazy.")
        else:
            print("Wszystkie instrumenty już istnieją w bazie.")

if __name__ == "__main__":
    seed_database()