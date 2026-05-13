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
    current_value: number;
    interest: number;
    profit: number;
    roi: number;
    annualized_roi: number;
    allocation: Record<string, number>; // Dynamiczne mapowanie klas aktywów (np. ETC, ETF)
    instrument_data: InstrumentChartData[];
    instrument_data_aggregated: any[]; // Na przyszłe agregacje
}

export interface InstrumentChartData {
    label: string;
    category1: string;
    category2: string;
    value: number;
    type: string;
}

/**
 * Szczegółowe dane pojedynczego aktywa
 */
export interface AssetDetail {
    base_data: AssetBaseData;
    summary: AssetSummary;
    current_data: AssetCurrentData;
    open_positions: OpenPosition[];
    closed_positions: ClosedPosition[];
}

export interface AssetBaseData {
    ticker: string;
    name: string;
    type: string;
    category1: string;
    category2: string;
    currency: string;
}

export interface AssetSummary {
    quantity: number;
    avg_price: number;
    avg_price_pln: number;
    avg_fx_rate: number;
    realized_profit: number;
    realized_profit_pln: number;
    unrealized_profit: number;
    unrealized_profit_pln: number;
    interest_profit: number;
    interest_profit_pln: number;
    profit_loss: number;
    profit_loss_pln: number;
    roi: number;
    roi_pln: number;
    roi_pa: number;
    roi_pa_pln: number;
}

export interface AssetCurrentData {
    price: number;
    value: number;
    value_pln: number;
    fx_data: FXData;
    price_datetime: string; // ISO Date String
}

export interface FXData {
    currency: string;
    fx_rate: number;
    fx_effective_rate: number;
    fx_datetime: string;
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