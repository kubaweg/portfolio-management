from enum import Enum
from datetime import datetime
from pydantic import BaseModel
from .types import MoneyAmount, AssetQuantity, FXRate

class TransactionType(str, Enum):
    BUY = "Kupno"
    SELL = "Sprzedaż"
    INTEREST = "Odsetki"

class BaseTransaction(BaseModel):
    ticker: str
    timestamp: datetime
    type: TransactionType

class BuyTransaction(BaseTransaction):
    quantity: AssetQuantity
    price: MoneyAmount
    fx_rate: FXRate

class SellTransaction(BaseTransaction):
    quantity: AssetQuantity
    price: MoneyAmount
    fx_rate: FXRate

class InterestTransaction(BaseTransaction):
    value: AssetQuantity

class CapitalizationTransaction(BaseTransaction):
    quantity: AssetQuantity
    price: MoneyAmount
    fx_rate: FXRate

class TickerTransactions(BaseModel):
    ticker: str
    transactions: list[BaseTransaction]
