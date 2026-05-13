from typing import List, Tuple
from datetime import datetime

from app.schemas.database.asset import Asset, AssetType
from app.schemas.mappers import TransactionMapper
from app.schemas.groupers import group_by_ticker
from app.core.fx_calculator import FXCalculator
from app.portfolio.position_builder import PositionBuilder


from app.schemas.dto.portfolio import (
    AssetBaseData, AssetSummary, AssetFXData, AssetCurrentData, AssetData, 
    PortfolioTotals, TransactionData,
    CurrentInstrumentData
)
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

            pb_result = pb.build(tt, current_price=prices["price"])

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
        fx_effective_rate = (
            fx_rate * (1.0 - self.CONVERSION_FEE) if asset.currency != "PLN" else 1.0
        )

        # TODO: tutaj trzeba refactor na pydantic zrobić
        return {
            "price": asset_price,
            "price_datetime": MarketDataProvider.get_asset_time(asset.ticker, asset.asset_type),
            "fx_rate": fx_rate,
            "fx_effective_rate": fx_effective_rate,
            "fx_datetime": MarketDataProvider.get_fx_time(asset.currency),

        }

    # ---------------------------------------------------------
    # STEP 3 — AssetData + metryki do totals
    # ---------------------------------------------------------
    def _build_asset_base_data(self, **kwargs) -> AssetBaseData:
        return AssetBaseData(
            ticker=kwargs.get("ticker", "-"),
            name=kwargs.get("name", "-"),
            type=kwargs.get("type", "-"),
            category1=kwargs.get("category1", "-"),
            category2=kwargs.get("category2", "-"),
            currency=kwargs.get("currency", "-")
        )
    
    def _build_asset_summary(self, **kwargs) -> AssetSummary:
        return AssetSummary(
            quantity=kwargs.get("quantity", 0.0),
            avg_price=kwargs.get("avg_price", 0.0),
            avg_price_pln=kwargs.get("avg_price_pln", 0.0),
            avg_fx_rate=kwargs.get("avg_fx_rate", 0.0),
            realized_profit=kwargs.get("realized_profit", 0.0),
            realized_profit_pln=kwargs.get("realized_profit_pln", 0.0),
            unrealized_profit=kwargs.get("unrealized_profit", 0.0),
            unrealized_profit_pln=kwargs.get("unrealized_profit_pln", 0.0),
            interest_profit=kwargs.get("interest_profit", 0.0),
            interest_profit_pln=kwargs.get("interest_profit_pln", 0.0),
            profit_loss=kwargs.get("profit_loss", 0.0),
            profit_loss_pln=kwargs.get("profit_loss_pln", 0.0),
            roi=kwargs.get("roi", 0.0),
            roi_pln=kwargs.get("roi_pln", 0.0),
            roi_pa=kwargs.get("roi_pa", 0.0),
            roi_pa_pln=kwargs.get("roi_pa_pln", 0.0),
        )
    
    def _build_asset_fx_data(self, **kwargs) -> AssetFXData:
        return AssetFXData(
            currency=kwargs.get("currency", "-"),
            fx_rate=kwargs.get("fx_rate", 0.0),
            fx_effective_rate=kwargs.get("fx_effective_rate", 0.0),
            fx_datetime=kwargs.get("fx_datetime", datetime(year=1900, month=1, day=1))
        )
    
    def _build_asset_current_data(self, **kwargs) -> AssetCurrentData:

        fx_data = self._build_asset_fx_data(**kwargs)

        return AssetCurrentData(
            price=kwargs.get("price", 0.0),
            value=kwargs.get("value", 0.0),
            value_pln=kwargs.get("value_pln", 0.0),
            fx_data=fx_data,
            price_datetime=kwargs.get("price_datetime", datetime(year=1900, month=1, day=1))
        )
    
    def _build_asset_data(self, asset: Asset, tt, pb_result, prices):

        open_positions = pb_result.open_positions
        closed_positions = pb_result.closed_positions

        for op in open_positions:
            op.unrealized_profit_pln = FXCalculator.unrealized_pln(
                op.value_buy, op.fx_buy, op.current_value, prices["fx_effective_rate"]
            )
            
        for cp in closed_positions:
            cp.realized_profit_pln = FXCalculator.realized_pln(
                cp.value_buy, cp.fx_buy, cp.value_sell, cp.fx_sell
            )


        quantity = sum(
            op.quantity for op in open_positions
        )

        # 1) Koszt historyczny (po historycznym FX z transakcji)
        historical_cost = sum(
            op.value_buy for op in open_positions
        )

        historical_cost_pln = sum(
            op.value_buy * op.fx_buy for op in open_positions
        )

        # 2) Wartość bieżąca w PLN (po bieżącym FX)
        current_value = sum(
            op.current_value for op in open_positions
        )

        current_value_pln = sum(
            op.current_value * prices["fx_effective_rate"] for op in open_positions
        )

        # 3) Zysk zrealizowany
        realized_profit = sum(
            cp.realized_profit for cp in closed_positions
        )

        realized_profit_pln = sum(
            cp.realized_profit_pln for cp in closed_positions
        )

        # 4) Zysk niezrealizowany
        unrealized_profit = sum(
            op.unrealized_profit for op in open_positions
        )

        unrealized_profit_pln = sum(
            op.unrealized_profit_pln for op in open_positions
        )

        # 5) Zysk z odsetek (uproszczenie: na razie tylko w PLN)
        interest_profit = 0.0
        interest_profit_pln = pb_result.interest_profit

        # Zysk nominalny
        profit_loss = realized_profit + interest_profit + unrealized_profit
        profit_loss_pln = realized_profit_pln + interest_profit_pln + unrealized_profit_pln

        # 6) ROI bezwzględne
        roi = (
            profit_loss / historical_cost
            if historical_cost > 0
            else 0.0
        )

        roi_pln = (
            profit_loss_pln / historical_cost_pln
            if historical_cost_pln > 0
            else 0.0
        )

        # 7) Annualized ROI – na razie 0.0
        roi_pa = 0.0
        roi_pa_pln = 0.0

        # 8) Średnie historyczne
        avg_price = (
            historical_cost / quantity if quantity > 0 else 0.0
        )
        avg_price_pln = (
            historical_cost_pln / quantity if quantity > 0 else 0.0
        )
        avg_fx_rate = (
            historical_cost_pln / historical_cost if historical_cost > 0 else 0.0
        )

        # 9) DTO transakcji
        enriched_transactions = self._build_transaction_dto(tt.transactions)

        base_data = self._build_asset_base_data(
            ticker=asset.ticker,
            name=asset.name,
            type=asset.asset_type.name,
            category1=asset.category1.value,
            category2=asset.category2.value,
            currency=asset.currency
        )

        summary = self._build_asset_summary(
            quantity=quantity,
            avg_price=avg_price,
            avg_price_pln=avg_price_pln,
            avg_fx_rate=avg_fx_rate,
            realized_profit=realized_profit,
            realized_profit_pln=realized_profit_pln,
            unrealized_profit=unrealized_profit,
            unrealized_profit_pln=unrealized_profit_pln,
            interest_profit_pln=interest_profit_pln,
            profit_loss=profit_loss,
            profit_loss_pln=profit_loss_pln,
            roi=roi,
            roi_pln=roi_pln,
            roi_pa=roi_pa,
            roi_pa_pln=roi_pa_pln

        )
        current_data = self._build_asset_current_data(
            price=prices["price"],
            value=current_value,
            value_pln=current_value_pln,
            currency=asset.currency,
            fx_rate=prices["fx_rate"],
            fx_effective_rate=prices["fx_effective_rate"],
            fx_datetime=prices["fx_datetime"],
            price_datetime=prices["price_datetime"]
        )

        asset_data = AssetData(
            base_data=base_data,
            summary=summary,
            current_data=current_data,
            open_positions=open_positions,
            closed_positions=closed_positions
        )

        # TODO: tutaj trzeba zrobić refactor na pydantic
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
            invested_value=0.0,
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
        invested_value_pln = metrics["historical_cost_pln"]
        current_value_pln = metrics["current_value_pln"]
        interest_profit_pln = metrics["interest_profit_pln"]

        totals.invested_value += invested_value_pln
        totals.current_value += current_value_pln
        totals.interest += interest_profit_pln  # tu traktujemy realized jako „interest/zysk zrealizowany”

        totals.instrument_data.append(
            CurrentInstrumentData(
                label=asset_data.base_data.ticker,
                category1=asset_data.base_data.category1,
                category2=asset_data.base_data.category2,
                value=current_value_pln,
                type=asset_data.base_data.type,
            )
        )

        totals.allocation[asset_data.base_data.type] = (
            totals.allocation.get(asset_data.base_data.name, 0.0)
            + current_value_pln
        )

    def _finalize_totals(self, totals):
        totals.profit = totals.current_value + totals.interest - totals.invested_value
        totals.roi = (
            totals.profit / totals.invested_value if totals.invested_value > 0 else 0.0
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
