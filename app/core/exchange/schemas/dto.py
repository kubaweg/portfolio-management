from pydantic import BaseModel, Field
from datetime import datetime
from typing import List, Optional
from app.schemas.domain.positions import OpenPosition, ClosedPosition
from app.schemas.domain.transactions import TransactionType

from app.core.cash.schemas.dto import CashFlowSummary

EXCHANGE_TAX_RATE = 0.19

class PositionBuilderResult(BaseModel):
    open_positions: List[OpenPosition]
    closed_positions: List[ClosedPosition]

    # realized_profit: float
    # unrealized_profit: float
    
    # realized_profit_pln: float
    # unrealized_profit_pln: float

#########################################

class TransactionData(BaseModel):
    timestamp: datetime
    type: TransactionType
    quantity: float
    price: float
    fx_rate: float
    roi: float

#########################################

# klasy zagnieżdżone
class ExchangeBaseData(BaseModel):
    ticker: str
    name: str
    type: str
    category1: str
    category2: str
    currency: str

class ExchangeSummary(BaseModel):

    avg_price: float = Field(ge=0)
    avg_price_pln: float = Field(ge=0)
    avg_fx_rate: float = Field(ge=0)

    realized_profit: float
    roi_realized: float
    roi_realized_pa: float

    realized_profit_pln: float
    roi_realized_pln: float
    roi_realized_pa_pln: float

    unrealized_profit: float
    roi_unrealized: float
    roi_unrealized_pa: float

    unrealized_profit_pln: float
    roi_unrealized_pln: float
    roi_unrealized_pa_pln: float

    total_profit: float
    roi: float
    roi_pa: float

    total_profit_pln: float
    roi_pln: float
    roi_pa_pln: float

class ExchangeFXData(BaseModel):

    currency: str

    fx_rate: float = Field(ge=0)
    fx_effective_rate_buy: float = Field(ge=0)
    fx_effective_rate_sell: float = Field(ge=0)

    fx_datetime: datetime

class ExchangeCurrentData(BaseModel):

    quantity: float = Field(ge=0)
    price: float = Field(ge=0)
    value: float = Field(ge=0)
    value_pln: float = Field(ge=0)
    fx_data: ExchangeFXData

    price_datetime: datetime


# klasa główna
class ExchangeData(BaseModel):

    base_data: ExchangeBaseData
    summary: ExchangeSummary
    current_data: ExchangeCurrentData

    open_positions: List[OpenPosition]
    closed_positions: List[ClosedPosition]

    cash_flows: CashFlowSummary

#############################################

class DashboardExchangeResponse(BaseModel):
    data: List[ExchangeData]

#############################################

class OpenPositionsMetrics(BaseModel):
    quantity: float = Field(
        default=0.0, 
        ge=0.0, 
        description="Całkowita liczba jednostek (wolumen) w otwartych pozycjach."
    )
    historical_cost: float = Field(
        default=0.0, 
        ge=0.0, 
        description="Łączny koszt zakupu otwartych pozycji wyrażony w walucie notowania instrumentu."
    )
    historical_cost_pln: float = Field(
        default=0.0, 
        ge=0.0, 
        description="Łączny koszt zakupu otwartych pozycji przeliczony na PLN po kursie z dnia transakcji."
    )
    current_value: float = Field(
        default=0.0, 
        ge=0.0, 
        description="Bieżąca rynkowa wartość otwartych pozycji w walucie notowania instrumentu."
    )
    current_value_pln: float = Field(
        default=0.0, 
        ge=0.0, 
        description="Bieżąca rynkowa wartość otwartych pozycji przeliczona na PLN po aktualnym kursie FX."
    )
    unrealized_profit: float = Field(
        default=0.0, 
        description="Niezrealizowany zysk lub strata (papierowy wynik) w walucie notowania instrumentu. Może przyjmować wartości ujemne."
    )
    unrealized_profit_pln: float = Field(
        default=0.0, 
        description="Niezrealizowany zysk lub strata przeliczony na PLN, uwzględniający różnice kursowe FX. Może przyjmować wartości ujemne."
    )

class ClosedPositionsMetrics(BaseModel):
    realized_profit: float = Field(
        default=0.0, 
        description="Faktycznie zrealizowany zysk lub strata z zamkniętych pozycji w walucie notowania instrumentu. Może przyjmować wartości ujemne."
    )
    realized_profit_pln: float = Field(
        default=0.0, 
        description="Faktycznie zrealizowany zysk lub strata z zamkniętych pozycji w PLN, uwzględniający różnice kursowe z dnia zakupu i sprzedaży. Może przyjmować wartości ujemne."
    )

class MarketPriceData(BaseModel):
    price: float = Field(
        default=0.0, 
        ge=0.0, 
        description="Bieżąca cena rynkowa aktywa po uwzględnieniu spreadu."
    )
    price_datetime: Optional[datetime] = Field(
        default=None, 
        description="Data i czas (timestamp) ostatniej aktualizacji ceny rynkowej aktywa."
    )
    fx_rate: float = Field(
        default=1.0, 
        ge=0.0, 
        description="Bazowy, rynkowy kurs wymiany waluty."
    )
    fx_effective_rate_buy: float = Field(
        default=1.0, 
        ge=0.0, 
        description="Efektywny kurs kupna waluty, powiększony o prowizję za przewalutowanie (conversion fee)."
    )
    fx_effective_rate_sell: float = Field(
        default=1.0, 
        ge=0.0, 
        description="Efektywny kurs sprzedaży waluty, pomniejszony o prowizję za przewalutowanie (conversion fee)."
    )
    fx_datetime: Optional[datetime] = Field(
        default=None, 
        description="Data i czas (timestamp) ostatniej aktualizacji kursu walutowego."
    )