from enum import Enum
from datetime import date
from typing import List, Optional
from pydantic import BaseModel, Field
from .assets import RetailBondBenchmark, CouponFrequency, InterestHandling

# Model wejściowy dla konkretnego aktywa w portfelu
class BondAsset(BaseModel):
    symbol: str = Field(..., description="np. EDO0434, DOR0526")

    issue_date: date
    maturity_date: date

    nominal_value: float

    interest_handling: InterestHandling
    coupon_frequency: CouponFrequency

    initial_rate: float = Field(..., description="Oprocentowanie w pierwszym okresie (często promocyjne/stałe)")

    is_indexed: bool
    margin: float = Field(0.0, description="Marża ponad wskaźnik (np. 1.50)")
    benchmark: Optional[RetailBondBenchmark]

    early_redemption_penalty: float
    
# Model pojedynczego okresu odsetkowego
class InterestPeriod(BaseModel):
    period_number: int
    start_date: date
    end_date: date
    rate: float
    benchmark_value_used: Optional[float] = None
    is_future: bool = Field(..., description="Czy ten okres dotyczy przyszłości?")

# Model wyjściowy (np. do przesłania na front-end)
class BondRateStream(BaseModel):
    symbol: str
    periods: List[InterestPeriod]
    current_rate: Optional[float] = Field(None, description="Oprocentowanie w trwającym obecnie okresie")