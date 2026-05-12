"use client";

import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import {
    PlusCircle, Save, Wallet, LineChart,
    DollarSign, Globe, Landmark, Info
} from "lucide-react";

// Importy z shadcn/ui
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { toast, Toaster } from "sonner";

type FormValues = Record<string, any>;

export default function AddAssetPage() {
    const { register, handleSubmit, setValue, watch, reset, formState } = useForm<FormValues>();
    const [meta, setMeta] = useState<Record<string, string[]>>({});
    const [loading, setLoading] = useState(true);

    const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
    const assetType = watch("asset_type");

    useEffect(() => {
        fetch(`${API_BASE_URL}/api/assets/meta`)
            .then(res => res.json())
            .then(data => {
                setMeta(data);
                setLoading(false);
            })
            .catch(() => toast.error("Nie udało się pobrać danych konfiguracyjnych"));
    }, []);

    const onSubmit = async (data: FormValues) => {
        try {
            const res = await fetch(`${API_BASE_URL}/api/assets`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });

            if (!res.ok) throw new Error();

            toast.success("Aktywo zostało dodane do Twojego portfela!");
            reset();
        } catch (err) {
            toast.error("Wystąpił błąd podczas zapisu. Sprawdź połączenie z backendem.");
        }
    };

    return (
        <div className="container mx-auto py-10 px-4 max-w-5xl">
            <Toaster position="top-right" richColors />

            <div className="flex items-center gap-4 mb-8">
                <div className="bg-blue-600 p-3 rounded-xl text-white">
                    <PlusCircle size={32} />
                </div>
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Nowe Aktywo</h1>
                    <p className="text-muted-foreground">Wprowadź dane instrumentu do bazy zarządzania portfelem.</p>
                </div>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
                {/* Sekcja: Informacje Podstawowe */}
                <Card className="shadow-sm">
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                            <Info size={18} className="text-blue-500" /> Podstawowe informacje
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <Label htmlFor="asset_type">Typ instrumentu</Label>
                            <Select onValueChange={(v) => setValue("asset_type", v)}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Wybierz typ..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {meta.asset_type?.map(v => (
                                        <SelectItem key={v} value={v}>{v}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="ticker">Ticker / Symbol</Label>
                            <div className="relative">
                                <LineChart className="absolute left-3 top-3 text-muted-foreground" size={16} />
                                <Input id="ticker" {...register("ticker")} className="pl-10" placeholder="np. CSPX.UK" />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="name">Pełna nazwa</Label>
                            <Input id="name" {...register("name")} placeholder="np. iShares Core S&P 500 UCITS ETF" />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="currency">Waluta</Label>
                            <div className="relative">
                                <DollarSign className="absolute left-3 top-3 text-muted-foreground" size={16} />
                                <Input id="currency" {...register("currency")} className="pl-10" placeholder="PLN / EUR / USD" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Sekcja dynamiczna: Tylko dla ETF/BOND/Equity */}
                {assetType && (
                    <Card className="border-blue-100 bg-blue-50/30">
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <Landmark size={18} className="text-blue-500" /> Szczegóły dla {assetType}
                            </CardTitle>
                            <CardDescription>Pola specyficzne dla wybranego rodzaju aktywa.</CardDescription>
                        </CardHeader>
                        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {/* Tutaj możesz dodać pola typu ISIN, TER, Maturity Date tak jak w poprzednim kodzie, używając komponentu <Input /> */}
                            <div className="space-y-2">
                                <Label>ISIN</Label>
                                <Input {...register("isin")} placeholder="IE00B5BMR087" />
                            </div>
                            <div className="space-y-2">
                                <Label>Emitent</Label>
                                <Input {...register("issuer")} placeholder="BlackRock" />
                            </div>
                            <div className="space-y-2">
                                <Label>TER (%)</Label>
                                <Input type="number" step="0.01" {...register("ter")} placeholder="0.07" />
                            </div>
                        </CardContent>
                    </Card>
                )}

                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                            <Globe size={18} className="text-blue-500" /> Kategoryzacja
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label>Kategoria główna</Label>
                                <Select onValueChange={(v) => setValue("category1", v)}>
                                    <SelectTrigger><SelectValue placeholder="Wybierz..." /></SelectTrigger>
                                    <SelectContent>
                                        {meta.category1?.map(v => <SelectItem key={v} value={v}>{v}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Region geograficzny</Label>
                                <Select onValueChange={(v) => setValue("geo_region", v)}>
                                    <SelectTrigger><SelectValue placeholder="Wybierz..." /></SelectTrigger>
                                    <SelectContent>
                                        {meta.geo_region?.map(v => <SelectItem key={v} value={v}>{v}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <Separator />

                        <div className="space-y-2">
                            <Label>Notatki prywatne</Label>
                            <Textarea {...register("notes")} placeholder="Dodatkowe informacje o strategii lub instrumencie..." />
                        </div>
                    </CardContent>
                </Card>

                <div className="flex justify-end gap-4">
                    <Button type="button" variant="outline" onClick={() => reset()}>Anuluj</Button>
                    <Button type="submit" className="px-8 bg-blue-600 hover:bg-blue-700" disabled={formState.isSubmitting}>
                        <Save className="mr-2 h-4 w-4" />
                        {formState.isSubmitting ? "Zapisywanie..." : "Zapisz w portfelu"}
                    </Button>
                </div>
            </form>
        </div>
    );
}