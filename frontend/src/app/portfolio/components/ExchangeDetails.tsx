import React from 'react';
import { Info } from 'lucide-react';
import { formatPLN } from '../utils';
import { ExchangeData } from '../schema/exchange_schema';

interface PositionTableProps {
    title: string;
    data: any[];
    type: 'open' | 'closed';
}

function PositionTable({ title, data, type }: PositionTableProps) {
    if (!data || data.length === 0) return (
        <div>
            <h4 className="text-sm font-bold text-slate-700 mb-2 uppercase tracking-wider flex items-center gap-2">
                <Info size={16} /> {title}
            </h4>
            <p className="text-sm text-slate-400 italic">Brak pozycji</p>
        </div>
    );

    return (
        <div>
            <h4 className="text-sm font-bold text-slate-700 mb-3 uppercase tracking-wider">{title}</h4>
            <div className="overflow-x-auto bg-white rounded-lg border border-slate-200">
                <table className="w-full text-xs text-left">
                    <thead className="bg-slate-100 text-slate-600 font-bold uppercase">
                        <tr>
                            <th className="p-2">Ilość</th>
                            <th className="p-2">Wartość zakupu (kurs walutowy)</th>
                            <th className="p-2">{type === 'open' ? 'Wartość obecna' : 'Wartość sprzedaży'}</th>
                            <th className="p-2">Zysk (PLN)</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {data.map((pos, idx) => (
                            <tr key={idx}>
                                <td className="p-2 font-medium">{pos.quantity.toFixed(4)}</td>
                                <td className="p-2">{pos.value_buy.toFixed(2)} ({pos.fx_buy.toFixed(4)})</td>
                                <td className="p-2">{type === 'open' ? pos.current_value.toFixed(2) : pos.value_sell.toFixed(2)}</td>
                                <td className={`p-2 font-bold ${pos[type === 'open' ? 'unrealized_profit_pln' : 'realized_profit_pln'] >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                                    {formatPLN(pos[type === 'open' ? 'unrealized_profit_pln' : 'realized_profit_pln'])}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

export function EtfAssetDetails({ asset }: { asset: ExchangeData }) {
    return (
        <div className="space-y-6">
            <div className="grid grid-cols-3 gap-4 bg-white p-4 rounded-lg border border-slate-200 text-xs shadow-sm">
                <div>
                    <span className="text-slate-400 block mb-1">Średnia cena wejścia:</span>
                    <span className="font-bold text-slate-700 text-sm">
                        {asset.summary.avg_price?.toFixed(2)} {asset.base_data.currency}
                    </span>
                </div>
                <div>
                    <span className="text-slate-400 block mb-1">Średni kurs wymiany (FX):</span>
                    <span className="font-bold text-slate-700 text-sm">
                        {asset.summary.avg_fx_rate?.toFixed(4)}
                    </span>
                </div>
                <div>
                    <span className="text-slate-400 block mb-1">Ekspozycja walutowa:</span>
                    <span className="font-bold text-slate-700 text-sm uppercase">
                        {asset.base_data.currency} / PLN
                    </span>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-6">
                <PositionTable title="Pozycje Otwarte" data={asset.open_positions} type="open" />
                <PositionTable title="Pozycje Zamknięte" data={asset.closed_positions} type="closed" />
            </div>
        </div>
    );
}