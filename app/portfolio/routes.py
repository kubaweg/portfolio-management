# # app/portfolio/routes.py (lub podobne)
# from . import portfolio_bp

# from datetime import date

# from app import db
# from app.schemas.domain.bonds import BondAsset
# from app.schemas.domain.assets import RetailBondBenchmark, CouponFrequency, InterestHandling
# from app.core.bonds.service import build_bond_stream

# @portfolio_bp.route('/api/bonds/<symbol>/stream')
# def get_bond_stream(symbol):
    
#     # 1. Wyciągasz obligację ze swojej tabeli portfela/aktywów
#     # (Tutaj uproszczone stworzenie mocka)
#     my_bond = BondAsset(
#         symbol="COI0526",
#         issue_date=date(2022, 5, 1),
#         maturity_date=date(2026, 5, 1),
#         nominal_value=100,
#         interest_handling=InterestHandling.PAYOUT,
#         coupon_frequency=CouponFrequency.YEARLY,
#         is_indexed=True,
#         initial_rate=5.50,
#         margin=1.00,
#         benchmark=RetailBondBenchmark.CPI,
#         early_redemption_penalty=0.7
#     )
    
#     # 2. Generujesz strumień za pomocą naszego orkiestratora
#     stream = build_bond_stream(db, my_bond)
    
#     # 3. Zwracasz jako JSON do Front-endu
#     return stream.model_dump() # dla Pydantic v2