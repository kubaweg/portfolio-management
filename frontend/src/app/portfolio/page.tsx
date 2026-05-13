'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { toast, Toaster } from "sonner"

import {
    PieChart, Pie, ResponsiveContainer, Tooltip, Legend, Cell
} from 'recharts';
import {
    TrendingUp, Wallet, Landmark, Percent, ChevronDown, ChevronUp, Info
} from 'lucide-react';
import {
    PortfolioResponse, AssetDetail, InstrumentChartData
} from './schema';

// --- Kolory dla wykresów ---
const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export default function PortfolioPage() {
    const [data, setData] = useState<PortfolioResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [expandedRow, setExpandedRow] = useState<string | null>(null);
    const [categoryType, setCategoryType] = useState<'category1' | 'category2'>('category1');

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
        if (!data) return []; // Zwraca puste dane, jeśli fetch jeszcze trwa
        const map = new Map<string, number>();
        data.totals.instrument_data.forEach(item => {
            map.set(item.type, (map.get(item.type) || 0) + item.value);
        });
        return Array.from(map).map(([name, value]) => ({ name, value }));
    }, [data]);

    const categoryData = useMemo(() => {
        if (!data) return []; // Zwraca puste dane, jeśli fetch jeszcze trwa
        const map = new Map<string, number>();
        data.totals.instrument_data.forEach(item => {
            const key = item[categoryType];
            map.set(key, (map.get(key) || 0) + item.value);
        });
        return Array.from(map).map(([name, value]) => ({ name, value }));
    }, [data, categoryType]);

    const formatPLN = (val: number) =>
        new Intl.NumberFormat('pl-PL', { style: 'currency', currency: 'PLN' }).format(val);

    if (loading) return <div className="p-10 text-center">Ładowanie portfela...</div>;
    if (!data) return <div className="p-10 text-center text-red-500">Nie udało się pobrać danych.</div>;

    const totals = data.totals;
    const asset_data = data.asset_data;

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-8 bg-slate-50 min-h-screen">

            {/* 1. Kafelki PortfolioTotals */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard title="Wartość Portfela" value={formatPLN(totals.current_value)} icon={<Wallet className="text-blue-600" />} />
                <StatCard title="Zainwestowane" value={formatPLN(totals.invested_value)} icon={<Landmark className="text-slate-600" />} />
                <StatCard title="Zysk Całkowity" value={formatPLN(totals.profit)} subValue={`${(totals.roi * 100).toFixed(2)}%`} icon={<TrendingUp className={totals.profit >= 0 ? "text-emerald-600" : "text-red-600"} />} />
                <StatCard title="Odsetki" value={formatPLN(totals.interest)} icon={<Percent className="text-amber-600" />} />
            </div>

            {/* 2. Wykresy Kołowe */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <ChartContainer title="Alokacja wg Typu">
                    <PieChartComponent data={typeData} />
                </ChartContainer>

                <ChartContainer
                    title="Alokacja wg Kategorii"
                    headerExtra={
                        <select
                            className="text-sm border rounded p-1 bg-white"
                            value={categoryType}
                            onChange={(e) => setCategoryType(e.target.value as any)}
                        >
                            <option value="category1">Kategoria 1</option>
                            <option value="category2">Kategoria 2</option>
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
                            <th className="p-4">Ilość</th>
                            <th className="p-4">Śr. Cena (PLN)</th>
                            <th className="p-4">Wycena (PLN)</th>
                            <th className="p-4">Zysk (PLN)</th>
                            <th className="p-4">ROI</th>
                            <th className="p-4"></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {asset_data.map((asset) => (
                            <React.Fragment key={asset.base_data.ticker}>
                                <tr
                                    className="hover:bg-slate-50 cursor-pointer transition-colors"
                                    onClick={() => setExpandedRow(expandedRow === asset.base_data.ticker ? null : asset.base_data.ticker)}
                                >
                                    <td className="p-4">
                                        <div className="font-bold">{asset.base_data.ticker}</div>
                                        <div className="text-xs text-slate-500">{asset.base_data.name}</div>
                                    </td>
                                    <td className="p-4">{asset.summary.quantity.toFixed(4)}</td>
                                    <td className="p-4">{formatPLN(asset.summary.avg_price_pln)}</td>
                                    <td className="p-4 font-semibold">{formatPLN(asset.current_data.value_pln)}</td>
                                    <td className={`p-4 font-medium ${asset.summary.profit_loss_pln >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                                        {formatPLN(asset.summary.profit_loss_pln)}
                                    </td>
                                    <td className="p-4">{(asset.summary.roi_pln * 100).toFixed(2)}%</td>
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
                        ))}
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
                            <th className="p-2">Cena Zak.</th>
                            <th className="p-2">{type === 'open' ? 'Wycena' : 'Cena Sprzed.'}</th>
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
                                    {pos[type === 'open' ? 'unrealized_profit_pln' : 'realized_profit_pln'].toFixed(2)} zł
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}