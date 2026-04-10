from pydantic import BaseModel

class OpenPosition(BaseModel):
    ticker: str
    quantity: float
    cost: float
    fx_rate: float  # historyczny FX
    current_value: float
    unrealized_profit: float
    unrealized_profit_pln: float


class ClosedPosition(BaseModel):
    ticker: str
    quantity: float
    cost: float
    proceeds: float
    fx_buy: float
    fx_sell: float
    realized_profit: float
    realized_profit_pln: float

