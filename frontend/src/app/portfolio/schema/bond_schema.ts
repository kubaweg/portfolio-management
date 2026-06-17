export type PeriodStatus = 'PAST' | 'CURRENT' | 'FUTURE';
export type EarlyRedemptionType = 'FORFEIT_INTEREST' | 'FEE';

export interface BondBaseData {
    ticker: string;
    name: string;
    category1: string;
    category2: string;
    type: string;
    issue_date: string;
    maturity_date: string;
    nominal_value: number;
    interest_handling: string;
    coupon_frequency: string;
    initial_rate: number;
    is_indexed: boolean;
    margin: number;
    benchmark: string | null;
    early_redemption_type: EarlyRedemptionType;
    early_redemption_penalty: number;
}

export interface BondInterestPeriod {
    period_number: number;
    start_date: string;
    end_date: string;
    status: PeriodStatus;
    base_capital: number;
    base_capital_per_bond: number;
    interest_rate: number;
    is_rate_estimated: boolean;
    benchmark_value: number;
    margin: number;
    gross_interest: number;
    gross_interest_per_bond: number;
    is_capitalized: boolean;
    ending_capital: number;
    ending_capital_per_bond: number;
    days_elapsed: number | null;
    days_total: number;
    accrued_interest_to_date: number;
}

export interface BondAssetSummary {
    quantity: number;
    total_invested: number;
    current_working_capital: number;
    realized_profit_pln_gross: number;
    realized_profit_pln_net: number;
    unrealized_profit_pln_gross: number;
    unrealized_profit_pln_net: number;
    current_value: number;
    current_interest_rate: number;
    roi_net: number;
    annualized_roi_net: number;
    days_to_maturity: number;
    overall_progress_percent: number;
}

export interface BondData {
    base_data: BondBaseData;
    summary: BondAssetSummary;
    periods: BondInterestPeriod[];
}

export interface DashboardBondResponse {
    data: BondData[];
}