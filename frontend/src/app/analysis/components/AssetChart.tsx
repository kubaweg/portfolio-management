import React, { useEffect, useRef, useState, useMemo } from 'react';
import { createChart, ColorType, CrosshairMode, LineStyle } from 'lightweight-charts';
import { ChartResponse, ChartTransactionPoint } from '../schema'; // Podmień ścieżki w razie potrzeby
import { ChartTooltip } from './ChartTooltip';
import { TransactionTable } from './TransactionTable';

interface AssetChartProps {
    data: ChartResponse;
}

export const AssetChart = ({ data }: AssetChartProps) => {
    const chartContainerRef = useRef<HTMLDivElement>(null);

    // Stan dla naszego autorskiego tooltipa
    const [tooltip, setTooltip] = useState({ visible: false, x: 0, y: 0, text: '' });

    const sortedData = useMemo(() => {
        if (!data) return null;
        return [...data.historical_data].sort((a, b) => a.date.localeCompare(b.date));
    }, [data]);

    // Wstępne przetwarzanie transakcji
    const processedChartElements = useMemo(() => {
        if (!data?.transactions || !data?.historical_data || data.historical_data.length === 0) return null;

        const earliestChartDate = data.historical_data[0].date;
        const validTransactions = data.transactions.filter(t => t.date >= earliestChartDate);

        if (validTransactions.length === 0) return null;

        const transactionsByDate = validTransactions.reduce((acc, tx) => {
            if (!acc[tx.date]) acc[tx.date] = [];
            acc[tx.date].push(tx);
            return acc;
        }, {} as Record<string, ChartTransactionPoint[]>);

        const markers: any[] = [];
        const priceLines: { price: number }[] = [];
        const tooltipMap = new Map<string, string>();

        // NOWE: Tablica przechowująca punkty (czas, cena) dla naszej ukrytej serii
        const transactionPoints: { time: string; value: number }[] = [];

        Object.keys(transactionsByDate).sort((a, b) => a.localeCompare(b)).forEach(date => {
            const dayTransactions = transactionsByDate[date];
            const buys = dayTransactions.filter(t => t.type.toUpperCase() === 'BUY');
            const sells = dayTransactions.filter(t => t.type.toUpperCase() === 'SELL');

            let price = 0;
            let text = '';
            let isBuy = buys.length > 0;

            if (dayTransactions.length === 1) {
                const t = dayTransactions[0];
                price = t.price;
                text = `${isBuy ? 'Kupno' : 'Sprzedaż'} @ ${price.toFixed(2)}`;
            } else if (buys.length > 0 && sells.length === 0) {
                const totalQty = buys.reduce((sum, t) => sum + t.quantity, 0);
                price = buys.reduce((sum, t) => sum + (t.quantity * t.price), 0) / totalQty;
                text = `Kupno x${buys.length} @ ${price.toFixed(2)}`;
            } else if (sells.length > 0 && buys.length === 0) {
                isBuy = false;
                const totalQty = sells.reduce((sum, t) => sum + t.quantity, 0);
                price = sells.reduce((sum, t) => sum + (t.quantity * t.price), 0) / totalQty;
                text = `Sprzedaż x${sells.length} @ ${price.toFixed(2)}`;
            } else {
                price = dayTransactions[0].price;
                text = `Mix x${dayTransactions.length} (K:${buys.length} / S:${sells.length})`;
            }

            tooltipMap.set(date, text);
            priceLines.push({ price });

            // NOWE: Rejestrujemy dokładny punkt ceny dla ukrytej linii
            transactionPoints.push({ time: date, value: price });

            // Tworzymy marker. Parametr 'price' tu usunąłem, bo lw-charts go nie czyta w markerach.
            // Pozycja zależeć będzie teraz idealnie od wartości `transactionPoints`
            markers.push({
                time: date,
                position: 'inBar',
                color: dayTransactions.length > 1 && buys.length > 0 && sells.length > 0
                    ? '#475569'
                    : (isBuy ? '#047857' : '#b91c1c'),
                shape: 'circle',
                size: 1,
                text: '',
            });
        });

        // Zwracamy dodatkowo transactionPoints
        return { markers, priceLines, tooltipMap, transactionPoints };
    }, [data]);

    useEffect(() => {
        if (!chartContainerRef.current || !sortedData || !data) return;

        const chart = createChart(chartContainerRef.current, {
            layout: { background: { type: ColorType.Solid, color: 'transparent' }, textColor: '#334155' },
            grid: { vertLines: { color: '#f1f5f9' }, horzLines: { color: '#f1f5f9' } },
            crosshair: { mode: CrosshairMode.Normal },
            rightPriceScale: { borderColor: '#e2e8f0' },
            timeScale: { borderColor: '#e2e8f0', timeVisible: true, rightOffset: 5 },
            autoSize: true,
        });

        // Seria świecowa
        const candlestickSeries = chart.addCandlestickSeries({
            upColor: '#10b981', downColor: '#ef4444', borderVisible: false,
            wickUpColor: '#10b981', wickDownColor: '#ef4444',
        });
        candlestickSeries.setData(sortedData.map(d => ({
            time: d.date, open: d.open, high: d.high, low: d.low, close: d.close,
        })) as any);

        // Główna linia: Średnia cena zakupu
        if (data.avg_price) {
            candlestickSeries.createPriceLine({
                price: data.avg_price, color: '#f59e0b', lineWidth: 2,
                lineStyle: LineStyle.Dashed, axisLabelVisible: true, title: 'Śr. cena',
            });
        }

        if (processedChartElements) {
            // Nakładanie szarych, przerywanych linii na serię świecową
            processedChartElements.priceLines.forEach(line => {
                candlestickSeries.createPriceLine({
                    price: line.price,
                    color: '#94a3b8',
                    lineWidth: 1,
                    lineStyle: LineStyle.Dashed,
                    axisLabelVisible: false,
                });
            });

            // ROZWIĄZANIE PROBLEMU: Tworzymy ukrytą serię liniową
            const hiddenMarkerSeries = chart.addLineSeries({
                color: 'transparent', // Linia jest niewidzialna
                crosshairMarkerVisible: false, // Brak własnej kropki po najechaniu
                priceLineVisible: false, // Brak linii ceny po prawej stronie
                lastValueVisible: false, // Brak wartości na skali
            });

            // Ustawiamy dane dla ukrytej serii (dokładne punkty na osi Y)
            hiddenMarkerSeries.setData(processedChartElements.transactionPoints as any);

            // Przypinamy kropki do ukrytej serii. Teraz kropki będą idealnie na liniach!
            hiddenMarkerSeries.setMarkers(processedChartElements.markers as any);
        }

        // Obsługa Tooltipów
        chart.subscribeCrosshairMove((param) => {
            if (
                param.point &&
                param.time &&
                processedChartElements?.tooltipMap.has(param.time as string)
            ) {
                setTooltip({
                    visible: true,
                    x: param.point.x,
                    y: param.point.y,
                    text: processedChartElements.tooltipMap.get(param.time as string)!
                });
            } else {
                setTooltip(prev => prev.visible ? { ...prev, visible: false } : prev);
            }
        });

        // Seria Wolumenu
        if (data.historical_volume && data.historical_volume.length > 0) {
            const volumeSeries = chart.addHistogramSeries({
                color: '#cbd5e1', priceFormat: { type: 'volume' }, priceScaleId: ''
            });
            chart.priceScale('').applyOptions({
                scaleMargins: { top: 0.8, bottom: 0 },
            });
            const volumeData = data.historical_volume
                .sort((a, b) => a.date.localeCompare(b.date))
                .map(v => ({ time: v.date, value: v.volume }));
            volumeSeries.setData(volumeData as any);
        }

        chart.timeScale().fitContent();

        return () => chart.remove();
    }, [data, sortedData, processedChartElements]);

    if (!data) return <div className="p-8 text-center text-slate-500">Brak danych do wyświetlenia.</div>;

    return (
        <div className="flex flex-col gap-6 w-full">
            <div className="w-full h-[550px] p-4 bg-white border border-slate-200 rounded-xl shadow-sm relative">
                <div className="w-full h-full relative" ref={chartContainerRef} />

                <ChartTooltip
                    visible={tooltip.visible}
                    x={tooltip.x}
                    y={tooltip.y}
                    text={tooltip.text}
                />
            </div>

            <TransactionTable transactions={data.transactions} />
        </div>
    );
};