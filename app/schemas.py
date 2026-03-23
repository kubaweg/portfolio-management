from typing import NewType, List, Dict, Any
from pydantic import BaseModel, Field, ConfigDict
from datetime import datetime
from models import Asset

# --- FILAR 2: TYPY DOMENOWE (Domain-Driven Types) ---

# Waluty
PLN = NewType('PLN', float)
CurrencyForeign = NewType('CurrencyForeign', float)

# Procenty (rozdzielone logicznie)
PercentTotal = NewType('PercentTotal', float)   # Całkowity zwrot (np. 15.5%)
PercentAnnual = NewType('PercentAnnual', float) # Stopa roczna p.a. (np. 8.2%)

# Wolumen
AssetQuantity = NewType('AssetQuantity', float)

# Kursy walut
FXRate = NewType('FXRate', float)

# --- MOLEKUŁY: Modele Pydantic korzystające z tych typów ---

class CurrentInstrumentData(BaseModel):
    label: str
    value: PLN
    type: str

class PortfolioTotals(BaseModel):
    """Statystyki z historii transakcji."""
    invested: PLN = Field(ge=0)
    current_value: PLN = Field(ge=0)
    interest: PLN = Field(ge=0)
    profit: PLN
    roi: PercentTotal
    allocation: dict[str, PLN]
    instrument_data: list[CurrentInstrumentData]

class AssetData(BaseModel):
    asset: Asset
    quantity: AssetQuantity
    avg_price_currency: CurrencyForeign
    avg_price_pln: PLN
    current_price: CurrencyForeign
    current_value_pln: PLN
    profit_loss_pln: PLN
    fx_rate: FXRate
    fx_effective_rate: FXRate
    roi_percent: PercentTotal
    annualized_roi: PercentAnnual
    transactions: Any

PortfolioData = NewType('PortfolioData', list)