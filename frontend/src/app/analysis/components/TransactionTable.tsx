import React from 'react';
import { ChartTransactionPoint } from '../schema'; // Podmień na właściwą ścieżkę do interfejsów

interface TransactionTableProps {
    transactions?: ChartTransactionPoint[];
}

export const TransactionTable = ({ transactions }: TransactionTableProps) => {
    if (!transactions || transactions.length === 0) return null;

    return (
        <div className="w-full bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 bg-slate-50">
                <h3 className="font-semibold text-slate-800">Historia transakcji</h3>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left text-slate-600">
                    <thead className="text-xs text-slate-500 uppercase bg-slate-50">
                        <tr>
                            <th className="px-6 py-3 font-medium">Data</th>
                            <th className="px-6 py-3 font-medium">Typ</th>
                            <th className="px-6 py-3 font-medium text-right">Ilość</th>
                            <th className="px-6 py-3 font-medium text-right">Cena</th>
                            <th className="px-6 py-3 font-medium text-right">Wartość</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                        {[...transactions]
                            .sort((a, b) => b.date.localeCompare(a.date)) // Sortowanie od najnowszych
                            .map((tx, idx) => (
                                <tr key={idx} className="hover:bg-slate-50 transition-colors">
                                    <td className="px-6 py-4 whitespace-nowrap">{tx.date}</td>
                                    <td className="px-6 py-4 font-medium">
                                        <span className={`px-2.5 py-1 rounded-full text-xs ${tx.type.toUpperCase() === 'BUY'
                                            ? 'bg-emerald-100 text-emerald-800'
                                            : 'bg-red-100 text-red-800'
                                            }`}>
                                            {tx.type.toUpperCase() === 'BUY' ? 'KUPNO' : 'SPRZEDAŻ'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right tabular-nums">{tx.quantity}</td>
                                    <td className="px-6 py-4 text-right tabular-nums">{tx.price.toFixed(2)}</td>
                                    <td className="px-6 py-4 text-right font-medium text-slate-900 tabular-nums">
                                        {(tx.quantity * tx.price).toFixed(2)}
                                    </td>
                                </tr>
                            ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};