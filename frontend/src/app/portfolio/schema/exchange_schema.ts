import { OpenPosition, ClosedPosition } from "./main_table_schema";

export interface ExchangeBaseData {
    ticker: string;
    name: string;
    type: string;
    category1: string;
    category2: string;
    currency: string;
}

export interface ExchangeSummary {
    // --- STARE POLA: średnie oraz zysk
    avg_price: number;
    avg_price_pln: number;
    avg_fx_rate: number;

    realized_profit_pln: number;
    roi_realized_pln: number;
    roi_realized_pa_pln: number;

    unrealized_profit_pln: number;
    roi_unrealized_pln: number;
    roi_unrealized_pa_pln: number;

    total_profit_pln: number;
    roi_pln: number;
    roi_pa_pln: number;

    // --- NOWE POLA: Skala i Wolumen ---
    total_quantity: number;
    total_quantity_open: number;
    total_quantity_closed: number;
    total_invested_pln: number;
    total_withdrawn_pln: number;

    // --- NOWE POLA: Atrybucja wyniku ---
    roi_attribution_asset_pln: number;
    roi_attribution_fx_pln: number;
}

export interface ExchangeFXData {
    currency: string;

    fx_rate: number;
    fx_effective_rate_buy: number;
    fx_effective_rate_sell: number;

    fx_datetime: string;
}

export interface ExchangeCurrentData {
    price: number;
    value: number;
    value_pln: number;
    fx_data: ExchangeFXData;
    price_datetime: string;
}

export interface ExchangeData {
    base_data: ExchangeBaseData;
    summary: ExchangeSummary;
    current_data: ExchangeCurrentData;
    open_positions: OpenPosition[];
    closed_positions: ClosedPosition[];
}

export interface DashboardExchangeResponse {
    data: ExchangeData[];
}