from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel, Field

from app.schemas.database.asset import Asset, AssetType
from app.schemas.domain.positions import OpenPosition, ClosedPosition
from app.schemas.mappers import TransactionMapper
from app.schemas.groupers import group_by_ticker
from app.core.fx_calculator import FXCalculator

from app.core.exchange.position_builder import PositionBuilder, PositionBuilderResult
from app.core.exchange.schemas.dto import (
    ExchangeBaseData, ExchangeSummary, ExchangeFXData, ExchangeCurrentData, ExchangeData
)
from app.core.market_data import MarketDataProvider
from app.core.exchange.annualized_roi import calculate_annualized_roi, AnnualizedRoiOutput

# Modele DTO
class OpenPositionsMetrics(BaseModel):
    quantity: float = Field(
        default=0.0, 
        ge=0.0, 
        description="Całkowita liczba jednostek (wolumen) w otwartych pozycjach."
    )
    historical_cost: float = Field(
        default=0.0, 
        ge=0.0, 
        description="Łączny koszt zakupu otwartych pozycji wyrażony w walucie notowania instrumentu."
    )
    historical_cost_pln: float = Field(
        default=0.0, 
        ge=0.0, 
        description="Łączny koszt zakupu otwartych pozycji przeliczony na PLN po kursie z dnia transakcji."
    )
    current_value: float = Field(
        default=0.0, 
        ge=0.0, 
        description="Bieżąca rynkowa wartość otwartych pozycji w walucie notowania instrumentu."
    )
    current_value_pln: float = Field(
        default=0.0, 
        ge=0.0, 
        description="Bieżąca rynkowa wartość otwartych pozycji przeliczona na PLN po aktualnym kursie FX."
    )
    unrealized_profit: float = Field(
        default=0.0, 
        description="Niezrealizowany zysk lub strata (papierowy wynik) w walucie notowania instrumentu. Może przyjmować wartości ujemne."
    )
    unrealized_profit_pln: float = Field(
        default=0.0, 
        description="Niezrealizowany zysk lub strata przeliczony na PLN, uwzględniający różnice kursowe FX. Może przyjmować wartości ujemne."
    )

class ClosedPositionsMetrics(BaseModel):
    realized_profit: float = Field(
        default=0.0, 
        description="Faktycznie zrealizowany zysk lub strata z zamkniętych pozycji w walucie notowania instrumentu. Może przyjmować wartości ujemne."
    )
    realized_profit_pln: float = Field(
        default=0.0, 
        description="Faktycznie zrealizowany zysk lub strata z zamkniętych pozycji w PLN, uwzględniający różnice kursowe z dnia zakupu i sprzedaży. Może przyjmować wartości ujemne."
    )

class MarketPriceData(BaseModel):
    price: float = Field(
        default=0.0, 
        ge=0.0, 
        description="Bieżąca cena rynkowa aktywa po uwzględnieniu spreadu."
    )
    price_datetime: Optional[datetime] = Field(
        default=None, 
        description="Data i czas (timestamp) ostatniej aktualizacji ceny rynkowej aktywa."
    )
    fx_rate: float = Field(
        default=1.0, 
        ge=0.0, 
        description="Bazowy, rynkowy kurs wymiany waluty."
    )
    fx_effective_rate_buy: float = Field(
        default=1.0, 
        ge=0.0, 
        description="Efektywny kurs kupna waluty, powiększony o prowizję za przewalutowanie (conversion fee)."
    )
    fx_effective_rate_sell: float = Field(
        default=1.0, 
        ge=0.0, 
        description="Efektywny kurs sprzedaży waluty, pomniejszony o prowizję za przewalutowanie (conversion fee)."
    )
    fx_datetime: Optional[datetime] = Field(
        default=None, 
        description="Data i czas (timestamp) ostatniej aktualizacji kursu walutowego."
    )


