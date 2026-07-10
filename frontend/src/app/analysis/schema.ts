export interface ChartDataPoint {
    date: string;
    open: number;
    high: number;
    low: number;
    close: number;
}

export interface VolumeDataPoint {
    date: string;
    volume: number;
}

export interface ChartTransactionPoint {
    date: string;
    type: 'BUY' | 'SELL' | string;
    quantity: number;
    price: number;
}

export interface ChartResponse {
    ticker: string;
    period: string;
    historical_data: ChartDataPoint[];
    historical_volume: VolumeDataPoint[];
    avg_price: number | null;
    transactions: ChartTransactionPoint[];
}

export interface MergedChartData {
    date: string;

    open: number;
    high: number;
    low: number;
    close: number;

    volume: number;

    // Tablice [min, max] dla Recharts, aby wyrysować przedziały w pionie
    wick: [number, number];
    body: [number, number];

    transaction_buy?: number;
    transaction_sell?: number;
}