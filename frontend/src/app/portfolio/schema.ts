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

/* Informacje dot. obligacji */
export type PeriodStatus = 'PAST' | 'CURRENT' | 'FUTURE';

export interface EarlyRedemptionSimulation {
    accrued_interest: number;
    penalty_applied: number;
    tax_applied: number;
    net_payout: number;
}

export interface BondInterestPeriod {
    period_number: number;
    start_date: string; // Daty przychodzą z JSON jako stringi "YYYY-MM-DD"
    end_date: string;
    status: PeriodStatus;
    base_capital: number;
    base_capital_per_bond: number;
    interest_rate: number;
    is_rate_estimated: boolean;
    benchmark_value: number | null;
    margin: number;
    gross_interest: number;
    gross_interest_per_bond: number;
    is_capitalized: boolean;
    ending_capital: number;
    ending_capital_per_bond: number;
    days_elapsed: number | null;
    days_total: number;
    accrued_interest_to_date: number | null;
    early_redemption: EarlyRedemptionSimulation | null;
}

// --- DODAJ TE DWA NOWE INTERFEJSY ---
export interface BondAssetSummary {
    bond_symbol: string;
    total_invested: number;
    current_working_capital: number;
    realized_profit_gross: number;
    realized_profit_net: number;
    unrealized_profit_gross: number;
    unrealized_profit_net: number;
    total_profit_net: number;
    current_value: number;
    current_early_redemption_value: number;
    current_interest_rate: number;
    roi_net: number;
    annualized_roi_net: number;
    days_to_maturity: number;
    overall_progress_percent: number;
    projected_total_gross_profit: number;
    projected_total_net_profit: number;
    projected_maturity_payout: number;
}

export interface BondDataPayload {
    periods: BondInterestPeriod[];
    summary: BondAssetSummary;
}

// --- PODMIEŃ TEN INTERFEJS ---
export interface BondPortfolioResponse {
    data: {
        [ticker: string]: BondDataPayload;
    };
}