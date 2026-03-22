from typing import List, Tuple, Dict, Any
from .market_data import MarketDataProvider
from .calculators import process_transaction_history, calculate_annualized_return

class PortfolioEngine:
    """
    Główny silnik portfela. 
    Łączy dane z bazy, ceny rynkowe i kalkulatory w spójny raport.
    """
    
    CONVERSION_FEE = 0.005  # 0.5% prowizji na kursie (reguła biznesowa)

    def get_portfolio_summary(self, assets: List[Any]) -> Tuple[List[Dict[str, Any]], Dict[str, Any]]:
        """Buduje kompletny zestaw danych do Dashboardu."""
        portfolio_data = []
        totals = {
            'invested': 0.0,
            'current_value': 0.0,
            'interest': 0.0,
            'allocation': {},
            'instrument_data': []
        }

        for asset in assets:
            # 1. Wyciągamy czystą historię (Calculators)
            stats = process_transaction_history(asset.transactions)
            
            # 2. Pobieramy ceny (Market Data)
            # Jeśli nie mamy ceny, fallback to średni koszt zakupu
            fallback = (stats['cost_curr'] / stats['qty']) if stats['qty'] > 0 else 0
            curr_price = MarketDataProvider.get_asset_price(asset.ticker, asset.asset_type, fallback)
            fx_rate = MarketDataProvider.get_fx_rate(asset.currency)
            
            # 3. Logika biznesowa (Przewalutowanie i Prowizje)
            effective_fx = fx_rate * (1 - self.CONVERSION_FEE) if asset.currency != 'PLN' else 1.0
            
            # Wycena końcowa
            market_value_pln = (stats['qty'] * curr_price * effective_fx) + stats['capitalization']
            profit_pln = (market_value_pln + stats['interest']) - stats['cost_pln']
            
            # Prosta stopa zwrotu
            roi = (profit_pln / stats['cost_pln']) if stats['cost_pln'] > 0 else 0
            
            # Roczna stopa zwrotu (XIRR)
            ann_roi = calculate_annualized_return(asset.transactions, market_value_pln, stats['qty'])

            # 4. Pakowanie danych pojedynczego aktywa
            portfolio_data.append({
                'asset': asset,
                'quantity': stats['qty'],
                'avg_price_currency': (stats['cost_curr'] / stats['qty']) if stats['qty'] > 0 else 0,
                'avg_price_pln': (stats['cost_pln'] / stats['qty']) if stats['qty'] > 0 else 0,
                'current_price': curr_price,
                'current_value_pln': market_value_pln,
                'profit_loss_pln': profit_pln,
                'fx_rate': fx_rate,
                'fx_effective_rate': effective_fx,
                'roi_percent': roi * 100,
                'annualized_roi': ann_roi * 100,
                'transactions': asset.transactions
            })

            # 5. Agregacja do sum całkowitych
            self._update_totals(totals, asset, market_value_pln, stats)

        # Końcowe obliczenia dla całego portfela
        totals['profit'] = (totals['current_value'] + totals['interest']) - totals['invested']
        totals['roi'] = (totals['profit'] / totals['invested']) if totals['invested'] > 0 else 0
        
        return portfolio_data, totals

    def _update_totals(self, totals: Dict[str, Any], asset: Any, market_value_pln: float, stats: Dict[str, float]):
        """Pomocnicza metoda do aktualizacji sumarycznych statystyk."""
        totals['invested'] += stats['cost_pln']
        totals['current_value'] += market_value_pln
        totals['interest'] += stats['interest']

        if market_value_pln > 0:
            a_type = asset.asset_type or 'Inne'
            totals['allocation'][a_type] = totals['allocation'].get(a_type, 0) + market_value_pln
            
            totals['instrument_data'].append({
                'label': asset.ticker,
                'value': market_value_pln,
                'type': a_type
            })