from pydantic import BaseModel

class OpenPosition(BaseModel):
    ticker: str
    quantity: float
    cost: float
    fx_rate: float  # historyczny FX
    current_value: float
    unrealized_profit: float

class ClosedPosition(BaseModel):
    ticker: str
    quantity: float
    cost: float
    proceeds: float
    realized_profit: float
