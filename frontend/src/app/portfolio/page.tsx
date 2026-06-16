'use client';

import React, { useState, useEffect } from 'react';
import { Wallet, Percent, ChevronDown, ChevronUp, BarChart2 } from 'lucide-react';

// Importy schematów
import { DashboardMainPageOutput } from './schema/main_table_schema';

// Importy narzędzi
import { formatPLN, formatPercent } from './utils';

// Importy z refaktoryzowanych plików
import { StatCard } from './components/StatCard';
import { ChartContainer, InteractiveChartContainer, PieChartComponent } from './components/PieCharts';
import { EtfAssetDetails } from './components/ExchangeDetails';
import { BondAssetDetails } from './components/BondDetails';

export default function PortfolioPage() {
    const [data, setData] = useState<DashboardMainPageOutput | null>(null);
    const [loading, setLoading] = useState(true);
    const [expandedRow, setExpandedRow] = useState<string | null>(null);

    const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                const response = await fetch(`${API_BASE_URL}/api/dashboard/main`, {
                    method: 'GET',
                    headers: { 'Content-Type': 'application/json' },
                });

                if (!response.ok) throw new Error('Błąd pobierania danych');

                const payload = await response.json();
                setData(payload);
            } catch (error) {
                console.error("Dashboard Fetch Error:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, []);

    if (loading) return <div className="p-8 text-center animate-pulse text-slate-500">Ładowanie portfela...</div>;
    if (!data) return <div className="p-8 text-center text-red-500 font-bold">Błąd pobierania danych z serwera.</div>;

    const { summary, charts, main_table, details } = data;

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-8 bg-slate-50 min-h-screen">
            {/* 1. Kafelki Podsumowania */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                    title="Zainwestowane Środki"
                    value={formatPLN(summary.invested_pln)}
                    icon={<Wallet className="h-5 w-5 text-slate-500" />}
                />
                <StatCard
                    title="Bieżąca Wartość"
                    value={formatPLN(summary.current_value_pln)}
                    icon={<Wallet className="h-5 w-5 text-slate-500" />}
                />
                <StatCard
                    title="Zysk / Strata"
                    value={formatPLN(summary.profit_loss_pln)}
                    subValue={summary.profit_loss_pln >= 0 ? `+${formatPLN(summary.profit_loss_pln)}` : formatPLN(summary.profit_loss_pln)}
                    icon={<BarChart2 className="h-5 w-5 text-slate-500" />}
                />
                <StatCard
                    title="Wskaźnik ROI"
                    value={formatPercent(summary.roi_pln)}
                    subValue={summary.roi_pln >= 0 ? `+${formatPercent(summary.roi_pln)}` : formatPercent(summary.roi_pln)}
                    icon={<Percent className="h-5 w-5 text-slate-500" />}
                />
            </div>

            {/* 2. Wykresy Kołowe */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <ChartContainer title="Alokacja według typu aktywa">
                    <PieChartComponent data={charts.by_type || []} />
                </ChartContainer>

                <InteractiveChartContainer allData={charts} />
            </div>

            {/* 3. Tabela Główna */}
            <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-slate-200">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 text-xs font-semibold uppercase tracking-wider">
                        <tr>
                            <th className="p-4">Instrument</th>
                            <th className="p-4">Wolumen</th>
                            <th className="p-4">Wycena PLN</th>
                            <th className="p-4">ROI</th>
                            <th className="p-4">Zysk całkowity</th>
                            <th className="p-4"></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                        {main_table.data.map((row) => {
                            const isExpanded = expandedRow === row.ticker;

                            // Wyszukanie w details po tickerze (zakładamy, że serwer zwraca spójne tickery w base_data)
                            const detailData = details.data.find(
                                d => (d.details.data.base_data as any).ticker === row.ticker ||
                                    (d.details.data.base_data as any).retail_series_type === row.ticker
                            );

                            return (
                                <React.Fragment key={row.ticker}>
                                    <tr
                                        className="hover:bg-slate-50/70 cursor-pointer transition-colors duration-150"
                                        onClick={() => setExpandedRow(isExpanded ? null : row.ticker)}
                                    >
                                        <td className="p-4">
                                            <div className="font-bold text-slate-900">{row.ticker}</div>
                                            <div className="text-xs text-slate-400">{row.name}</div>
                                        </td>
                                        <td className="p-4 font-medium text-slate-600">
                                            {parseFloat(row.quantity).toLocaleString('pl-PL', { maximumFractionDigits: 4 })}
                                        </td>
                                        <td className="p-4 font-semibold text-slate-800">{formatPLN(row.current_value_pln)}</td>
                                        <td className={`p-4 font-medium ${row.roi_pln >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                                            {formatPercent(row.roi_pln)}
                                        </td>
                                        <td className={`p-4 font-bold ${row.total_profit_gross_pln >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                                            {row.total_profit_gross_pln >= 0 ? '+' : ''}{formatPLN(row.total_profit_gross_pln)}
                                        </td>
                                        <td className="p-4 text-slate-400">
                                            {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                                        </td>
                                    </tr>

                                    {/* 4. Renderowanie odpowiednich szczegółów */}
                                    {isExpanded && detailData && (
                                        <tr>
                                            <td colSpan={6} className="bg-slate-50/50 p-6 shadow-inner">
                                                {detailData.type === 'BOND' ? (
                                                    <BondAssetDetails ticker={row.ticker} bondPayload={detailData.details.data as any} />
                                                ) : (
                                                    <EtfAssetDetails asset={detailData.details.data as any} />
                                                )}
                                            </td>
                                        </tr>
                                    )}
                                </React.Fragment>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}