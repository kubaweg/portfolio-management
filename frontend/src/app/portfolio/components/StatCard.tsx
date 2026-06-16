import React from 'react';

export function StatCard({
    title,
    value,
    subValue,
    icon
}: {
    title: string,
    value: string,
    subValue?: string,
    icon: React.ReactNode
}) {
    return (
        <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 flex items-start justify-between">
            <div>
                <p className="text-sm text-slate-500 font-medium">{title}</p>
                <h3 className="text-xl font-bold mt-1 text-slate-900">{value}</h3>
                {subValue && (
                    <p className={`text-xs font-bold mt-1 ${subValue.startsWith('-') ? 'text-red-500' : 'text-emerald-500'}`}>
                        {subValue}
                    </p>
                )}
            </div>
            <div className="p-2 bg-slate-50 rounded-lg">{icon}</div>
        </div>
    );
}

export interface StatCardDetailedProps {
    title: string;
    detailedData: Record<string, number> | undefined;
    isPercentage?: boolean;
}

export function StatCardDetailed({ title, detailedData = {}, isPercentage = false }: StatCardDetailedProps) {
    // Helper do formatowania waluty lub procentów (lokalny, bo dotyczy tylko tej specyficznej logiki wyświetlania)
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

    const entries = Object.entries(detailedData);
    if (entries.length === 0) return null;

    return (
        <div className="bg-slate-50/60 p-4 rounded-xl border border-slate-100 mt-2">
            <div className="space-y-1.5">
                {entries.map(([asset, val]) => {
                    const isNegative = val < 0;
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