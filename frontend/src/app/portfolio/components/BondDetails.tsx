import React, { useMemo } from 'react';
import { formatPLN, formatPercent, formatDate } from '../utils';
import { BondData, BondInterestPeriod, PeriodStatus } from '../schema/bond_schema';
import {
    useReactTable,
    getCoreRowModel,
    flexRender,
    createColumnHelper,
    RowData
} from '@tanstack/react-table';

// Konfiguracja styli dla statusów okresów odsetkowych
const statusConfig: Record<PeriodStatus, { label: string; badgeClass: string; rowClass: string }> = {
    PAST: { label: 'Zakończony', badgeClass: 'bg-slate-100 text-slate-600', rowClass: 'opacity-75' },
    CURRENT: { label: 'Trwający', badgeClass: 'bg-emerald-100 text-emerald-700 font-bold border border-emerald-200', rowClass: 'bg-emerald-50/20' },
    FUTURE: { label: 'Przyszły', badgeClass: 'bg-blue-50 text-blue-600', rowClass: '' }
};


// Rozszerzenie modułu TanStack, aby obsługiwało nasze własne pole meta (np. do wyrównywania do prawej)
declare module '@tanstack/react-table' {
    interface ColumnMeta<TData extends RowData, TValue> {
        align?: 'left' | 'center' | 'right';
    }
}

interface BondPeriodTableProps {
    periods: BondInterestPeriod[];
    formatDate: (date: string) => string;
    formatPercent: (val: number) => string;
    formatPLN: (val: number) => string;
    statusConfig: Record<string, { rowClass: string; badgeClass: string; label: string }>;
}

const columnHelper = createColumnHelper<BondInterestPeriod>();

