from pydantic import BaseModel
from typing import List, Optional

class ChartDataPoint(BaseModel):
    date: str
    open: float
    high: float
    low: float
    close: float

class VolumeDataPoint(BaseModel):
    date: str
    volume: int

class ChartTransactionPoint(BaseModel):
    date: str
    type: str
    quantity: float
    price: float

class ChartResponse(BaseModel):
    ticker: str
    period: str
    historical_data: List[ChartDataPoint]
    historical_volume: List[VolumeDataPoint]
    avg_price: Optional[float] = None
    transactions: List[ChartTransactionPoint]
