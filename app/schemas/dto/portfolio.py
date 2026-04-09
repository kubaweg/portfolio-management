from pydantic import BaseModel, Field, ConfigDict
from datetime import datetime
from typing import Optional
from ..models import Asset
from ..domain.types import PLN, CurrencyForeign, PercentTotal, PercentAnnual, AssetQuantity, FXRate
from ..domain.positions import OpenPosition, ClosedPosition

CurrentInstrumentData = dict

class PortfolioTotals(BaseModel):
    invested: PLN = Field(ge=0)
    current_value: PLN = Field(ge=0)
    interest: PLN = Field(ge=0)
    profit: PLN
    roi: PercentTotal
    annualized_roi: PercentAnnual
    allocation: dict[str, PLN]
    instrument_data: list[CurrentInstrumentData]

class TransactionData(BaseModel):
    date: datetime
    transaction_type: str
    quantity: AssetQuantity
    price_per_unit: PLN | CurrencyForeign
    exchange_rate: FXRate
    roi: PercentTotal

class AssetData(BaseModel):
    model_config = ConfigDict(arbitrary_types_allowed=True)

    asset: Asset
    quantity: AssetQuantity
    avg_price_currency: CurrencyForeign
    avg_price_pln: PLN
    current_price: CurrencyForeign
    current_price_datetime: datetime
    current_value_pln: PLN
    profit_loss_pln: PLN
    fx_rate: FXRate
    fx_effective_rate: FXRate
    fx_datetime: datetime
    roi_percent: PercentTotal
    annualized_roi: PercentAnnual
    transactions: list[TransactionData]
    open_positions: list[OpenPosition]
    closed_positions: list[ClosedPosition]
    realized_profit_pln: float
    unrealized_profit_pln: float
