from pydantic import BaseModel
from .types import AssetQuantity, MoneyAmount, FXRate

class OpenPosition(BaseModel):
    ticker: str
    quantity: AssetQuantity
    value_buy: MoneyAmount
    fx_buy: FXRate  # historyczny FX
    current_value: MoneyAmount
    unrealized_profit: MoneyAmount
    unrealized_profit_pln: MoneyAmount


class ClosedPosition(BaseModel):
    ticker: str
    quantity: AssetQuantity
    value_buy: MoneyAmount
    value_sell: MoneyAmount
    fx_buy: FXRate
    fx_sell: FXRate
    realized_profit: MoneyAmount
    realized_profit_pln: MoneyAmount

