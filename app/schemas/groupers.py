from collections import defaultdict
from typing import List
from .domain.transactions import BaseTransaction, TickerTransactions

def group_by_ticker(domain_txs: List[BaseTransaction]) -> List[TickerTransactions]:

    if not domain_txs:
        return []

    buckets = defaultdict(list)
    for tx in domain_txs:
        buckets[tx.ticker].append(tx)

    return [
        TickerTransactions(
            ticker=ticker,
            transactions=sorted(txs, key=lambda t: t.timestamp)
        )
        for ticker, txs in buckets.items()
    ]
