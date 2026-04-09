from typing import List, Tuple, Dict, Any
from .schemas import PLN, CurrencyForeign, PercentTotal, PercentAnnual, AssetQuantity, FXRate, CurrentInstrumentData, AssetData, PortfolioData, PortfolioTotals, TransactionData
from .models import Asset
from .market_data import MarketDataProvider
from .calculators import process_transaction_history, calculate_annualized_return

class PortfolioEngine:
    """
    Główny silnik portfela. 
    Łączy dane z bazy, ceny rynkowe i kalkulatory w spójny raport.
    """
    
    CONVERSION_FEE = 0.005  # 0.5% prowizji na kursie (reguła biznesowa)
    SPREAD_PCT = 0.00135

    def get_portfolio_summary(self, assets: List[Any]) -> Tuple[PortfolioData, PortfolioTotals]:
        """Buduje kompletny zestaw danych do Dashboardu."""

        portfolio_data = PortfolioData([])
        all_transactions = []

        totals = PortfolioTotals(
            invested = PLN(0.0),
            current_value =  PLN(0.0),
            interest = PLN(0.0),
            profit = PLN(0.0),
            roi = PercentTotal(0.0),
            annualized_roi = PercentAnnual(0.0),
            allocation = {},
            instrument_data = []
        )

        for asset in assets:
            
            # 1. Wyciągamy czystą historię (Calculators)
            stats = process_transaction_history(asset.transactions)

            if asset.ticker == 'OTS0326': print(stats)
            
            all_transactions.extend(asset.transactions)

            # 2. Pobieramy ceny (Market Data)
            asset_price = CurrencyForeign(MarketDataProvider.get_asset_price(asset.ticker, asset.asset_type)) * (1.0 if asset.asset_type != 'ETF' else 1 - self.SPREAD_PCT)
            asset_dt = MarketDataProvider.get_asset_time(asset.ticker, asset.asset_type)

            fx_rate = FXRate(MarketDataProvider.get_fx_rate(asset.currency))
            fx_dt = MarketDataProvider.get_fx_time(asset.currency)

            # 3. Logika biznesowa (Przewalutowanie i Prowizje)
            effective_fx = FXRate(fx_rate * (1 - self.CONVERSION_FEE) if asset.currency != 'PLN' else 1.0)
            
            # Wycena końcowa
            market_value_pln = PLN((stats['qty'] * asset_price * effective_fx) + stats['capitalization'])
            profit_pln = PLN((market_value_pln + stats['interest']) - stats['cost_pln'])
            
            # Prosta stopa zwrotu
            roi = PercentTotal((profit_pln / stats['cost_pln']) if stats['cost_pln'] > 0 else 0)
            
            # Roczna stopa zwrotu (XIRR)
            ann_roi = PercentAnnual(calculate_annualized_return(asset.transactions, market_value_pln, stats['qty']))

            enriched_transactions = []
            for t in asset.transactions:

                # Obliczamy zwrot tylko dla kupna (ROI dla sprzedaży jest mniej intuicyjne w tym widoku)
                t_profit = PLN(0.0)
                t_roi = PercentTotal(0.0)

                if t.transaction_type == 'KUPNO':
                    # (Cena rynkowa teraz - Cena kupna wtedy) / Cena kupna wtedy
                    t_profit = PLN(t_profit + t.quantity*(asset_price*effective_fx - t.price_per_unit*t.exchange_rate))

                elif t.transaction_type == 'ODSETKI':
                    # t_profit = PLN(t_profit + (t.price_per_unit*t.exchange_rate))
                    t_profit = PLN(t_profit + 0.0)

                t_roi = PercentTotal(t_profit / (t.quantity*t.price_per_unit*t.exchange_rate))
                
                # Tworzymy słownik lub prosty obiekt, który przekażemy do szablonu
                enriched_transactions.append(TransactionData(
                    date = t.date,
                    transaction_type = t.transaction_type,
                    quantity = t.quantity,
                    price_per_unit = t.price_per_unit,
                    exchange_rate = t.exchange_rate,
                    roi = t_roi
                ))

            # 4. Pakowanie danych pojedynczego aktywa
            portfolio_data.append(AssetData(
                asset = asset,
                quantity = AssetQuantity(stats['qty']),
                avg_price_currency = CurrencyForeign((stats['cost_curr'] / stats['qty']) if stats['qty'] > 0 else 0),
                avg_price_pln = PLN((stats['cost_pln'] / stats['qty']) if stats['qty'] > 0 else 0),
                current_price = CurrencyForeign(asset_price),
                current_price_datetime = asset_dt,
                current_value_pln = PLN(market_value_pln),
                profit_loss_pln = PLN(profit_pln),
                fx_rate = FXRate(fx_rate),
                fx_effective_rate = FXRate(effective_fx),
                fx_datetime = fx_dt,
                roi_percent = PercentTotal(roi),
                annualized_roi = PercentAnnual(0.0) if roi == 0.0 else PercentAnnual(ann_roi),
                transactions = enriched_transactions
            ))

            # 5. Agregacja do sum całkowitych
            # print(asset.ticker, market_value_pln, totals.current_value)
            self._update_totals(totals, asset, market_value_pln, stats)

        # Końcowe obliczenia dla całego portfela
        totals.profit = PLN((totals.current_value + totals.interest) - totals.invested)
        totals.roi = PercentTotal((totals.profit / totals.invested) if totals.invested > 0 else 0)
        
        totals.annualized_roi = PercentAnnual(calculate_annualized_return(all_transactions, totals.current_value, 1.0))

        return portfolio_data, totals

    def _update_totals(self, totals: PortfolioTotals, asset: Asset, market_value_pln: PLN, stats: Dict[str, float]):
        """Pomocnicza metoda do aktualizacji sumarycznych statystyk."""
        totals.invested = PLN(totals.invested + stats['cost_pln'])
        totals.current_value = PLN(totals.current_value + market_value_pln)
        totals.interest = PLN(totals.interest + stats['interest'])

        if stats['qty'] > 0:
            a_type = asset.asset_type or 'Inne'
            totals.allocation[a_type] = PLN(totals.allocation.get(a_type, 0) + market_value_pln)
            
            totals.instrument_data.append(CurrentInstrumentData({
                'label': asset.ticker,
                'value': market_value_pln,
                'type': a_type
            }))