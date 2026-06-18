from datetime import date
from typing import Tuple, List

from backend.portfolio.schemas.dto import (
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
            name=item.base_data.name,
            quantity=str(item.summary.quantity),
            current_value_pln=item.summary.current_value,
            roi_pln=item.summary.roi_net,
            total_profit_gross_pln = item.summary.realized_profit_pln_gross + item.summary.unrealized_profit_pln_gross
        )

    def _calculate_summary(self, input_data) -> DashboardSummaryData:
        """Suma portfela (Exchange + Bonds) dla kafelków dashboardu z rozbiciem szczegółowym."""
        
        # =========================================================================
        # 1. Agregacja z Exchange (Giełda: ETF/ETC)
        # =========================================================================
        exch_invested = sum(
            item.summary.avg_price_pln * item.summary.quantity 
            for item in input_data.exchange_response.data
        )
        exch_current = sum(
            item.current_data.value_pln 
            for item in input_data.exchange_response.data
        )
        # Wartość + dywidendy/odsetki
        exch_current_with_interest = sum(
            item.current_data.value_pln + item.summary.interest_profit_pln 
            for item in input_data.exchange_response.data
        )
        
        exch_unrealized_gross = sum(
            item.summary.unrealized_profit_pln 
            for item in input_data.exchange_response.data
        )
        exch_realized_gross = sum(
            item.summary.realized_profit_pln 
            for item in input_data.exchange_response.data
        )
        exch_total_gross = sum(
            item.summary.profit_loss_pln 
            for item in input_data.exchange_response.data
        )
        
        # ROI dla samej giełdy
        exch_unrealized_roi = (exch_unrealized_gross / exch_invested) if exch_invested > 0 else 0.0
        exch_realized_roi = (exch_realized_gross / exch_invested) if exch_invested > 0 else 0.0
        exch_total_roi = (exch_total_gross / exch_invested) if exch_invested > 0 else 0.0

        # =========================================================================
        # 2. Agregacja z Bond (Obligacje skarbowe)
        # =========================================================================
        bond_invested = sum(
            item.summary.total_invested 
            for item in input_data.bond_response.data
        )
        bond_current = sum(
            item.summary.current_value 
            for item in input_data.bond_response.data
        )
        # Bieżąca wartość + zrealizowane już kupony odsetkowe
        bond_current_with_interest = sum(
            item.summary.current_value + item.summary.realized_profit_pln_gross 
            for item in input_data.bond_response.data
        )
        
        bond_unrealized_gross = sum(
            item.summary.unrealized_profit_pln_gross 
            for item in input_data.bond_response.data
        )
        bond_realized_gross = sum(
            item.summary.realized_profit_pln_gross 
            for item in input_data.bond_response.data
        )
        # Łączny zysk brutto dla obligacji (unrealized + realized)
        bond_total_gross = bond_unrealized_gross + bond_realized_gross
        
        # ROI dla samych obligacji
        bond_unrealized_roi = (bond_unrealized_gross / bond_invested) if bond_invested > 0 else 0.0
        bond_realized_roi = (bond_realized_gross / bond_invested) if bond_invested > 0 else 0.0
        bond_total_roi = (bond_total_gross / bond_invested) if bond_invested > 0 else 0.0

        # =========================================================================
        # 3. Sumowanie globalne (Global Sums)
        # =========================================================================
        total_invested = exch_invested + bond_invested
        total_current = exch_current + bond_current
        total_current_with_interest = exch_current_with_interest + bond_current_with_interest
        
        total_unrealized_gross = exch_unrealized_gross + bond_unrealized_gross
        total_realized_gross = exch_realized_gross + bond_realized_gross
        total_profit_gross = exch_total_gross + bond_total_gross
        
        # Globalne wskaźniki ROI
        global_unrealized_roi = (total_unrealized_gross / total_invested) if total_invested > 0 else 0.0
        global_realized_roi = (total_realized_gross / total_invested) if total_invested > 0 else 0.0
        global_total_roi = (total_profit_gross / total_invested) if total_invested > 0 else 0.0

        # =========================================================================
        # 4. Budowanie i zwracanie obiektu wyjściowego
        # =========================================================================
        return DashboardSummaryData(
            # 1. Zainwestowane
            invested_pln=total_invested,
            invested_pln_detailed={
                "exchange": exch_invested,
                "bonds": bond_invested
            },
            
            # 2. Obecna wartość rynkowa
            current_value_pln=total_current,
            current_value_pln_detailed={
                "exchange": exch_current,
                "bonds": bond_current
            },
            
            # 3. Obecna wartość + odsetki/dywidendy
            current_value_with_interest_pln=total_current_with_interest,
            current_value_with_interest_pln_detailed={
                "exchange": exch_current_with_interest,
                "bonds": bond_current_with_interest
            },
            
            # 4. Niezrealizowany zysk + ROI
            unrealized_profit_pln_gross=total_unrealized_gross,
            unrealized_profit_pln_gross_detailed={
                "exchange": exch_unrealized_gross,
                "bonds": bond_unrealized_gross
            },
            unrealized_roi_gross=global_unrealized_roi,
            unrealized_roi_gross_detailed={
                "exchange": exch_unrealized_roi,
                "bonds": bond_unrealized_roi
            },
            
            # 5. Zrealizowany zysk + ROI
            realized_profit_pln_gross=total_realized_gross,
            realized_profit_pln_gross_detailed={
                "exchange": exch_realized_gross,
                "bonds": bond_realized_gross
            },
            realized_roi_gross=global_realized_roi,
            realized_roi_gross_detailed={
                "exchange": exch_realized_roi,
                "bonds": bond_realized_roi
            },
            
            # 6. Całkowity zysk + ROI
            total_profit_pln_gross=total_profit_gross,
            total_profit_pln_gross_detailed={
                "exchange": exch_total_gross,
                "bonds": bond_total_gross
            },
            total_roi_gross=global_total_roi,
            total_roi_gross_detailed={
                "exchange": exch_total_roi,
                "bonds": bond_total_roi
            }
        )

    def _calculate_charts(self, input_data) -> DashboardAllocationChartsData:
        """Agregacja portfela z wymuszonym grupowaniem po parze (type, label)."""
        
        combined_assets = []
        
        # ... (kod zbierający combined_assets pozostaje bez zmian) ...
        for e in input_data.exchange_response.data:
            combined_assets.append({
                "invested": e.summary.avg_price_pln * e.summary.quantity,
                "current": e.current_data.value_pln,
                "type": e.base_data.type,
                "category2": e.base_data.category2,
                "name": e.base_data.name,
                "ticker": e.base_data.ticker
            })
            
        for b in input_data.bond_response.data:
            combined_assets.append({
                "invested": b.summary.total_invested,
                "current": b.summary.current_value,
                "type": b.base_data.type,
                "category2": b.base_data.category2,
                "name": b.base_data.name,
                "ticker": b.base_data.ticker
            })

        total_invested = sum(a["invested"] for a in combined_assets)
        total_current = sum(a["current"] for a in combined_assets)

        def aggregate_by(key_field: str):
            groups = {}
            for asset in combined_assets:
                # Kluczem jest teraz krotka (type, wartość_pola)
                group_key = (asset.get("type", "Nieznane"), asset.get(key_field, "Nieznane"))
                
                if group_key not in groups:
                    groups[group_key] = {"invested": 0.0, "current": 0.0}
                
                groups[group_key]["invested"] += asset["invested"]
                groups[group_key]["current"] += asset["current"]
            
            # Formowanie wyniku
            result = []
            for (asset_type, label), val in groups.items():
                result.append({
                    "type": asset_type,
                    "label": label,
                    "invested_pln": val["invested"],
                    "invested_pct": (val["invested"] / total_invested) if total_invested > 0 else 0,
                    "current_pln": val["current"],
                    "current_pct": (val["current"] / total_current) if total_current > 0 else 0
                })
            return result

        return DashboardAllocationChartsData(
            by_type=aggregate_by("type"),
            by_category2=aggregate_by("category2"),
            by_name=aggregate_by("name"),
            by_ticker=aggregate_by("ticker")
        )