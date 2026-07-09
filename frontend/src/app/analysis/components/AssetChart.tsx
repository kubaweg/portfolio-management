import React, { useMemo } from 'react';
import {
    ComposedChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    ReferenceLine,
    Scatter
} from 'recharts';
import { ChartResponse, MergedChartData } from '../schema';

// ==========================================
// 1. CUSTOMOWE KSZTAŁTY ŚWIEC (SVG)
// ==========================================

// Rysuje pionową linię od wartości Low do High
const CandleWick = (props: any) => {
    const { x, y, width, height, payload } = props;
    const isUp = payload.close >= payload.open;
    const fill = isUp ? '#10b981' : '#ef4444'; // Szmaragdowy (Wzrost) / Karmazynowy (Spadek)
    const centerX = x + width / 2;

    return <line x1={centerX} y1={y} x2={centerX} y2={y + height} stroke={fill} strokeWidth={1.5} />;
};

// Rysuje prostokąt od Open do Close (lub na odwrót)
const CandleBody = (props: any) => {
    const { x, y, width, height, payload } = props;
    const isUp = payload.close >= payload.open;
    const fill = isUp ? '#10b981' : '#ef4444';

    // Zabezpieczenie na wypadek, gdyby Open == Close (aby zawsze widzieć kreskę o grubości 1px)
    const rectHeight = height > 0 ? height : 1;

    return <rect x={x} y={y} width={width} height={rectHeight} fill={fill} stroke={fill} />;
};

// Niestandardowy dymek z danymi po najechaniu kursorem
const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        // Wyciągamy dane z pierwszego lepszego elementu (wszystkie mają ten sam payload)
        const data = payload[0].payload as MergedChartData;
        return (
            <div className="p-3 text-sm bg-white border border-slate-200 rounded-lg shadow-lg">
                <p className="mb-2 font-semibold text-slate-700">{label}</p>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                    <span className="text-slate-500">Otwarcie:</span>
                    <span className="font-medium">{data.open.toFixed(2)}</span>
                    <span className="text-slate-500">Max (High):</span>
                    <span className="font-medium text-slate-900">{data.high.toFixed(2)}</span>
                    <span className="text-slate-500">Min (Low):</span>
                    <span className="font-medium text-slate-900">{data.low.toFixed(2)}</span>
                    <span className="text-slate-500">Zamknięcie:</span>
                    <span className="font-medium">{data.close.toFixed(2)}</span>
                    <span className="text-slate-500">Wolumen:</span>
                    <span className="font-medium">{data.volume.toLocaleString()}</span>
                </div>
            </div>
        );
    }
    return null;
};

// ==========================================
// 2. GŁÓWNY KOMPONENT WYKRESU
// ==========================================

interface AssetChartProps {
    data: ChartResponse | null;
}

export const AssetChart = ({ data }: AssetChartProps) => {
    const mergedData = useMemo(() => {
        if (!data) return [];

        const dataMap = new Map<string, MergedChartData>();

        // 1. Inicjalizacja danymi OHLC
        data.historical_data.forEach(d => {
            dataMap.set(d.date, {
                date: d.date,
                open: d.open,
                high: d.high,
                low: d.low,
                close: d.close,
                volume: 0,
                wick: [d.low, d.high],
                body: [Math.min(d.open, d.close), Math.max(d.open, d.close)]
            });
        });

        // 2. Dodanie wolumenu
        data.historical_volume.forEach(v => {
            if (dataMap.has(v.date)) {
                dataMap.get(v.date)!.volume = v.volume;
            }
        });

        // 3. Punkty transakcyjne
        data.transactions.forEach(t => {
            if (dataMap.has(t.date)) {
                const entry = dataMap.get(t.date)!;
                if (t.type.toUpperCase() === 'BUY') {
                    entry.transaction_buy = t.price; // Kropka dokładnie na cenie zakupu
                } else if (t.type.toUpperCase() === 'SELL') {
                    entry.transaction_sell = t.price; // Kropka dokładnie na cenie sprzedaży
                }
            }
        });

        return Array.from(dataMap.values()).sort((a, b) => a.date.localeCompare(b.date));
    }, [data]);

    if (!data) return <div className="p-8 text-center text-slate-500">Brak danych do wyświetlenia.</div>;

    return (
        <div className="w-full h-[550px] p-4 bg-white border border-slate-200 rounded-xl shadow-sm">
            <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={mergedData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />

                    <XAxis
                        dataKey="date"
                        tick={{ fill: '#64748b', fontSize: 12 }}
                        tickFormatter={(val) => val.substring(5)} // Ucinamy rok (MM-DD) dla czytelności
                        minTickGap={40}
                    />

                    {/* Oś Y dla wykresu świecowego. Domeny automatyczne dopasują się do wicks. */}
                    <YAxis
                        yAxisId="price"
                        domain={['auto', 'auto']}
                        tick={{ fill: '#64748b', fontSize: 12 }}
                        tickFormatter={(val) => val.toFixed(2)}
                    />

                    {/* Ukryta oś Y dla wolumenu */}
                    <YAxis
                        yAxisId="volume"
                        orientation="right"
                        domain={[0, 'dataMax * 5']}
                        hide
                    />

                    <Tooltip content={<CustomTooltip />} />

                    {/* 1. Wolumen jako słupki w tle */}
                    <Bar yAxisId="volume" dataKey="volume" fill="#cbd5e1" opacity={0.4} />

                    {/* 2. Cienie/Knoty (Wicks) */}
                    <Bar yAxisId="price" dataKey="wick" shape={<CandleWick />} />

                    {/* 3. Ciała (Bodies) */}
                    <Bar yAxisId="price" dataKey="body" shape={<CandleBody />} />

                    {/* Opcjonalnie: Referencyjna średnia cena zakupu */}
                    {data.avg_price && (
                        <ReferenceLine
                            yAxisId="price"
                            y={data.avg_price}
                            stroke="#f59e0b"
                            strokeDasharray="5 5"
                            label={{ position: 'top', value: 'Twoja śr. cena', fill: '#f59e0b', fontSize: 12 }}
                        />
                    )}

                    {/* Oznaczenia Transakcji użytkownika */}
                    <Scatter yAxisId="price" dataKey="transaction_buy" fill="#059669" name="Kupno" stroke="#ffffff" strokeWidth={1} />
                    <Scatter yAxisId="price" dataKey="transaction_sell" fill="#dc2626" name="Sprzedaż" stroke="#ffffff" strokeWidth={1} />
                </ComposedChart>
            </ResponsiveContainer>
        </div>
    );
};