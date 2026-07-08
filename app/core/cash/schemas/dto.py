from typing import Optional, List
from enum import Enum
from pydantic import BaseModel, Field
from datetime import date

class CashFlowType(str, Enum):
    # Gotówka / Forex
    DEPOSIT = "DEPOSIT"
    WITHDRAWAL = "WITHDRAWAL"
    EXCHANGE = "EXCHANGE"
    
    # Transakcje i operacje na papierach
    BUY = "BUY"
    SELL = "SELL"
    DIVIDEND = "DIVIDEND"
    
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
    value: float
    flow_type: CashFlowType
    description: Optional[str]


class CashFlow(BaseModel):
    realized: List[CashFlowInstance]
    unrealized: List[CashFlowInstance]
    total: List[CashFlowInstance]

class CashFlowSummary(BaseModel):
    gross: CashFlow
    net: CashFlow


#############################################################################


class FinancialAggregationInstance(BaseModel):
    """
    Uproszczony zestaw kluczowych metryk finansowych dla danego stanu przepływów.
    """
    invested_capital: float = Field(
        description="Kapitał zainwestowany (baza stanowiąca mianownik dla ROI)"
    )
    profit: float = Field(
        description="Zysk kwotowy (nominalny wynik finansowy)"
    )
    roi: float = Field(
        description="Tradycyjny zwrot z inwestycji (ROI) wyrażony jako ułamek/procent (profit_amount / invested_capital)"
    )
    roi_pa: Optional[float] = Field(
        default=None, 
        description="Zannualizowany zwrot z inwestycji (ROI p.a.) wyliczony za pomocą algorytmu XIRR"
    )

class FinancialAggregation(BaseModel):
    """Podsumowanie z zachowaniem trójpodziału na przepływy zrealizowane, niezrealizowane i łącznie."""
    realized: FinancialAggregationInstance
    unrealized: FinancialAggregationInstance
    total: FinancialAggregationInstance

class FinancialSummary(BaseModel):
    """Główny obiekt wynikowy zwracany przez silnik agregujący."""
    gross: FinancialAggregation
    net: FinancialAggregation
    total_tax_impact: float = Field(
        description="Łączny wpływ podatkowy (różnica pomiędzy profit_amount brutto a netto)"
    )