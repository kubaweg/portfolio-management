from pyxirr import xirr
from datetime import datetime
from typing import List, Dict, Any

from typing import List, Dict, Any

class TransactionProcessor:
    """
    Klasa odpowiedzialna za przetwarzanie historii transakcji i wyliczanie statystyk.
    Implementuje logikę "Lowest-In, First-Out" (LOFO) dla sprzedaży.
    """
    
    def __init__(self):
        # Stan początkowy
        self.stats = {
            'qty': 0.0, 
            'cost_pln': 0.0, 
            'cost_curr': 0.0, 
            'capitalization': 0.0, 
            'interest': 0.0
        }
        # Lista do śledzenia poszczególnych transz zakupowych
        self.buy_lots = []

    def process(self, transactions: List[Any]) -> Dict[str, float]:
        """Główna metoda procesująca listę transakcji."""
        for t in transactions:
            if t.transaction_type == 'KUPNO':
                self._handle_buy(t)
            elif t.transaction_type == 'SPRZEDAŻ':
                self._handle_sell(t)
            elif t.transaction_type == 'KAPITALIZACJA':
                self._handle_capitalization(t)
            elif t.transaction_type == 'ODSETKI':
                self._handle_interest(t)
            else:
                # Opcjonalnie: logowanie nieznanego typu transakcji
                pass

        return self._calculate_final_stats()

    def _handle_buy(self, t: Any) -> None:
        """Dodaje nową transzę do magazynu."""
        self.buy_lots.append({
            'qty': float(t.quantity),
            'price_curr': float(t.price_per_unit),
            'rate': float(t.exchange_rate)
        })

    def _handle_sell(self, t: Any) -> None:
        """Zdejmuje z magazynu najtańsze dostępne transze (LOFO)."""
        qty_to_sell = float(t.quantity)
        current_qty = sum(lot['qty'] for lot in self.buy_lots)
        
        # Zabezpieczenie przed ujemnym wolumenem
        qty_to_sell = min(qty_to_sell, current_qty)
        
        if qty_to_sell <= 0:
            return

        # Sortujemy transze rosnąco po cenie zakupu
        self.buy_lots.sort(key=lambda x: x['price_curr'])
        
        for lot in self.buy_lots:
            if qty_to_sell <= 0:
                break
            
            if lot['qty'] > 0:
                sold_from_lot = min(lot['qty'], qty_to_sell)
                lot['qty'] -= sold_from_lot
                qty_to_sell -= sold_from_lot
        
        # Czyszczenie pustych transz (zabezpieczenie przed float precision)
        self.buy_lots = [lot for lot in self.buy_lots if lot['qty'] > 1e-8]

    def _handle_capitalization(self, t: Any) -> None:
        """Dodaje wartość do ogólnej kapitalizacji."""
        self.stats['capitalization'] += float(t.quantity * t.price_per_unit * t.exchange_rate)

    def _handle_interest(self, t: Any) -> None:
        """Dodaje wartość do ogólnych odsetek."""
        self.stats['interest'] += float(t.quantity * t.price_per_unit * t.exchange_rate)

    def _calculate_final_stats(self) -> Dict[str, float]:
        """Podsumowuje to, co ostatecznie zostało w magazynie."""
        self.stats['qty'] = sum(lot['qty'] for lot in self.buy_lots)
        self.stats['cost_curr'] = sum(lot['qty'] * lot['price_curr'] for lot in self.buy_lots)
        self.stats['cost_pln'] = sum(lot['qty'] * lot['price_curr'] * lot['rate'] for lot in self.buy_lots)
        
        return self.stats