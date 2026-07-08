from typing import List
from app.schemas.database.transaction import Transaction as SA_Transaction
from app.schemas.domain.transactions import (
    Transaction,
    TransactionType,
    BuyTransaction,
    SellTransaction,
    DividendTransaction,
    DepositTransaction,
    WithdrawalTransaction,
    FeeTransaction,
    TaxTransaction,
)

class TransactionMapper:
    @staticmethod
    def map_one(tx: SA_Transaction) -> Transaction:

        ttype = TransactionType(tx.type)

        if ttype == TransactionType.BUY:
            return BuyTransaction(
                ticker=tx.asset.ticker,
                timestamp=tx.timestamp,                                         # type: ignore
                value_net=tx.value_net,                                         # type: ignore
                fee=tx.fee,                                                     # type: ignore
                tax=tx.tax,                                                     # type: ignore
                notes=tx.notes,                                                 # type: ignore
                metadata_json=tx.metadata_json,                                 # type: ignore
                quantity=tx.quantity,                                           # type: ignore
                price=tx.price,                                                 # type: ignore
                fx_rate=tx.fx_rate,                                             # type: ignore
                is_exchange=tx.is_exchange                                      # type: ignore
            )

        if ttype == TransactionType.SELL:
            return SellTransaction(
                ticker=tx.asset.ticker,
                timestamp=tx.timestamp,                                         # type: ignore
                value_net=tx.value_net,                                         # type: ignore
                fee=tx.fee,                                                     # type: ignore
                tax=tx.tax,                                                     # type: ignore
                notes=tx.notes,                                                 # type: ignore
                metadata_json=tx.metadata_json,                                 # type: ignore
                quantity=tx.quantity,                                           # type: ignore
                price=tx.price,                                                 # type: ignore
                fx_rate=tx.fx_rate,                                             # type: ignore
                is_early_redemption=tx.is_early_redemption                      # type: ignore
            )

        if ttype == TransactionType.DIVIDEND:
            return DividendTransaction(
                ticker=tx.asset.ticker,
                timestamp=tx.timestamp,                                         # type: ignore
                value_net=tx.value_net,                                         # type: ignore
                fee=tx.fee,                                                     # type: ignore
                tax=tx.tax,                                                     # type: ignore
                notes=tx.notes,                                                 # type: ignore
                metadata_json=tx.metadata_json                                  # type: ignore
            )

        if ttype == TransactionType.DEPOSIT:
            return DepositTransaction(
                timestamp=tx.timestamp,                                         # type: ignore
                value_net=tx.value_net,                                         # type: ignore
                fee=tx.fee,                                                     # type: ignore
                tax=tx.tax,                                                     # type: ignore
                notes=tx.notes,                                                 # type: ignore
                metadata_json=tx.metadata_json                                  # type: ignore
            )

        if ttype == TransactionType.WITHDRAWAL:
            return WithdrawalTransaction(
                timestamp=tx.timestamp,                                         # type: ignore
                value_net=tx.value_net,                                         # type: ignore
                fee=tx.fee,                                                     # type: ignore
                tax=tx.tax,                                                     # type: ignore
                notes=tx.notes,                                                 # type: ignore
                metadata_json=tx.metadata_json                                  # type: ignore
            )

        if ttype == TransactionType.FEE:
            return FeeTransaction(
                ticker=tx.asset.ticker,
                timestamp=tx.timestamp,                                         # type: ignore
                value_net=tx.value_net,                                         # type: ignore
                fee=tx.fee,                                                     # type: ignore
                tax=tx.tax,                                                     # type: ignore
                notes=tx.notes,                                                 # type: ignore
                metadata_json=tx.metadata_json                                  # type: ignore
            )

        if ttype == TransactionType.TAX:
            return TaxTransaction(
                ticker=tx.asset.ticker,
                timestamp=tx.timestamp,                                         # type: ignore
                value_net=tx.value_net,                                         # type: ignore
                fee=tx.fee,                                                     # type: ignore
                tax=tx.tax,                                                     # type: ignore
                notes=tx.notes,                                                 # type: ignore
                metadata_json=tx.metadata_json                                  # type: ignore
            )

        raise ValueError(f"Nieobsługiwany typ transakcji: {ttype}")

    @classmethod
    def map_many(cls, txs: List[SA_Transaction]) -> List[Transaction]:
        return [cls.map_one(tx) for tx in txs]