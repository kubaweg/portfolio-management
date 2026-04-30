from typing import List, Tuple
from app.schemas.database.asset import Asset, AssetType
from app.schemas.mappers import TransactionMapper
from app.schemas.groupers import group_by_ticker
from app.core.fx_calculator import FXCalculator
from app.portfolio.position_builder import PositionBuilder

# from app.schemas.domain.types import (
#     MoneyAmount,
#     AssetQuantity,
#     PercentTotal,
#     PercentAnnual,
#     FXRate
# )
from app.schemas.dto.portfolio import AssetData, PortfolioTotals, TransactionData
from app.core.market_data import MarketDataProvider

import pandas as pd


class PortfolioEngine:

    CONVERSION_FEE = 0.005

    # ---------------------------------------------------------
    # PUBLIC API
    # ---------------------------------------------------------
    def build_portfolio(self, assets: List[Asset]) -> Tuple[List[AssetData], PortfolioTotals]:
        domain_map = self._map_sqlalchemy_to_domain(assets)
        grouped = group_by_ticker(self._flatten(domain_map))

        portfolio: List[AssetData] = []
        totals = self._init_totals()
        pb = PositionBuilder()

        for tt in grouped:
            asset = self._find_asset(assets, tt.ticker)
            prices = self._get_market_prices(asset)

            pb_result = pb.build(tt, current_price=prices["asset_price"])

            asset_data, metrics = self._build_asset_data(
                asset=asset,
                tt=tt,
                pb_result=pb_result,
                prices=prices,
            )
            portfolio.append(asset_data)

            self._update_totals(totals, asset_data, metrics)

        self._finalize_totals(totals)
        self._aggregate_totals(totals, grouper='category2')

        return portfolio, totals

    # ---------------------------------------------------------
    # STEP 1 — Mapowanie SQLAlchemy → domena
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

    # ---------------------------------------------------------
    # STEP 2 — Ceny rynkowe i FX
    # ---------------------------------------------------------
    def _get_market_prices(self, asset: Asset):
        raw_price = MarketDataProvider.get_asset_price(asset.ticker, asset.asset_type)
        asset_price = raw_price * (1.0 if asset.asset_type == AssetType.BOND else (1.0 - float(asset.spread)))

        fx_rate = MarketDataProvider.get_fx_rate(asset.currency)
        effective_fx = (
            fx_rate * (1.0 - self.CONVERSION_FEE) if asset.currency != "PLN" else 1.0
        )

        return {
            "asset_price": asset_price,
            "asset_dt": MarketDataProvider.get_asset_time(asset.ticker, asset.asset_type),
            "fx_rate": fx_rate,
            "fx_dt": MarketDataProvider.get_fx_time(asset.currency),
            "effective_fx": effective_fx,
        }

    # ---------------------------------------------------------
    # STEP 3 — AssetData + metryki do totals
    # ---------------------------------------------------------
    def _build_asset_data(self, asset, tt, pb_result, prices):

        open_positions = pb_result.open_positions
        closed_positions = pb_result.closed_positions

        for op in open_positions:
            op.unrealized_profit_pln = FXCalculator.unrealized_pln(
                op.value_buy, op.fx_buy, op.current_value, prices["effective_fx"]
            )
            
        for cp in closed_positions:
            cp.realized_profit_pln = FXCalculator.realized_pln(
                cp.value_buy, cp.fx_buy, cp.value_sell, cp.fx_sell
            )


        total_qty = sum(
            op.quantity for op in open_positions
        )

        # 1) Koszt historyczny (po historycznym FX z transakcji)
        historical_cost_pln = sum(
            op.value_buy * op.fx_buy for op in open_positions
        )

        historical_cost = sum(
            op.value_buy for op in open_positions
        )

        # 2) Wartość bieżąca w PLN (po bieżącym FX)
        current_value_pln = sum(
            op.current_value * prices["effective_fx"] for op in open_positions
        )

        # 3) Zysk zrealizowany w PLN (przeliczamy po bieżącym FX – uproszczenie)
        realized_profit_pln = sum(
            cp.realized_profit_pln for cp in closed_positions
        )
        
        interest_profit_pln = pb_result.interest_profit

        # 4) Zysk niezrealizowany w PLN
        unrealized_profit_pln = sum(
            op.unrealized_profit_pln for op in open_positions
        )

        # 5) ROI bezwzględne
        roi_percent = (
            (realized_profit_pln + interest_profit_pln + unrealized_profit_pln) / historical_cost_pln
            if historical_cost_pln > 0
            else 0.0
        )

        # 6) Annualized ROI – na razie 0.0
        annualized_roi = 0.0

        # 7) Średnie ceny
        avg_price_currency = (
            historical_cost / total_qty if total_qty > 0 else 0.0
        )
        avg_price_pln = (
            historical_cost_pln / total_qty if total_qty > 0 else 0.0
        )

        # 8) DTO transakcji
        enriched_transactions = self._build_transaction_dto(tt.transactions)

        asset_data = AssetData(
            asset=asset,
            quantity=total_qty,
            avg_price_currency=avg_price_currency,
            avg_price_pln=avg_price_pln,
            current_price=prices["asset_price"],
            current_price_datetime=prices["asset_dt"],
            current_value_pln=current_value_pln,
            profit_loss_pln=realized_profit_pln + interest_profit_pln + unrealized_profit_pln,
            fx_rate=prices["fx_rate"],
            fx_effective_rate=prices["effective_fx"],
            fx_datetime=prices["fx_dt"],
            roi_percent=roi_percent,
            annualized_roi=annualized_roi,
            transactions=enriched_transactions,
            open_positions=open_positions,
            closed_positions=closed_positions,
            realized_profit_pln=realized_profit_pln,
            unrealized_profit_pln=unrealized_profit_pln,
            interest_profit_pln=interest_profit_pln,
        )

        metrics = {
            "historical_cost_pln": historical_cost_pln,
            "current_value_pln": current_value_pln,
            "realized_profit_pln": realized_profit_pln,
            "interest_profit_pln": interest_profit_pln,
            "unrealized_profit_pln": unrealized_profit_pln,
        }

        return asset_data, metrics

    def _build_transaction_dto(self, txs):
        dto = []
        for tx in txs:
            dto.append(
                TransactionData(
                    timestamp=tx.timestamp,
                    type=tx.type.value,
                    quantity=getattr(tx, "quantity", 0.0),
                    price=getattr(tx, "price", 0.0),
                    fx_rate=getattr(tx, "fx_rate", 1.0),
                    roi=0.0,  # na razie 0.0
                )
            )
        return dto

    # ---------------------------------------------------------
    # STEP 4 — Totals
    # ---------------------------------------------------------
    def _init_totals(self):
        return PortfolioTotals(
            invested=0.0,
            current_value=0.0,
            interest=0.0,
            profit=0.0,
            roi=0.0,
            annualized_roi=0.0,
            allocation={},
            instrument_data=[],
            instrument_data_aggregated=[]
        )

    def _update_totals(self, totals, asset_data: AssetData, metrics: dict):
        invested_pln = metrics["historical_cost_pln"]
        current_value_pln = metrics["current_value_pln"]
        interest_profit_pln = metrics["interest_profit_pln"]

        totals.invested += invested_pln
        totals.current_value += current_value_pln
        totals.interest += interest_profit_pln  # tu traktujemy realized jako „interest/zysk zrealizowany”

        totals.instrument_data.append(
            {
                "label": asset_data.asset.ticker,
                "category1": asset_data.asset.category1.value,
                "category2": asset_data.asset.category2.value,
                "value": current_value_pln,
                "type": asset_data.asset.asset_type.name,
            }
        )

        totals.allocation[asset_data.asset.asset_type.name] = (
            totals.allocation.get(asset_data.asset.asset_type.name, 0.0)
            + current_value_pln
        )

    def _finalize_totals(self, totals):
        totals.profit = totals.current_value + totals.interest - totals.invested
        totals.roi = (
            totals.profit / totals.invested if totals.invested > 0 else 0.0
        )
        totals.annualized_roi = 0.0  # na razie 0.0

    def _aggregate_totals(self, totals, grouper: str):

        df = totals.instrument_data
        df = pd.DataFrame(df)

        try:
        
            df = df.groupby([grouper, 'type'])['value'].sum().reset_index()
            df = df.rename(columns={grouper: 'category'})
            df = df.to_dict('records')

            totals.instrument_data_aggregated = df
        
        except KeyError as e:

            print(str(e).strip())

            totals.instrument_data_aggregated = []

    # ---------------------------------------------------------
    # HELPERS
    # ---------------------------------------------------------
    def _find_asset(self, assets, ticker):
        return next(a for a in assets if a.ticker == ticker)
