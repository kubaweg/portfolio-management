import numpy as np
from datetime import date
from typing import List
from pydantic import BaseModel, Field
from app.schemas.domain.positions import OpenPosition, ClosedPosition

class CashFlowInstance(BaseModel):
    date: date
    value: float
    fx_rate: float

def _npv(rate: float, amounts: np.ndarray, times: np.ndarray) -> float:
    """Oblicza NPV (Net Present Value) dla danej stopy procentowej."""
    return np.sum(amounts / (1 + rate) ** times)

def _npv_derivative(rate: float, amounts: np.ndarray, times: np.ndarray) -> float:
    """Oblicza pochodną NPV (używana w metodzie Newtona)."""
    # Pochodna z P / (1+r)^t wynosi -P * t * (1+r)^(-t-1)
    return np.sum(-amounts * times / ((1 + rate) ** (times + 1)))

def calculate_xirr(amounts: List[float], dates: List[date], guess: float = 0.10) -> float:
    """
    Oblicza XIRR przy użyciu metody Newtona-Raphsona i surowego numpy.
    """
    # Przygotowanie danych
    amounts = np.array(amounts)                         # type: ignore
    dates = np.array(dates)                             # type: ignore
    
    # 1. Znajdź najwcześniejszą datę
    min_date = np.min(dates) # type: ignore
    
    # 2. Oblicz różnice (wynikiem są obiekty timedelta)
    deltas = dates - min_date
    
    # 3. Wyciągnij liczbę dni z każdego obiektu timedelta i zamień na float
    # List comprehension jest tu najbezpieczniejszym i najbardziej czytelnym sposobem
    delta_days = np.array([d.days for d in deltas], dtype=float)
    
    # Przelicz na lata
    times = delta_days / 365.0
    
    # Metoda Newtona
    rate = guess
    max_iter = 30
    tolerance = 1e-7
    
    for _ in range(max_iter):

        f = _npv(rate, amounts, times)                      # type: ignore
        f_prime = _npv_derivative(rate, amounts, times)     # type: ignore
        
        if abs(f_prime) < 1e-10: # Unikamy dzielenia przez zero
            return 0.0
            
        new_rate = np.max([rate - f / f_prime, -0.9999])
        
        if abs(new_rate - rate) < tolerance:
            return new_rate
            
        rate = new_rate
        
    return rate # Jeśli nie zbiegło się, zwracamy ostatnią próbę

# Model pod output
class AnnualizedRoiOutput(BaseModel):
    roi_pa: float = Field(default=0.0, description='Stopa zwrotu w skali roku w walucie instrumentu')
    roi_pa_pln: float = Field(default=0.0, description='Stopa zwrotu w skali roku w PLN')

def calculate_annualized_roi(open_positions: List[OpenPosition], closed_positions: List[ClosedPosition]) -> AnnualizedRoiOutput:
    """
    Główna funkcja wyciągająca dane z modeli i wywołująca XIRR.
    """
    cash_flows = []
    today = date.today()

    # Pozycje zamknięte: zakup (-) i sprzedaż (+)
    for pos in closed_positions:
        cash_flows.append(CashFlowInstance(date=pos.date_buy, value=-pos.value_buy, fx_rate=pos.fx_buy))
        cash_flows.append(CashFlowInstance(date=pos.date_sell, value=pos.value_sell, fx_rate=pos.fx_sell))

    # Pozycje otwarte: zakup (-) i wycena bieżąca (+)
    for pos in open_positions:
        cash_flows.append(CashFlowInstance(date=pos.date_buy, value=-pos.value_buy, fx_rate=pos.fx_buy))
        cash_flows.append(CashFlowInstance(date=today, value=pos.current_value, fx_rate=pos.fx_current)) # na razie, dopóki nie dodamy current_fx do OpenPosition

    if len(cash_flows) < 2:
        return AnnualizedRoiOutput(roi_pa=0.0, roi_pa_pln=0.0)

    # Sortowanie chronologiczne
    cash_flows.sort(key=lambda cfi: cfi.date)
    
    dates = [cf.date for cf in cash_flows]
    amounts = [cf.value for cf in cash_flows]
    amounts_pln = [cf.value * cf.fx_rate for cf in cash_flows]
    
    return AnnualizedRoiOutput(
        roi_pa=calculate_xirr(amounts, dates), 
        roi_pa_pln=calculate_xirr(amounts_pln, dates)
    )