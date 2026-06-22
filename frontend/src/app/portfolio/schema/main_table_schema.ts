import { BondData } from './bond_schema';
import { ExchangeData } from './exchange_schema';


export interface OpenPosition {
    ticker: string;
    quantity: number;
    date_buy: string;

    value_buy: number;
    current_value: number;

    fx_buy: number;
    fx_current: number;
    fx_percentage_impact: number;

    unrealized_profit: number;
    roi_unrealized: number;
    roi_unrealized_pa: number;

    unrealized_profit_pln: number;
    roi_unrealized_pln: number;
    roi_unrealized_pa_pln: number;
}

export interface ClosedPosition {
    ticker: string;
    quantity: number;

    date_buy: string;
    date_sell: string;

    value_buy: number;
    value_sell: number;

    fx_buy: number;
    fx_sell: number;
    fx_percentage_impact: number;

    realized_profit: number;
    roi_realized: number;
    roi_realized_pa: number;

    realized_profit_pln: number;
    roi_realized_pln: number;
    roi_realized_pa_pln: number;
}


export interface ChartItem {

    type: string;

    label: string;
    invested_pln: number;
    invested_pct: number;
    current_pln: number;
    current_pct: number;
}

export interface DashboardSummaryData {
    // 1. Zainwestowany kapitał
    invested_pln: number;
    invested_pln_detailed: Record<string, number>;

    // 2. Bieżąca wartość portfela
    current_value_pln: number;
    current_value_pln_detailed: Record<string, number>;

    // 3. Bieżąca wartość + odsetki/dywidendy
    current_value_with_interest_pln: number;
    current_value_with_interest_pln_detailed: Record<string, number>;

    // 4. Zysk niezrealizowany + ROI
    unrealized_profit_pln_gross: number;
    unrealized_profit_pln_gross_detailed: Record<string, number>;
    unrealized_roi_gross: number;
    unrealized_roi_gross_detailed: Record<string, number>;

    // 5. Zysk zrealizowany + ROI
    realized_profit_pln_gross: number;
    realized_profit_pln_gross_detailed: Record<string, number>;
    realized_roi_gross: number;
    realized_roi_gross_detailed: Record<string, number>;

    // 6. Całkowity zysk + ROI
    total_profit_pln_gross: number;
    total_profit_pln_gross_detailed: Record<string, number>;
    total_roi_gross: number;
    total_roi_gross_detailed: Record<string, number>;
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