from pydantic import BaseModel, Field, ConfigDict
from datetime import datetime
from typing import Optional
from ..database.asset import Asset
from ..domain.types import MoneyAmount, AssetQuantity, PercentTotal, PercentAnnual, FXRate
from ..domain.positions import OpenPosition, ClosedPosition
from ..domain.transactions import TransactionType

CurrentInstrumentData = dict

class PortfolioTotals(BaseModel):
    invested: float = Field(ge=0)
    current_value: float = Field(ge=0)
    interest: float = Field(ge=0)
    profit: float
    roi: PercentTotal
    annualized_roi: PercentAnnual
    allocation: dict[str, float]
    instrument_data: list[CurrentInstrumentData]
    instrument_data_aggregated: list[CurrentInstrumentData]

class TransactionData(BaseModel):
    timestamp: datetime
    type: TransactionType
    quantity: AssetQuantity
    price: MoneyAmount
    fx_rate: FXRate
    roi: PercentTotal

class AssetData(BaseModel):
    
    model_config = ConfigDict(arbitrary_types_allowed=True)

    asset: Asset
    quantity: AssetQuantity
    avg_price_currency: MoneyAmount
    avg_price_pln: MoneyAmount
    current_price: MoneyAmount
    current_price_datetime: datetime
    current_value_pln: MoneyAmount
    profit_loss_pln: MoneyAmount
    fx_rate: FXRate
    fx_effective_rate: FXRate
    fx_datetime: datetime
    roi_percent: PercentTotal
    annualized_roi: PercentAnnual
    transactions: list[TransactionData]
    open_positions: list[OpenPosition]
    closed_positions: list[ClosedPosition]
    realized_profit_pln: MoneyAmount
    unrealized_profit_pln: MoneyAmount
    interest_profit_pln: MoneyAmount
