"use client";

import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { PlusCircle, Save, Info, Globe, TrendingUp, Landmark, Settings2, FileText } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { toast, Toaster } from "sonner";

import { assetSchema, AssetFormValues } from "./schema";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

export default function AddAssetPage() {
    const [meta, setMeta] = useState<any>(null);
    const { register, handleSubmit, watch, setValue, formState: { errors, isSubmitting } } = useForm<AssetFormValues>({
        resolver: zodResolver(assetSchema),
        defaultValues: {
            active: true,
            spread: 0,
            multiplier: 1,
            physical_backing: true,
        }
    });

    const assetType = watch("asset_type");

    // Logika pomocnicza dla widoczności sekcji MIXIN
    const showExchangeFields = ["ETF", "ETC", "EQUITY", "Akcja"].includes(assetType || "");

    useEffect(() => {
        async function fetchMeta() {
            try {
                const res = await fetch(`${API_BASE_URL}/api/assets/meta`);
                const data = await res.json();
                setMeta(data);
            } catch (err) {
                toast.error("Nie udało się pobrać metadanych");
            }
        }
        fetchMeta();
    }, []);

    const onSubmit = async (values: AssetFormValues) => {
        try {
            const res = await fetch(`${API_BASE_URL}/api/assets`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(values),
            });
            if (res.ok) {
                toast.success("Aktywo dodane pomyślnie!");
            } else {
                toast.error("Błąd przy dodawaniu aktywa");
            }
        } catch {
            toast.error("Błąd sieci");
        }
    };

    if (!meta) return (
        <div className="flex h-screen items-center justify-center">
            <p className="animate-pulse text-muted-foreground font-medium">Inicjalizacja systemu...</p>
        </div>
    );

    return (
        <div className="max-w-4xl mx-auto p-6 space-y-8 animate-in fade-in duration-500">
            <Toaster richColors />

            <header className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="bg-primary/10 p-2 rounded-lg">
                        <PlusCircle className="text-primary h-8 w-8" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Nowe Aktywo</h1>
                        <p className="text-muted-foreground text-sm">Dodaj nowy instrument finansowy do swojej bazy danych.</p>
                    </div>
                </div>
            </header>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">

                {/* --- SEKCJA 1: PODSTAWOWE DANE --- */}
                <Card className="shadow-sm border-muted-foreground/10">
                    <CardHeader className="bg-muted/30 pb-4">
                        <CardTitle className="flex items-center gap-2 text-base font-semibold">
                            <Info className="h-4 w-4 text-blue-500" /> Podstawowe Informacje
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-5 pt-6">
                        <div className="space-y-2">
                            <Label>Ticker</Label>
                            <Input {...register("ticker")} placeholder="np. VWCE.DE" className="font-mono uppercase" />
                            {errors.ticker && <p className="text-destructive text-xs italic">{errors.ticker.message}</p>}
                        </div>
                        <div className="space-y-2 md:col-span-2">
                            <Label>Nazwa Pełna</Label>
                            <Input {...register("name")} placeholder="np. Vanguard FTSE All-World UCITS ETF" />
                            {errors.name && <p className="text-destructive text-xs italic">{errors.name.message}</p>}
                        </div>
                        <div className="space-y-2">
                            <Label>Typ Aktywa</Label>
                            <Select onValueChange={(val) => setValue("asset_type", val)}>
                                <SelectTrigger><SelectValue placeholder="Wybierz..." /></SelectTrigger>
                                <SelectContent className="bg-white">
                                    {meta.asset_type.map((t: string) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                                </SelectContent>
                            </Select>
                            {errors.asset_type && <p className="text-destructive text-xs italic">{errors.asset_type.message}</p>}
                        </div>
                        <div className="space-y-2">
                            <Label>Waluta</Label>
                            <Input {...register("currency")} placeholder="EUR" className="uppercase" />
                        </div>
                        <div className="space-y-2">
                            <Label>Typ Rynku</Label>
                            <Select onValueChange={(val) => setValue("market_type", val)}>
                                <SelectTrigger><SelectValue placeholder="Rynek..." /></SelectTrigger>
                                <SelectContent className="bg-white">
                                    {meta.market_type.map((m: string) => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                    </CardContent>
                </Card>

                {/* --- SEKCJA 2: KLASYFIKACJA --- */}
                <Card className="shadow-sm border-muted-foreground/10">
                    <CardHeader className="bg-muted/30 pb-4">
                        <CardTitle className="flex items-center gap-2 text-base font-semibold">
                            <Globe className="h-4 w-4 text-emerald-500" /> Klasyfikacja i Geografia
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-6">
                        <div className="space-y-2">
                            <Label>Kategoria (Główna)</Label>
                            <Select onValueChange={(val) => setValue("category1", val)}>
                                <SelectTrigger><SelectValue placeholder="Wybierz..." /></SelectTrigger>
                                <SelectContent className="bg-white">
                                    {meta.category1.map((c: string) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Kategoria (Dodatkowa)</Label>
                            <Select onValueChange={(val) => setValue("category2", val)}>
                                <SelectTrigger><SelectValue placeholder="Opcjonalna..." /></SelectTrigger>
                                <SelectContent className="bg-white">
                                    {meta.category2.map((c: string) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Region</Label>
                            <Select onValueChange={(val) => setValue("geo_region", val)}>
                                <SelectTrigger><SelectValue placeholder="Region..." /></SelectTrigger>
                                <SelectContent className="bg-white">
                                    {meta.geo_region.map((g: string) => <SelectItem key={g} value={g}>{g}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Kraj</Label>
                            <Select onValueChange={(val) => setValue("geo_country", val)}>
                                <SelectTrigger><SelectValue placeholder="Kraj..." /></SelectTrigger>
                                <SelectContent className="bg-white">
                                    {meta.geo_country.map((c: string) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                    </CardContent>
                </Card>

                {/* --- SEKCJA 3: EXCHANGE TRADED (Dla ETF, ETC, Akcji) --- */}
                {showExchangeFields && (
                    <Card className="shadow-sm border-blue-200 bg-blue-50/5 animate-in slide-in-from-top-2 duration-300">
                        <CardHeader className="bg-blue-100/30 pb-4 border-b border-blue-100">
                            <CardTitle className="flex items-center gap-2 text-base font-semibold text-blue-700">
                                <TrendingUp className="h-4 w-4" /> Dane Giełdowe
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-5 pt-6">
                            <div className="space-y-2">
                                <Label>ISIN</Label>
                                <Input {...register("isin")} placeholder="IE00..." className="font-mono" />
                            </div>
                            <div className="space-y-2 md:col-span-2">
                                <Label>Emitent</Label>
                                <Input {...register("issuer")} placeholder="np. BlackRock Asset Management" />
                            </div>
                            <div className="space-y-2">
                                <Label>TER (%)</Label>
                                <Input type="number" step="0.001" {...register("ter")} />
                            </div>
                            <div className="space-y-2">
                                <Label>Miejsce Notowania</Label>
                                <Input {...register("listing_venue")} placeholder="XETRA" />
                            </div>
                            <div className="space-y-2">
                                <Label>Domicile</Label>
                                <Input {...register("domicile")} placeholder="Ireland" />
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* --- SEKCJA 4: SPECYFIKACJA ETF --- */}
                {assetType === "ETF" && (
                    <Card className="shadow-sm border-blue-200 animate-in slide-in-from-top-2 duration-300">
                        <CardHeader className="bg-blue-50/50 pb-4 border-b border-blue-100">
                            <CardTitle className="text-sm font-bold uppercase tracking-wider text-blue-800">Szczegóły Funduszu ETF</CardTitle>
                        </CardHeader>
                        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-6">
                            <div className="space-y-2">
                                <Label>Benchmark</Label>
                                <Input {...register("benchmark")} placeholder="MSCI World Index" />
                            </div>
                            <div className="space-y-2">
                                <Label>Polityka Dystrybucji</Label>
                                <Select onValueChange={(val) => setValue("distribution_policy", val)}>
                                    <SelectTrigger><SelectValue placeholder="Wybierz..." /></SelectTrigger>
                                    <SelectContent className="bg-white">
                                        {meta.distribution_policy.map((d: string) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Metoda Replikacji</Label>
                                <Select onValueChange={(val) => setValue("replication_method", val)}>
                                    <SelectTrigger><SelectValue placeholder="Wybierz..." /></SelectTrigger>
                                    <SelectContent className="bg-white">
                                        {meta.replication_method.map((r: string) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* --- SEKCJA 5: OBLIGACJE (Zmienione na "Obligacja" zgodnie z Twoim warunkiem) --- */}
                {assetType === "Obligacja" && (
                    <Card className="shadow-sm border-orange-200 bg-orange-50/5 animate-in slide-in-from-top-2 duration-300">
                        <CardHeader className="bg-orange-100/30 pb-4 border-b border-orange-100">
                            <CardTitle className="flex items-center gap-2 text-base font-semibold text-orange-700">
                                <Landmark className="h-4 w-4" /> Dane Obligacji
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-5 pt-6">
                            <div className="space-y-2">
                                <Label>Seria Detaliczna</Label>
                                <Input {...register("retail_series_type")} placeholder="np. EDO0534" />
                            </div>
                            <div className="space-y-2">
                                <Label>Data Emisji</Label>
                                <Input type="date" {...register("issue_date")} />
                            </div>
                            <div className="space-y-2">
                                <Label>Data Wykupu</Label>
                                <Input type="date" {...register("maturity_date")} />
                            </div>
                            <div className="space-y-2">
                                <Label>Wartość Nominalna</Label>
                                <Input type="number" step="0.001" {...register("nominal_value")} />
                            </div>
                            <div className="space-y-2">
                                <Label>Oprocentowanie Początkowe (%)</Label>
                                <Input type="number" step="0.001" {...register("initial_rate")} />
                            </div>
                            <div className="space-y-2">
                                <Label>Marża (%)</Label>
                                <Input type="number" step="0.001" {...register("margin")} />
                            </div>
                            <div className="flex items-center space-x-2 pt-8">
                                <Checkbox checked={watch("is_indexed")} onCheckedChange={(val) => setValue("is_indexed", !!val)} />
                                <Label>Indeksowana Inflacją</Label>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* --- SEKCJA 6: USTAWIENIA I NOTATKI --- */}
                <Card className="shadow-sm border-muted-foreground/10">
                    <CardHeader className="bg-muted/30 pb-4">
                        <CardTitle className="flex items-center gap-2 text-base font-semibold">
                            <Settings2 className="h-4 w-4 text-slate-500" /> Ustawienia Dodatkowe
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-5 pt-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                            <div className="flex items-center gap-6">
                                <div className="flex items-center space-x-2">
                                    <Checkbox checked={watch("active")} onCheckedChange={(val) => setValue("active", !!val)} />
                                    <Label>Instrument Aktywny</Label>
                                </div>
                                {assetType === "ETC" && (
                                    <div className="flex items-center space-x-2">
                                        <Checkbox checked={watch("physical_backing")} onCheckedChange={(val) => setValue("physical_backing", !!val)} />
                                        <Label>Fizyczne Pokrycie</Label>
                                    </div>
                                )}
                            </div>
                            <div className="space-y-2">
                                <Label>Spread / Inne koszty (%)</Label>
                                <Input type="number" step="0.001" {...register("spread")} />
                            </div>
                        </div>
                        <Separator />
                        <div className="space-y-2">
                            <Label className="flex items-center gap-2"><FileText className="h-3 w-3" /> Notatki i Strategia</Label>
                            <Textarea {...register("notes")} placeholder="Wpisz powód zakupu, cele inwestycyjne lub ryzyka..." className="min-h-[100px]" />
                        </div>
                    </CardContent>
                </Card>

                {/* --- PRZYCISKI AKCJI --- */}
                <div className="flex items-center justify-end gap-4 pb-10">
                    <Button type="button" variant="ghost" onClick={() => window.history.back()}>
                        Anuluj
                    </Button>
                    <Button type="submit" size="lg" className="px-8 flex items-center gap-2 shadow-lg" disabled={isSubmitting}>
                        {isSubmitting ? "Zapisywanie..." : <><Save className="h-4 w-4" /> Zapisz Aktywo</>}
                    </Button>
                </div>
            </form>
        </div>
    );
}