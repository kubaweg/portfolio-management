import { AssetDetail } from './main_table'

/**
 * Główny interfejs odpowiedzi z API
 */
export interface PortfolioResponse {
    totals: PortfolioTotals;
    asset_data: AssetDetail[];
}

/**
 * Podsumowanie całego portfela
 */
export interface PortfolioTotals {
    invested_value: number;
    invested_value_detailed: Record<string, number>;

    current_value: number;
    current_value_detailed: Record<string, number>;

    realized_profit: number;
    realized_profit_detailed: Record<string, number>;

    unrealized_profit: number;
    unrealized_profit_detailed: Record<string, number>;

    interest: number;
    interest_detailed: Record<string, number>;

    profit: number;
    profit_detailed: Record<string, number>;

    roi: number;
    roi_detailed: Record<string, number>;

    annualized_roi: number;
    annualized_roi_detailed: Record<string, number>;

    instrument_data: InstrumentChartData[];
}

export interface InstrumentChartData {
    label: string;
    category1: string;
    category2: string;
    value: number;
    type: string;
}

/**
 * Historia transakcji dla instrumentu
 */
export interface OpenPosition {
    ticker: string;
    quantity: number;
    value_buy: number;
    fx_buy: number;
    current_value: number;
    unrealized_profit: number;
    unrealized_profit_pln: number;
}

export interface ClosedPosition {
    ticker: string;
    quantity: number;
    value_buy: number;
    value_sell: number;
    fx_buy: number;
    fx_sell: number;
    realized_profit: number;
    realized_profit_pln: number;
}