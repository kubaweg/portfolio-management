import { useMemo, useState } from 'react';
import { formatGenericFloat, formatPLN, formatPercent } from '../utils';
import { ArrowUp, ArrowDown } from 'lucide-react';
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
    <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm flex flex-col justify-between">
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

// =========================================================================
// GŁÓWNY EKSPORT
// =========================================================================

export const ExchangeRowDetails = ({ item }: any) => {
    const { base_data, summary, current_data, open_positions } = item;

    return (
        <div className="w-full bg-slate-50 p-6 flex flex-col gap-6">
            <div className="flex flex-wrap items-center gap-2">
                <span className="px-2.5 py-1 bg-white border border-slate-200 rounded text-xs font-semibold">{base_data.name} ({base_data.ticker})</span>
                <span className="text-xs text-slate-500 ml-auto">Waluta: {base_data.currency}</span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <MiniCard title="Wycena i Kurs FX">
                    <DetailedRow label="Śr. cena zakupu" value={formatGenericFloat(summary.avg_price)} />
                    <DetailedRow label="Bieżący kurs FX" value={formatGenericFloat(current_data.fx_data.fx_rate)} />
                    <DetailedRow label="Bieżący kurs FX" value={formatGenericFloat(current_data.fx_data.fx_effective_rate)} />
                </MiniCard>
                <MiniCard title="Struktura Wyniku">
                    <DetailedRow label="Zysk Niezrealizowany (PLN)" value={formatPLN(summary.unrealized_profit_pln)} />
                    <DetailedRow label="Wynik Całkowity" value={formatPLN(summary.profit_loss_pln)} isBold />
                </MiniCard>
                <MiniCard title="Efektywność">
                    <DetailedRow label="ROI (PLN)" value={formatPercent(summary.roi_pln)} isBold />
                    <DetailedRow label="ROI Roczne (PA)" value={formatPercent(summary.roi_pa)} />
                </MiniCard>
            </div>

            <OpenPositionsTable data={open_positions} currency={base_data.currency} totalQuantity={summary.quantity} currentPrice={current_data.price} />
        </div>
    );
};