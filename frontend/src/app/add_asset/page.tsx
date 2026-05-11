"use client";

import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast, Toaster } from "sonner";
import {
    PlusCircle, Save, Wallet, LineChart, DollarSign,
    Globe, Landmark, Info, AlertCircle, Loader2
} from "lucide-react";

import { assetSchema, type AssetFormValues } from "./schema";

export default function AddAssetPage() {
    const [meta, setMeta] = useState<Record<string, string[]>>({});
    const [isLoadingMeta, setIsLoadingMeta] = useState(true);

    const {
        register,
        handleSubmit,
        watch,
        reset,
        formState: { errors, isSubmitting },
    } = useForm<AssetFormValues>({
        resolver: zodResolver(assetSchema),
        defaultValues: {
            currency: "PLN",
            active: true,
            spread: 0,
            multiplier: 1,
            physical_backing: true,
        },
    });

    const selectedType = watch("asset_type");
    const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

    // Pobieranie danych meta
    useEffect(() => {
        fetch(`${API_BASE_URL}/api/assets/meta`)
            .then((res) => res.json())
            .then((data) => {
                setMeta(data);
                setIsLoadingMeta(false);
            })
            .catch(() => toast.error("Nie udało się pobrać list rozwijanych"));
    }, []);

    const onSubmit = async (data: AssetFormValues) => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/assets/meta`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });

            if (!response.ok) throw new Error("Błąd zapisu");

            toast.success("Instrument dodany do portfela!");
            reset();
        } catch (err) {
            toast.error("Wystąpił problem podczas komunikacji z bazą.");
        }
    };

    if (isLoadingMeta) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen gap-4 bg-gray-50">
                <Loader2 className="animate-spin text-blue-600" size={40} />
                <p className="text-gray-500 font-medium">Przygotowujemy formularz...</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50/50 pb-20">
            <Toaster position="top-right" richColors />

            {/* Dynamiczny pasek postępu na górze */}
            <div className="h-1 bg-gray-200 w-full fixed top-0 z-50">
                <div className={`h-full bg-blue-600 transition-all duration-500 ${selectedType ? 'w-1/2' : 'w-1/12'}`} />
            </div>

            <div className="max-w-4xl mx-auto pt-12 px-4">
                <header className="mb-10">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-blue-600 rounded-lg text-white">
                            <PlusCircle size={24} />
                        </div>
                        <h1 className="text-3xl font-bold tracking-tight text-gray-900">Nowy Instrument</h1>
                    </div>
                    <p className="text-gray-500">Zdefiniuj parametry aktywa zgodnie z modelem danych portfela.</p>
                </header>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">

                    {/* KARTA 1: PODSTAWY */}
                    <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="p-6 border-b border-gray-50 bg-gray-50/30">
                            <h2 className="font-semibold flex items-center gap-2"><Info size={18} className="text-blue-500" /> Dane Podstawowe</h2>
                        </div>
                        <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-xs font-bold uppercase text-gray-400 ml-1">Typ Instrumentu</label>
                                <select
                                    {...register("asset_type")}
                                    className={`w-full p-3 rounded-xl border bg-gray-50 focus:ring-4 transition-all ${errors.asset_type ? 'border-red-500 ring-red-500/10' : 'border-gray-200 focus:ring-blue-500/10 focus:border-blue-500'}`}
                                >
                                    <option value="">Wybierz...</option>
                                    {meta.asset_type?.map(v => <option key={v} value={v}>{v}</option>)}
                                </select>
                                {errors.asset_type && <p className="text-red-500 text-xs mt-1 ml-1">{errors.asset_type.message}</p>}
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold uppercase text-gray-400 ml-1">Ticker / Symbol</label>
                                <input
                                    {...register("ticker")}
                                    placeholder="np. VWCE.DE"
                                    className="w-full p-3 rounded-xl border border-gray-200 bg-gray-50 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all"
                                />
                            </div>

                            <div className="md:col-span-2 space-y-2">
                                <label className="text-xs font-bold uppercase text-gray-400 ml-1">Pełna Nazwa</label>
                                <input {...register("name")} className="w-full p-3 rounded-xl border border-gray-200 bg-gray-50 outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all" />
                            </div>
                        </div>
                    </div>

                    {/* KARTA 2: GEOGRAFIA I KLASYFIKACJA */}
                    <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="space-y-2">
                            <label className="text-xs font-bold uppercase text-gray-400 ml-1 flex items-center gap-1"><Globe size={12} /> Region</label>
                            <select {...register("geo_region")} className="w-full p-3 rounded-xl border border-gray-200 bg-gray-50 outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all">
                                {meta.geo_region?.map(v => <option key={v} value={v}>{v}</option>)}
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold uppercase text-gray-400 ml-1">Kraj</label>
                            <select {...register("geo_country")} className="w-full p-3 rounded-xl border border-gray-200 bg-gray-50">
                                <option value="">Wybierz...</option>
                                {meta.geo_country?.map(v => <option key={v} value={v}>{v}</option>)}
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold uppercase text-gray-400 ml-1">Rynek</label>
                            <select {...register("market_type")} className="w-full p-3 rounded-xl border border-gray-200 bg-gray-50">
                                {meta.market_type?.map(v => <option key={v} value={v}>{v}</option>)}
                            </select>
                        </div>
                    </div>

                    {/* SEKCJA DYNAMICZNA: OBLIGACJE */}
                    {selectedType === "Obligacja" && (
                        <div className="bg-blue-600 rounded-3xl p-[1px]">
                            <div className="bg-white rounded-[23px] p-8">
                                <h3 className="text-blue-600 font-bold mb-6 flex items-center gap-2"><Landmark size={20} /> Specyfikacja Obligacji</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold uppercase text-gray-400">Data Emisji</label>
                                        <input type="date" {...register("issue_date")} className="w-full p-3 rounded-xl border border-gray-200 bg-gray-50" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold uppercase text-gray-400">Wartość Nominalna</label>
                                        <input type="number" step="0.01" {...register("nominal_value")} className="w-full p-3 rounded-xl border border-gray-200 bg-gray-50" />
                                    </div>
                                    <div className="space-y-2 md:col-span-2">
                                        <label className="text-xs font-bold uppercase text-gray-400">Obsługa odsetek</label>
                                        <select {...register("interest_handling")} className="w-full p-3 rounded-xl border border-gray-200 bg-gray-50">
                                            {meta.interest_handling?.map(v => <option key={v} value={v}>{v}</option>)}
                                        </select>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* SEKCJA DYNAMICZNA: ETF / AKCJE (Exchange Traded) */}
                    {(selectedType === "ETF" || selectedType === "Akcja" || selectedType === "ETC") && (
                        <div className="bg-emerald-500 rounded-3xl p-[1px]">
                            <div className="bg-white rounded-[23px] p-8">
                                <h3 className="text-emerald-600 font-bold mb-6 flex items-center gap-2"><LineChart size={20} /> Dane Giełdowe</h3>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold uppercase text-gray-400">ISIN</label>
                                        <input {...register("isin")} className="w-full p-3 rounded-xl border border-gray-200 bg-gray-50" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold uppercase text-gray-400">TER (%)</label>
                                        <input type="number" step="0.0001" {...register("ter")} className="w-full p-3 rounded-xl border border-gray-200 bg-gray-50" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold uppercase text-gray-400">Giełda</label>
                                        <input {...register("listing_venue")} className="w-full p-3 rounded-xl border border-gray-200 bg-gray-50" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="flex items-center justify-end gap-4 pt-6">
                        <button
                            type="button"
                            onClick={() => reset()}
                            className="px-6 py-3 text-gray-500 font-semibold hover:text-gray-700 transition-colors"
                        >
                            Anuluj
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="px-10 py-3 bg-blue-600 text-white rounded-2xl font-bold shadow-lg shadow-blue-500/30 hover:bg-blue-700 hover:-translate-y-0.5 active:scale-95 transition-all flex items-center gap-2 disabled:opacity-50 disabled:translate-y-0"
                        >
                            {isSubmitting ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
                            Zapisz Instrument
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}