"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { ChartControls } from './components/ChartControls';
import { AssetChart } from './components/AssetChart';
import { ChartResponse } from './schema';

// Dostosuj bazowy URL do swojej konfiguracji
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export default function AnalysisPage() {
    const [ticker, setTicker] = useState('SXR8.DE');
    const [period, setPeriod] = useState('1y');
    const [chartData, setChartData] = useState<ChartResponse | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchChartData = useCallback(async () => {
        if (!ticker) return;

        setIsLoading(true);
        setError(null);

        try {
            const response = await fetch(`${API_BASE_URL}/api/history?ticker=${ticker}&period=${period}`, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' },
            });

            if (!response.ok) {
                throw new Error('Błąd podczas pobierania danych z serwera.');
            }

            const data: ChartResponse = await response.json();
            setChartData(data);
        } catch (err: any) {
            setError(err.message || 'Wystąpił nieznany błąd.');
            setChartData(null);
        } finally {
            setIsLoading(false);
        }
    }, [ticker, period]);

    // Opcjonalnie: Załaduj dane przy pierwszym wejściu na stronę
    useEffect(() => {
        fetchChartData();
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    // Reakcja na zmianę period (automatyczne odpytanie API)
    useEffect(() => {
        if (chartData && chartData.period !== period) {
            fetchChartData();
        }
    }, [period, fetchChartData, chartData]);

    return (
        <div className="max-w-6xl p-6 mx-auto">
            <header className="mb-8">
                <h1 className="text-3xl font-bold text-slate-800">Analiza Instrumentów</h1>
                <p className="mt-2 text-slate-500">
                    Sprawdź historyczne notowania rynkowe i nałóż na nie własną historię transakcji.
                </p>
            </header>

            <ChartControls
                ticker={ticker}
                period={period}
                onTickerChange={setTicker}
                onPeriodChange={setPeriod}
                onFetch={fetchChartData}
                isLoading={isLoading}
            />

            {error && (
                <div className="p-4 mb-6 text-rose-700 bg-rose-50 border border-rose-200 rounded-lg">
                    {error}
                </div>
            )}

            <AssetChart data={chartData} />

            {/* Opcjonalna tabelka podsumowująca ostatnie transakcje (korzysta z tych samych danych!) */}
            {chartData && chartData.transactions.length > 0 && (
                <div className="mt-8 p-6 bg-white border border-slate-200 rounded-xl shadow-sm">
                    <h3 className="mb-4 text-lg font-semibold text-slate-800">Twoje transakcje na tym walorze</h3>
                    <ul className="divide-y divide-slate-100">
                        {chartData.transactions.map((t, idx) => (
                            <li key={idx} className="flex justify-between py-3 text-sm text-slate-600">
                                <span>{t.date}</span>
                                <span className={t.type === 'BUY' ? 'text-emerald-600 font-medium' : 'text-rose-600 font-medium'}>
                                    {t.type} {t.quantity} szt. po {t.price.toFixed(2)}
                                </span>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
}