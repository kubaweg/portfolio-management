from app import create_app, db

app = create_app()

from app.schemas.mappers import TransactionMapper
from app.schemas.groupers import group_by_ticker
from app.portfolio.position_builder import PositionBuilder
from app.schemas.database.asset import Asset

with app.app_context():
    asset = Asset.query.filter_by(ticker="4GLD.DE").first()
    domain_txs = TransactionMapper.map_many(asset.transactions)
    tt = group_by_ticker(domain_txs)[0]

    pb = PositionBuilder()
    result = pb.build(tt, current_price=100)

    print("OPEN:", result.open_positions)
    print("CLOSED:", result.closed_positions)
    print("REALIZED:", result.realized_profit)
    print("UNREALIZED:", result.unrealized_profit)
