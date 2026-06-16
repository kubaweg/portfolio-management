import { OpenPosition, ClosedPosition } from './exchange'

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

