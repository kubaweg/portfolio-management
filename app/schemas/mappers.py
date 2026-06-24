from typing import List
from .database.transaction import Transaction as SA_Transaction
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

        if ttype == TransactionType.BUY:        # type: ignore
            return BuyTransaction(
                ticker=ticker,
                timestamp=tx.timestamp,         # type: ignore
                type=TransactionType.BUY,
                quantity=tx.quantity,           # type: ignore
                price=tx.price,                 # type: ignore
                fx_rate=tx.fx_rate,             # type: ignore
            )

        if ttype == TransactionType.SELL:       # type: ignore
            return SellTransaction(
                ticker=ticker,
                timestamp=tx.timestamp,         # type: ignore
                type=TransactionType.SELL,
                quantity=tx.quantity,           # type: ignore
                price=tx.price,                 # type: ignore
                fx_rate=tx.fx_rate,             # type: ignore
            )

        if ttype == TransactionType.INTEREST:   # type: ignore
            return InterestTransaction(
                ticker=ticker,
                timestamp=tx.timestamp,         # type: ignore
                type=TransactionType.INTEREST,
                value=tx.price * tx.fx_rate,    # type: ignore
            )

        raise ValueError(f"Unknown transaction_type: {ttype}")

    @classmethod
    def map_many(cls, txs: List[SA_Transaction]) -> List[BaseTransaction]:
        return [cls.map_one(tx) for tx in txs]
