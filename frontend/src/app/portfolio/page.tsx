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
    PortfolioResponse, AssetDetail, InstrumentChartData
} from './schema';

const formatPLN = (val: number) =>
    new Intl.NumberFormat('pl-PL', { style: 'currency', currency: 'PLN', useGrouping: true, maximumFractionDigits: 2 }).format(val);

const formatValue = (val: number) =>
    new Intl.NumberFormat('pl-PL', { useGrouping: true, maximumFractionDigits: 2 }).format(val);

const formatPercent = (val: number) => new Intl.NumberFormat('pl-PL', { style: 'percent', minimumFractionDigits: 2 }).format(val);

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
        fetchPortfolio()
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
                {/* Dodajemy relative i min-h-[350px] */}
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
                        // Dodaj animację, żeby uniknąć nagłego "skoku" po zamontowaniu
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
                        icon={<Wallet className="h-5 w-5 text-slate-500" />} // Przykład ikony Lucide
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
                        icon={<Wallet className="h-5 w-5 text-slate-500" />} // Przykład ikony Lucide
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
                            {/* <option value="category1">Kategoria 1</option> */}
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
                            {/* <th className="p-4">Średni kurs</th> */}
                            {/* <th className="p-4">Średni kurs walutowy</th> */}
                            <th className="p-4">Obecna wartość</th>
                            {/* <th className="p-4">ROI</th> */}
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
                                    {/* <td className="p-4">{formatValue(asset.summary.avg_price)} {asset.base_data.currency}</td> */}
                                    {/* <td className="p-4">{asset.base_data.currency !== 'PLN' ? (
                                        `${formatValue(asset.summary.avg_fx_rate)} PLN/${asset.base_data.currency}`
                                    ) : (
                                        '---'
                                    )}</td> */}
                                    <td className="p-4 font-semibold">{formatPLN(asset.current_data.value_pln)}</td>
                                    {/* <td className="p-4">{asset.base_data.currency !== 'PLN' ? (
                                        `${formatPercent(asset.summary.roi)}`
                                    ) : (
                                        '---'
                                    )}</td> */}
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
                                            <div className="grid grid-cols-1 gap-6">
                                                <PositionTable title="Pozycje Otwarte" data={asset.open_positions} type="open" />
                                                <PositionTable title="Pozycje Zamknięte" data={asset.closed_positions} type="closed" />
                                            </div>
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