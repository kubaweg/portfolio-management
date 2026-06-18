from enum import Enum
from datetime import date
from pydantic import BaseModel
from typing import Optional, List

from backend.schemas.domain.assets import (
    Category1, Category2, AssetType
)

from backend.schemas.domain.bonds import (
    CouponFrequency, InterestHandling
)

class PeriodStatus(Enum):
    PAST = "PAST"
    CURRENT = "CURRENT"
    FUTURE = "FUTURE"

class EarlyRedemptionType(Enum):
    FORFEIT_INTEREST = "FORFEIT_INTEREST"
    FEE = "FEE"


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


#############################################
# Modele do obsługi standardowego outputu z silnika obligacji

class BondInputParams(BaseModel):

    quantity: float

    retail_series_type: str
    issue_date: date
    maturity_date: date
    nominal_value: float
    interest_handling: str
    coupon_frequency: int
    initial_rate: float
    is_indexed: bool
    margin: float
    benchmark: Optional[str]
    early_redemption_type: EarlyRedemptionType
    early_redemption_penalty: float

class BondBaseData(BaseModel):

    ticker: str
    name: str
    category1: Category1
    category2: Category2
    type: AssetType
    issue_date: date
    maturity_date: date
    nominal_value: float
    interest_handling: InterestHandling
    coupon_frequency: CouponFrequency
    initial_rate: float
    is_indexed: bool
    margin: float
    benchmark: Optional[str]
    early_redemption_type: EarlyRedemptionType
    early_redemption_penalty: float

class BondInterestPeriod(BaseModel):
    period_number: int
    start_date: date
    end_date: date
    status: PeriodStatus
    base_capital: float
    base_capital_per_bond: float
    interest_rate: float
    is_rate_estimated: bool
    benchmark_value: float
    margin: float
    gross_interest: float
    gross_interest_per_bond: float
    is_capitalized: bool
    ending_capital: float
    ending_capital_per_bond: float
    days_elapsed: Optional[int]
    days_total: int
    accrued_interest_to_date: float

class BondAssetSummary(BaseModel):
    quantity: float
    total_invested: float
    current_working_capital: float
    realized_profit_pln_gross: float
    realized_profit_pln_net: float
    unrealized_profit_pln_gross: float
    unrealized_profit_pln_net: float
    current_value: float
    current_interest_rate: float
    roi_gross: float
    roi_net: float
    annualized_roi_net: float
    days_to_maturity: int
    overall_progress_percent: float

class BondData(BaseModel):
    base_data: BondBaseData
    summary: BondAssetSummary
    periods: List[BondInterestPeriod]


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

def map_frequency_to_months(freq_enum_value: str) -> int:
    """Zmienia string z Enuma na liczbę miesięcy dla funkcji relativedelta."""
    mapping = {
        "Co miesiąc": 1,
        "Co kwartał": 3,
        "Co pół roku": 6,
        "Co roku": 12,
        "Przy wykupie": 0
    }
    return mapping.get(freq_enum_value, 12)