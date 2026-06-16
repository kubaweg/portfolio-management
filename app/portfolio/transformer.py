from datetime import date
from typing import Tuple, List

from app.schemas.dto.portfolio import (
    DashboardMainPageInput, DashboardMainPageOutput,
    DashboardSummaryData, DashboardAllocationChartsData, DashboardMainTableData, DashboardMainTableDetailsData,
    DashboardMainTableRowData, DashboardMainTableRowDetailsData,
    RowDetailsExchange, RowDetailsBond
)


class DashboardTransformer:
    def build_dashboard(self, input_data: DashboardMainPageInput) -> DashboardMainPageOutput:
        """Główny punkt wejścia transformatora."""
        
        # 1. Przetwarzanie Tabeli i Detali (zwraca listę wierszy i listę detali)
        table_rows, details_rows = self._build_table_and_details(input_data)
        
        return DashboardMainPageOutput(
            summary=self._calculate_summary(input_data),
            charts=self._calculate_charts(input_data),
            main_table=DashboardMainTableData(data=table_rows),
            details=DashboardMainTableDetailsData(data=details_rows)
        )

    def _build_table_and_details(self, input_data) -> Tuple[List[DashboardMainTableRowData], List[DashboardMainTableRowDetailsData]]:
        table_rows = []
        details_rows = []

        # Przetwarzanie Giełdy
        for item in input_data.exchange_response.data:
            table_rows.append(self._map_exchange_to_row(item))
            details_rows.append(DashboardMainTableRowDetailsData(
                type="EXCHANGE",
                details=RowDetailsExchange(data=item)
            ))

        # Przetwarzanie Obligacji
        for item in input_data.bond_response.data:
            table_rows.append(self._map_bond_to_row(item))
            details_rows.append(DashboardMainTableRowDetailsData(
                type="BOND",
                details=RowDetailsBond(data=item)
            ))

        return table_rows, details_rows

    def _map_exchange_to_row(self, item) -> DashboardMainTableRowData:
        """Adapter: ExchangeData -> DashboardMainTableRowData"""
        return DashboardMainTableRowData(
            ticker=item.base_data.ticker,
            name=item.base_data.name,
            quantity=str(item.summary.quantity),
            current_value_pln=item.current_data.value_pln,
            roi_pln=item.summary.roi_pln,
            total_profit_gross_pln=item.summary.profit_loss_pln
        )

    def _map_bond_to_row(self, item) -> DashboardMainTableRowData:
        """Adapter: BondData -> DashboardMainTableRowData"""
        return DashboardMainTableRowData(
            ticker=item.base_data.ticker, # lub inna identyfikacja obligacji
            name="Obligacje Skarbowe",
            quantity=str(item.summary.quantity),
            current_value_pln=item.summary.current_value,
            roi_pln=item.summary.roi_net,
            total_profit_gross_pln=item.summary.total_profit_net
        )

    def _calculate_summary(self, input_data) -> DashboardSummaryData:
        """Suma portfela (Exchange + Bonds) dla kafelków dashboardu."""
        
        # 1. Agregacja z Exchange (giełda)
        exch_invested = sum(item.summary.avg_price_pln * item.summary.quantity for item in input_data.exchange_response.data)
        exch_current = sum(item.current_data.value_pln for item in input_data.exchange_response.data)
        exch_profit = sum(item.summary.profit_loss_pln for item in input_data.exchange_response.data)
        
        # 2. Agregacja z Bond (obligacje)
        bond_invested = sum(item.summary.total_invested for item in input_data.bond_response.data)
        bond_current = sum(item.summary.current_value for item in input_data.bond_response.data)
        bond_profit = sum(item.summary.total_profit_net for item in input_data.bond_response.data)
        
        # 3. Sumowanie globalne
        total_invested = exch_invested + bond_invested
        total_current = exch_current + bond_current
        total_profit = exch_profit + bond_profit
        
        # Unikamy dzielenia przez zero
        global_roi = (total_profit / total_invested) if total_invested > 0 else 0.0
        
        return DashboardSummaryData(
            invested_pln=total_invested,
            current_value_pln=total_current,
            profit_loss_pln=total_profit,
            roi_pln=global_roi
        )

    def _calculate_charts(self, input_data) -> DashboardAllocationChartsData:
        """Agregacja portfela w różnych przekrojach."""
        
        # Przygotowanie surowych danych w formie ujednoliconej listy
        # Każdy element musi mieć: value_invested, current_value, type, category2, name
        combined_assets = []
        
        for e in input_data.exchange_response.data:
            combined_assets.append({
                "invested": e.summary.avg_price_pln * e.summary.quantity,
                "current": e.current_data.value_pln,
                "type": e.base_data.type,
                "category2": e.base_data.category2,
                "name": e.base_data.name
            })
            
        for b in input_data.bond_response.data:
            combined_assets.append({
                "invested": b.summary.total_invested,
                "current": b.summary.current_value,
                "type": b.base_data.type, # Wymuszenie spójności
                "category2": b.base_data.category2, # Stała kategoria dla obligacji
                "name": b.base_data.name
            })

        total_invested = sum(a["invested"] for a in combined_assets)
        total_current = sum(a["current"] for a in combined_assets)

        def aggregate_by(key_field: str):
            groups = {}
            for asset in combined_assets:
                key = asset.get(key_field, "Nieznane")
                if key not in groups:
                    groups[key] = {"invested": 0.0, "current": 0.0}
                groups[key]["invested"] += asset["invested"]
                groups[key]["current"] += asset["current"]
            
            # Formowanie wyniku
            return [
                {
                    "label": key,
                    "invested_pln": val["invested"],
                    "invested_pln_pct": (val["invested"] / total_invested) if total_invested > 0 else 0,
                    "current_pln": val["current"],
                    "current_pln_pct": (val["current"] / total_current) if total_current > 0 else 0
                }
                for key, val in groups.items()
            ]

        # Budowanie wynikowego obiektu (zakładając strukturę modelu DashboardAllocationChartsData)
        return DashboardAllocationChartsData(
            by_type=aggregate_by("type"),
            by_category2=aggregate_by("category2"),
            by_name=aggregate_by("name")
        )