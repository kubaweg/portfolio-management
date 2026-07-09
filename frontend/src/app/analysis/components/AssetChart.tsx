import React, { useMemo } from 'react';
import {
    ComposedChart,
    Line,
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

interface AssetChartProps {
    data: ChartResponse | null;
}

export const AssetChart = ({ data }: AssetChartProps) => {
    // Łączenie danych rynkowych i wolumenowych z transakcjami po dacie
    const mergedData = useMemo(() => {
        if (!data) return [];

        const dataMap = new Map<string, MergedChartData>();

        // 1. Dodajemy ceny zamknięcia
        data.historical_data.forEach(d => {
            dataMap.set(d.date, { date: d.date, close: d.close, volume: 0 });
        });

        // 2. Dodajemy wolumen
        data.historical_volume.forEach(v => {
            if (dataMap.has(v.date)) {
                dataMap.get(v.date)!.volume = v.volume;
            }
        });

        // 3. Oznaczamy punkty transakcyjne (BUY / SELL) na konkretnych datach
        data.transactions.forEach(t => {
            if (dataMap.has(t.date)) {
                const entry = dataMap.get(t.date)!;
                if (t.type.toUpperCase() === 'BUY') {
                    entry.transaction_buy = entry.close; // Umieszczamy kropkę na poziomie ceny zamknięcia w danym dniu
                } else if (t.type.toUpperCase() === 'SELL') {
                    entry.transaction_sell = entry.close;
                }
            }
        });

        return Array.from(dataMap.values()).sort((a, b) => a.date.localeCompare(b.date));
    }, [data]);

    if (!data) return <div className="p-8 text-center text-slate-500">Brak danych do wyświetlenia.</div>;

    return (
        <div className="w-full h-[500px] p-4 bg-white border border-slate-200 rounded-xl shadow-sm">
            <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={mergedData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />

                    <XAxis
                        dataKey="date"
                        tick={{ fill: '#64748b', fontSize: 12 }}
                        tickFormatter={(val) => val.substring(5)} // Pokaż tylko MM-DD
                        minTickGap={30}
                    />

                    {/* Główna oś Y dla ceny */}
                    <YAxis
                        yAxisId="price"
                        domain={['auto', 'auto']}
                        tick={{ fill: '#64748b', fontSize: 12 }}
                        tickFormatter={(val) => val.toFixed(2)}
                    />

                    {/* Ukryta oś Y dla wolumenu, aby nie spłaszczał ceny */}
                    <YAxis
                        yAxisId="volume"
                        orientation="right"
                        domain={[0, 'dataMax * 4']}
                        hide
                    />

                    <Tooltip
                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                        labelStyle={{ color: '#64748b', marginBottom: '4px' }}
                    />

                    {/* Słupki wolumenu (w tle) */}
                    <Bar yAxisId="volume" dataKey="volume" fill="#cbd5e1" opacity={0.5} name="Wolumen" />

                    {/* Linia ceny */}
                    <Line
                        yAxisId="price"
                        type="monotone"
                        dataKey="close"
                        stroke="#0ea5e9"
                        strokeWidth={2}
                        dot={false}
                        name="Cena Zamknięcia"
                    />

                    {/* Twoja średnia cena zakupu */}
                    {data.avg_price && (
                        <ReferenceLine
                            yAxisId="price"
                            y={data.avg_price}
                            stroke="#f59e0b"
                            strokeDasharray="5 5"
                            label={{ position: 'top', value: 'Średnia cena', fill: '#f59e0b', fontSize: 12 }}
                        />
                    )}

                    {/* Punkty Transakcji */}
                    <Scatter yAxisId="price" dataKey="transaction_buy" fill="#10b981" name="Kupno" />
                    <Scatter yAxisId="price" dataKey="transaction_sell" fill="#ef4444" name="Sprzedaż" />
                </ComposedChart>
            </ResponsiveContainer>
        </div>
    );
};