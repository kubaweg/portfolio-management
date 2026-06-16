import React from 'react';
import { formatPLN, formatPercent, formatDate } from '../utils';
import { BondDataPayload, BondInterestPeriod, PeriodStatus } from '../schema/bond.ts';

// Konfiguracja styli dla statusów okresów odsetkowych
const statusConfig: Record<PeriodStatus, { label: string; badgeClass: string; rowClass: string }> = {
    PAST: { label: 'Zakończony', badgeClass: 'bg-slate-100 text-slate-600', rowClass: 'opacity-75' },
    CURRENT: { label: 'Trwający', badgeClass: 'bg-emerald-100 text-emerald-700 font-bold border border-emerald-200', rowClass: 'bg-emerald-50/20' },
    FUTURE: { label: 'Przyszły', badgeClass: 'bg-blue-50 text-blue-600', rowClass: '' }
};

// Komponent Tabeli Okresów
function BondPeriodTable({ periods }: { periods: BondInterestPeriod[] }) {
    if (!periods || periods.length === 0) {
        return <div className="text-center p-4 text-slate-500 italic">Brak okresów odsetkowych.</div>;
    }

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

// Główny komponent sekcji rozwijanej dla Obligacji
export function BondAssetDetails({ ticker, bondPayload }: { ticker: string, bondPayload: BondDataPayload }) {
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

            <div>
                <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2 mt-4">
                    Harmonogram Odsetkowy
                </h4>
                <BondPeriodTable periods={periods} />
            </div>
        </div>
    );
}