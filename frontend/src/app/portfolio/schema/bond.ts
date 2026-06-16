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