'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { toast, Toaster } from "sonner"

import {
    PieChart, Pie, ResponsiveContainer, Tooltip, Legend, Cell
} from 'recharts';
import {
    TrendingUp, Wallet, Landmark, Percent, ChevronDown, ChevronUp, Info, BarChart2
} from 'lucide-react';
import {
    PortfolioResponse,
    BondPortfolioResponse, BondInterestPeriod, BondAssetSummary, PeriodStatus, BondDataPayload
} from './schema';

const formatPLN = (val: number) =>
    new Intl.NumberFormat('pl-PL', { style: 'currency', currency: 'PLN', useGrouping: true, maximumFractionDigits: 2 }).format(val);

const formatValue = (val: number) =>
    new Intl.NumberFormat('pl-PL', { useGrouping: true, maximumFractionDigits: 2 }).format(val);

const formatPercent = (val: number) => new Intl.NumberFormat('pl-PL', { style: 'percent', minimumFractionDigits: 2 }).format(val);

const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Intl.DateTimeFormat('pl-PL', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    }).format(new Date(dateString));
};

// --- Kolory dla wykresów ---
const TYPE_HUES: Record<string, string> = {
    'Obligacja': '#198754', // Hex będzie źródłem prawdy dla odcienia
    'ETF': '#0d6efd',
    'ETC': '#ffc107',
    'Akcja': '#ffffff',
    'Crypto': '#ffffff',
};

// Funkcja konwertująca HEX na HSL
const hexToHsl = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (!result) return { h: 0, s: 0, l: 50 };

    const r = parseInt(result[1], 16) / 255;
    const g = parseInt(result[2], 16) / 255;
    const b = parseInt(result[3], 16) / 255;

    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h = 0, s = 0, l = (max + min) / 2;

    if (max !== min) {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
            case r: h = (g - b) / d + (g < b ? 6 : 0); break;
            case g: h = (b - r) / d + 2; break;
            case b: h = (r - g) / d + 4; break;
        }
        h /= 6;
    }
    return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
};

