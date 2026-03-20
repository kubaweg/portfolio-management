import yfinance as yf
from pyxirr import xirr
from datetime import datetime
import pytz

class PortfolioService:
    CONVERSION_FEE = 0.005  # 0.5% prowizji na kursie

    @staticmethod
    def get_market_data(asset, total_qty, total_cost_currency):
        """Pobiera cenę rynkową i kurs waluty."""
        current_price = 0
        if asset.asset_type == 'Obligacja':
            current_price = 100.0
        else:
            try:
                ticker_yf = yf.Ticker(asset.ticker)
                current_price = ticker_yf.fast_info['lastPrice']
            except:
                current_price = (total_cost_currency / total_qty) if total_qty > 0 else 0
        
        # Pobieranie kursu waluty
        fx_rate = 1.0
        if asset.currency != 'PLN':
            try:
                fx_yf = yf.Ticker(f"{asset.currency}PLN=X")
                fx_rate = fx_yf.fast_info['lastPrice']
            except:
                fx_rate = 1.0
        
        return current_price, fx_rate

    @staticmethod
    def calculate_xirr(transactions, current_value_pln, total_qty):
        """Oblicza roczną stopę zwrotu XIRR."""
        amounts = []
        dates = []

        for t in transactions:
            val_pln = t.quantity * t.price_per_unit * t.exchange_rate
            if t.transaction_type == 'KUPNO':
                amounts.append(-val_pln)
                dates.append(t.date)
            elif t.transaction_type == 'ODSETKI':
                amounts.append(val_pln)
                dates.append(t.date)

        if total_qty > 0:
            amounts.append(current_value_pln)
            dates.append(datetime.now())

        if len(amounts) >= 2:
            try:
                result = xirr(dates, amounts)
                return result if result and abs(result) < 100 else 0
            except:
                return 0
        return 0

    def get_portfolio_summary(self, assets):
        """Główna funkcja budująca dane do Dashboardu."""
        portfolio_data = []
        totals = {
            'invested': 0,
            'current_value': 0,
            'interest': 0,
            'allocation': {},
            'instrument_data': []
        }

        for asset in assets:
            transactions = asset.transactions # Zakładając relację w modelu
            
            # 1. Obliczanie stanów z transakcji
            stats = self._process_transactions(transactions)
            
            # 2. Dane rynkowe
            curr_price, fx_rate = self.get_market_data(asset, stats['qty'], stats['cost_curr'])
            
            # 3. Wyliczenia końcowe
            effective_fx = fx_rate * (1 - self.CONVERSION_FEE) if asset.currency != 'PLN' else 1.0
            market_value_pln = (stats['qty'] * curr_price * effective_fx) + stats['capitalization']
            profit_pln = (market_value_pln + stats['interest']) - stats['cost_pln']
            roi = (profit_pln / stats['cost_pln']) if stats['cost_pln'] > 0 else 0
            
            ann_roi = self.calculate_xirr(transactions, market_value_pln, stats['qty'])

            # 4. Agregacja
            portfolio_data.append({
                'asset': asset,
                'quantity': stats['qty'],
                'avg_price_currency': (stats['cost_curr'] / stats['qty']) if stats['qty'] > 0 else 0,
                'avg_price_pln': (stats['cost_pln'] / stats['qty']) if stats['qty'] > 0 else 0, # <-- DODAJ TĘ LINIĘ
                'current_price': curr_price,
                'current_value_pln': market_value_pln,
                'profit_loss_pln': profit_pln,
                'fx_rate': fx_rate,
                'fx_effective_rate': effective_fx,
                'roi_percent': roi * 100,
                'annualized_roi': ann_roi * 100,
                'transactions': transactions
            })

            totals['invested'] += stats['cost_pln']
            totals['current_value'] += market_value_pln
            totals['interest'] += stats['interest']

            if market_value_pln > 0:
                # Pobieramy typ aktywa (jeśli nie ma, nazywamy 'Inne')
                a_type = asset.asset_type if asset.asset_type else 'Inne'
                # Dodajemy bieżącą wartość do odpowiedniej "szufladki"
                totals['allocation'][a_type] = totals['allocation'].get(a_type, 0) + market_value_pln
                totals['instrument_data'].append({
                    'label': asset.ticker,
                    'value': market_value_pln,
                    'type': asset.asset_type  # <--- Ważne dla przypisania koloru
                })

        totals['profit'] = (totals['current_value'] + totals['interest']) - totals['invested']
        totals['roi'] = (totals['profit'] / totals['invested']) if totals['invested'] > 0 else 0
        
        return portfolio_data, totals

    def _process_transactions(self, transactions):
        """Pomocnicza funkcja do sumowania transakcji."""
        res = {'qty': 0, 'cost_pln': 0, 'cost_curr': 0, 'capitalization': 0, 'interest': 0}
        for t in transactions:
            if t.transaction_type == 'KUPNO':
                res['qty'] += t.quantity
                res['cost_curr'] += (t.quantity * t.price_per_unit)
                res['cost_pln'] += (t.quantity * t.price_per_unit * t.exchange_rate)
            elif t.transaction_type == 'SPRZEDAZ':
                if res['qty'] > 0:
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