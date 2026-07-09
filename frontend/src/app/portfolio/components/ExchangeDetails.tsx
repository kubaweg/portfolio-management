import React, { useMemo, useState } from 'react';
import { formatGenericFloat, formatPLN, formatPercent, formatDate } from '../utils';
import { ExchangeBaseData, ExchangeCurrentData, ExchangeFXData, ExchangeSummary, ExchangeData } from '../schema/exchange_schema';
import { ArrowUp, ArrowDown, ChevronDown } from 'lucide-react';
import {
    useReactTable,
    getCoreRowModel,
    getSortedRowModel,
    flexRender,
    SortingState,
    createColumnHelper
} from '@tanstack/react-table';
import { OpenPosition, ClosedPosition } from '../schema/main_table_schema';

// =========================================================================
// KOMPONENTY POMOCNICZE
// =========================================================================

const DetailedRow = ({ label, value, isBold = false, isMono = false }: any) => (
    <div className="flex justify-between items-center text-xs text-slate-500 py-0.5">
        <span>{label}</span>
        <span className={`${isBold ? 'font-semibold text-slate-800' : 'font-medium text-slate-700'} ${isMono ? 'font-mono' : ''}`}>
            {value}
        </span>
    </div>
);

const MiniCard = ({ title, children }: any) => (
    <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm flex flex-col">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">{title}</h4>
        <div className="flex flex-col gap-1">{children}</div>
    </div>
);

// =========================================================================
// TABELA OTWARTYCH POZYCJI
// =========================================================================

const openColumnHelper = createColumnHelper<OpenPosition>();