export const BondPeriodTable: React.FC<BondPeriodTableProps> = ({
    periods,
    formatDate,
    formatPercent,
    formatPLN,
    statusConfig
}) => {
    // Jeśli nie ma danych, zwracamy pusty stan tak jak w oryginale
    if (!periods || periods.length === 0) {
        return <div className="text-center p-4 text-slate-500 italic">Brak okresów odsetkowych.</div>;
    }

    // Definicja kolumn TanStack
    const columns = useMemo(() => [
        columnHelper.accessor('period_number', {
            header: 'Okres',
            cell: info => <span className="font-medium">#{info.getValue()}</span>,
            meta: { align: 'left' }
        }),
        columnHelper.display({
            id: 'duration',
            header: 'Data trwania',
            cell: info => (
                <div className="flex flex-col gap-0.5 whitespace-nowrap">
                    <span>{formatDate(info.row.original.start_date)}</span>
                    <span className="text-slate-400">do {formatDate(info.row.original.end_date)}</span>
                </div>
            ),
            meta: { align: 'left' }
        }),
        columnHelper.accessor('status', {
            header: 'Status',
            cell: info => {
                const statusStyle = statusConfig[info.getValue()] || statusConfig.FUTURE;
                return (
                    <span className={`px-2 py-1 rounded text-[10px] uppercase font-medium tracking-wider whitespace-nowrap ${statusStyle.badgeClass}`}>
                        {statusStyle.label}
                    </span>
                );
            },
            meta: { align: 'left' }
        }),
        columnHelper.accessor('interest_rate', {
            header: 'Oprocentowanie',
            cell: info => <span className="font-bold text-slate-700">{formatPercent(info.getValue())}</span>,
            meta: { align: 'right' }
        }),
        columnHelper.accessor('base_capital', {
            header: 'Baza (Łącznie)',
            cell: info => <span className="whitespace-nowrap">{formatPLN(info.getValue())}</span>,
            meta: { align: 'right' }
        }),
        columnHelper.accessor('gross_interest', {
            header: 'Odsetki Brutto',
            cell: info => (
                <div className="flex flex-col items-end gap-0.5 whitespace-nowrap">
                    <span className="font-bold text-emerald-600">+{formatPLN(info.getValue())}</span>
                    {info.row.original.is_capitalized ? (
                        <span className="text-[10px] bg-slate-100 text-slate-500 px-1.5 rounded">Kapitalizacja</span>
                    ) : (
                        <span className="text-[10px] bg-blue-50 text-blue-500 px-1.5 rounded">Wypłata</span>
                    )}
                </div>
            ),
            meta: { align: 'right' }
        }),
        columnHelper.display({
            id: 'days',
            header: 'Dni',
            cell: info => (
                <span className="text-slate-500 whitespace-nowrap">
                    {info.row.original.days_elapsed !== null ? <span className="font-medium text-slate-800">{info.row.original.days_elapsed} / </span> : ''}
                    {info.row.original.days_total}
                </span>
            ),
            meta: { align: 'right' }
        })
    ], [formatDate, formatPercent, formatPLN, statusConfig]);

    const table = useReactTable({
        data: periods,
        columns,
        getCoreRowModel: getCoreRowModel(),
    });

    return (
        <div className="overflow-x-auto bg-white rounded-lg border border-slate-200 shadow-sm mt-4 custom-scrollbar">
            <table className="w-full text-xs text-left text-slate-600">
                <thead className="bg-slate-100 border-b border-slate-200 font-bold uppercase text-slate-600 tracking-wider">
                    {table.getHeaderGroups().map(headerGroup => (
                        <tr key={headerGroup.id}>
                            {headerGroup.headers.map(header => {
                                const alignClass = header.column.columnDef.meta?.align === 'right' ? 'text-right' : 'text-left';
                                return (
                                    <th key={header.id} className={`p-3 whitespace-nowrap ${alignClass}`}>
                                        {flexRender(header.column.columnDef.header, header.getContext())}
                                    </th>
                                );
                            })}
                        </tr>
                    ))}
                </thead>
                <tbody className="divide-y divide-slate-100">
                    {table.getRowModel().rows.map(row => {
                        // Pobieramy style dla całego wiersza na podstawie statusu
                        const statusStyle = statusConfig[row.original.status] || statusConfig.FUTURE;

                        return (
                            <tr key={row.id} className={`hover:bg-slate-50 transition-colors ${statusStyle.rowClass || ''}`}>
                                {row.getVisibleCells().map(cell => {
                                    const alignClass = cell.column.columnDef.meta?.align === 'right' ? 'text-right' : 'text-left';
                                    return (
                                        <td key={cell.id} className={`p-3 ${alignClass}`}>
                                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                        </td>
                                    );
                                })}
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
};


export function BondAssetDetails({ bondPayload }: { bondPayload: BondData }) {

    return (
        <div className="w-full bg-slate-50 p-6 flex flex-col gap-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm">
                    <span className="text-slate-400 block mb-1">Bieżące oprocentowanie:</span>
                    <span className="font-bold text-sm text-slate-800">
                        {formatPercent(bondPayload.summary.current_interest_rate)}
                    </span>
                </div>

                <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm">
                    <span className="text-slate-400 block mb-1">Dni do wykupu:</span>
                    <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-slate-800">{bondPayload.summary.days_to_maturity}</span>
                        <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-blue-500 rounded-full"
                                style={{ width: `${bondPayload.summary.overall_progress_percent * 100}%` }}
                            />
                        </div>
                    </div>
                </div>

                <div className="bg-emerald-50 p-3 rounded-lg border border-emerald-100 shadow-sm">
                    <span className="text-emerald-700 block mb-1 font-medium">Zysk zrealizowany:</span>
                    <span className="text-sm font-bold text-emerald-800">
                        {formatPLN(bondPayload.summary.realized_profit_pln_gross)}
                    </span>
                </div>

                <div className="bg-emerald-50 p-3 rounded-lg border border-emerald-100 shadow-sm">
                    <span className="text-emerald-700 block mb-1 font-medium">Narosłe odsetki:</span>
                    <span className="text-sm font-bold text-emerald-800">
                        {formatPLN(bondPayload.summary.current_value - bondPayload.summary.total_invested)}
                    </span>
                </div>
            </div>

            <div>
                <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2 mt-4">
                    Harmonogram Odsetkowy
                </h4>
                <BondPeriodTable
                    periods={bondPayload.periods}
                    formatDate={formatDate}
                    formatPercent={formatPercent}
                    formatPLN={formatPLN}
                    statusConfig={statusConfig}
                />
            </div>
        </div>
    );
}