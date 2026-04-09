from typing import List
from .models import Transaction as SA_Transaction
from .domain.transactions import (
    BuyTransaction,
    SellTransaction,
    InterestTransaction,
    CapitalizationTransaction,
    BaseTransaction,
    TransactionType,
)


class TransactionMapper:
    @staticmethod
    def map_one(tx: SA_Transaction) -> BaseTransaction:
        ticker = tx.asset.ticker  # relacja z Asset
        ttype = tx.transaction_type

        if ttype == TransactionType.BUY.value:
            return BuyTransaction(
                ticker=ticker,
                date=tx.date,
                type=TransactionType.BUY,
                quantity=tx.quantity,
                price=tx.price_per_unit,
                fx_rate=tx.exchange_rate,
            )

        if ttype == TransactionType.SELL.value:
            return SellTransaction(
                ticker=ticker,
                date=tx.date,
                type=TransactionType.SELL,
                quantity=tx.quantity,
                price=tx.price_per_unit,
                fx_rate=tx.exchange_rate,
            )

        if ttype == TransactionType.INTEREST.value:
            return InterestTransaction(
                ticker=ticker,
                date=tx.date,
                type=TransactionType.INTEREST,
                amount=tx.price_per_unit * tx.exchange_rate,
            )

        if ttype == TransactionType.CAPITALIZATION.value:
            return CapitalizationTransaction(
                ticker=ticker,
                date=tx.date,
                type=TransactionType.CAPITALIZATION,
                quantity=tx.quantity,
                price=tx.price_per_unit,
                fx_rate=tx.exchange_rate,
            )

        raise ValueError(f"Unknown transaction_type: {ttype}")

    @classmethod
    def map_many(cls, txs: List[SA_Transaction]) -> List[BaseTransaction]:
        return [cls.map_one(tx) for tx in txs]
