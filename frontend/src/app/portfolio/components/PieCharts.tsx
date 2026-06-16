import React, { useState, useEffect } from 'react';
import { PieChart, Pie, ResponsiveContainer, Tooltip, Legend, Cell } from 'recharts';
import { formatPLN } from '../utils';

export function ChartContainer({
    title,
    children,
    headerExtra
}: {
    title: string,
    children: React.ReactNode,
    headerExtra?: React.ReactNode
}) {
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

export function PieChartComponent({ data }: { data: any[] }) {
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        // Wymuszamy renderowanie po stronie klienta, unikamy błędu hydratacji
        setIsMounted(true);
    }, []);

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
                >
                    {/* Odczytujemy kolor 'fill' wyliczony wcześniej w Memo z odcieniami HSL */}
                    {data.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill || '#94a3b8'} />
                    ))}
                </Pie>
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