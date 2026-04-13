from typing import List
from .transaction import Transaction as SA_Transaction
from .domain.transactions import (
    BuyTransaction,
    SellTransaction,
    InterestTransaction,
    BaseTransaction,
    TransactionType,
)


class TransactionMapper:
    @staticmethod
    def map_one(tx: SA_Transaction) -> BaseTransaction:
        ticker = tx.asset.ticker  # relacja z Asset
        ttype = tx.type

        if ttype == TransactionType.BUY.value:
            return BuyTransaction(
                ticker=ticker,
                date=tx.timestamp,
                type=TransactionType.BUY,
                quantity=tx.quantity,
                price=tx.price,
                fx_rate=tx.fx_rate,
            )

        if ttype == TransactionType.SELL.value:
            return SellTransaction(
                ticker=ticker,
                date=tx.timestamp,
                type=TransactionType.SELL,
                quantity=tx.quantity,
                price=tx.price,
                fx_rate=tx.fx_rate,
            )

        if ttype == TransactionType.INTEREST.value:
            return InterestTransaction(
                ticker=ticker,
                date=tx.timestamp,
                type=TransactionType.INTEREST,
                amount=tx.price * tx.fx_rate,
            )

        raise ValueError(f"Unknown transaction_type: {ttype}")

    @classmethod
    def map_many(cls, txs: List[SA_Transaction]) -> List[BaseTransaction]:
        return [cls.map_one(tx) for tx in txs]
