from pydantic import BaseModel, Field, ConfigDict
from datetime import datetime
from typing import Optional, List
from ..database.asset import Asset
from ..domain.assets import Category1, Category2
from ..domain.positions import OpenPosition, ClosedPosition
from ..domain.transactions import TransactionType

from app.core.bonds import BondInterestPeriod


class CurrentInstrumentData(BaseModel):
    model_config = ConfigDict(arbitrary_types_allowed=True)

    label: str
    category1: str
    category2: str
    value: float
    type: str

#########################################

class PortfolioTotals(BaseModel):
    invested_value: float = Field(ge=0)
    invested_value_detailed: dict[str, float]

    current_value: float = Field(ge=0)
    current_value_detailed: dict[str, float]

    realized_profit: float
    realized_profit_detailed: dict[str, float]

    unrealized_profit: float
    unrealized_profit_detailed: dict[str, float]
    
    interest: float = Field(ge=0)
    interest_detailed: dict[str, float]

    profit: float
    profit_detailed: dict[str, float]

    roi: float
    roi_detailed: dict[str, float]

    annualized_roi: float
    annualized_roi_detailed: dict[str, float]
    
    instrument_data: list[CurrentInstrumentData]

class TransactionData(BaseModel):
    timestamp: datetime
    type: TransactionType
    quantity: float
    price: float
    fx_rate: float
    roi: float

#########################################

# klasy zagnieżdżone
class AssetBaseData(BaseModel):
    ticker: str
    name: str
    type: str
    category1: str
    category2: str
    currency: str

class AssetSummary(BaseModel):

    quantity: float = Field(ge=0)

    avg_price: float = Field(ge=0)
    avg_price_pln: float = Field(ge=0)
    avg_fx_rate: float = Field(ge=0)

    realized_profit: float
    realized_profit_pln: float

    unrealized_profit: float
    unrealized_profit_pln: float

    interest_profit: float = Field(ge=0)
    interest_profit_pln: float = Field(ge=0)

    profit_loss: float
    profit_loss_pln: float

    roi: float
    roi_pln: float

    roi_pa: float
    roi_pa_pln: float

class AssetFXData(BaseModel):

    currency: str

    fx_rate: float = Field(ge=0)
    fx_effective_rate: float = Field(ge=0)

    fx_datetime: datetime

class AssetCurrentData(BaseModel):

    price: float = Field(ge=0)

    value: float = Field(ge=0)
    value_pln: float = Field(ge=0)

    fx_data: AssetFXData

    price_datetime: datetime


# klasa główna
class AssetData(BaseModel):
    
    model_config = ConfigDict(arbitrary_types_allowed=True)

    base_data: AssetBaseData
    summary: AssetSummary
    current_data: AssetCurrentData

    open_positions: List[OpenPosition]
    closed_positions: List[ClosedPosition]

#############################################

class DashboardResponse(BaseModel):
    totals: PortfolioTotals
    asset_data: List[AssetData]

class DashboardBondResponse(BaseModel):
    data: dict[str, dict]
