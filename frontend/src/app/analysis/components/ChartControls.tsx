import React from 'react';

interface ChartControlsProps {
    ticker: string;
    period: string;
    onTickerChange: (ticker: string) => void;
    onPeriodChange: (period: string) => void;
    onFetch: () => void;
    isLoading: boolean;
}

const PERIODS = [
    { label: '1 Mies.', value: '1mo' },
    { label: '3 Mies.', value: '3mo' },
    { label: '6 Mies.', value: '6mo' },
    { label: '1 Rok', value: '1y' },
    { label: '5 Lat', value: '5y' },
    { label: 'Max', value: 'max' },
];

export const ChartControls = ({ ticker, period, onTickerChange, onPeriodChange, onFetch, isLoading }: ChartControlsProps) => {
    return (
        <div className="flex flex-col gap-4 p-5 mb-6 bg-white border border-slate-200 rounded-xl shadow-sm sm:flex-row sm:items-end">
            <div className="flex-1">
                <label className="block mb-1 text-sm font-medium text-slate-700">Symbol (Ticker)</label>
                <input
                    type="text"
                    value={ticker}
                    onChange={(e) => onTickerChange(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && onFetch()}
                    className="w-full px-4 py-2 border rounded-lg outline-none border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="np. AAPL"
                />
            </div>

            <div className="flex-1">
                <label className="block mb-1 text-sm font-medium text-slate-700">Zakres czasowy</label>
                <div className="flex gap-2">
                    {PERIODS.map((p) => (
                        <button
                            key={p.value}
                            onClick={() => onPeriodChange(p.value)}
                            className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${period === p.value
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                }`}
                        >
                            {p.label}
                        </button>
                    ))}
                </div>
            </div>

            <button
                onClick={onFetch}
                disabled={isLoading}
                className="px-6 py-2 font-medium text-white transition-colors bg-blue-600 rounded-lg shadow-sm hover:bg-blue-700 disabled:bg-blue-400"
            >
                {isLoading ? 'Ładowanie...' : 'Analizuj'}
            </button>
        </div>
    );
};