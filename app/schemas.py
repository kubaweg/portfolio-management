from typing import NewType, List, Dict, Any
from pydantic import BaseModel, Field, ConfigDict
from datetime import datetime

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

class TransactionStats(BaseModel):
    """Statystyki z historii transakcji."""
    model_config = ConfigDict(frozen=True)

    quantity: AssetQuantity = Field(default=AssetQuantity(0.0))
    cost_pln: PLN = Field(default=PLN(0.0))
    cost_currency: CurrencyForeign = Field(default=CurrencyForeign(0.0))
    capitalization: PLN = Field(default=PLN(0.0))
    interest: PLN = Field(default=PLN(0.0))

class MarketQuote(BaseModel):
    """Cena rynkowa i kurs waluty."""
    price: CurrencyForeign = Field(...)
    fx_rate: FXRate = Field(default=FXRate(1.0))
    as_of: datetime = Field(default_factory=datetime.now)