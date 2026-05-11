'use client';

import React, { useState, useEffect } from 'react';
import { Trash2, PlusCircle, Save } from 'lucide-react';

const AddAssetPage = () => {
    const [assets, setAssets] = useState([]);
    const [formData, setFormData] = useState({ asset_type: '', ticker: '', name: '', currency: 'PLN' });
    const [metadata, setMetadata] = useState(null);

    // Pobierz dane przy starcie
    useEffect(() => {
        fetch('/api/assets').then(res => res.json()).then(data => setAssets(data));
        fetch('/api/assets/meta').then(res => res.json()).then(data => setMetadata(data));
    }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const response = await fetch('/api/add', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData),
        });

        if (response.ok) {
            alert("Dodano aktywo!");
            // Odśwież listę
        }
    };

    const deleteAsset = async (id) => {
        if (window.confirm("Usunąć aktywo?")) {
            await fetch(`/api/delete/${id}`, { method: 'DELETE' });
            setAssets(assets.filter(a => a.id !== id));
        }
    };

    return (
        <div className="p-6 max-w-6xl mx-auto space-y-8">
            {/* SEKCJA FORMULARZA */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                    <PlusCircle size={20} /> Dodaj Nowe Aktywo
                </h2>

                <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Typ Aktywa - Steruje widocznością innych pól */}
                    <div className="flex flex-col">
                        <label className="text-sm text-gray-500">Typ aktywa</label>
                        <select
                            name="asset_type"
                            onChange={handleChange}
                            className="border rounded p-2 bg-gray-50"
                        >
                            <option value="">Wybierz...</option>
                            {metadata?.asset_types.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                    </div>

                    <input name="ticker" placeholder="Ticker (np. AAPL)" onChange={handleChange} className="border p-2 rounded" />
                    <input name="name" placeholder="Nazwa pełna" onChange={handleChange} className="border p-2 rounded" />

                    {/* DYNAMICZNE POLA - Przykład dla Obligacji */}
                    {formData.asset_type === 'BOND' && (
                        <div className="col-span-full grid grid-cols-3 gap-4 p-4 bg-blue-50 rounded-lg">
                            <input name="nominal_value" type="number" placeholder="Wartość nominalna" onChange={handleChange} className="border p-2 rounded" />
                            <input name="maturity_date" type="date" onChange={handleChange} className="border p-2 rounded" />
                        </div>
                    )}

                    <button type="submit" className="col-span-full bg-blue-600 text-white p-3 rounded-lg flex justify-center items-center gap-2 hover:bg-blue-700">
                        <Save size={18} /> Zapisz Aktywo
                    </button>
                </form>
            </div>

            {/* TABELA ZARZĄDZANIA */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-gray-50 border-b">
                        <tr>
                            <th className="p-4">Ticker</th>
                            <th className="p-4">Nazwa</th>
                            <th className="p-4">Typ</th>
                            <th className="p-4 text-right">Akcje</th>
                        </tr>
                    </thead>
                    <tbody>
                        {assets.map(asset => (
                            <tr key={asset.id} className="border-b hover:bg-gray-50">
                                <td className="p-4 font-mono font-bold">{asset.ticker}</td>
                                <td className="p-4">{asset.name}</td>
                                <td className="p-4 text-xs bg-gray-100 rounded px-2 py-1 inline-block mt-3">{asset.type}</td>
                                <td className="p-4 text-right">
                                    <button onClick={() => deleteAsset(asset.id)} className="text-red-500 hover:text-red-700">
                                        <Trash2 size={18} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default AddAssetPage;