from pydantic import BaseModel
# from .types import AssetQuantity, MoneyAmount, FXRate

class OpenPosition(BaseModel):
    ticker: str
    quantity: float
    value_buy: float
    fx_buy: float  # historyczny FX
    current_value: float
    unrealized_profit: float
    unrealized_profit_pln: float


class ClosedPosition(BaseModel):
    ticker: str
    quantity: float
    value_buy: float
    value_sell: float
    fx_buy: float
    fx_sell: float
    realized_profit: float
    realized_profit_pln: float

