"use client";

import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
    PlusCircle, Save
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { toast, Toaster } from "sonner";

import { assetSchema, AssetFormValues } from "./schema";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

export default function AddAssetPage() {
    const [meta, setMeta] = useState<any>(null);
    const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<AssetFormValues>({
        resolver: zodResolver(assetSchema),
        defaultValues: {
            active: true,
            spread: 0,
            multiplier: 1,
            physical_backing: true,
        }
    });

    const assetType = watch("asset_type");

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

    if (!meta) return <p>Ładowanie...</p>;

    return (
        <div className="max-w-3xl mx-auto p-6">
            <Toaster />
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <PlusCircle /> Dodaj aktywo
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">

                        {/* --- Podstawowe pola --- */}
                        <div className="space-y-2">
                            <Label>Ticker</Label>
                            <Input {...register("ticker")} />
                            {errors.ticker && <p className="text-red-500">{errors.ticker.message}</p>}
                        </div>

                        <div className="space-y-2">
                            <Label>Nazwa</Label>
                            <Input {...register("name")} />
                            {errors.name && <p className="text-red-500">{errors.name.message}</p>}
                        </div>

                        <div className="space-y-2">
                            <Label>Typ aktywa</Label>
                            <Select onValueChange={(val) => setValue("asset_type", val)}>
                                <SelectTrigger><SelectValue placeholder="Wybierz typ" /></SelectTrigger>
                                <SelectContent>
                                    {meta.asset_type.map((t: string) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                                </SelectContent>
                            </Select>
                            {errors.asset_type && <p className="text-red-500">{errors.asset_type.message}</p>}
                        </div>

                        <div className="space-y-2">
                            <Label>Waluta</Label>
                            <Input {...register("currency")} placeholder="np. USD" />
                            {errors.currency && <p className="text-red-500">{errors.currency.message}</p>}
                        </div>

                        {/* Kategorie, region, rynek */}
                        <div className="space-y-2">
                            <Label>Kategoria 1</Label>
                            <Select onValueChange={(val) => setValue("category1", val)}>
                                <SelectTrigger><SelectValue placeholder="Wybierz kategorię" /></SelectTrigger>
                                <SelectContent>
                                    {meta.category1.map((c: string) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label>Kategoria 2</Label>
                            <Select onValueChange={(val) => setValue("category2", val)}>
                                <SelectTrigger><SelectValue placeholder="Opcjonalne" /></SelectTrigger>
                                <SelectContent>
                                    {meta.category2.map((c: string) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label>Region geograficzny</Label>
                            <Select onValueChange={(val) => setValue("geo_region", val)}>
                                <SelectTrigger><SelectValue placeholder="Wybierz region" /></SelectTrigger>
                                <SelectContent>
                                    {meta.geo_region.map((g: string) => <SelectItem key={g} value={g}>{g}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label>Kraj</Label>
                            <Select onValueChange={(val) => setValue("geo_country", val)}>
                                <SelectTrigger><SelectValue placeholder="Opcjonalne" /></SelectTrigger>
                                <SelectContent>
                                    {meta.geo_country.map((c: string) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label>Typ rynku</Label>
                            <Select onValueChange={(val) => setValue("market_type", val)}>
                                <SelectTrigger><SelectValue placeholder="Wybierz rynek" /></SelectTrigger>
                                <SelectContent>
                                    {meta.market_type.map((m: string) => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="flex items-center gap-2">
                            <Checkbox checked={watch("active")} onCheckedChange={(val) => setValue("active", !!val)} />
                            <Label>Aktywne</Label>
                        </div>

                        <div className="space-y-2">
                            <Label>Notatki</Label>
                            <Textarea {...register("notes")} />
                        </div>

                        <Separator />

                        {/* --- ExchangeTradedMixin --- */}
                        {(assetType === "ETF" || assetType === "ETC" || assetType === "Akcja" || assetType === "Kryptowaluta") && (
                            <>
                                <Separator />
                                <div className="space-y-2"><Label>ISIN</Label><Input {...register("isin")} /></div>
                                <div className="space-y-2"><Label>Emitent</Label><Input {...register("issuer")} /></div>
                                <div className="space-y-2"><Label>TER</Label><Input type="number" step="0.01" {...register("ter")} /></div>
                                <div className="space-y-2"><Label>Miejsce notowania</Label><Input {...register("listing_venue")} /></div>
                                <div className="space-y-2"><Label>Domicile</Label><Input {...register("domicile")} /></div>
                                <div className="space-y-2"><Label>Spread</Label><Input type="number" step="0.01" {...register("spread")} /></div>
                            </>
                        )}

                        {/* --- ETF --- */}
                        {assetType === "ETF" && (
                            <>
                                <Separator />
                                <div className="space-y-2">
                                    <Label>Benchmark</Label>
                                    <Input {...register("benchmark")} />
                                </div>
                                <div className="space-y-2">
                                    <Label>Polityka dystrybucji</Label>
                                    <Select onValueChange={(val) => setValue("distribution_policy", val)}>
                                        <SelectTrigger><SelectValue placeholder="Wybierz" /></SelectTrigger>
                                        <SelectContent>
                                            {meta.distribution_policy.map((d: string) => (
                                                <SelectItem key={d} value={d}>{d}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>Metoda replikacji</Label>
                                    <Select onValueChange={(val) => setValue("replication_method", val)}>
                                        <SelectTrigger><SelectValue placeholder="Wybierz" /></SelectTrigger>
                                        <SelectContent>
                                            {meta.replication_method.map((r: string) => (
                                                <SelectItem key={r} value={r}>{r}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </>
                        )}

                        {/* --- ETC --- */}
                        {assetType === "ETC" && (
                            <>
                                <Separator />
                                <div className="space-y-2">
                                    <Label>Multiplier</Label>
                                    <Input type="number" {...register("multiplier")} />
                                </div>
                                <div className="flex items-center gap-2">
                                    <Checkbox
                                        checked={watch("physical_backing")}
                                        onCheckedChange={(val) => setValue("physical_backing", !!val)}
                                    />
                                    <Label>Fizyczne pokrycie</Label>
                                </div>
                            </>
                        )}

                        {/* --- Obligacja --- */}
                        {assetType === "Obligacja" && (
                            <>
                                <Separator />
                                <div className="space-y-2"><Label>Seria detaliczna</Label><Input {...register("retail_series_type")} /></div>
                                <div className="space-y-2"><Label>Data emisji</Label><Input type="date" {...register("issue_date")} /></div>
                                <div className="space-y-2"><Label>Data wykupu</Label><Input type="date" {...register("maturity_date")} /></div>
                                <div className="space-y-2"><Label>Wartość nominalna</Label><Input type="number" step="0.01" {...register("nominal_value")} /></div>

                                <div className="space-y-2">
                                    <Label>Obsługa odsetek</Label>
                                    <Select onValueChange={(val) => setValue("interest_handling", val)}>
                                        <SelectTrigger><SelectValue placeholder="Wybierz" /></SelectTrigger>
                                        <SelectContent>
                                            {meta.interest_handling.map((i: string) => <SelectItem key={i} value={i}>{i}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label>Częstotliwość kuponu</Label>
                                    <Select onValueChange={(val) => setValue("coupon_frequency", val)}>
                                        <SelectTrigger><SelectValue placeholder="Wybierz" /></SelectTrigger>
                                        <SelectContent>
                                            {meta.coupon_frequency.map((c: string) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2"><Label>Stopa początkowa</Label><Input type="number" step="0.01" {...register("initial_rate")} /></div>

                                <div className="flex items-center gap-2">
                                    <Checkbox checked={watch("is_indexed")} onCheckedChange={(val) => setValue("is_indexed", !!val)} />
                                    <Label>Indeksowana</Label>
                                </div>

                                <div className="space-y-2">
                                    <Label>Benchmark</Label>
                                    <Select onValueChange={(val) => setValue("benchmark", val)}>
                                        <SelectTrigger><SelectValue placeholder="Wybierz" /></SelectTrigger>
                                        <SelectContent>
                                            {meta.retail_bond_benchmark.map((b: string) => <SelectItem key={b} value={b}>{b}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2"><Label>Marża</Label><Input type="number" step="0.01" {...register("margin")} /></div>
                                <div className="space-y-2"><Label>Kara za wcześniejszy wykup</Label><Input type="number" step="0.01" {...register("early_redemption_penalty")} /></div>
                                <div className="space-y-2"><Label>Rating</Label><Input {...register("rating")} /></div>

                                <div className="flex items-center gap-2">
                                    <Checkbox checked={watch("secured")} onCheckedChange={(val) => setValue("secured", !!val)} />
                                    <Label>Zabezpieczona</Label>
                                </div>
                            </>
                        )}

                        {/* --- Przycisk zapisu --- */}
                        <Separator />
                        <div className="flex justify-end">
                            <Button type="submit" className="flex items-center gap-2">
                                <Save /> Zapisz aktywo
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
