from pyxirr import xirr
from datetime import datetime
from typing import List, Dict, Any

def process_transaction_history(transactions: List[Any]) -> Dict[str, float]:
    """
    Oblicza sumaryczne wartości (ilość, koszty) z historii transakcji.
    Implementuje logikę średniego kosztu zakupu.
    """
    res = {'qty': 0.0, 'cost_pln': 0.0, 'cost_curr': 0.0, 'capitalization': 0.0, 'interest': 0.0}
    
    for t in transactions:
        if t.transaction_type == 'KUPNO':
            res['qty'] += t.quantity
            res['cost_curr'] += (t.quantity * t.price_per_unit)
            res['cost_pln'] += (t.quantity * t.price_per_unit * t.exchange_rate)
            
        elif t.transaction_type == 'SPRZEDAZ':
            if res['qty'] > 0:
                # Obliczamy średni koszt jednostkowy w momencie sprzedaży
                avg_c_curr = res['cost_curr'] / res['qty']
                avg_c_pln = res['cost_pln'] / res['qty']
                
                res['qty'] -= t.quantity
                res['cost_curr'] -= t.quantity * avg_c_curr
                res['cost_pln'] -= t.quantity * avg_c_pln
                
        elif t.transaction_type == 'KAPITALIZACJA':
            res['capitalization'] += (t.quantity * t.price_per_unit * t.exchange_rate)
            
        elif t.transaction_type == 'ODSETKI':
            res['interest'] += (t.quantity * t.price_per_unit * t.exchange_rate)
            
    return res

def calculate_annualized_return(transactions: List[Any], current_value_pln: float, total_qty: float) -> float:
    """Oblicza XIRR dla strumienia przepływów pieniężnych (całe portfolio lub ticker)."""
    amounts = []
    dates = []

    for t in transactions:
        val_pln = t.quantity * t.price_per_unit * t.exchange_rate
        
        if t.transaction_type == 'KUPNO':
            amounts.append(-val_pln) # Pieniądze wychodzą z portfela
            dates.append(t.date)
        elif t.transaction_type in ['SPRZEDAZ', 'ODSETKI', 'KAPITALIZACJA']:
            # Pieniądze wracają do portfela (zrealizowany zysk/kapitał)
            amounts.append(val_pln)
            dates.append(t.date)

    # Dodajemy końcową wycenę wszystkiego, co jeszcze trzymamy
    if current_value_pln > 0:
        amounts.append(current_value_pln)
        dates.append(datetime.now())

    if len(amounts) >= 2:
        try:
            # XIRR wymaga co najmniej jednej wartości ujemnej i jednej dodatniej
            if any(x < 0 for x in amounts) and any(x > 0 for x in amounts):
                result = xirr(dates, amounts)
                return result if result else 0.0
        except Exception:
            return 0.0
    return 0.0