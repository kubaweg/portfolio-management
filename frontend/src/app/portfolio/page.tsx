'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { toast, Toaster } from "sonner";
import { Wallet, Percent, ChevronDown, ChevronUp, BarChart2 } from 'lucide-react';

// --- IMPORTY TYPÓW (z schema.ts) ---
import {
    PortfolioResponse,
} from './schema/exchange';

import {
    BondPortfolioResponse,
    BondAssetSummary
} from './schema/bond';

// --- IMPORTY NARZĘDZI (z utils.ts) ---
import { formatPLN, formatPercent, TYPE_HUES, hexToHsl } from './utils';
// --- IMPORTY KOMPONENTÓW ---
import { StatCard, StatCardDetailed } from './components/StatCard';
import { ChartContainer, PieChartComponent } from './components/PieCharts';
import { EtfAssetDetails } from './components/EtfAssetDetails';
import { BondAssetDetails } from './components/BondAssetDetails';

export default function PortfolioPage() {
    const [data, setData] = useState<PortfolioResponse | null>(null);
    const [loading, setLoading] = useState(true);

    const [bondData, setBondData] = useState<BondPortfolioResponse | null>(null);
    const [loadingBonds, setLoadingBonds] = useState(true);

    const [expandedRow, setExpandedRow] = useState<string | null>(null);
    const [categoryType, setCategoryType] = useState<'category2' | 'label'>('category2');

    const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

    useEffect(() => {
        const fetchPortfolio = async () => {
            try {
                const response = await fetch(`${API_BASE_URL}/api/dashboard`, {
                    method: 'GET',
                    headers: { 'Content-Type': 'application/json' },
                });

                if (!response.ok) throw new Error('Błąd serwera');

                const portfolioData: PortfolioResponse = await response.json();
                setData(portfolioData);
            } catch (error) {
                console.error("Fetch error:", error);
                toast.error("Błąd ładowania portfela", {
                    description: "Nie udało się pobrać aktualnych danych inwestycyjnych.",
                });
            } finally {
                setLoading(false);
            }
        };

        const fetchBonds = async () => {
            try {
                const response = await fetch(`${API_BASE_URL}/api/bond_summary`, {
                    method: 'GET',
                    headers: { 'Content-Type': 'application/json' },
                });
                if (!response.ok) throw new Error('Błąd pobierania obligacji');

                const bondSummaryData: BondPortfolioResponse = await response.json();
                setBondData(bondSummaryData);
            } catch (error) {
                console.error("Błąd ładowania szczegółów obligacji:", error);
            } finally {
                setLoadingBonds(false);
            }
        };

        fetchPortfolio();
        fetchBonds();
    }, []);

    // --- Przetwarzanie danych do wykresów ---
    const typeData = useMemo(() => {
        if (!data) return [];
        const map = new Map<string, number>();
        data.totals.instrument_data.forEach(item => {
            map.set(item.type, (map.get(item.type) || 0) + item.value);
        });

        return Array.from(map).map(([name, value]) => {
            const hexColor = TYPE_HUES[name] || '#94a3b8';
            return {
                name,
                value,
                fill: hexColor
            };
        });
    }, [data]);

    const categoryData = useMemo(() => {
        if (!data) return [];

        const aggregation = new Map<string, { value: number, type: string }>();
        data.totals.instrument_data.forEach(item => {
            const key = item[categoryType];
            const current = aggregation.get(key) || { value: 0, type: item.type };
            aggregation.set(key, { value: current.value + item.value, type: item.type });
        });

        const aggregatedArray = Array.from(aggregation).map(([name, info]) => ({ name, ...info }));

        const typeCounts: Record<string, number> = {};
        aggregatedArray.forEach(item => {
            typeCounts[item.type] = (typeCounts[item.type] || 0) + 1;
        });

        const currentTypeCounters: Record<string, number> = {};

        return aggregatedArray
            .sort((a, b) => a.type.localeCompare(b.type))
            .map((item) => {
                const totalOfThisType = typeCounts[item.type];
                const currentIndex = currentTypeCounters[item.type] || 0;
                currentTypeCounters[item.type] = currentIndex + 1;

                const hexColor = TYPE_HUES[item.type] || '#94a3b8';

                if (totalOfThisType === 1) {
                    return {
                        name: item.name,
                        value: item.value,
                        fill: hexColor
                    };
                }

                const { h, s } = hexToHsl(hexColor);
                const step = (30 - 20) / (totalOfThisType - 1);
                const lightness = 40 + (currentIndex * step);

                return {
                    name: item.name,
                    value: item.value,
                    fill: `hsl(${h}, ${s}%, ${lightness}%)`
                };
            });
    }, [data, categoryType]);


    // --- Stany przed renderem głównym ---
    if (loading) return <div className="p-10 text-center">Ładowanie portfela...</div>;
    if (!data) return <div className="p-10 text-center text-red-500">Nie udało się pobrać danych.</div>;

    const totals = data.totals;
    const asset_data = data.asset_data;

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-8 bg-slate-50 min-h-screen">
            {/* Opcjonalny toster do notyfikacji błędów z Sonner */}
            <Toaster position="top-right" richColors />

            {/* 1. Kafelki PortfolioTotals */}
            <div className="grid grid-cols-1 md:grid-cols-1 lg:grid-cols-5 gap-4">

                <div className="flex flex-col">
                    <StatCard title="Wartość początkowa" value={formatPLN(totals.invested_value)} icon={<Wallet className="h-5 w-5 text-slate-500" />} />
                    <StatCardDetailed title="Wartość" detailedData={totals.invested_value_detailed} />
                </div>

                <div className="flex flex-col">
                    <StatCard title="Wartość obecna" value={formatPLN(totals.current_value)} icon={<Wallet className="h-5 w-5 text-slate-500" />} />
                    <StatCardDetailed title="Wartość" detailedData={totals.current_value_detailed} />
                </div>

                <div className="flex flex-col">
                    <StatCard title="Zysk łączny" value={formatPLN(totals.profit)} icon={<BarChart2 className="h-5 w-5 text-slate-500" />} />
                    <StatCardDetailed title="Zysk łączny" detailedData={totals.profit_detailed} />
                </div>

                <div className="flex flex-col">
                    <StatCard title="Zysk niezrealizowany" value={formatPLN(totals.unrealized_profit)} icon={<BarChart2 className="h-5 w-5 text-slate-500" />} />
                    <StatCardDetailed title="Zysk niezrealizowany" detailedData={totals.unrealized_profit_detailed} />
                </div>

                <div className="flex flex-col">
                    <StatCard title="Stopa Zwrotu (ROI)" value={formatPercent(totals.roi)} icon={<Percent className="h-5 w-5 text-slate-500" />} />
                    <StatCardDetailed title="ROI" detailedData={totals.roi_detailed} isPercentage={true} />
                </div>

            </div>

            {/* 2. Wykresy Kołowe */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <ChartContainer title="Alokacja wg Typu">
                    <PieChartComponent data={typeData} />
                </ChartContainer>

                <ChartContainer
                    title="Alokacja wg Szczegółów"
                    headerExtra={
                        <select
                            className="text-sm border rounded p-1 bg-white outline-none focus:ring-2 focus:ring-blue-500"
                            value={categoryType}
                            onChange={(e) => setCategoryType(e.target.value as any)}
                        >
                            <option value="category2">Kategoria</option>
                            <option value="label">Instrument</option>
                        </select>
                    }
                >
                    <PieChartComponent data={categoryData} />
                </ChartContainer>
            </div>

            {/* 3. Tabela Główna */}
            <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-slate-200">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 text-sm font-semibold">
                        <tr>
                            <th className="p-4">Instrument</th>
                            <th className="p-4">Wolumen</th>
                            <th className="p-4">Obecna wartość</th>
                            <th className="p-4">ROI (PLN)</th>
                            <th className="p-4">Zysk</th>
                            <th className="p-4"></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {asset_data.map((asset) => (asset.summary.quantity > 0 && (
                            <React.Fragment key={asset.base_data.ticker}>
                                <tr
                                    className="hover:bg-slate-50 cursor-pointer transition-colors"
                                    onClick={() => setExpandedRow(expandedRow === asset.base_data.ticker ? null : asset.base_data.ticker)}
                                >
                                    <td className="p-4">
                                        <div className="font-bold">{asset.base_data.ticker}</div>
                                        <div className="text-xs text-slate-500">{asset.base_data.name}</div>
                                    </td>
                                    <td className="p-4">{asset.summary.quantity.toLocaleString('pl-PL', { maximumFractionDigits: 4 })}</td>
                                    <td className="p-4 font-semibold">{formatPLN(asset.current_data.value_pln)}</td>
                                    <td className="p-4">{formatPercent(asset.summary.roi_pln)}</td>
                                    <td className={`p-4 font-medium ${asset.summary.profit_loss_pln >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                                        {formatPLN(asset.summary.profit_loss_pln)}
                                    </td>
                                    <td className="p-4 text-slate-400">
                                        {expandedRow === asset.base_data.ticker ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                                    </td>
                                </tr>

                                {/* 4. Rozwijana sekcja pozycji */}
                                {expandedRow === asset.base_data.ticker && (
                                    <tr>
                                        <td colSpan={7} className="bg-slate-50 p-6 shadow-inner">
                                            {asset.base_data.type === 'Obligacja' ? (
                                                loadingBonds ? (
                                                    <div className="text-center p-4 text-slate-500 animate-pulse">Ładowanie harmonogramu...</div>
                                                ) : (
                                                    <BondAssetDetails
                                                        ticker={asset.base_data.ticker}
                                                        bondPayload={
                                                            bondData?.data?.[asset.base_data.ticker] || { periods: [], summary: {} as BondAssetSummary }
                                                        }
                                                    />
                                                )
                                            ) : (
                                                <EtfAssetDetails asset={asset} />
                                            )}
                                        </td>
                                    </tr>
                                )}
                            </React.Fragment>
                        )))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}