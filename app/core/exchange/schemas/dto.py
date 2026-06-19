from pydantic import BaseModel, Field, ConfigDict
from datetime import datetime
from typing import List
from app.schemas.domain.positions import OpenPosition, ClosedPosition
from app.schemas.domain.transactions import TransactionType


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

    quantity: float = Field(ge=0)

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

    interest_profit: float = Field(ge=0)
    interest_profit_pln: float = Field(ge=0)

    total_profit: float
    total_profit_pln: float

    roi: float
    roi_pa: float

    roi_pln: float
    roi_pa_pln: float

class ExchangeFXData(BaseModel):

    currency: str

    fx_rate: float = Field(ge=0)
    fx_effective_rate_buy: float = Field(ge=0)
    fx_effective_rate_sell: float = Field(ge=0)

    fx_datetime: datetime

class ExchangeCurrentData(BaseModel):

    price: float = Field(ge=0)

    value: float = Field(ge=0)
    value_pln: float = Field(ge=0)

    fx_data: ExchangeFXData

    price_datetime: datetime


# klasa główna
class ExchangeData(BaseModel):
    
    model_config = ConfigDict(arbitrary_types_allowed=True)

    base_data: ExchangeBaseData
    summary: ExchangeSummary
    current_data: ExchangeCurrentData

    open_positions: List[OpenPosition]
    closed_positions: List[ClosedPosition]

#############################################

class DashboardExchangeResponse(BaseModel):
    data: List[ExchangeData]
