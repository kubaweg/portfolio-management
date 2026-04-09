from enum import Enum
from datetime import datetime
from pydantic import BaseModel
from .types import FXRate

class TransactionType(str, Enum):
    BUY = "KUPNO"
    SELL = "SPRZEDAŻ"
    INTEREST = "ODSETKI"
    CAPITALIZATION = "KAPITALIZACJA"

class BaseTransaction(BaseModel):
    ticker: str
    date: datetime
    type: TransactionType

class BuyTransaction(BaseTransaction):
    quantity: float
    price: float
    fx_rate: FXRate

class SellTransaction(BaseTransaction):
    quantity: float
    price: float
    fx_rate: FXRate

class InterestTransaction(BaseTransaction):
    amount: float

class CapitalizationTransaction(BaseTransaction):
    quantity: float
    price: float
    fx_rate: FXRate

class TickerTransactions(BaseModel):
    ticker: str
    transactions: list[BaseTransaction]
