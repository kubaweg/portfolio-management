import React, { useMemo, useState } from 'react';
import { formatPLN, formatPercent, formatDate } from '../utils';
import { BondData, BondBaseData, BondInterestPeriod, PeriodStatus } from '../schema/bond_schema';
import { ChevronDown } from 'lucide-react';
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
        columnHelper.accessor('base_capital_per_bond', {
            header: 'Baza (Łącznie)',
            cell: info => <span className="whitespace-nowrap">{formatPLN(info.getValue())}</span>,
            meta: { align: 'right' }
        }),
        columnHelper.accessor('gross_interest_per_bond', {
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
        <div className="overflow-x-auto bg-white rounded-lg border border-slate-200 shadow-sm custom-scrollbar">
            <table className="w-full text-xs text-left text-slate-600">
                <thead className="bg-white border-b border-slate-200 font-bold uppercase text-slate-800 tracking-wider">
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

// Typ pomocniczy dla wierszy tabeli szczegółów
interface BaseDataRow {
    label: string;
    value: React.ReactNode;
}

const detailColumnHelper = createColumnHelper<BaseDataRow>();

export const BondBaseDataTable = ({ baseData }: { baseData: BondBaseData }) => {
    // Transformacja obiektu base_data na wiersze tabeli
    const tableData: BaseDataRow[] = useMemo(() => [
        { label: 'Symbol (Ticker)', value: <span className="font-bold text-slate-800">{baseData.ticker}</span> },
        { label: 'Pełna nazwa', value: baseData.name },
        { label: 'Kategoria', value: `${baseData.category1} / ${baseData.category2}` },
        { label: 'Data emisji', value: formatDate(baseData.issue_date) },
        { label: 'Data wykupu', value: formatDate(baseData.maturity_date) },
        { label: 'Typ oprocentowania', value: baseData.is_indexed ? 'Zmiennoprocentowe (Indeksowane)' : 'Stałoprocentowe' },
        { label: 'Kapitalizacja odsetek', value: baseData.interest_handling },
        { label: 'Częstotliwość kuponu', value: baseData.coupon_frequency },
    ], [baseData, formatDate]);

    const columns = useMemo(() => [
        detailColumnHelper.accessor('label', {
            header: 'Atrybut',
            cell: info => <span className="text-slate-500 font-medium">{info.getValue()}</span>,
        }),
        detailColumnHelper.accessor('value', {
            header: 'Wartość',
            cell: info => <span className="text-slate-800">{info.getValue()}</span>,
        }),
    ], []);

    const table = useReactTable({
        data: tableData,
        columns,
        getCoreRowModel: getCoreRowModel(),
    });

    return (
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
            <table className="w-full text-sm text-left">
                <tbody className="divide-y divide-slate-100">
                    {table.getRowModel().rows.map(row => (
                        <tr key={row.id} className="hover:bg-slate-50/50">
                            {row.getVisibleCells().map(cell => (
                                <td key={cell.id} className="px-4 py-2.5 w-1/2">
                                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};


export function BondAssetDetails({ bondPayload }: { bondPayload: BondData }) {

    // Znajdź bieżący okres, aby pobrać z niego wartość benchmarku (np. inflacji lub WIBOR-u)
    const currentPeriod = bondPayload.periods.find(p => p.status === 'CURRENT') || bondPayload.periods.at(-1);
    const currentBenchmarkValue = currentPeriod?.benchmark_value || 0;
    const isIndexed = bondPayload.base_data.is_indexed;

    const [isDetailsOpen, setIsDetailsOpen] = useState(false); // Domyślnie zamknięte, zmień na true jeśli ma być domyślnie otwarte
    const [isScheduleOpen, setIsScheduleOpen] = useState(false); // Domyślnie zamknięte, zmień na true jeśli ma być domyślnie otwarte

    return (
        <div className="w-full bg-slate-50 p-6 flex flex-col gap-0">
            <div className="border border-slate-200 rounded-lg overflow-hidden bg-white mb-3">
                {/* KLIKALNY NAGŁÓWEK SEKCIJI */}
                <button
                    type="button"
                    onClick={() => setIsDetailsOpen(!isDetailsOpen)}
                    className="w-full px-4 py-3 bg-white hover:bg-slate-50 transition-colors flex items-center justify-between select-none border-b border-slate-100"
                >
                    <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                        Informacje szczegółowe
                    </h4>
                    {/* Animowana strzałka, która obraca się o 180 stopni przy zwijaniu */}
                    <ChevronDown
                        className={`w-5 h-5 text-slate-500 transition-transform duration-200 ${isDetailsOpen ? '' : '-rotate-90'
                            }`}
                    />
                </button>

                {/* WARUNKOWE RENDEROWANIE TABELI */}
                {isDetailsOpen && (
                    <BondBaseDataTable baseData={bondPayload.base_data} />
                )}
            </div>

            {/* Dynamiczna klasa grid-cols w zależności od isIndexed */}
            <div className={`grid grid-cols-1 ${!isIndexed ? 'md:grid-cols-2' : 'md:grid-cols-3'} gap-4 mb-3`}>

                {/* 1. PASEK POSTĘPU - zawsze col-span-1 */}
                <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm flex flex-col justify-between">
                    <div className="flex justify-between items-baseline mb-1">
                        <span className="text-slate-400 font-medium">
                            Postęp do wykupu: <span className="font-medium text-slate-800 ml-1">{bondPayload.summary.days_to_maturity} dni</span>
                        </span>
                        <span className="font-medium text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">
                            {Math.round(bondPayload.summary.overall_progress_percent * 100)}%
                        </span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-500 rounded-full transition-all duration-500"
                            style={{ width: `${bondPayload.summary.overall_progress_percent * 100}%` }} />
                    </div>
                </div>

                {/* 2. SEKCJA OPROCENTOWANIA - dynamiczny span i wewnętrzny grid */}
                <div className={`${!isIndexed ? 'col-span-1' : 'col-span-2'} grid ${isIndexed ? 'grid-cols-2' : 'grid-cols-1'} gap-4`}>

                    {!isIndexed ? (
                        /* Wariant 1: Jeden kafelek, który naturalnie rozciągnie się na całą dostępną przestrzeń */
                        <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm flex flex-col justify-center">
                            <span className="text-slate-400 block mb-1">Oprocentowanie (stałe):</span>
                            <span className="font-bold text-lg text-slate-800">
                                {formatPercent(bondPayload.current_data.interest_rate)}
                            </span>
                        </div>
                    ) : (
                        /* Wariant 2: Dwa kafelki, które podzielą przestrzeń 2/3 na pół */
                        <>
                            <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm">
                                <span className="text-slate-400 block mb-1">Oprocentowanie początkowe:</span>
                                <span className="font-bold text-xl text-slate-800">
                                    {formatPercent(bondPayload.base_data.initial_rate)}
                                </span>
                            </div>

                            <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm">
                                <span className="text-slate-400 block mb-1 font-medium tracking-wider">
                                    Bieżące oprocentowanie:
                                </span>
                                <div className="flex flex-col gap-1.5">
                                    <span className="font-bold text-xl text-slate-800">
                                        {formatPercent(bondPayload.current_data.interest_rate)} <span className="text-base font-medium text-slate-600">
                                            = {formatPercent(currentBenchmarkValue)} <span className="text-sm font-medium text-slate-600">(baza)</span> + {formatPercent(bondPayload.base_data.margin)} <span className="text-sm font-medium text-slate-600">(marża)</span>
                                        </span>
                                    </span>

                                    <span className="text-xs font-medium text-slate-400">
                                        Benchmark: {bondPayload.base_data.benchmark || '-'}
                                    </span>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>

            <div>
                {/* ZYSKI */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
                    <div className="bg-emerald-50 p-3 rounded-lg border border-emerald-100 shadow-sm col-span-2">
                        <span className="text-emerald-700 block mb-1 font-medium">Zysk zrealizowany:</span>
                        <span className="text-lg font-bold text-emerald-800">
                            {formatPLN(bondPayload.summary.realized_profit_gross)}
                        </span>
                    </div>

                    <div className="bg-emerald-50 p-3 rounded-lg border border-emerald-100 shadow-sm col-span-2">
                        <span className="text-emerald-700 block mb-1 font-medium">Narosłe odsetki (Niezrealizowane):</span>
                        <span className="text-lg font-bold text-emerald-800">
                            {formatPLN(bondPayload.summary.unrealized_profit_gross)}
                        </span>
                    </div>
                </div>

                <div className="border border-slate-200 rounded-lg overflow-hidden bg-white">
                    {/* KLIKALNY NAGŁÓWEK SEKCIJI */}
                    <button
                        type="button"
                        onClick={() => setIsScheduleOpen(!isScheduleOpen)}
                        className="w-full px-4 py-3 bg-white hover:bg-slate-50 transition-colors flex items-center justify-between select-none border-b border-slate-100"
                    >
                        <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                            Harmonogram Odsetkowy
                        </h4>
                        {/* Animowana strzałka, która obraca się o 180 stopni przy zwijaniu */}
                        <ChevronDown
                            className={`w-5 h-5 text-slate-500 transition-transform duration-200 ${isScheduleOpen ? '' : '-rotate-90'
                                }`}
                        />
                    </button>

                    {/* WARUNKOWE RENDEROWANIE TABELI */}
                    {isScheduleOpen && (
                        <BondPeriodTable
                            periods={bondPayload.periods}
                            formatDate={formatDate}
                            formatPercent={formatPercent}
                            formatPLN={formatPLN}
                            statusConfig={statusConfig}
                        />
                    )}
                </div>
            </div >
        </div >
    );
}