class ExchangeEngine:

    CONVERSION_FEE = 0.005

    # ---------------------------------------------------------
    # PUBLIC API
    # ---------------------------------------------------------
    def build_portfolio(self, assets: List[Asset]) -> List[ExchangeData]:
        domain_map = self._map_sqlalchemy_to_domain(assets)
        grouped = group_by_ticker(self._flatten(domain_map))

        portfolio: List[ExchangeData] = []
        pb = PositionBuilder()

        for tt in grouped:
            asset = self._find_asset(assets, tt.ticker)

            prices = self._get_market_prices(asset)

            pb_result = pb.build(tt, current_price=prices.price, fx_current=prices.fx_effective_rate_sell)

            asset_data = self._build_asset_data(
                asset=asset,
                pb_result=pb_result,
                prices=prices,
            )
            portfolio.append(asset_data)

        return portfolio

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
    # STEP 3 — AssetData + metryki do totals
    # ---------------------------------------------------------
    def _build_asset_base_data(self, **kwargs) -> ExchangeBaseData:
        return ExchangeBaseData(
            ticker=kwargs.get("ticker", "-"),
            name=kwargs.get("name", "-"),
            type=kwargs.get("type", "-"),
            category1=kwargs.get("category1", "-"),
            category2=kwargs.get("category2", "-"),
            currency=kwargs.get("currency", "-")
        )
    
    def _build_asset_summary(self, **kwargs) -> ExchangeSummary:
        return ExchangeSummary(
            quantity=kwargs.get("quantity", 0.0),

            avg_price=kwargs.get("avg_price", 0.0),
            avg_price_pln=kwargs.get("avg_price_pln", 0.0),
            avg_fx_rate=kwargs.get("avg_fx_rate", 0.0),

            realized_profit=kwargs.get("realized_profit", 0.0),
            roi_realized=kwargs.get("roi_realized", 0.0),
            roi_realized_pa=kwargs.get("roi_realized_pa", 0.0),

            realized_profit_pln=kwargs.get("realized_profit_pln", 0.0),
            roi_realized_pln=kwargs.get("roi_realized_pln", 0.0),
            roi_realized_pa_pln=kwargs.get("roi_realized_pa_pln", 0.0),

            unrealized_profit=kwargs.get("unrealized_profit", 0.0),
            roi_unrealized=kwargs.get("roi_unrealized", 0.0),
            roi_unrealized_pa=kwargs.get("roi_unrealized_pa", 0.0),

            unrealized_profit_pln=kwargs.get("unrealized_profit_pln", 0.0),
            roi_unrealized_pln=kwargs.get("roi_unrealized_pln", 0.0),
            roi_unrealized_pa_pln=kwargs.get("roi_unrealized_pa_pln", 0.0),

            interest_profit=kwargs.get("interest_profit", 0.0),
            interest_profit_pln=kwargs.get("interest_profit_pln", 0.0),

            total_profit=kwargs.get("total_profit", 0.0),
            roi=kwargs.get("roi", 0.0),
            roi_pa=kwargs.get("roi_pa", 0.0),

            total_profit_pln=kwargs.get("total_profit_pln", 0.0),
            roi_pln=kwargs.get("roi_pln", 0.0),
            roi_pa_pln=kwargs.get("roi_pa_pln", 0.0),
        )
    
    def _build_asset_fx_data(self, **kwargs) -> ExchangeFXData:
        return ExchangeFXData(
            currency=kwargs.get("currency", "-"),
            fx_rate=kwargs.get("fx_rate", 0.0),
            fx_effective_rate_buy=kwargs.get("fx_effective_rate_buy", -1.0),
            fx_effective_rate_sell=kwargs.get("fx_effective_rate_sell", -1.0),
            fx_datetime=kwargs.get("fx_datetime", datetime(year=1900, month=1, day=1))
        )
    
    def _build_asset_current_data(self, **kwargs) -> ExchangeCurrentData:

        fx_data = self._build_asset_fx_data(**kwargs)

        return ExchangeCurrentData(
            price=kwargs.get("price", 0.0),
            value=kwargs.get("value", 0.0),
            value_pln=kwargs.get("value_pln", 0.0),
            fx_data=fx_data,
            price_datetime=kwargs.get("price_datetime", datetime(year=1900, month=1, day=1))
        )
    # ---------------------------------------------------------
    # STEP 4 — funkcje pomocnicze do budowania danych
    # ---------------------------------------------------------
    def _process_open_positions(self, open_positions: List[OpenPosition], fx_effective_rate_sell: float) -> OpenPositionsMetrics:
        """Przetwarza otwarte pozycje i agreguje metryki do modelu Pydantic."""
        metrics = OpenPositionsMetrics()

        for op in open_positions:
            # Obliczenie i przypisanie wartości PLN do obiektu
            op.unrealized_profit_pln = FXCalculator.unrealized_pln(
                op.value_buy, op.fx_buy, op.current_value, fx_effective_rate_sell
            )

            op.roi_unrealized = op.unrealized_profit / op.value_buy if op.value_buy > 0 else 0.0
            op.roi_unrealized_pln = op.unrealized_profit_pln / (op.value_buy * op.fx_buy) if op.value_buy > 0 else 0.0

            roi_annualized = calculate_annualized_roi([op], [])
            op.roi_unrealized_pa = roi_annualized.roi_pa
            op.roi_unrealized_pa_pln = roi_annualized.roi_pa_pln

            # Agregacja do atrybutów modelu
            metrics.quantity += op.quantity
            metrics.historical_cost += op.value_buy
            metrics.historical_cost_pln += op.value_buy * op.fx_buy
            metrics.current_value += op.current_value
            metrics.current_value_pln += op.current_value * fx_effective_rate_sell
            metrics.unrealized_profit += op.unrealized_profit
            metrics.unrealized_profit_pln += op.unrealized_profit_pln

        return metrics

    def _process_closed_positions(self, closed_positions: List[ClosedPosition]) -> ClosedPositionsMetrics:
        """Przetwarza zamknięte pozycje i agreguje zyski do modelu Pydantic."""
        metrics = ClosedPositionsMetrics()

        for cp in closed_positions:
            # Obliczenie i przypisanie wartości PLN do obiektu
            cp.realized_profit_pln = FXCalculator.realized_pln(
                cp.value_buy, cp.fx_buy, cp.value_sell, cp.fx_sell
            )

            # Agregacja do atrybutów modelu
            metrics.realized_profit += cp.realized_profit
            metrics.realized_profit_pln += cp.realized_profit_pln

        return metrics
    
    def _build_asset_data(self, asset: Asset, pb_result: PositionBuilderResult, prices: MarketPriceData) -> ExchangeData:

        open_positions = pb_result.open_positions
        closed_positions = pb_result.closed_positions

        # 1) Obliczenia dla pozycji otwartych i zamkniętych (zwracają modele Pydantic)
        open_metrics = self._process_open_positions(open_positions, prices.fx_effective_rate_sell)
        assert pb_result.unrealized_profit == open_metrics.unrealized_profit, ''
        assert pb_result.unrealized_profit_pln == open_metrics.unrealized_profit_pln, ''

        closed_metrics = self._process_closed_positions(closed_positions)
        assert pb_result.realized_profit == closed_metrics.realized_profit, ''
        assert pb_result.realized_profit_pln == closed_metrics.realized_profit_pln, ''

        # 2) Zysk z odsetek
        interest_profit = pb_result.interest_profit
        interest_profit_pln = pb_result.interest_profit_pln

        # 3) Zysk nominalny
        total_profit = pb_result.realized_profit + interest_profit + pb_result.unrealized_profit
        total_profit_pln = pb_result.realized_profit_pln + interest_profit_pln + pb_result.unrealized_profit_pln

        # 4) ROI bezwzględne
        historical_cost = open_metrics.historical_cost
        historical_cost_pln = open_metrics.historical_cost_pln

        roi_realized = pb_result.realized_profit / historical_cost if historical_cost > 0 else 0.0
        roi_realized_pln = pb_result.realized_profit_pln / historical_cost_pln if historical_cost_pln > 0 else 0.0

        roi_unrealized = pb_result.unrealized_profit / historical_cost if historical_cost > 0 else 0.0
        roi_unrealized_pln = pb_result.unrealized_profit_pln / historical_cost_pln if historical_cost_pln > 0 else 0.0

        roi = total_profit / historical_cost if historical_cost > 0 else 0.0
        roi_pln = total_profit_pln / historical_cost_pln if historical_cost_pln > 0 else 0.0

        # 5) Annualized ROI
        roi_unrealized_annualized = calculate_annualized_roi(open_positions, [])
        roi_unrealized_pa = roi_unrealized_annualized.roi_pa
        roi_unrealized_pa_pln = roi_unrealized_annualized.roi_pa_pln

        roi_realized_annualized = calculate_annualized_roi([], closed_positions)
        roi_realized_pa = roi_realized_annualized.roi_pa
        roi_realized_pa_pln = roi_realized_annualized.roi_pa_pln

        roi_annualized = calculate_annualized_roi(open_positions, closed_positions)
        roi_pa = roi_annualized.roi_pa
        roi_pa_pln = roi_annualized.roi_pa_pln

        # 6) Średnie historyczne
        qty = open_metrics.quantity
        
        avg_price = historical_cost / qty if qty > 0 else 0.0
        avg_price_pln = historical_cost_pln / qty if qty > 0 else 0.0
        avg_fx_rate = historical_cost_pln / historical_cost if historical_cost > 0 else 0.0

        # 7) Budowa obiektów końcowych
        base_data = self._build_asset_base_data(
            ticker=asset.ticker,
            name=asset.name,
            type=asset.asset_type.value,
            category1=asset.category1.value,
            category2=asset.category2.value,
            currency=asset.currency
        )

        summary = self._build_asset_summary(
            quantity=qty,
            avg_price=avg_price,
            avg_price_pln=avg_price_pln,
            avg_fx_rate=avg_fx_rate,

            realized_profit=closed_metrics.realized_profit,
            roi_realized=roi_realized,
            roi_realized_pa=roi_realized_pa,
            
            realized_profit_pln=closed_metrics.realized_profit_pln,
            roi_realized_pln=roi_realized_pln,
            roi_realized_pa_pln=roi_realized_pa_pln,

            unrealized_profit=open_metrics.unrealized_profit,
            roi_unrealized=roi_unrealized,
            roi_unrealized_pa=roi_unrealized_pa,

            unrealized_profit_pln=open_metrics.unrealized_profit_pln,
            roi_unrealized_pln=roi_unrealized_pln,
            roi_unrealized_pa_pln=roi_unrealized_pa_pln,    

            interest_profit_pln=interest_profit_pln,

            total_profit=total_profit,
            roi=roi,
            roi_pa=roi_pa,

            total_profit_pln=total_profit_pln,
            roi_pln=roi_pln,
            roi_pa_pln=roi_pa_pln
        )
        
        current_data = self._build_asset_current_data(
            price=prices.price,
            value=open_metrics.current_value,
            value_pln=open_metrics.current_value_pln,
            currency=asset.currency,
            fx_rate=prices.fx_rate,
            fx_effective_rate_buy=prices.fx_effective_rate_buy,
            fx_effective_rate_sell=prices.fx_effective_rate_sell,
            fx_datetime=prices.fx_datetime,
            price_datetime=prices.price_datetime
        )

        asset_data = ExchangeData(
            base_data=base_data,
            summary=summary,
            current_data=current_data,
            open_positions=open_positions,
            closed_positions=closed_positions
        )

        return asset_data

    # ---------------------------------------------------------
    # HELPERS
    # ---------------------------------------------------------
    def _find_asset(self, assets, ticker):
        return next(a for a in assets if a.ticker == ticker)
