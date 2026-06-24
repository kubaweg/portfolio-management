from enum import Enum
from datetime import date, datetime
from pydantic import BaseModel, Field
from typing import Optional, List

from app.schemas.domain.assets import (
    Category1, Category2, AssetType
)

from app.schemas.domain.bonds import (
    CouponFrequency, InterestHandling
)

from app.schemas.domain.positions import (
    OpenPosition, ClosedPosition
)

class PeriodStatus(Enum):
    PAST = "PAST"
    CURRENT = "CURRENT"
    FUTURE = "FUTURE"

class EarlyRedemptionType(Enum):
    FORFEIT_INTEREST = "FORFEIT_INTEREST"
    FEE = "FEE"

class BondCashFlowType(Enum):
    BUY = "BUY"
    INTEREST = "INTEREST"
    EARLY_REDEMPTION = "EARLY_REDEMPTION"
    BOND_EXCHANGE = "BOND_EXCHANGE"


#############################################
# Modele do obsługi przedterminowego wykupu

class PerBondRedemptionMetrics(BaseModel):
    nominal: float
    accrued_interest: float
    penalty_applied: float
    gross_payout: float
    tax_applied: float
    net_payout: float

class TotalRedemptionMetrics(BaseModel):
    quantity: float
    gross_payout: float
    total_penalty: float
    total_tax: float
    net_payout: float

class EarlyRedemptionSimulation(BaseModel):
    redemption_date: date
    per_bond: PerBondRedemptionMetrics
    total: TotalRedemptionMetrics

class BondEarlyRedemption(BaseModel):
    # Data operacji przedterminowego wykupu
    redemption_date: date
    
    # Liczba sztuk (obligacji) podlegających wycofaniu
    quantity: float = Field(ge=0.0)
    
    # Metoda naliczania kary: używamy istniejącego już u Ciebie enuma EarlyRedemptionType
    # przyjmującego wartości odpowiadające m.in. FORFEIT_INTEREST lub FEE
    penalty_method: EarlyRedemptionType
    
    # Wysokość kary potrącanej z odsetek za 1 sztukę obligacji (np. 0.70 PLN dla COI lub 2.00 PLN dla EDO)
    penalty_per_unit: float = Field(ge=0.0)

#############################################
# Modele do obsługi standardowego outputu z silnika obligacji

class BondBaseData(BaseModel):

    ticker: str
    name: str
    category1: Category1
    category2: Category2
    type: AssetType
    issue_date: date
    maturity_date: date
    nominal_value: float = Field(ge=0.0)
    interest_handling: InterestHandling
    coupon_frequency: CouponFrequency
    initial_rate: float = Field(ge=0.0)
    is_indexed: bool
    margin: float = Field(ge=0.0)
    benchmark: Optional[str]
    early_redemption_type: EarlyRedemptionType
    early_redemption_penalty: float = Field(ge=0.0)

class BondCurrentData(BaseModel):
    # Bieżąca wycena jednej sztuki obligacji (nominał + narosłe odsetki)
    price: float = Field(ge=0)
    interest_rate: float = Field(ge=0.0, default=0.0)

    # Całkowita bieżąca wartość posiadanego pakietu (quantity * price)
    interest_pln: float = Field(ge=0)
    value_pln: float = Field(ge=0)

    # Moment przeliczenia wyceny
    price_datetime: datetime

class BondCashFlowInstance(BaseModel):
    type: BondCashFlowType
    date: date
    value: float

class BondInterestPeriod(BaseModel):
    period_number: int

    start_date: date
    end_date: date

    status: PeriodStatus
    days_elapsed: Optional[int]
    days_total: int

    interest_rate: float = Field(ge=0)

    is_rate_estimated: bool
    benchmark_value: float = Field(ge=0)
    margin: float = Field(ge=0, default=0.0)
    
    is_capitalized: bool

    base_capital: float = Field(ge=0)
    base_capital_per_bond: float = Field(ge=0)

    gross_interest: float = Field(ge=0)
    gross_interest_per_bond: float = Field(ge=0)

    ending_capital: float = Field(ge=0)
    ending_capital_per_bond: float = Field(ge=0)

    accrued_interest_to_date: float = Field(ge=0)
    accrued_interest_to_date_per_bond: float = Field(ge=0)

class BondSummary(BaseModel):
    quantity: float = Field(ge=0)
    total_invested: float = Field(ge=0)
    
    realized_profit_gross: float
    realized_profit_net: float
    roi_realized_net: float
    roi_realized_pa_net: float
    
    unrealized_profit_gross: float
    unrealized_profit_net: float
    roi_unrealized_net: float
    roi_unrealized_pa_net: float
    
    interest_profit_net: float = Field(ge=0)
    
    total_profit_net: float
    roi_net: float
    roi_pa_net: float
    
    days_to_maturity: int
    overall_progress_percent: float

class BondData(BaseModel):
    base_data: BondBaseData
    current_data: BondCurrentData
    summary: BondSummary

    periods: List[BondInterestPeriod]
    cash_flows: List[BondCashFlowInstance]

    early_redemptions: List[BondEarlyRedemption]

#############################################

class DashboardBondResponse(BaseModel):
    data: List[BondData]


#############################################
# Helper functions

def resolve_early_redemption_type(retail_series_type: str) -> EarlyRedemptionType:
    """
    Określa mechanizm kary za wcześniejszy wykup na podstawie serii obligacji.
    """
    # Zamieniamy na wielkie litery i usuwamy ewentualne cyfry (np. COI1228 -> COI)
    series_prefix = "".join(filter(str.isalpha, retail_series_type.upper()))

    # OTS nie mają opcji wcześniejszego wykupu w standardzie, 
    # ale jeśli nastąpi, przepada cała narosła korzyść.
    if series_prefix == "OTS":
        return EarlyRedemptionType.FORFEIT_INTEREST
        
    # Dla większości pozostałych (ROR, DOR, TOZ, COI, EDO, ROS, ROD) 
    # obowiązuje stała opłata (FEE) określona w liście emisyjnym (np. 1 zł lub 2 zł)
    return EarlyRedemptionType.FEE

def map_frequency_to_months(coupon_frequency: CouponFrequency) -> int:
    """Zmienia string z Enuma na liczbę miesięcy dla funkcji relativedelta."""
    mapping = {
        "Co miesiąc": 12,
        "Co kwartał": 4,
        "Co pół roku": 2,
        "Co roku": 1,
        "Przy wykupie": 0
    }
    return mapping.get(coupon_frequency.value, 12)