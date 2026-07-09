from typing import List, Tuple
from datetime import datetime

from app.schemas.database.asset import Asset, AssetType
from app.schemas.domain.positions import OpenPosition, ClosedPosition
from app.schemas.domain.transactions import TickerTransactions, TransactionType
from app.schemas.mappers import TransactionMapper
from app.schemas.groupers import group_by_ticker

from app.core.cash.service import CashFlowEngine
from app.core.cash.schemas.dto import (
    CashFlowInstance, CashFlow, CashFlowSummary, CashFlowType, FinancialSummary, FinancialAggregation, FinancialAggregationInstance
)

from app.core.exchange.exchange_service_utils import PositionBuilder, PositionBuilderResult
from app.core.exchange.schemas.dto import (
    ExchangeBaseData, ExchangeSummary, ExchangeFXData, ExchangeCurrentData, ExchangeData,
    OpenPositionsMetrics, MarketPriceData,
    EXCHANGE_TAX_RATE
)

from app.core.market_data import MarketDataProvider


class ExchangeEngine:

    CONVERSION_FEE = 0.005

    # Metoda główna - orkiestrator
    def build_portfolio(self, assets: List[Asset]) -> List[ExchangeData]:
        domain_map = self._map_sqlalchemy_to_domain(assets)
        grouped = group_by_ticker(self._flatten(domain_map))

        portfolio: List[ExchangeData] = []
        pb = PositionBuilder()

        for tt in grouped:
            asset = self._find_asset(assets, tt.ticker)

            prices = self._get_market_prices(asset)

            pb_result = pb.build(tt, current_price=prices.price, fx_current=prices.fx_effective_rate_sell)

            exchange_data = self._build_exchange_data(
                asset=asset,
                tt=tt,
                pb_result=pb_result,
                prices=prices,
            )
            portfolio.append(exchange_data)

        return portfolio

    def _build_exchange_data(self, asset: Asset, tt: TickerTransactions, pb_result: PositionBuilderResult, prices: MarketPriceData) -> ExchangeData:

        open_positions = pb_result.open_positions
        closed_positions = pb_result.closed_positions

        # Obliczenia dla pozycji otwartych i zamkniętych (zwracają modele Pydantic)
        open_metrics = self._process_open_positions(open_positions, prices.fx_effective_rate_sell)

        # ROI bezwzględne
        historical_cost = open_metrics.historical_cost
        historical_cost_pln = open_metrics.historical_cost_pln

        # Średnie historyczne dla pozycji otwartych
        current_quantity = open_metrics.quantity
        
        avg_price = historical_cost / current_quantity if current_quantity > 0 else 0.0
        avg_price_pln = historical_cost_pln / current_quantity if current_quantity > 0 else 0.0
        avg_fx_rate = historical_cost_pln / historical_cost if historical_cost > 0 else 0.0

        # 7) Budowa obiektów końcowych
        base_data = self._build_exchange_base_data(asset=asset)

        current_data = self._build_exchange_current_data(
            open_metrics=open_metrics,
            prices=prices,
            currency=str(asset.currency)
        )

        cash_flows = self._build_exchange_cash_flows(
            open_positions=open_positions,
            closed_positions=closed_positions,
            transactions=tt,
            current_data=current_data,
            tax_rate=EXCHANGE_TAX_RATE
        )

        engine = CashFlowEngine()
        financial_summary = engine.calculate_summary(cash_flows)

        summary = self._build_exchange_summary(
            financial_summary=financial_summary,
            open_positions=open_positions,
            closed_positions=closed_positions,
            prices=prices
        )

        exchange_data = ExchangeData(
            base_data=base_data,
            summary=summary,
            current_data=current_data,
            open_positions=open_positions,
            closed_positions=closed_positions,
            cash_flows=cash_flows
        )

        return exchange_data
    
    # ---------------------------------------------------------
    # Krok 1 — techniczne metody pomocnicze
    # ---------------------------------------------------------

    def _map_sqlalchemy_to_domain(self, assets: List[Asset]):
        domain_map = {}
        for asset in assets:
            domain_map[asset.ticker] = TransactionMapper.map_many(asset.transactions)
        return domain_map

    def _flatten(self, domain_map):
        all_txs = []
        for txs in domain_map.values():
            all_txs.extend(txs)
        return all_txs

    def _find_asset(self, assets, ticker):
        return next(a for a in assets if a.ticker == ticker)
    
    # ---------------------------------------------------------
    # Krok 2 — ceny rynkowe i FX
    # ---------------------------------------------------------

    def _get_market_prices(self, asset: Asset) -> MarketPriceData:
        raw_price = MarketDataProvider.get_asset_price(str(asset.ticker), AssetType(asset.asset_type))
        asset_price = raw_price * (1.0 - float(asset.spread))

        fx_rate = MarketDataProvider.get_fx_rate(str(asset.currency))
        fx_effective_rate_sell = (
            fx_rate * (1.0 - self.CONVERSION_FEE) if str(asset.currency) != "PLN" else 1.0
        )
        fx_effective_rate_buy = (
            fx_rate * (1.0 + self.CONVERSION_FEE) if str(asset.currency) != "PLN" else 1.0
        )

        return MarketPriceData(
            price=asset_price,
            price_datetime=MarketDataProvider.get_asset_time(str(asset.ticker), AssetType(asset.asset_type)),
            fx_rate=fx_rate,
            fx_effective_rate_buy=fx_effective_rate_buy,
            fx_effective_rate_sell=fx_effective_rate_sell,
            fx_datetime=MarketDataProvider.get_fx_time(str(asset.currency))
        )

    # ---------------------------------------------------------
    # Krok 3 — ExchangeData + metryki do totals
    # ---------------------------------------------------------

    def _build_exchange_base_data(self, asset: Asset) -> ExchangeBaseData:
        return ExchangeBaseData(
            ticker=str(asset.ticker),
            name=str(asset.name),
            type=str(asset.asset_type.value),
            category1=str(asset.category1.value),
            category2=str(asset.category2.value),
            currency=str(asset.currency)
        )
    
    def _build_exchange_summary(
            self,
            financial_summary: FinancialSummary,
            open_positions: List[OpenPosition],
            closed_positions: List[ClosedPosition],
            prices: MarketPriceData
        ) -> ExchangeSummary:
            
            # Skrót do wartości netto z silnika agregującego
            base = financial_summary.gross
            
            # Połączenie wszystkich pozycji dla uproszczenia iteracji
            all_positions = open_positions + closed_positions

            # Agregacja wartości bazowych
            total_quantity_open = sum(p.quantity for p in open_positions)
            total_quantity_closed = sum(p.quantity for p in closed_positions)
            total_quantity = total_quantity_open + total_quantity_closed

            total_value = sum(p.value_buy for p in all_positions)
            total_value_pln = sum(p.value_buy * p.fx_buy for p in all_positions)

            total_invested = sum(p.value_buy for p in all_positions)
            total_invested_pln = sum(p.value_buy * p.fx_buy for p in all_positions)

            total_withdrawn_pln = sum(p.value_sell * p.fx_sell for p in closed_positions)

            # Wyliczenie średnich z zabezpieczeniem przed dzieleniem przez zero
            avg_price = total_value / total_quantity if total_quantity > 0 else 0.0
            avg_price_pln = total_value_pln / total_quantity if total_quantity > 0 else 0.0
            avg_fx_rate = total_value_pln / total_value if total_value > 0 else 0.0

            # Zysk w walucie instrumentu
            asset_profit_closed = sum((p.value_sell - p.value_buy) for p in closed_positions)
            asset_profit_open = sum(((p.quantity * prices.price) - p.value_buy) for p in open_positions)
            asset_profit = asset_profit_open + asset_profit_closed
            roi_attribution_asset = asset_profit / total_invested if total_invested > 0 else 0.0
            roi_attribution_fx = base.total.roi - roi_attribution_asset


            # 4. Zbudowanie i zwrócenie modelu
            return ExchangeSummary(
                avg_price=avg_price,
                avg_price_pln=avg_price_pln,
                avg_fx_rate=avg_fx_rate,

                realized_profit_pln=base.realized.profit,
                roi_realized_pln=base.realized.roi,
                roi_realized_pa_pln=base.realized.roi_pa or 0.0,

                unrealized_profit_pln=base.unrealized.profit,
                roi_unrealized_pln=base.unrealized.roi,
                roi_unrealized_pa_pln=base.unrealized.roi_pa or 0.0,

                total_profit_pln=base.total.profit,
                roi_pln=base.total.roi,
                roi_pa_pln=base.total.roi_pa or 0.0,

                total_quantity=total_quantity,
                total_quantity_open=total_quantity_open,
                total_quantity_closed=total_quantity_closed,
                total_invested_pln=total_invested_pln,
                total_withdrawn_pln=total_withdrawn_pln,

                roi_attribution_asset_pln=roi_attribution_asset,
                roi_attribution_fx_pln=roi_attribution_fx
            )
    
    def _build_exchange_fx_data(
        self, 
        prices: MarketPriceData,
        currency: str
    ) -> ExchangeFXData:
        return ExchangeFXData(
            currency=currency,
            fx_rate=prices.fx_rate,
            fx_effective_rate_buy=prices.fx_effective_rate_buy,
            fx_effective_rate_sell=prices.fx_effective_rate_sell,
            fx_datetime=prices.fx_datetime or datetime(year=1, month=1, day=1)
        )
    
    def _build_exchange_current_data(
            self, 
            open_metrics: OpenPositionsMetrics,
            prices: MarketPriceData,
            currency: str
    ) -> ExchangeCurrentData:

        fx_data = self._build_exchange_fx_data(prices=prices, currency=currency)

        return ExchangeCurrentData(
            quantity=open_metrics.quantity,
            price=prices.price,
            value=open_metrics.current_value,
            value_pln=open_metrics.current_value_pln,
            fx_data=fx_data,
            price_datetime=prices.price_datetime or datetime(year=1, month=1, day=1)
        )
    
    # ---------------------------------------------------------
    # Krok 4 — funkcje pomocnicze do budowania danych
    # ---------------------------------------------------------

    def _process_open_positions(self, open_positions: List[OpenPosition], fx_effective_rate_sell: float) -> OpenPositionsMetrics:
        """Przetwarza otwarte pozycje i agreguje metryki do modelu Pydantic."""
        metrics = OpenPositionsMetrics()

        for op in open_positions:

            # Agregacja do atrybutów modelu
            metrics.quantity += op.quantity
            metrics.historical_cost += op.value_buy
            metrics.historical_cost_pln += op.value_buy * op.fx_buy
            metrics.current_value += op.current_value
            metrics.current_value_pln += op.current_value * fx_effective_rate_sell

        return metrics
    
    # ---------------------------------------------------------
    # Krok 5 - budowanie Cash Flows
    # ---------------------------------------------------------

    def _build_exchange_cash_flows(
        self,
        open_positions: List[OpenPosition],
        closed_positions: List[ClosedPosition],
        transactions: TickerTransactions,
        current_data: ExchangeCurrentData,
        tax_rate: float
    ) -> CashFlowSummary:
        """Orkiestruje budowę przepływów pieniężnych dla instrumentów giełdowych."""
        
        rg, ug, rn, un = [], [], [], []

        # 1. ZAMKNIĘTE POZYCJE (Zrealizowane)
        cp_rg, cp_rn = self._build_closed_positions_flows(closed_positions, tax_rate)
        rg.extend(cp_rg)
        rn.extend(cp_rn)

        # 2. OTWARTE POZYCJE (Niezrealizowane)
        op_ug, op_un, total_open_cost_pln = self._build_open_positions_flows(open_positions)
        ug.extend(op_ug)
        un.extend(op_un)

        # 3. DYWIDENDY (Zrealizowane)
        div_rg, div_rn = self._build_dividend_flows(transactions, tax_rate)
        rg.extend(div_rg)
        rn.extend(div_rn)

        # 4. WYCENA BIEŻĄCA (Niezrealizowane)
        val_ug, val_un = self._build_current_valuation_flow(
            current_data, bool(open_positions), total_open_cost_pln, tax_rate
        )
        ug.extend(val_ug)
        un.extend(val_un)

        # 5. SORTOWANIE I BUDOWA SUMMARY
        return self._compile_cash_flow_summary(rg, ug, rn, un)

    # ---------------------------------------------------------
    # Krok 6 - metody pomocnicze pod Cash Flows
    # ---------------------------------------------------------

    def _build_closed_positions_flows(
        self, 
        closed_positions: List[ClosedPosition], 
        tax_rate: float
    ) -> Tuple[List[CashFlowInstance], List[CashFlowInstance]]:
        """Buduje zrealizowane przepływy (wypływ kapitału i powrót ze sprzedaży) dla zamkniętych pozycji."""
        rg, rn = [], []

        for pos in closed_positions:
            # Wypływ - otwarcie
            buy_val_pln = pos.value_buy * pos.fx_buy
            desc_buy = f"Otwarcie (zamkniętej) pozycji {pos.ticker} ({pos.quantity} szt.)"
            cf_buy = CashFlowInstance(
                date=pos.date_buy, value=-buy_val_pln, flow_type=CashFlowType.BUY, description=desc_buy
            )
            rg.append(cf_buy)
            rn.append(cf_buy)

            # Wpływ - sprzedaż
            gross_sell_val_pln = pos.value_sell * pos.fx_sell
            profit_pln = max(0.0, pos.realized_profit_pln)
            net_sell_val_pln = gross_sell_val_pln - (profit_pln * tax_rate)
            
            desc_sell = f"Zamknięcie pozycji {pos.ticker} ({pos.quantity} szt.)"
            rg.append(CashFlowInstance(
                date=pos.date_sell, value=gross_sell_val_pln, flow_type=CashFlowType.SELL, description=desc_sell
            ))
            rn.append(CashFlowInstance(
                date=pos.date_sell, value=net_sell_val_pln, flow_type=CashFlowType.SELL, description=desc_sell
            ))
            
        return rg, rn

    def _build_open_positions_flows(
        self, 
        open_positions: List[OpenPosition]
    ) -> Tuple[List[CashFlowInstance], List[CashFlowInstance], float]:
        """Buduje niezrealizowane przepływy (wypływ kapitału) dla otwartych pozycji i zwraca ich łączny koszt w PLN."""
        ug, un = [], []
        total_open_cost_pln = 0.0
        
        for pos in open_positions:
            buy_val_pln = pos.value_buy * pos.fx_buy
            total_open_cost_pln += buy_val_pln
            
            desc_buy = f"Otwarcie (aktywnej) pozycji {pos.ticker} ({pos.quantity} szt.)"
            cf_buy = CashFlowInstance(
                date=pos.date_buy, value=-buy_val_pln, flow_type=CashFlowType.BUY, description=desc_buy
            )
            ug.append(cf_buy)
            un.append(cf_buy)
            
        return ug, un, total_open_cost_pln

    def _build_dividend_flows(
        self, 
        tt: TickerTransactions, 
        tax_rate: float
    ) -> Tuple[List["CashFlowInstance"], List["CashFlowInstance"]]:
        """Generuje w pełni zrealizowane przepływy z tytułu dywidend."""
        rg, rn = [], []
        

        dividend_txs = [
            tx for tx in tt.transactions
            if tx.type == TransactionType.DIVIDEND
        ]
        
        for tx in dividend_txs:
            tx_date = tx.timestamp.date()
            div_val_pln = tx.value_net
            net_div_val_pln = div_val_pln * (1.0 - tax_rate)
            
            desc_div = f"Wypłata dywidendy ({div_val_pln} PLN)"
            rg.append(CashFlowInstance(
                date=tx_date, value=div_val_pln, flow_type=CashFlowType.DIVIDEND, description=desc_div
            ))
            rn.append(CashFlowInstance(
                date=tx_date, value=net_div_val_pln, flow_type=CashFlowType.DIVIDEND, description=desc_div
            ))
            
        return rg, rn

    def _build_current_valuation_flow(
        self, 
        current_data: ExchangeCurrentData, 
        has_open_positions: bool, 
        total_open_cost_pln: float, 
        tax_rate: float
    ) -> Tuple[List[CashFlowInstance], List[CashFlowInstance]]:
        """Oblicza punktową wycenę bieżącą jako niezrealizowany wpływ kapitału, potrącając wirtualny podatek."""
        ug, un = [], []
        
        if has_open_positions:
            calc_date = current_data.price_datetime.date()
            val_gross_pln = current_data.value_pln
            
            unrealized_profit_pln = max(0.0, val_gross_pln - total_open_cost_pln)
            val_net_pln = val_gross_pln - (unrealized_profit_pln * tax_rate)
            
            desc_val = f"Wycena bieżąca otwartych pozycji na dzień {calc_date}"
            ug.append(CashFlowInstance(
                date=calc_date, value=val_gross_pln, flow_type=CashFlowType.CURRENT_VALUATION, description=desc_val
            ))
            un.append(CashFlowInstance(
                date=calc_date, value=val_net_pln, flow_type=CashFlowType.CURRENT_VALUATION, description=desc_val
            ))
            
        return ug, un

    def _compile_cash_flow_summary(
        self, 
        rg: List["CashFlowInstance"], 
        ug: List["CashFlowInstance"], 
        rn: List["CashFlowInstance"], 
        un: List["CashFlowInstance"]
    ) -> "CashFlowSummary":
        """Sortuje wszystkie zdarzenia chronologicznie i składa finalny obiekt CashFlowSummary."""
        rg.sort(key=lambda cf: cf.date)
        rn.sort(key=lambda cf: cf.date)
        ug.sort(key=lambda cf: cf.date)
        un.sort(key=lambda cf: cf.date)
        
        gross_cf = CashFlow(
            realized=rg,
            unrealized=ug,
            total=sorted(rg + ug, key=lambda cf: cf.date)
        )
        
        net_cf = CashFlow(
            realized=rn,
            unrealized=un,
            total=sorted(rn + un, key=lambda cf: cf.date)
        )
        
        return CashFlowSummary(gross=gross_cf, net=net_cf)
