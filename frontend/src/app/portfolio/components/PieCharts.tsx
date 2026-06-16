'use client';

import React, { useState, useEffect } from 'react';
import { PieChart, Pie, ResponsiveContainer, Tooltip, Legend, Cell, LabelList } from 'recharts';
import { formatPLN, TYPE_HUES } from '../utils'; // Importujemy słownik kolorów
import { ChartItem, DashboardAllocationChartsData } from '../schema/main_table_schema'; // Dopasuj ścieżkę do swojego pliku ze schematami
import { hexToHsl } from '../utils';

export function ChartContainer({
    title,
    children,
}: {
    title: string,
    children: React.ReactNode,
}) {
    return (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex flex-col h-[450px]"> {/* Stała wysokość kontenera */}
            <h3 className="font-bold text-slate-800 mb-4">{title}</h3>
            <div className="w-full flex-grow relative">
                {children}
            </div>
        </div>
    );
}

export function InteractiveChartContainer({
    allData
}: {
    allData: DashboardAllocationChartsData
}) {
    const [view, setView] = useState<'by_category2' | 'by_name' | 'by_ticker'>('by_category2');

    return (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex flex-col h-[450px]">
            <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-slate-800">Alokacja (do wyboru)</h3>
                <select
                    className="text-xs border border-slate-200 rounded-md p-1 bg-slate-50 outline-none"
                    value={view}
                    onChange={(e) => setView(e.target.value as any)}
                >
                    <option value="by_category2">Kategoria</option>
                    <option value="by_name">Nazwa instrumentu</option>
                    <option value="by_ticker">Ticker instrumentu</option>
                </select>
            </div>
            <div className="w-full flex-grow relative">
                {/* Klucz 'key' wymusza restart animacji przy zmianie wykresu */}
                <PieChartComponent key={view} data={allData[view]} />
            </div>
        </div>
    );
}

export function PieChartComponent({ data }: { data: ChartItem[] }) {
    const [isMounted, setIsMounted] = useState(false);
    useEffect(() => { setIsMounted(true); }, []);

    if (!isMounted || !data || data.length === 0) return null;

    const itemsByType = data.reduce((acc, item) => {
        acc[item.type] = (acc[item.type] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);
    const processedTypes: Record<string, number> = {};


    const chartData = data.map((item) => {
        const baseHex = TYPE_HUES[item.type] || '#94a3b8';
        const hsl = hexToHsl(baseHex);
        const count = itemsByType[item.type];
        const currentIdx = processedTypes[item.type] || 0;
        processedTypes[item.type] = currentIdx + 1;
        const range = 20;
        const step = count > 1 ? (range * 2) / (count - 1) : 0;
        const newL = count > 1 ? (40 - range) + (currentIdx * step) : 40;
        return {
            ...item,
            name: item.label,
            value: item.current_pln,
            fill: `hsl(${hsl.h}, ${hsl.s}%, ${newL}%)`,
            percentLabel: (item.current_pct * 100).toFixed(1) + '%'
        };
    });


    return (
        <ResponsiveContainer width="100%" height="100%">
            <PieChart margin={{ top: 0, bottom: 0, left: 0, right: 0 }}>
                <Pie
                    data={chartData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius="45%"
                    outerRadius="75%" // Nieznacznie mniejszy, żeby zrobić miejsce na etykiety
                    paddingAngle={1}
                    startAngle={90}
                    endAngle={-270}
                >
                    {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                    <LabelList
                        dataKey="percentLabel"
                        position="outside"
                        fill="#334155"
                        style={{ fontSize: '11px', fontWeight: '600' }}
                        offset={10}
                    />
                </Pie>
                <Tooltip
                    content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                            const d = payload[0].payload;
                            return (
                                <div className="bg-white p-2 border border-slate-100 shadow-lg rounded text-xs">
                                    <p className="font-bold">{d.name}</p>
                                    <p className="text-slate-500">Wartość obecna: {formatPLN(d.value)}</p>
                                    <p className="text-slate-500">Udział: {d.percentLabel}</p>
                                </div>
                            );
                        }
                        return null;
                    }}
                />
                {/* 1. Zmniejszona czcionka legendy */}
                <Legend
                    verticalAlign="bottom"
                    iconType="circle"
                    wrapperStyle={{ fontSize: '14px', paddingTop: '0px' }}
                />
            </PieChart>
        </ResponsiveContainer>
    );
}