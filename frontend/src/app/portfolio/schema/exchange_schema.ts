export interface OpenPosition {
    ticker: string;
    quantity: number;
    date_buy: string;
    value_buy: number;
    fx_buy: number;
    current_value: number;
    unrealized_profit: number;
    unrealized_profit_pln: number;
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
    realized_profit: number;
    realized_profit_pln: number;
}

export interface ExchangeBaseData {
    ticker: string;
    name: string;
    type: string;
    category1: string;
    category2: string;
    currency: string;
}

export interface ExchangeSummary {
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

export interface ExchangeFXData {
    currency: string;
    fx_rate: number;
    fx_effective_rate: number;
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