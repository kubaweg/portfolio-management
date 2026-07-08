from typing import List

from app.core.cash.schemas.dto import (
    CashFlow,
    CashFlowInstance,
    CashFlowSummary,
    CashFlowType,
    FinancialAggregation,
    FinancialAggregationInstance,
    FinancialSummary,
)
from app.core.xirr import XIRRCalculator


class CashFlowEngine:
    """Silnik agregujący surowe przepływy pieniężne (CashFlowSummary)
    w gotowe metryki biznesowe i rentowności (FinancialSummary).
    """

    def __init__(self):
        self._xirr_calculator = XIRRCalculator()

    def calculate_summary(self, summary_in: CashFlowSummary) -> FinancialSummary:
        """Główna metoda transformująca zestawienia przepływów w podsumowanie finansowe."""
        gross_aggregation = self._aggregate_flow_state(summary_in.gross)
        net_aggregation = self._aggregate_flow_state(summary_in.net)

        total_tax_impact = gross_aggregation.total.profit - net_aggregation.total.profit

        return FinancialSummary(
            gross=gross_aggregation,
            net=net_aggregation,
            total_tax_impact=max(0.0, round(total_tax_impact, 2)),
        )

    def _aggregate_flow_state(self, cash_flow: CashFlow) -> FinancialAggregation:
        """Agreguje poszczególne stany w ramach jednego profilu (netto/brutto)."""
        return FinancialAggregation(
            realized=self._calculate_metrics(cash_flow.realized),
            unrealized=self._calculate_metrics(cash_flow.unrealized),
            total=self._calculate_metrics(cash_flow.total),
        )

    def _calculate_metrics(
        self, instances: List[CashFlowInstance]
    ) -> FinancialAggregationInstance:
        """Wylicza kapitał, zysk oraz wskaźniki ROI i ROI p.a."""
        if not instances:
            return FinancialAggregationInstance(
                invested_capital=0.0, profit=0.0, roi=0.0, roi_pa=None
            )

        invested_capital = sum(
            abs(cf.value) for cf in instances if cf.flow_type == CashFlowType.BUY
        )

        profit = sum(cf.value for cf in instances)

        roi = 0.0
        if invested_capital > 1e-4:
            roi = profit / invested_capital

        roi_pa = self._xirr_calculator.calculate(instances)

        return FinancialAggregationInstance(
            invested_capital=round(invested_capital, 2),
            profit=round(profit, 2),
            roi=round(roi, 4),
            roi_pa=round(roi_pa, 4) if roi_pa is not None else None,
        )