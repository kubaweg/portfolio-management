import { BondData } from './bond_schema';
import { ExchangeData } from './exchange_schema';

export interface ChartItem {

    type: string;

    label: string;
    invested_pln: number;
    invested_pct: number;
    current_pln: number;
    current_pct: number;
}

export interface DashboardSummaryData {
    invested_pln: number;
    current_value_pln: number;
    profit_loss_pln: number;
    roi_pln: number;
}

export interface DashboardAllocationChartsData {
    by_type: ChartItem[];
    by_category2: ChartItem[];
    by_name: ChartItem[];
    by_ticker: ChartItem[];
}

export interface DashboardMainTableRowData {
    ticker: string;
    name: string;
    quantity: string;
    current_value_pln: number;
    roi_pln: number;
    total_profit_gross_pln: number;
}

export interface RowDetailsBond {
    data: BondData;
}

export interface RowDetailsExchange {
    data: ExchangeData;
}

export interface DashboardMainTableRowDetailsData {
    type: 'BOND' | 'EXCHANGE';
    details: RowDetailsBond | RowDetailsExchange;
}

export interface DashboardMainTableData {
    data: DashboardMainTableRowData[];
}

export interface DashboardMainTableDetailsData {
    data: DashboardMainTableRowDetailsData[];
}

export interface DashboardMainPageOutput {
    summary: DashboardSummaryData;
    charts: DashboardAllocationChartsData;
    main_table: DashboardMainTableData;
    details: DashboardMainTableDetailsData;
}