export default function PortfolioPage() {
    const [data, setData] = useState<PortfolioResponse | null>(null);
    const [loading, setLoading] = useState(true);

    // --- NOWY KOD (Stan dla obligacji) ---
    const [bondData, setBondData] = useState<BondPortfolioResponse | null>(null);
    const [loadingBonds, setLoadingBonds] = useState(true);

    const [expandedRow, setExpandedRow] = useState<string | null>(null);
    const [categoryType, setCategoryType] = useState<'category2' | 'label'>('category2');

    const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

    useEffect(() => {
        const fetchPortfolio = async () => {
            try {
                const response = await fetch(`${API_BASE_URL}/api/dashboard`, {
                    method: 'GET',
                    headers: { 'Content-Type': 'application/json' },
                });

                if (!response.ok) throw new Error('Błąd serwera');

                const portfolioData: PortfolioResponse = await response.json();

                // Tutaj możesz dodać ewentualne filtrowanie, jeśli zajdzie potrzeba
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
                // Celowo nie daję tu toasta z błędem, aby nie psuć UX jeśli tylko moduł obligacji padnie
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
            const hexColor = TYPE_HUES[name] || '#94a3b8'; // Domyślny szary dla nieznanych
            return {
                name,
                value,
                fill: hexColor // Na głównym wykresie używamy czystych kolorów z definicji
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

                // LOGIKA DOPASOWANIA KOLORU:
                // Jeśli mamy tylko jeden element tego typu, zwracamy czysty hex (jak na wykresie typu)
                if (totalOfThisType === 1) {
                    return {
                        name: item.name,
                        value: item.value,
                        fill: hexColor
                    };
                }

                // Jeśli jest więcej elementów, przechodzimy na generowanie odcieni HSL
                const { h, s } = hexToHsl(hexColor);

                // Wyliczanie jasności dla wielu elementów (zakres 20% - 40%)
                const step = (30 - 20) / (totalOfThisType - 1);
                const lightness = 40 + (currentIndex * step);

                return {
                    name: item.name,
                    value: item.value,
                    fill: `hsl(${h}, ${s}%, ${lightness}%)`
                };
            });
    }, [data, categoryType]);

    function ChartContainer({ title, children, headerExtra }: { title: string, children: React.ReactNode, headerExtra?: React.ReactNode }) {
        return (
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 min-h-[500px] h-auto flex flex-col">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold text-slate-800">{title}</h3>
                    {headerExtra}
                </div>
                <div className="flex-1 w-full min-h-[350px] relative">
                    {children}
                </div>
            </div>
        );
    }

    function PieChartComponent({ data }: { data: any[] }) {
        const [isMounted, setIsMounted] = useState(false);

        useEffect(() => {
            // Wymuszamy renderowanie po stronie klienta
            setIsMounted(true);
        }, []);

        // Jeśli jeszcze się nie zamontował, zwracamy pusty div o wysokości 100%, 
        // aby zachować strukturę layoutu, ale nie odpalać logiki Recharts.
        if (!isMounted) {
            return <div className="w-full h-full" />;
        }

        return (
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                <PieChart>
                    <Pie
                        data={data}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius="55%"
                        outerRadius="100%"
                        paddingAngle={1}
                        startAngle={90}
                        endAngle={-270}

                        animationBegin={0}
                        animationDuration={800}
                    />
                    <Tooltip formatter={(value: number) => formatPLN(value)} />
                    <Legend
                        verticalAlign="bottom"
                        align="center"
                        iconType="circle"
                        wrapperStyle={{ paddingTop: '15px' }}
                    />
                </PieChart>
            </ResponsiveContainer>
        );
    }

    if (loading) return <div className="p-10 text-center">Ładowanie portfela...</div>;
    if (!data) return <div className="p-10 text-center text-red-500">Nie udało się pobrać danych.</div>;

    const totals = data.totals;
    const asset_data = data.asset_data;

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-8 bg-slate-50 min-h-screen">

            {/* 1. Kafelki PortfolioTotals */}
            <div className="grid grid-cols-1 md:grid-cols-1 lg:grid-cols-5 gap-4">

                {/* KARTY INWESTYCJI */}
                <div className="flex flex-col">
                    <StatCard
                        title="Wartość początkowa"
                        value={formatPLN(totals.invested_value)}
                        icon={<Wallet className="h-5 w-5 text-slate-500" />}
                    />
                    <StatCardDetailed
                        title="Wartość"
                        detailedData={totals.invested_value_detailed}
                    />
                </div>

                <div className="flex flex-col">
                    <StatCard
                        title="Wartość obecna"
                        value={formatPLN(totals.current_value)}
                        icon={<Wallet className="h-5 w-5 text-slate-500" />}
                    />
                    <StatCardDetailed
                        title="Wartość"
                        detailedData={totals.current_value_detailed}
                    />
                </div>


                {/* KARTY WYNIKU */}
                <div className="flex flex-col">
                    <StatCard
                        title="Zysk łączny"
                        value={formatPLN(totals.profit)}
                        icon={<BarChart2 className="h-5 w-5 text-slate-500" />}
                    />
                    <StatCardDetailed
                        title="Zysk łączny"
                        detailedData={totals.profit_detailed}
                    />
                </div>

                <div className="flex flex-col">
                    <StatCard
                        title="Zysk niezrealizowany"
                        value={formatPLN(totals.unrealized_profit)}
                        icon={<BarChart2 className="h-5 w-5 text-slate-500" />}
                    />
                    <StatCardDetailed
                        title="Zysk niezrealizowany"
                        detailedData={totals.unrealized_profit_detailed}
                    />
                </div>

                {/* KARTY ZWROTU */}
                <div className="flex flex-col">
                    <StatCard
                        title="Stopa Zwrotu (ROI)"
                        value={formatPercent(totals.roi)}
                        icon={<Percent className="h-5 w-5 text-slate-500" />}
                    />
                    <StatCardDetailed
                        title="ROI"
                        detailedData={totals.roi_detailed}
                        isPercentage={true}
                    />
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

// --- Komponenty pomocnicze ---

function StatCard({ title, value, subValue, icon }: { title: string, value: string, subValue?: string, icon: React.ReactNode }) {
    return (
        <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 flex items-start justify-between">
            <div>
                <p className="text-sm text-slate-500 font-medium">{title}</p>
                <h3 className="text-xl font-bold mt-1 text-slate-900">{value}</h3>
                {subValue && <p className={`text-xs font-bold mt-1 ${subValue.startsWith('-') ? 'text-red-500' : 'text-emerald-500'}`}>{subValue}</p>}
            </div>
            <div className="p-2 bg-slate-50 rounded-lg">{icon}</div>
        </div>
    );
}

interface StatCardDetailedProps {
    title: string;
    detailedData: Record<string, number> | undefined;
    isPercentage?: boolean;
}

function StatCardDetailed({ title, detailedData = {}, isPercentage = false }: StatCardDetailedProps) {
    // Helper do formatowania waluty lub procentów
    const formatValue = (val: number) => {
        if (isPercentage) {
            return new Intl.NumberFormat('pl-PL', {
                style: 'percent',
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            }).format(val);
        }
        return new Intl.NumberFormat('pl-PL', {
            style: 'currency',
            currency: 'PLN',
            useGrouping: true
        }).format(val);
    };

    // Sprawdzamy, czy w ogóle mamy jakieś dane do wyświetlenia
    const entries = Object.entries(detailedData);
    if (entries.length === 0) return null;

    return (
        <div className="bg-slate-50/60 p-4 rounded-xl border border-slate-100 mt-2">
            {/* <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                {title}
            </p> */}
            <div className="space-y-1.5">
                {entries.map(([asset, val]) => {
                    // Ustalamy kolorowanie tekstu na podstawie logiki biznesowej
                    const isNegative = val < 0;

                    // Kolorujemy na zielono/czerwono tylko stopy zwrotu (ROI) oraz zyski (profit/unrealized)
                    const shouldColor = isPercentage || title.toLowerCase().includes('zysk') || title.toLowerCase().includes('wynik') || title.toLowerCase().includes('roi');

                    const valueColor = shouldColor
                        ? (isNegative ? 'text-red-600' : val > 0 ? 'text-emerald-600' : 'text-slate-600')
                        : 'text-slate-700';

                    return (
                        <div key={asset} className="flex justify-between items-center text-xs">
                            <span className="font-medium text-slate-500">{asset}</span>
                            <span className={`font-semibold ${valueColor}`}>
                                {formatValue(val)}
                            </span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

function ChartContainer({ title, children, headerExtra }: { title: string, children: React.ReactNode, headerExtra?: React.ReactNode }) {
    return (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 h-[400px] flex flex-col">
            <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-slate-800">{title}</h3>
                {headerExtra}
            </div>
            <div className="flex-1">{children}</div>
        </div>
    );
}

function PieChartComponent({ data }: { data: any[] }) {
    return (
        <ResponsiveContainer width="100%" height="100%">
            <PieChart>
                <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5}>
                    {data.map((_, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(value: number) => new Intl.NumberFormat('pl-PL', { style: 'currency', currency: 'PLN' }).format(value)} />
                <Legend verticalAlign="bottom" height={36} />
            </PieChart>
        </ResponsiveContainer>
    );
}


function EtfAssetDetails({ asset }: { asset: any }) {
    return (
        <div className="space-y-6">
            {/* Opcjonalny mini-wyszczególniony baner ze średnią ceną */}
            <div className="grid grid-cols-3 gap-4 bg-white p-4 rounded-lg border border-slate-200 text-xs shadow-sm">
                <div>
                    <span className="text-slate-400 block mb-1">Średnia cena wejścia:</span>
                    <span className="font-bold text-slate-700 text-sm">
                        {asset.summary.avg_price?.toFixed(2)} {asset.base_data.currency}
                    </span>
                </div>
                <div>
                    <span className="text-slate-400 block mb-1">Średni kurs wymiany (FX):</span>
                    <span className="font-bold text-slate-700 text-sm">
                        {asset.summary.avg_fx_rate?.toFixed(4)}
                    </span>
                </div>
                <div>
                    <span className="text-slate-400 block mb-1">Ekspozycja walutowa:</span>
                    <span className="font-bold text-slate-700 text-sm uppercase">
                        {asset.base_data.currency} / PLN
                    </span>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-6">
                <PositionTable title="Pozycje Otwarte" data={asset.open_positions} type="open" />
                <PositionTable title="Pozycje Zamknięte" data={asset.closed_positions} type="closed" />
            </div>
        </div>
    );
}


const statusConfig: Record<PeriodStatus, { label: string; badgeClass: string; rowClass: string }> = {
    PAST: { label: 'Zakończony', badgeClass: 'bg-slate-100 text-slate-600', rowClass: 'opacity-75' },
    CURRENT: { label: 'Trwający', badgeClass: 'bg-emerald-100 text-emerald-700 font-bold border border-emerald-200', rowClass: 'bg-emerald-50/20' },
    FUTURE: { label: 'Przyszły', badgeClass: 'bg-blue-50 text-blue-600', rowClass: '' }
};

function BondPeriodTable({ periods }: { periods: BondInterestPeriod[] }) {
    if (!periods || periods.length === 0) return <div className="text-center p-4 text-slate-500 italic">Brak okresów odsetkowych.</div>;

    return (
        <div className="overflow-x-auto bg-white rounded-lg border border-slate-200 shadow-sm mt-4">
            <table className="w-full text-xs text-left text-slate-600">
                <thead className="bg-slate-100 border-b border-slate-200 font-bold uppercase text-slate-600 tracking-wider">
                    <tr>
                        <th className="p-3 whitespace-nowrap">Okres</th>
                        <th className="p-3">Data trwania</th>
                        <th className="p-3">Status</th>
                        <th className="p-3 text-right">Oprocentowanie</th>
                        <th className="p-3 text-right">Baza (Łącznie)</th>
                        <th className="p-3 text-right">Odsetki Brutto</th>
                        <th className="p-3 text-right">Dni</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                    {periods.map((period, index) => {
                        const statusStyle = statusConfig[period.status] || statusConfig.FUTURE;
                        return (
                            <tr key={index} className={`hover:bg-slate-50 ${statusStyle.rowClass}`}>
                                <td className="p-3 font-medium">#{period.period_number}</td>
                                <td className="p-3 whitespace-nowrap">
                                    <div className="flex flex-col gap-0.5">
                                        <span>{formatDate(period.start_date)}</span>
                                        <span className="text-slate-400">do {formatDate(period.end_date)}</span>
                                    </div>
                                </td>
                                <td className="p-3">
                                    <span className={`px-2 py-1 rounded text-[10px] uppercase font-medium tracking-wider whitespace-nowrap ${statusStyle.badgeClass}`}>
                                        {statusStyle.label}
                                    </span>
                                </td>
                                <td className="p-3 text-right font-bold text-slate-700">
                                    {formatPercent(period.interest_rate)}
                                </td>
                                <td className="p-3 text-right whitespace-nowrap">{formatPLN(period.base_capital)}</td>
                                <td className="p-3 text-right whitespace-nowrap">
                                    <div className="flex flex-col items-end gap-0.5">
                                        <span className="font-bold text-emerald-600">+{formatPLN(period.gross_interest)}</span>
                                        {period.is_capitalized ? (
                                            <span className="text-[10px] bg-slate-100 text-slate-500 px-1.5 rounded">Kapitalizacja</span>
                                        ) : (
                                            <span className="text-[10px] bg-blue-50 text-blue-500 px-1.5 rounded">Wypłata</span>
                                        )}
                                    </div>
                                </td>
                                <td className="p-3 text-right text-slate-500 whitespace-nowrap">
                                    {period.days_elapsed !== null ? <span className="font-medium text-slate-800">{period.days_elapsed} / </span> : ''}
                                    {period.days_total}
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
}

function BondAssetDetails({ ticker, bondPayload }: { ticker: string, bondPayload: BondDataPayload }) {
    // Rozpakowujemy dane przysłane z backendu
    const { periods, summary } = bondPayload;

    return (
        <div className="space-y-4 text-xs text-slate-700">
            {/* Piękne podsumowanie bazujące wyłącznie na danych z silnika */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm">
                    <span className="text-slate-400 block mb-1">Bieżące oprocentowanie:</span>
                    <span className="font-bold text-sm text-slate-800">
                        {formatPercent(summary.current_interest_rate)}
                    </span>
                </div>

                <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm">
                    <span className="text-slate-400 block mb-1">Dni do wykupu:</span>
                    <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-slate-800">{summary.days_to_maturity}</span>
                        <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-blue-500 rounded-full"
                                style={{ width: `${summary.overall_progress_percent * 100}%` }}
                            />
                        </div>
                    </div>
                </div>

                <div className="bg-emerald-50 p-3 rounded-lg border border-emerald-100 shadow-sm">
                    <span className="text-emerald-700 block mb-1 font-medium">Zysk zrealizowany:</span>
                    <span className="text-sm font-bold text-emerald-800">
                        {formatPLN(summary.realized_profit_gross)}
                    </span>
                </div>

                <div className="bg-emerald-50 p-3 rounded-lg border border-emerald-100 shadow-sm">
                    <span className="text-emerald-700 block mb-1 font-medium">Narosłe odsetki:</span>
                    <span className="text-sm font-bold text-emerald-800">
                        {formatPLN(summary.current_value - summary.total_invested)}
                    </span>
                </div>
            </div>

            {/* Tabela pozostaje bez zmian, po prostu przekazujemy listę periods */}
            <div>
                <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2 mt-4">
                    Harmonogram Odsetkowy
                </h4>
                <BondPeriodTable periods={periods} />
            </div>
        </div>
    );
}


function PositionTable({ title, data, type }: { title: string, data: any[], type: 'open' | 'closed' }) {
    if (!data || data.length === 0) return (
        <div>
            <h4 className="text-sm font-bold text-slate-700 mb-2 uppercase tracking-wider flex items-center gap-2"><Info size={16} /> {title}</h4>
            <p className="text-sm text-slate-400 italic">Brak pozycji</p>
        </div>
    );

    return (
        <div>
            <h4 className="text-sm font-bold text-slate-700 mb-3 uppercase tracking-wider">{title}</h4>
            <div className="overflow-x-auto bg-white rounded-lg border border-slate-200">
                <table className="w-full text-xs text-left">
                    <thead className="bg-slate-100 text-slate-600 font-bold uppercase">
                        <tr>
                            <th className="p-2">Ilość</th>
                            <th className="p-2">Wartość zakupu (kurs walutowy)</th>
                            <th className="p-2">{type === 'open' ? 'Wartość obecna' : 'Wartość sprzedaży'}</th>
                            <th className="p-2">Zysk (PLN)</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {data.map((pos, idx) => (
                            <tr key={idx}>
                                <td className="p-2 font-medium">{pos.quantity.toFixed(4)}</td>
                                <td className="p-2">{pos.value_buy.toFixed(2)} ({pos.fx_buy.toFixed(4)})</td>
                                <td className="p-2">{type === 'open' ? pos.current_value.toFixed(2) : pos.value_sell.toFixed(2)}</td>
                                <td className={`p-2 font-bold ${pos[type === 'open' ? 'unrealized_profit_pln' : 'realized_profit_pln'] >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                                    {formatPLN(pos[type === 'open' ? 'unrealized_profit_pln' : 'realized_profit_pln'])}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}