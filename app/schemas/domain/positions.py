from pydantic import BaseModel, Field
from datetime import date

class OpenPosition(BaseModel):
    ticker: str
    quantity: float
    date_buy: date

    value_buy: float = Field(ge=0.0)
    current_value: float = Field(ge=0.0)

    fx_buy: float = Field(ge=0.0) # historyczny FX
    fx_current: float = Field(ge=0.0)
    fx_percentage_impact: float

    unrealized_profit: float
    roi_unrealized: float = Field(default=0.0)
    roi_unrealized_pa: float = Field(default=0.0)

    unrealized_profit_pln: float
    roi_unrealized_pln: float = Field(default=0.0)
    roi_unrealized_pa_pln: float = Field(default=0.0)


class ClosedPosition(BaseModel):
    ticker: str
    quantity: float = Field(ge=0.0)

    date_buy: date
    date_sell: date

    value_buy: float = Field(ge=0.0)
    value_sell: float = Field(ge=0.0)

    fx_buy: float = Field(ge=0.0)
    fx_sell: float = Field(ge=0.0)
    fx_percentage_impact: float

    realized_profit: float
    roi_realized: float = Field(default=0.0)
    roi_realized_pa: float = Field(default=0.0)
    
    realized_profit_pln: float
    roi_realized_pln: float = Field(default=0.0)
    roi_realized_pa_pln: float = Field(default=0.0)

