from enum import Enum
from pydantic import BaseModel
from datetime import date

class CashFlowType(str, Enum):
    # Gotówka / Forex
    DEPOSIT = "DEPOSIT"
    WITHDRAWAL = "WITHDRAWAL"
    EXCHANGE = "EXCHANGE"
    
    # Transakcje i operacje na papierach
    BUY = "BUY"
    SELL = "SELL"
    
    # Operacje specyficzne dla obligacji
    INTEREST = "INTEREST"
    MATURITY = "MATURITY"
    EARLY_REDEMPTION = "EARLY_REDEMPTION"
    TAX = "TAX"
    FEE = "FEE"
    
    # Sztuczny przepływ na potrzeby analityki (Point-in-Time Evaluation)
    CURRENT_VALUATION = "CURRENT_VALUATION"

class CashFlowInstance(BaseModel):
    date: date
    amount: float
    flow_type: CashFlowType
    description: str = ""