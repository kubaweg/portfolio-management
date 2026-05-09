from pydantic import BaseModel, Field, ConfigDict
from datetime import datetime
from typing import Optional, List
from ..database.asset import Asset
from ..domain.assets import Category1, 
from ..domain.positions import OpenPosition, ClosedPosition
from ..domain.transactions import TransactionType


class CurrentInstrumentData(BaseModel):
    model_config = ConfigDict(arbitrary_types_allowed=True)

#########################################

class PortfolioTotals(BaseModel):
    invested: float = Field(ge=0)
    current_value: float = Field(ge=0)
    interest: float = Field(ge=0)
    profit: float
    roi: float
    annualized_roi: float
    allocation: dict[str, float]
    instrument_data: list[CurrentInstrumentData]
    instrument_data_aggregated: list[CurrentInstrumentData]

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

    # asset: Asset #
    # quantity: float #
    # avg_price_currency: float #
    # avg_price_pln: float #
    # current_price: float #
    # current_price_datetime: datetime #
    # current_value_pln: float #
    # profit_loss_pln: float #
    # fx_rate: float #
    # fx_effective_rate: float #
    # fx_datetime: datetime #
    # roi_percent: float #
    # annualized_roi: float #
    # transactions: List[TransactionData]
    # open_positions: List[OpenPosition]
    # closed_positions: List[ClosedPosition]
    # realized_profit_pln: float #
    # unrealized_profit_pln: float #
    # interest_profit_pln: float #

class DashboardResponse(BaseModel):
    totals: PortfolioTotals
    asset_data: List[AssetData]
