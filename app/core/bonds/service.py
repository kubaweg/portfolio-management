from datetime import date
from typing import List

from app.core.bonds.bond_service_utils import PortfolioBuilder, PortfolioBuilderResult
from app.core.bonds.schemas.dto import (
    BondData,
    BondBaseData, BondSummary, BondCurrentData, BondEarlyRedemption
)

from app.schemas.domain.assets import RetailBondBenchmark, InterestHandling, CouponFrequency
from app.schemas.database.asset import Bond
from app.schemas.mappers import TransactionMapper
from app.schemas.groupers import group_by_ticker

class BondEngine:

    TAX_RATE = 0.19

    ### Metoda główna

    def build_portfolio(self, bonds: List[Bond]) -> List[BondData]:

        domain_map = self._map_sqlalchemy_to_domain(bonds)
        grouped = group_by_ticker(self._flatten(domain_map))

        portfolio: List[BondData] = []
        pb = PortfolioBuilder()

        for tt in grouped:
            bond = self._find_asset(bonds, tt.ticker)

            pb_result = pb.build(
                tt=tt,
                calculation_date=date.today(),
                nominal_value=float(bond.nominal_value),                                    # type: ignore
                issue_date=bond.issue_date,                                                 # type: ignore
                maturity_date=bond.maturity_date,                                           # type: ignore
                coupon_frequency=CouponFrequency(bond.coupon_frequency),
                interest_handling=InterestHandling(bond.interest_handling),
                initial_rate=float(bond.initial_rate),                                      # type: ignore
                is_indexed=bond.is_indexed,                                                 # type: ignore
                margin=float(bond.margin) if bond.margin is not None else 0.0,              # type: ignore
                benchmark=RetailBondBenchmark(bond.benchmark) if bond.benchmark is not None else None
            )
            
            bond_data = self._build_bond_data(
                bond=bond,
                pb_result=pb_result
            )
            portfolio.append(bond_data)

        return portfolio

    ### Metody pomocnicze
    def _build_bond_data(self, bond: Bond, pb_result: PortfolioBuilderResult) -> BondData:

        base_data: BondBaseData = self._build_bond_base_data(...)
        summary: BondSummary = self._build_bond_summary(...)
        current_data: BondCurrentData = self._build_bond_current_data(...)

        periods = pb_result.periods
        cash_flows = pb_result.cash_flows
        early_redemptions = pb_result.early_redemptions

        return BondData(
            base_data=base_data,
            summary=summary,
            current_data=current_data,

            periods=periods,
            cash_flows=cash_flows,
            early_redemptions=early_redemptions
        )
    
    def _build_bond_base_data(self, ...) -> BondBaseData:
        ...
        return BondBaseData(...)
    
    def _build_bond_summary(self, ...) -> BondSummary:
        ...
        return BondSummary(...)
    
    def _build_bond_current_data(self, ...) -> BondCurrentData:
        ...
        return BondCurrentData(...)
    
    def _build_bond_early_redemptions(self, ...) -> List[BondEarlyRedemption]:
        
        early_redemptions: List[BondEarlyRedemption] = []

        ...

        return early_redemptions
    
    # Mapowanie SQLAlchemy → domena
    def _map_sqlalchemy_to_domain(self, assets: List[Bond]):
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
