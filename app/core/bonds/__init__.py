from enum import Enum
from dataclasses import dataclass
from datetime import date
from typing import Optional

class PeriodStatus(Enum):
    PAST = "PAST"
    CURRENT = "CURRENT"
    FUTURE = "FUTURE"

class EarlyRedemptionType(Enum):
    FORFEIT_INTEREST = "FORFEIT_INTEREST"
    FEE = "FEE"

@dataclass
class BondInputParams:

    quantity: int

    retail_series_type: str
    issue_date: date
    maturity_date: date
    nominal_value: float
    interest_handling: str
    coupon_frequency: int
    initial_rate: float
    is_indexed: bool
    margin: float
    benchmark: str
    early_redemption_type: EarlyRedemptionType
    early_redemption_penalty: float

@dataclass
class EarlyRedemptionSimulation:
    calculation_date: date
    gross_payout: float
    fee_applied: float
    tax_applied: float
    net_payout: float

@dataclass
class BondInterestPeriod:
    period_number: int
    start_date: date
    end_date: date
    status: PeriodStatus
    base_capital: float
    interest_rate: float
    is_rate_estimated: bool
    benchmark_value: Optional[float]
    margin: float
    gross_interest: float
    is_capitalized: bool
    ending_capital: float
    days_elapsed: Optional[int]
    days_total: int
    accrued_interest_to_date: Optional[float]
    early_redemption: Optional[EarlyRedemptionSimulation]

@dataclass
class BondAssetSummary:
    bond_symbol: str
    total_invested: float
    current_working_capital: float
    realized_profit_gross: float
    realized_profit_net: float
    unrealized_profit_gross: float
    unrealized_profit_net: float
    total_profit_net: float
    current_value: float
    current_early_redemption_value: float
    current_interest_rate: float
    roi_net: float
    annualized_roi_net: float
    days_to_maturity: int
    overall_progress_percent: float
    projected_total_gross_profit: float
    projected_total_net_profit: float
    projected_maturity_payout: float

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