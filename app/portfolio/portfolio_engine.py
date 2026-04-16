from typing import List, Tuple
from app.schemas.database.asset import Asset
from app.schemas.mappers import TransactionMapper
from app.schemas.groupers import group_by_ticker
from app.core.fx_calculator import FXCalculator
from app.portfolio.position_builder import PositionBuilder

from app.schemas.domain.types import (
    PLN,
    CurrencyForeign,
    FXRate,
    PercentTotal,
    PercentAnnual,
    AssetQuantity,
)
from app.schemas.dto.portfolio import AssetData, PortfolioTotals, TransactionData
from app.core.market_data import MarketDataProvider


class PortfolioEngine:

    CONVERSION_FEE = 0.005

    # ---------------------------------------------------------
    # PUBLIC API
    # ---------------------------------------------------------
    def build_portfolio(self, assets: List[Asset]) -> Tuple[List[AssetData], PortfolioTotals]:
        domain_map = self._map_sqlalchemy_to_domain(assets)
        grouped = group_by_ticker(self._flatten(domain_map))

        asset_data_list: List[AssetData] = []
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
            asset_data_list.append(asset_data)

            self._update_totals(totals, asset_data, metrics)

        self._finalize_totals(totals)
        return asset_data_list, totals

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
        asset_price = CurrencyForeign(
            raw_price * (1.0 - float(asset.spread))
        )

        fx_rate = FXRate(MarketDataProvider.get_fx_rate(asset.currency))
        effective_fx = FXRate(
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
                op.cost, op.fx_rate, op.current_value, prices["effective_fx"]
            )
            
        for cp in closed_positions:
            cp.realized_profit_pln = FXCalculator.realized_pln(
                cp.cost, cp.fx_buy, cp.proceeds, cp.fx_sell
            )


        total_qty = sum(op.quantity for op in open_positions)

        # 1) Koszt historyczny w PLN (po historycznym FX z transakcji)
        historical_cost_pln = sum(
            op.cost * op.fx_rate for op in open_positions
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
        roi_percent = PercentTotal(
            (realized_profit_pln + interest_profit_pln + unrealized_profit_pln) / historical_cost_pln
            if historical_cost_pln > 0
            else 0.0
        )

        # 6) Annualized ROI – na razie 0.0
        annualized_roi = PercentAnnual(0.0)

        # 7) Średnie ceny
        total_cost_currency = sum(op.cost for op in open_positions)
        avg_price_currency = (
            total_cost_currency / total_qty if total_qty > 0 else 0.0
        )
        avg_price_pln = (
            historical_cost_pln / total_qty if total_qty > 0 else 0.0
        )

        # 8) DTO transakcji
        enriched_transactions = self._build_transaction_dto(tt.transactions)

        asset_data = AssetData(
            asset=asset,
            quantity=AssetQuantity(total_qty),
            avg_price_currency=CurrencyForeign(avg_price_currency),
            avg_price_pln=PLN(avg_price_pln),
            current_price=prices["asset_price"],
            current_price_datetime=prices["asset_dt"],
            current_value_pln=PLN(current_value_pln),
            profit_loss_pln=PLN(realized_profit_pln + interest_profit_pln + unrealized_profit_pln),
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
                    date=tx.date,
                    transaction_type=tx.type.value,
                    quantity=AssetQuantity(getattr(tx, "quantity", 0.0)),
                    price_per_unit=CurrencyForeign(getattr(tx, "price", 0.0)),
                    exchange_rate=FXRate(getattr(tx, "fx_rate", 1.0)),
                    roi=PercentTotal(0.0),  # na razie 0.0
                )
            )
        return dto

    # ---------------------------------------------------------
    # STEP 4 — Totals
    # ---------------------------------------------------------
    def _init_totals(self):
        return PortfolioTotals(
            invested=PLN(0.0),
            current_value=PLN(0.0),
            interest=PLN(0.0),
            profit=PLN(0.0),
            roi=PercentTotal(0.0),
            annualized_roi=PercentAnnual(0.0),
            allocation={},
            instrument_data=[],
        )

    def _update_totals(self, totals, asset_data: AssetData, metrics: dict):
        invested_pln = PLN(metrics["historical_cost_pln"])
        current_value_pln = PLN(metrics["current_value_pln"])
        interest_profit_pln = PLN(metrics["interest_profit_pln"])

        totals.invested += invested_pln
        totals.current_value += current_value_pln
        totals.interest += interest_profit_pln  # tu traktujemy realized jako „interest/zysk zrealizowany”

        totals.instrument_data.append(
            {
                "label": asset_data.asset.ticker,
                "value": current_value_pln,
                "type": asset_data.asset.asset_type,
            }
        )

        totals.allocation[asset_data.asset.asset_type] = (
            totals.allocation.get(asset_data.asset.asset_type, PLN(0.0))
            + current_value_pln
        )

    def _finalize_totals(self, totals):
        totals.profit = PLN(totals.current_value + totals.interest - totals.invested)
        totals.roi = PercentTotal(
            totals.profit / totals.invested if totals.invested > 0 else 0.0
        )
        totals.annualized_roi = PercentAnnual(0.0)  # na razie 0.0

    # ---------------------------------------------------------
    # HELPERS
    # ---------------------------------------------------------
    def _find_asset(self, assets, ticker):
        return next(a for a in assets if a.ticker == ticker)
