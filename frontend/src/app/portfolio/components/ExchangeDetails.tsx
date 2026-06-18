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

const openColumnHelper = createColumnHelper<any>(); // Użyj 'any' lub swojego typu OpenPosition

const OpenPositionsTable = ({ data, currency, totalQuantity, currentPrice }: any) => {
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
        openColumnHelper.display({
            id: 'share',
            header: 'Waga',
            cell: info => formatPercent(info.row.original.quantity / totalQuantity),
            size: 70,
        }),
        openColumnHelper.display({
            id: 'unit_buy_price',
            header: `Kurs początkowy (${currency})`,
            cell: info => formatGenericFloat(info.row.original.value_buy / info.row.original.quantity),
            size: 110,
        }),
        openColumnHelper.accessor('fx_buy', {
            header: 'Kurs FX początkowy',
            cell: info => <span className="font-mono text-slate-500">{formatGenericFloat(info.getValue())}</span>,
            size: 90,
        }),
        openColumnHelper.display({
            id: 'buy_value_pln',
            header: 'Wartość początkowa (PLN)',
            cell: info => formatPLN(info.row.original.value_buy * info.row.original.fx_buy),
            size: 130,
        }),
        openColumnHelper.display({
            id: 'unit_current_price',
            header: `Kurs obecny (${currency})`,
            cell: () => formatGenericFloat(currentPrice),
            size: 110,
        }),
        openColumnHelper.display({
            id: 'roi_currency',
            header: `ROI (${currency})`,
            cell: info => {
                const roi = info.row.original.unrealized_profit / info.row.original.value_buy;
                return <span className={roi >= 0 ? 'text-emerald-600' : 'text-rose-600'}>{formatPercent(roi)}</span>;
            },
            size: 100,
        }),
        openColumnHelper.display({
            id: 'fx_impact',
            header: 'Wpływ FX',
            cell: info => {
                const buyPln = info.row.original.value_buy * info.row.original.fx_buy;
                const roiPln = info.row.original.unrealized_profit_pln / buyPln;
                const roiCur = info.row.original.unrealized_profit / info.row.original.value_buy;
                const delta = roiPln - roiCur;
                return <span className={`font-medium ${delta >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                    {delta > 0 ? '+' : ''}{formatPercent(delta)}
                </span>;
            },
            size: 90,
        }),
        openColumnHelper.display({
            id: 'current_value_pln',
            header: 'Wartość Obecna (PLN)',
            cell: info => {
                const buyPln = info.row.original.value_buy * info.row.original.fx_buy;
                const currentPln = buyPln + info.row.original.unrealized_profit_pln;
                return <span className="font-semibold text-slate-700">{formatPLN(currentPln)}</span>;
            },
            size: 140,
        }),
        openColumnHelper.display({
            id: 'roi_pln',
            header: 'ROI (PLN)',
            cell: info => {
                const buyPln = info.row.original.value_buy * info.row.original.fx_buy;
                const roiPln = info.row.original.unrealized_profit_pln / buyPln;
                return <span className={`font-bold ${roiPln >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {roiPln > 0 ? '+' : ''}{formatPercent(roiPln)}
                </span>;
            },
            size: 100,
        }),
    ], [currency, totalQuantity, currentPrice]);

    const table = useReactTable({
        data,
        columns,
        state: {
            sorting,
            columnVisibility: { fx_buy: isForeign, fx_impact: isForeign },
            columnPinning: { left: ['date_buy', 'quantity'], right: ['current_value_pln', 'roi_pln'] }
        },
        onSortingChange: setSorting,
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
    });

    return (
        <div className="overflow-x-auto border border-slate-200 rounded-lg shadow-sm">
            <table className="w-full text-left text-xs text-slate-600" style={{ minWidth: table.getTotalSize() }}>
                <thead className="bg-slate-50 text-slate-500 uppercase text-[10px]">
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
                </MiniCard>

                {/* 2. KAFELEK: Kurs FX (Renderowany warunkowo, tylko jeśli waluta to NIE PLN) */}
                {!isPLN && (
                    <MiniCard title={`Kurs FX (${exchangePayload.base_data.currency})`}>
                        <DetailedRow label="Bieżący kurs FX" value={formatGenericFloat(exchangePayload.current_data.fx_data.fx_rate)} />
                        <DetailedRow label="Efektywny kurs FX (buy)" value={formatGenericFloat(exchangePayload.current_data.fx_data.fx_rate / 0.995)} />
                        <DetailedRow label="Efektywny kurs FX (sell)" value={formatGenericFloat(exchangePayload.current_data.fx_data.fx_rate / 1.005)} />
                    </MiniCard>
                )}

                {/* 3. KAFELEK: Struktura Wyniku */}
                <MiniCard title="Struktura Wyniku">
                    <DetailedRow label="Zysk zrealizowany" value={formatPLN(exchangePayload.summary.realized_profit_pln)} />
                    <DetailedRow label="Zysk niezrealizowany" value={formatPLN(exchangePayload.summary.unrealized_profit_pln)} />
                    <DetailedRow label="Wynik całkowity" value={formatPLN(exchangePayload.summary.profit_loss_pln)} isBold />
                </MiniCard>

                {/* 4. KAFELEK: Efektywność */}
                <MiniCard title="Efektywność">
                    <DetailedRow label="ROI (PLN)" value={formatPercent(exchangePayload.summary.roi_pln)} isBold />
                    <DetailedRow label="ROI w skali roku (PLN)" value={formatPercent(exchangePayload.summary.roi_pa)} />
                </MiniCard>

            </div>

            <OpenPositionsTable
                data={exchangePayload.open_positions}
                currency={exchangePayload.base_data.currency}
                totalQuantity={exchangePayload.summary.quantity}
                currentPrice={exchangePayload.current_data.price}
            />
        </div >
    );
};