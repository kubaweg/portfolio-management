import { ReactNode } from 'react';
import { formatGenericFloat, formatPLN, formatPercent, formatDate } from '../utils';


export interface DetailedBreakdownProps {
    detailed: Record<string, number>;
    formatter: (val: number) => string;
}

export const DetailedBreakdown = ({ detailed, formatter }: DetailedBreakdownProps) => {
    const exchangeVal = detailed?.exchange ?? 0;
    const bondsVal = detailed?.bonds ?? 0;

    return (
        <div className="flex flex-col gap-1 mt-3 pt-3 border-t border-slate-100 text-xs text-slate-500">
            {/* Wiersz 1: Giełda */}
            <div className="flex justify-between items-center">
                <span>ETF/ETC</span>
                <span className="font-medium text-slate-700">{formatter(exchangeVal)}</span>
            </div>

            {/* Wiersz 2: Obligacje */}
            <div className="flex justify-between items-center">
                <span>Obligacje</span>
                <span className="font-medium text-slate-700">{formatter(bondsVal)}</span>
            </div>
        </div>
    );
};


export interface StatCardProps {
    title: string;
    value: string;
    subValue?: string;
    icon: ReactNode;
    children?: ReactNode; // <-- DODAJ TĘ LINIJKĘ
}

export function StatCard({ title, value, icon, children }: StatCardProps) {
    return (
        <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200 flex flex-col">
            <div className="flex justify-between items-start">
                <div>
                    <h3 className="text-sm font-medium text-slate-500">{title}</h3>
                    <p className="text-2xl font-bold text-slate-800 mt-1">{value}</p>
                </div>
                <div className="p-2 bg-slate-50 rounded-md">{icon}</div>
            </div>

            {/* Renderowanie detali, jeśli zostały przekazane */}
            {children}
        </div>
    );
}

export interface StatCardDetailedProps {
    title: string;
    detailedData: Record<string, number> | undefined;
    isPercentage?: boolean;
}

export function StatCardDetailed({ title, detailedData = {}, isPercentage = false }: StatCardDetailedProps) {

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
                                {formatPLN(val)}
                            </span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}