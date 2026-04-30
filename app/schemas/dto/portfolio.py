from pydantic import BaseModel, Field, ConfigDict
from datetime import datetime
from typing import Optional
from ..database.asset import Asset
# from ..domain.types import MoneyAmount, AssetQuantity, PercentTotal, PercentAnnual, FXRate
from ..domain.positions import OpenPosition, ClosedPosition
from ..domain.transactions import TransactionType

class CurrentInstrumentData(BaseModel):
    model_config = ConfigDict(arbitrary_types_allowed=True)


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

class AssetData(BaseModel):
    
    model_config = ConfigDict(arbitrary_types_allowed=True)

    asset: Asset
    quantity: float
    avg_price_currency: float
    avg_price_pln: float
    current_price: float
    current_price_datetime: datetime
    current_value_pln: float
    profit_loss_pln: float
    fx_rate: float
    fx_effective_rate: float
    fx_datetime: datetime
    roi_percent: float
    annualized_roi: float
    transactions: list[TransactionData]
    open_positions: list[OpenPosition]
    closed_positions: list[ClosedPosition]
    realized_profit_pln: float
    unrealized_profit_pln: float
    interest_profit_pln: float
