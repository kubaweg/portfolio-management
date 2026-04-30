from enum import Enum
from datetime import datetime
from pydantic import BaseModel
# from .types import MoneyAmount, AssetQuantity, FXRate

class TransactionType(str, Enum):
    BUY = "Kupno"
    SELL = "Sprzedaż"
    INTEREST = "Odsetki"

class BaseTransaction(BaseModel):
    ticker: str
    timestamp: datetime
    type: TransactionType

class BuyTransaction(BaseTransaction):
    quantity: float
    price: float
    fx_rate: float

class SellTransaction(BaseTransaction):
    quantity: float
    price: float
    fx_rate: float

class InterestTransaction(BaseTransaction):
    value: float

class CapitalizationTransaction(BaseTransaction):
    quantity: float
    price: float
    fx_rate: float

class TickerTransactions(BaseModel):
    ticker: str
    transactions: list[BaseTransaction]
