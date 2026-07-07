import numpy as np
from typing import List, Optional
from app.core.cash.schemas.dto import CashFlowInstance

class XIRRCalculator:
    """
    Kalkulator Zannualizowanej Stopy Zwrotu (XIRR) wykorzystujący
    wektoryzację numpy dla zoptymalizowania obliczeń numerycznych.
    """
    
    def calculate(self, instances: List[CashFlowInstance], guess: float = 0.1) -> Optional[float]:
        """Metoda główna przygotowująca dane z obiektów domenowych pod obliczenia macierzowe."""
        # Odfiltrowanie mikroskopijnych przepływów
        clean_flows = [cf for cf in instances if abs(cf.value) > 1e-4]
        
        if len(clean_flows) < 2:
            return None

        # Weryfikacja warunku koniecznego: przynajmniej jeden wydatek i jeden przychód
        has_negative = any(cf.value < 0 for cf in clean_flows)
        has_positive = any(cf.value > 0 for cf in clean_flows)
        if not (has_negative and has_positive):
            return None

        # Sortowanie i wyznaczenie daty bazowej (t0)
        sorted_flows = sorted(clean_flows, key=lambda x: x.date)
        t0 = sorted_flows[0].date

        # Ekstrakcja danych do tablic numpy
        values = np.array([cf.value for cf in sorted_flows], dtype=np.float64)
        years = np.array([(cf.date - t0).days / 365.0 for cf in sorted_flows], dtype=np.float64)

        return self._numpy_xirr(values, years, guess)

    def _numpy_xirr(self, values: np.ndarray, years: np.ndarray, guess: float = 0.1, max_iters: int = 100) -> Optional[float]:
        """Faktyczny silnik obliczeniowy wektoryzujący metodę Newtona-Raphsona."""
        r = guess
        f_val = 0.0
        
        for _ in range(max_iters):
            # Zabezpieczenie przed spadkiem poniżej stopy -100%
            r = max(r, -0.9999)
            
            rate_factor = 1.0 + r
            # Wektor czynników dyskontujących: (1 + r)^t
            discount_factors = rate_factor ** years
            
            # Wartość funkcji NPV (suma zdyskontowanych przepływów)
            f_val = np.sum(values / discount_factors)
            
            # Pochodna funkcji NPV po stopie 'r'
            # Wzór analityczny: -t * V / (1+r)^(t+1)
            f_deriv = np.sum(-years * values / (discount_factors * rate_factor))

            if abs(f_deriv) < 1e-12:
                break
                
            step = f_val / f_deriv
            r -= step

            # Kryterium stopu i progi tolerancji wyniku
            if abs(step) < 1e-6:
                if -0.99 < r < 100.0:
                    return float(r)
                return None
                
        if abs(f_val) < 1e-3 and -0.99 < r < 100.0:
            return float(r)
            
        return None