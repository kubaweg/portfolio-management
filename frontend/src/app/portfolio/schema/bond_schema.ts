import { OpenPosition, ClosedPosition } from "./main_table_schema";

export type PeriodStatus = 'PAST' | 'CURRENT' | 'FUTURE';
export type EarlyRedemptionType = 'FORFEIT_INTEREST' | 'FEE';

export interface BondEarlyRedemption {
    redemption_date: string; // Format 'YYYY-MM-DD'
    quantity: number;
    penalty_method: EarlyRedemptionType;
    penalty_per_unit: number;
}

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

// NOWY MODEL: Wycena bieżąca (zgodna z silnikiem)
export interface BondCurrentData {
    price: number;
    interest_rate: number;
    value_pln: number;
    price_datetime: string;
}

// ZAKTUALIZOWANY MODEL: Podsumowanie (zastępuje BondAssetSummary)
export interface BondSummary {
    quantity: number;
    total_invested: number;

    realized_profit_gross: number;
    realized_profit_net: number;
    roi_realized_net: number;
    roi_realized_pa_net: number;

    unrealized_profit_gross: number;
    unrealized_profit_net: number;
    roi_unrealized_net: number;
    roi_unrealized_pa_net: number;

    interest_profit_net: number;
    total_profit_net: number;

    roi_net: number;
    roi_pa_net: number;

    days_to_maturity: number;
    overall_progress_percent: number;
}

// ZAKTUALIZOWANY MODEL GŁÓWNY
export interface BondData {
    base_data: BondBaseData;
    summary: BondSummary;
    current_data: BondCurrentData;
    periods: BondInterestPeriod[];

    // Listy obsługujące transakcje (zgodne z orkiestratorem na backendzie)
    open_positions: OpenPosition[];       // TODO: Otypować zgodnie z modelem Position
    closed_positions: ClosedPosition[];     // TODO: Otypować zgodnie z modelem Position
    early_redemptions: BondEarlyRedemption[];    // TODO: Otypować zgodnie z modelem EarlyRedemption
}

export interface DashboardBondResponse {
    data: BondData[];
}