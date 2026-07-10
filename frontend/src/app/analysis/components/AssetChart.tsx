import React, { useEffect, useRef, useMemo } from 'react';
import { createChart, ColorType, CrosshairMode, LineStyle } from 'lightweight-charts';
import { ChartResponse, ChartTransactionPoint } from '../schema';

interface AssetChartProps {
    data: ChartResponse | null;
}

export const AssetChart = ({ data }: AssetChartProps) => {
    const chartContainerRef = useRef<HTMLDivElement>(null);

    // Sortujemy dane dla pewności (Lightweight Charts wymaga danych ułożonych chronologicznie)
    const sortedData = useMemo(() => {
        if (!data) return null;
        return [...data.historical_data].sort((a, b) => a.date.localeCompare(b.date));
    }, [data]);

    useEffect(() => {
        if (!chartContainerRef.current || !sortedData || !data) return;

        // 1. Inicjalizacja instancji wykresu
        const chart = createChart(chartContainerRef.current, {
            layout: {
                background: { type: ColorType.Solid, color: 'transparent' },
                textColor: '#334155',
            },
            grid: {
                vertLines: { color: '#f1f5f9' },
                horzLines: { color: '#f1f5f9' },
            },
            crosshair: {
                mode: CrosshairMode.Normal,
            },
            rightPriceScale: {
                borderColor: '#e2e8f0',
            },
            timeScale: {
                borderColor: '#e2e8f0',
                timeVisible: true,
                rightOffset: 5, // Drobny margines z prawej strony
            },
            autoSize: true, // Automatycznie reaguje na zmianę rozmiaru kontenera
        });

        // 2. Tworzenie serii świecowej (OHLC)
        const candlestickSeries = chart.addCandlestickSeries({
            upColor: '#10b981', // Wzrost (Szmaragdowy)
            downColor: '#ef4444', // Spadek (Czerwony)
            borderVisible: false,
            wickUpColor: '#10b981',
            wickDownColor: '#ef4444',
        });

        // Formatowanie i ładowanie danych OHLC
        const candlestickData = sortedData.map(d => ({
            time: d.date,
            open: d.open,
            high: d.high,
            low: d.low,
            close: d.close,
        }));
        candlestickSeries.setData(candlestickData as any);

        // 3. Dodawanie poziomej linii średniej ceny zakupu
        if (data.avg_price) {
            candlestickSeries.createPriceLine({
                price: data.avg_price,
                color: '#f59e0b',
                lineWidth: 2,
                lineStyle: LineStyle.Dashed,
                axisLabelVisible: true,
                title: 'Śr. cena zakupu',
            });
        }

        // 4. Nakładanie markerów transakcji na serię świecową
        if (data.transactions && data.transactions.length > 0) {

            // Pobieramy dane historyczne ściśle według interfejsu ChartResponse
            const candlesArray = data.historical_data;

            // Pobieramy datę pierwszej świecy ('date' z interfejsu ChartDataPoint)
            const earliestChartDate = candlesArray.length > 0 ? candlesArray[0].date : null;

            // KROK ZERO: Filtrujemy transakcje odrzucając te przed zakresem wykresu
            const validTransactions = data.transactions.filter(t => {
                if (!earliestChartDate) return true;
                return t.date >= earliestChartDate;
            });

            if (validTransactions.length === 0) {
                candlestickSeries.setMarkers([]);
            } else {

                // Krok A: Grupowanie według daty ze ścisłym typowaniem ChartTransactionPoint[]
                const transactionsByDate = validTransactions.reduce((acc, tx) => {
                    if (!acc[tx.date]) {
                        acc[tx.date] = [];
                    }
                    acc[tx.date].push(tx);
                    return acc;
                }, {} as Record<string, ChartTransactionPoint[]>);

                // Krok B: Mapowanie na markery
                const markers = Object.keys(transactionsByDate)
                    .sort((a, b) => a.localeCompare(b))
                    .map(date => {
                        const dayTransactions = transactionsByDate[date];

                        // PRZYPADEK 1: Tylko jedna transakcja w ciągu dnia
                        if (dayTransactions.length === 1) {
                            const t = dayTransactions[0];
                            const isBuy = t.type.toUpperCase() === 'BUY';
                            return {
                                time: date,
                                position: isBuy ? 'belowBar' : 'aboveBar',
                                color: isBuy ? '#059669' : '#dc2626',
                                shape: isBuy ? 'arrowUp' : 'arrowDown',
                                text: `${isBuy ? 'Kupno' : 'Sprzedaż'} @ ${t.price.toFixed(2)}`,
                            };
                        }

                        // PRZYPADEK 2: Wiele transakcji w ciągu jednego dnia
                        const buys = dayTransactions.filter(t => t.type.toUpperCase() === 'BUY');
                        const sells = dayTransactions.filter(t => t.type.toUpperCase() === 'SELL');

                        // Sytuacja A: W danym dniu były TYLKO zakupy
                        if (buys.length > 0 && sells.length === 0) {
                            const totalQty = buys.reduce((sum, t) => sum + t.quantity, 0);
                            const totalValue = buys.reduce((sum, t) => sum + (t.quantity * t.price), 0);
                            const weightedAvgPrice = totalValue / totalQty;

                            return {
                                time: date,
                                position: 'belowBar',
                                color: '#047857',
                                shape: 'arrowUp',
                                text: `Kupno x${buys.length} @ ${weightedAvgPrice.toFixed(2)}`,
                            };
                        }

                        // Sytuacja B: W danym dniu były TYLKO sprzedaże
                        if (sells.length > 0 && buys.length === 0) {
                            const totalQty = sells.reduce((sum, t) => sum + t.quantity, 0);
                            const totalValue = sells.reduce((sum, t) => sum + (t.quantity * t.price), 0);
                            const weightedAvgPrice = totalValue / totalQty;

                            return {
                                time: date,
                                position: 'aboveBar',
                                color: '#b91c1c',
                                shape: 'arrowDown',
                                text: `Sprzedaż x${sells.length} @ ${weightedAvgPrice.toFixed(2)}`,
                            };
                        }

                        // Sytuacja C: Dzień mieszany
                        return {
                            time: date,
                            position: 'aboveBar',
                            color: '#64748b',
                            shape: 'square',
                            text: `Mix x${dayTransactions.length} (K:${buys.length} / S:${sells.length})`,
                        };
                    });

                candlestickSeries.setMarkers(markers as any);
            }
        } else {
            candlestickSeries.setMarkers([]);
        }

        // 5. Tworzenie serii wolumenu (jako histogram w dolnych 20%)
        if (data.historical_volume && data.historical_volume.length > 0) {
            const volumeSeries = chart.addHistogramSeries({
                color: '#cbd5e1',
                priceFormat: {
                    type: 'volume',
                },
                priceScaleId: '' // Pusty string oznacza, że nakładamy serię na główny wykres jako osobną skalę
            });

            chart.priceScale('').applyOptions({
                scaleMargins: {
                    top: 0.8, // Zaczyna się od 80% wysokości (zostawia górne 80% miejsca dla świec)
                    bottom: 0,
                },
            });

            // Mapowanie wolumenu z kolorowaniem świec wzrostowych/spadkowych
            const volumeData = data.historical_volume
                .sort((a, b) => a.date.localeCompare(b.date))
                .map(v => {
                    const dailyData = sortedData.find(d => d.date === v.date);
                    const isUp = dailyData ? dailyData.close >= dailyData.open : true;
                    return {
                        time: v.date,
                        value: v.volume,
                    };
                });

            volumeSeries.setData(volumeData as any);
        }

        // Dopasowanie widoku do dostępnych danych
        chart.timeScale().fitContent();

        // 6. Cleanup (Zwalnianie zasobów po odmontowaniu komponentu)
        return () => {
            chart.remove();
        };
    }, [data, sortedData]);

    if (!data) return <div className="p-8 text-center text-slate-500">Brak danych do wyświetlenia.</div>;

    return (
        <div className="flex flex-col gap-6 w-full">
            {/* KONTENER NA WYKRES */}
            <div className="w-full h-[550px] p-4 bg-white border border-slate-200 rounded-xl shadow-sm">
                <div className="w-full h-full relative" ref={chartContainerRef} />
            </div>

            {/* TABELA TRANSAKCJI */}
            {data.transactions && data.transactions.length > 0 && (
                <div className="w-full bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                    <div className="px-6 py-4 border-b border-slate-200 bg-slate-50">
                        <h3 className="font-semibold text-slate-800">Historia transakcji</h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left text-slate-600">
                            <thead className="text-xs text-slate-500 uppercase bg-slate-50">
                                <tr>
                                    <th className="px-6 py-3 font-medium">Data</th>
                                    <th className="px-6 py-3 font-medium">Typ</th>
                                    <th className="px-6 py-3 font-medium text-right">Ilość</th>
                                    <th className="px-6 py-3 font-medium text-right">Cena</th>
                                    <th className="px-6 py-3 font-medium text-right">Wartość</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200">
                                {data.transactions
                                    .sort((a, b) => b.date.localeCompare(a.date)) // Sortowanie od najnowszych
                                    .map((tx, idx) => (
                                        <tr key={idx} className="hover:bg-slate-50 transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap">{tx.date}</td>
                                            <td className="px-6 py-4 font-medium">
                                                <span className={`px-2.5 py-1 rounded-full text-xs ${tx.type.toUpperCase() === 'BUY'
                                                    ? 'bg-emerald-100 text-emerald-800'
                                                    : 'bg-red-100 text-red-800'
                                                    }`}>
                                                    {tx.type.toUpperCase() === 'BUY' ? 'KUPNO' : 'SPRZEDAŻ'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right tabular-nums">{tx.quantity}</td>
                                            <td className="px-6 py-4 text-right tabular-nums">{tx.price.toFixed(2)}</td>
                                            <td className="px-6 py-4 text-right font-medium text-slate-900 tabular-nums">
                                                {(tx.quantity * tx.price).toFixed(2)}
                                            </td>
                                        </tr>
                                    ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};