const OpenPositionsTable = ({ data, currency, currentPrice }: any) => {
    const isForeign = currency !== 'PLN';
    const [sorting, setSorting] = useState<SortingState>([{ id: 'date_buy', desc: true }]);

    const columns = useMemo(() => [
        openColumnHelper.accessor('date_buy', {
            header: 'Data Zakupu',
            cell: info => <span className="whitespace-nowrap">{new Date(info.getValue()).toLocaleDateString('us-US')}</span>,
            size: 90,
        }),
        openColumnHelper.accessor('quantity', {
            header: 'Wolumen',
            cell: info => <span className="font-medium text-slate-700">{formatGenericFloat(info.getValue())}</span>,
            size: 80,
        }),

        // --- KURSY AKTYWA OBOK SIEBIE ---
        openColumnHelper.display({
            id: 'unit_buy_price',
            header: `Kurs początkowy (${currency})`,
            cell: info => formatGenericFloat(info.row.original.value_buy / info.row.original.quantity),
            size: 110,
        }),
        openColumnHelper.display({
            id: 'unit_current_price',
            header: `Kurs obecny (${currency})`,
            cell: () => formatGenericFloat(currentPrice),
            size: 110,
        }),

        // --- KURSY WALUTOWE I WPŁYW FX OBOK SIEBIE ---
        openColumnHelper.accessor('fx_buy', {
            header: 'Kurs FX początkowy',
            cell: info => <span className="font-mono text-slate-500">{formatGenericFloat(info.getValue())}</span>,
            size: 100,
        }),
        openColumnHelper.accessor('fx_current' as any, { // Zakładam obecność fx_current w modelu pozycji
            header: 'Kurs FX obecny',
            cell: info => <span className="font-mono text-slate-500">{formatGenericFloat(info.row.original.fx_current)}</span>,
            size: 100,
        }),
        openColumnHelper.display({
            id: 'roi_currency',
            header: `ROI (${currency})`,
            cell: info => {
                const roi = info.row.original.roi_unrealized;
                return <span className={roi >= 0 ? 'text-emerald-600' : 'text-rose-600'}>{formatPercent(roi)}</span>;
            },
            size: 100,
        }),
        openColumnHelper.display({
            id: 'fx_impact',
            header: 'Wpływ FX',
            cell: info => {
                const impact = info.row.original.fx_percentage_impact;
                return <span className={`font-medium ${impact >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                    {impact > 0 ? '+' : ''}{formatPercent(impact)}
                </span>;
            },
            size: 90,
        }),

        // --- BLOK ZYSKÓW W PLN ---
        openColumnHelper.accessor('unrealized_profit_pln', {
            id: 'unrealized_profit_pln',
            header: 'Zysk (PLN)',
            cell: info => {
                const profit = info.getValue();
                return <span className={`font-semibold ${profit >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {profit > 0 ? '+' : ''}{formatPLN(profit)}
                </span>;
            },
            size: 120,
        }),
        openColumnHelper.display({
            id: 'roi_pln',
            header: 'ROI (PLN)',
            cell: info => {
                const roiPln = info.row.original.roi_unrealized_pln;
                return <span className={`font-bold ${roiPln >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {roiPln > 0 ? '+' : ''}{formatPercent(roiPln)}
                </span>;
            },
            size: 100,
        }),
        openColumnHelper.accessor('roi_unrealized_pa_pln' as any, {
            id: 'roi_pa_pln',
            header: 'ROI p.a. (PLN)',
            cell: info => {
                const roiPa = info.getValue();
                return <span className={`font-bold ${roiPa >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                    {roiPa > 0 ? '+' : ''}{formatPercent(roiPa)}
                </span>;
            },
            size: 110,
        })
    ], [currency, currentPrice]);

    const table = useReactTable({
        data,
        columns,
        state: {
            sorting,
            columnVisibility: {
                fx_buy: isForeign,
                fx_current: isForeign,
                fx_impact: isForeign,
                roi_currency: isForeign
            },
            columnPinning: {
                left: ['date_buy', 'quantity'],
                right: ['unrealized_profit_pln', 'roi_pln', 'roi_pa_pln']
                // Przypięliśmy najważniejsze metryki wynikowe do prawej krawędzi
            }
        },
        onSortingChange: setSorting,
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
    });

    return (
        // Kluczowa zmiana: dodanie w-full i max-w-full do głównego kontenera
        <div className="w-full max-w-full overflow-x-auto border border-slate-200 rounded-lg shadow-sm">
            <table className="w-full text-left text-xs text-slate-600" style={{ minWidth: table.getTotalSize() }}>
                <thead className="w-full bg-slate-50 text-slate-500 uppercase text-[10px]">
                    {table.getHeaderGroups().map(hg => (
                        <tr key={hg.id}>
                            {hg.headers.map(h => (
                                <th key={h.id} className="p-3" style={{ width: h.getSize() }}>
                                    <div className="flex items-center gap-1 cursor-pointer" onClick={h.column.getToggleSortingHandler()}>
                                        {flexRender(h.column.columnDef.header, h.getContext())}
                                        {{ asc: <ArrowUp className="w-3 h-3" />, desc: <ArrowDown className="w-3 h-3" /> }[h.column.getIsSorted() as string]}
                                    </div>
                                </th>
                            ))}
                        </tr>
                    ))}
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                    {table.getRowModel().rows.map(row => (
                        <tr key={row.id} className="hover:bg-slate-50">
                            {row.getVisibleCells().map(cell => (
                                <td key={cell.id} className="p-3">
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


// =========================================================================
// TABELA ZAMKNIĘTYCH POZYCJI
// =========================================================================

const closedColumnHelper = createColumnHelper<ClosedPosition>(); // Zgodnie z dobrymi praktykami od razu podpinamy interfejs

export const ClosedPositionsTable = ({ data, currency }: { data: ClosedPosition[], currency: string }) => {
    const isForeign = currency !== 'PLN';
    // Domyślnie sortujemy po dacie sprzedaży, od najnowszych
    const [sorting, setSorting] = useState<SortingState>([{ id: 'date_sell', desc: true }]);

    const columns = useMemo(() => [
        closedColumnHelper.accessor('date_buy', {
            header: 'Data Zakupu',
            cell: info => <span className="whitespace-nowrap">{new Date(info.getValue()).toLocaleDateString('us-US')}</span>,
            size: 90,
        }),
        closedColumnHelper.accessor('date_sell', {
            header: 'Data Sprzedaży',
            cell: info => <span className="whitespace-nowrap font-medium text-slate-700">{new Date(info.getValue()).toLocaleDateString('us-US')}</span>,
            size: 90,
        }),
        closedColumnHelper.accessor('quantity', {
            header: 'Wolumen',
            cell: info => <span className="font-medium text-slate-700">{formatGenericFloat(info.getValue())}</span>,
            size: 80,
        }),
        closedColumnHelper.display({
            id: 'unit_buy_price',
            header: `Kurs zakupu (${currency})`,
            cell: info => formatGenericFloat(info.row.original.value_buy / info.row.original.quantity),
            size: 110,
        }),
        closedColumnHelper.display({
            id: 'unit_sell_price',
            header: `Kurs sprzedaży (${currency})`,
            cell: info => formatGenericFloat(info.row.original.value_sell / info.row.original.quantity),
            size: 110,
        }),
        closedColumnHelper.accessor('fx_buy', {
            header: 'FX Kupno',
            cell: info => <span className="font-mono text-slate-500">{formatGenericFloat(info.getValue())}</span>,
            size: 80,
        }),
        closedColumnHelper.accessor('fx_sell', {
            header: 'FX Sprzedaż',
            cell: info => <span className="font-mono text-slate-500">{formatGenericFloat(info.getValue())}</span>,
            size: 80,
        }),
        closedColumnHelper.display({
            id: 'roi_realized',
            header: `ROI (${currency})`,
            cell: info => {
                const roi = info.row.original.roi_realized;
                return <span className={roi >= 0 ? 'text-emerald-600' : 'text-rose-600'}>{formatPercent(roi)}</span>;
            },
            size: 90,
        }),
        closedColumnHelper.display({
            id: 'fx_impact',
            header: 'Wpływ FX',
            cell: info => {
                const impact = info.row.original.fx_percentage_impact;
                return <span className={`font-medium ${impact >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                    {impact > 0 ? '+' : ''}{formatPercent(impact)}
                </span>;
            },
            size: 90,
        }),
        closedColumnHelper.accessor('realized_profit_pln', {
            header: 'Zysk (PLN)',
            cell: info => {
                const profit = info.getValue();
                return <span className={`font-semibold ${profit >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {profit > 0 ? '+' : ''}{formatPLN(profit)}
                </span>;
            },
            size: 120,
        }),
        closedColumnHelper.accessor('roi_realized_pln', {
            header: 'ROI (PLN)',
            cell: info => {
                const roi = info.getValue();
                return <span className={`font-bold ${roi >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {roi > 0 ? '+' : ''}{formatPercent(roi)}
                </span>;
            },
            size: 100,
        }),
        closedColumnHelper.accessor('roi_realized_pa_pln', {
            header: 'ROI p.a. (PLN)',
            cell: info => {
                const roipa = info.getValue();
                return <span className={`font-bold ${roipa >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                    {roipa > 0 ? '+' : ''}{formatPercent(roipa)}
                </span>;
            },
            size: 110,
        })
    ], [currency]);

    const table = useReactTable({
        data,
        columns,
        state: {
            sorting,
            columnVisibility: {
                fx_buy: isForeign,
                fx_sell: isForeign,
                fx_impact: isForeign,
                roi_realized: isForeign
            },
            columnPinning: {
                left: ['date_buy', 'date_sell', 'quantity'],
                right: ['realized_profit_pln', 'roi_realized_pln', 'roi_realized_pa_pln']
            }
        },
        onSortingChange: setSorting,
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
    });

    return (
        <div className="overflow-x-auto border border-slate-200 rounded-lg shadow-sm">
            <table className="w-full text-left text-xs text-slate-600" style={{ minWidth: table.getTotalSize() }}>
                <thead className="w-full bg-slate-50 text-slate-500 uppercase text-[10px]">
                    {table.getHeaderGroups().map(hg => (
                        <tr key={hg.id}>
                            {hg.headers.map(h => (
                                <th key={h.id} className="p-3" style={{ width: h.getSize() }}>
                                    <div className="flex items-center gap-1 cursor-pointer" onClick={h.column.getToggleSortingHandler()}>
                                        {flexRender(h.column.columnDef.header, h.getContext())}
                                        {{ asc: <ArrowUp className="w-3 h-3" />, desc: <ArrowDown className="w-3 h-3" /> }[h.column.getIsSorted() as string]}
                                    </div>
                                </th>
                            ))}
                        </tr>
                    ))}
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                    {table.getRowModel().rows.map(row => (
                        <tr key={row.id} className="hover:bg-slate-50">{row.getVisibleCells().map(cell => (
                            <td key={cell.id} className="p-3">{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>
                        ))}</tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};


// ===============================================================================================================

interface BaseDataRow {
    label: string;
    value: React.ReactNode;
}

const columnHelper = createColumnHelper<BaseDataRow>();

interface ExchangeBaseDataTableProps {
    baseData: ExchangeBaseData;
}

export const ExchangeBaseDataTable: React.FC<ExchangeBaseDataTableProps> = ({ baseData }) => {
    // 1. Przygotowanie danych do tabeli (mapowanie obiektu na wiersze)
    const tableData: BaseDataRow[] = useMemo(() => [
        {
            label: 'Symbol (Ticker)',
            value: <span className="font-bold text-slate-800">{baseData.ticker}</span>
        },
        {
            label: 'Pełna nazwa',
            value: baseData.name
        },
        {
            label: 'Typ instrumentu',
            value: baseData.type // np. ETF, ETC
        },
        {
            label: 'Kategoria bazowa',
            value: baseData.category1 // np. Equity, Commodities
        },
        {
            label: 'Podkategoria',
            value: baseData.category2 || '-'
        },
        {
            label: 'Waluta notowania',
            value: <span>{baseData.currency}</span>
        },
    ], [baseData]);

    // 2. Definicja kolumn TanStack
    const columns = useMemo(() => [
        columnHelper.accessor('label', {
            header: 'Parametr',
            cell: info => <span className="text-slate-500 font-medium">{info.getValue()}</span>,
        }),
        columnHelper.accessor('value', {
            header: 'Wartość',
            cell: info => <span className="text-slate-800">{info.getValue()}</span>,
        }),
    ], []);

    // 3. Inicjalizacja tabeli
    const table = useReactTable({
        data: tableData,
        columns,
        getCoreRowModel: getCoreRowModel(),
    });

    return (
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
            <table className="w-full text-left text-sm">
                <tbody className="divide-y divide-slate-100">
                    {table.getRowModel().rows.map(row => (
                        <tr key={row.id} className="hover:bg-slate-50/50">
                            {row.getVisibleCells().map((cell, index) => (
                                <td key={cell.id} className="px-4 py-2.5 w-1/2">
                                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div >
    );
};

// =========================================================================
// GŁÓWNY EKSPORT
// =========================================================================

export const ExchangeRowDetails = ({ exchangePayload }: { exchangePayload: ExchangeData }) => {

    const [isDetailsOpen, setIsDetailsOpen] = useState(false); // Domyślnie zamknięte, zmień na true jeśli ma być domyślnie otwarte

    {/* Wyciągamy flagę logiczną do sprawdzenia, czy waluta bazowa to PLN */ }
    const isPLN = exchangePayload.base_data.currency === 'PLN';

    console.log(exchangePayload)

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
                    <ExchangeBaseDataTable baseData={exchangePayload.base_data} />
                )}
            </div>

            {/* Dynamicznie przypisujemy siatkę: 3 kolumny dla PLN, 4 kolumny dla obcych walut */}
            <div className={`grid grid-cols-1 ${isPLN ? 'lg:grid-cols-3' : 'lg:grid-cols-4'} gap-3 mb-3`}>

                {/* 1. KAFELEK: Wycena */}
                <MiniCard title="Wycena">
                    <DetailedRow label="Średni kurs zakupu" value={formatGenericFloat(exchangePayload.summary.avg_price)} />
                    <DetailedRow label="Kurs obecny" value={formatGenericFloat(exchangePayload.current_data.price)} />
                    <DetailedRow label="% różnicy vs średni kurs zakupu" value={formatPercent(exchangePayload.current_data.price / exchangePayload.summary.avg_price - 1)} />
                </MiniCard>

                {/* 2. KAFELEK: Kurs FX (Renderowany warunkowo, tylko jeśli waluta to NIE PLN) */}
                {!isPLN && (
                    <MiniCard title={`Kurs FX (${exchangePayload.base_data.currency})`}>
                        <DetailedRow label="Bieżący kurs FX" value={formatGenericFloat(exchangePayload.current_data.fx_data.fx_rate)} />
                        <DetailedRow label="Efektywny kurs FX (buy)" value={formatGenericFloat(exchangePayload.current_data.fx_data.fx_rate / 0.995)} />
                        <DetailedRow label="Efektywny kurs FX (sell)" value={formatGenericFloat(exchangePayload.current_data.fx_data.fx_rate / 1.005)} />
                        <DetailedRow label="Średni kurs FX zakupu" value={formatGenericFloat(exchangePayload.summary.avg_fx_rate)} />
                        <DetailedRow label="% różnicy vs średni kurs FX zakupu" value={formatPercent(exchangePayload.current_data.fx_data.fx_effective_rate_sell / exchangePayload.summary.avg_fx_rate - 1)} />
                    </MiniCard>
                )}

                {/* 3. KAFELEK: Struktura Wyniku */}
                <MiniCard title="Struktura Wyniku">
                    <DetailedRow label="Zysk zrealizowany" value={formatPLN(exchangePayload.summary.realized_profit_pln)} />
                    <DetailedRow label="Zysk niezrealizowany" value={formatPLN(exchangePayload.summary.unrealized_profit_pln)} />
                    <DetailedRow label="Wynik całkowity" value={formatPLN(exchangePayload.summary.total_profit_pln)} isBold />
                </MiniCard>

                {/* 4. KAFELEK: Efektywność */}
                <MiniCard title="Efektywność">
                    {!isPLN && (
                        <>
                            <DetailedRow label={`ROI (${exchangePayload.base_data.currency})`} value={formatPercent(exchangePayload.summary.roi_attribution_asset_pln)} />
                            <DetailedRow label="Wpływ FX" value={formatPercent(exchangePayload.summary.roi_attribution_fx_pln)} />
                        </>
                    )}
                    <DetailedRow label="ROI (PLN)" value={formatPercent(exchangePayload.summary.roi_pln)} />
                    <DetailedRow label="ROI w skali roku (PLN)" value={formatPercent(exchangePayload.summary.roi_pa_pln)} isBold />
                </MiniCard>

            </div>

            {exchangePayload.open_positions.length > 0 ? (
                <OpenPositionsTable
                    data={exchangePayload.open_positions}
                    currency={exchangePayload.base_data.currency}
                    currentPrice={exchangePayload.current_data.price}
                />
            ) : (
                <div className="p-8 text-center text-slate-400 border border-dashed border-slate-300 rounded-lg">
                    Brak otwartych pozycji dla tego aktywa.
                </div>
            )}

            <div className="mb-3"></div>

            {exchangePayload.closed_positions.length > 0 ? (
                <ClosedPositionsTable
                    data={exchangePayload.closed_positions}
                    currency={exchangePayload.base_data.currency}
                />
            ) : (
                <div className="p-8 text-center text-slate-400 border border-dashed border-slate-300 rounded-lg">
                    Brak zamkniętych pozycji dla tego aktywa.
                </div>
            )}
        </div >
    );
};