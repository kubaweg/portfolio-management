"use client"

import React, { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Landmark, ArrowRightLeft, Calendar, Coins, Hash, Notebook, Save, Globe } from "lucide-react"
import { toast, Toaster } from "sonner"

import { transactionSchema, type TransactionFormValues } from "./schema"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

interface AssetMeta {
    id: number
    ticker: string
    name: string
    currency: string
}

interface TransactionMeta {
    transaction_type: string[]
}

export default function AddTransactionPage() {
    const [assets, setAssets] = useState<AssetMeta[]>([])
    const [types, setTypes] = useState<string[]>([])
    const [isLoading, setIsLoading] = useState(true)

    const {
        register,
        watch,
        handleSubmit,
        setValue,
        formState: { errors, isSubmitting },
    } = useForm<TransactionFormValues>({
        resolver: zodResolver(transactionSchema),
        defaultValues: {
            fx_rate: 1.0,
            notes: ""
        },
    })

    useEffect(() => {
        const fetchMeta = async () => {
            try {
                const [assetsRes, enumsRes] = await Promise.all([
                    fetch(`${API_BASE_URL}/api/transactions/meta/list_assets`),
                    fetch(`${API_BASE_URL}/api/transactions/meta/enums`),
                ])

                if (!assetsRes.ok || !enumsRes.ok) throw new Error()

                const assetsData = await assetsRes.json()
                const enumsData: TransactionMeta = await enumsRes.json()

                const activeAssets = assetsData.filter(asset => asset.active === true)

                setAssets(activeAssets)
                setTypes(enumsData.transaction_type)
            } catch (error) {
                toast.error("Błąd ładowania danych", {
                    description: "Nie udało się pobrać list aktywów lub typów transakcji.",
                })
            } finally {
                setIsLoading(false)
            }
        }
        fetchMeta()
    }, [])

    // Wewnątrz komponentu AddTransactionPage:
    const selectedAssetId = watch("asset_id");
    console.log("Obecna wartość asset_id w formularzu:", selectedAssetId);

    const selectedAsset = assets.find((a) => a.id === selectedAssetId);

    const onSubmit = async (values: TransactionFormValues) => {
        const promise = fetch(`${API_BASE_URL}/api/transactions/add`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(values),
        }).then(async (res) => {
            if (!res.ok) {
                const errorData = await res.json()
                throw new Error(errorData.detail || "Błąd serwera")
            }
            return res.json()
        })

        toast.promise(promise, {
            loading: "Zapisywanie transakcji...",
            success: "Transakcja została dodana pomyślnie!",
            error: (err) => `Błąd: ${err.message}`,
        })
    }

    if (isLoading) return <div className="flex h-screen items-center justify-center animate-pulse">Inicjalizacja formularza...</div>

    return (
        <div className="min-h-screen bg-slate-50/30 py-10 px-4">
            <Toaster position="top-right" richColors />

            {/* mx-auto sprawia, że kontener jest wyśrodkowany */}
            <div className="container mx-auto max-w-4xl">

                <div className="flex items-center gap-4 mb-10">
                    <div className="bg-blue-600 p-3 rounded-xl shadow-blue-200 shadow-lg">
                        <ArrowRightLeft className="h-6 w-6 text-white" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Nowa Transakcja</h1>
                        <p className="text-slate-500">Uzupełnij szczegóły operacji, aby zaktualizować portfel.</p>
                    </div>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                    {/* SEKCJA 1: Wybór aktywa, typu oraz flag operacyjnych */}
                    <Card className="shadow-sm border-blue-100">
                        <CardHeader className="bg-blue-50/20 pb-4 border-b border-blue-50">
                            <CardTitle className="flex items-center gap-2 text-base font-semibold text-blue-700">
                                <Landmark className="h-4 w-4" /> Podmiot i Typ
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6">
                            <div className="space-y-2">
                                <Label>Aktywo</Label>
                                <Select onValueChange={(val) => setValue("asset_id", parseInt(val))}>
                                    <SelectTrigger className={errors.asset_id ? "border-destructive" : ""}>
                                        <SelectValue placeholder="Wybierz aktywo...">
                                            {selectedAsset ? `${selectedAsset.ticker} — ${selectedAsset.name}` : null}
                                        </SelectValue>
                                    </SelectTrigger>

                                    <SelectContent className="bg-white">
                                        {assets.map((asset) => (
                                            <SelectItem key={asset.id} value={asset.id.toString()}>
                                                {asset.ticker} - {asset.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {errors.asset_id && <p className="text-xs font-medium text-destructive">{errors.asset_id.message}</p>}
                            </div>

                            <div className="space-y-2">
                                <Label>Typ operacji</Label>
                                <Select onValueChange={(val) => setValue("type", val)}>
                                    <SelectTrigger className={errors.type ? "border-destructive" : ""}>
                                        <SelectValue placeholder="Wybierz typ transakcji..." />
                                    </SelectTrigger>
                                    <SelectContent className="bg-white">
                                        {types.map((t) => (
                                            <SelectItem key={t} value={t}>{t}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {errors.type && <p className="text-xs font-medium text-destructive">{errors.type.message}</p>}
                            </div>

                            {/* Nowe pola logiczne (Booleany) w dolnej sekcji pierwszej karty */}
                            <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
                                <div className="flex items-start space-x-3 rounded-md border p-4 shadow-sm bg-slate-50/30">
                                    <input
                                        type="checkbox"
                                        id="is_exchange"
                                        {...register("is_exchange")}
                                        className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 mt-1 cursor-pointer"
                                    />
                                    <div className="space-y-1 leading-none">
                                        <Label htmlFor="is_exchange" className="cursor-pointer font-medium text-slate-700">Zamiana obligacji</Label>
                                        <p className="text-xs text-muted-foreground">Zaznacz, jeśli kupujesz obligacje w ramach mechanizmu zamiany.</p>
                                        {errors.is_exchange && <p className="text-xs font-medium text-destructive">{errors.is_exchange.message}</p>}
                                    </div>
                                </div>

                                <div className="flex items-start space-x-3 rounded-md border p-4 shadow-sm bg-slate-50/30">
                                    <input
                                        type="checkbox"
                                        id="is_early_redemption"
                                        {...register("is_early_redemption")}
                                        className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 mt-1 cursor-pointer"
                                    />
                                    <div className="space-y-1 leading-none">
                                        <Label htmlFor="is_early_redemption" className="cursor-pointer font-medium text-slate-700">Przedterminowy wykup</Label>
                                        <p className="text-xs text-muted-foreground">Zaznacz w przypadku przedterminowego wykupu obligacji skarbowych.</p>
                                        {errors.is_early_redemption && <p className="text-xs font-medium text-destructive">{errors.is_early_redemption.message}</p>}
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* SEKCJA 2: Dane finansowe i parametry liczbowe */}
                    <Card className="shadow-sm">
                        <CardHeader className="bg-slate-50/50 pb-4 border-b border-slate-100">
                            <CardTitle className="flex items-center gap-2 text-base font-semibold text-slate-700">
                                <Coins className="h-4 w-4" /> Parametry transakcji
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 pt-6">

                            {/* Wiersz 1: Podstawowe parametry wykonania */}
                            <div className="space-y-2 lg:col-span-2">
                                <Label className="flex items-center gap-2"><Calendar className="h-3.5 w-3.5" /> Data i godzina</Label>
                                <Input type="datetime-local" {...register("timestamp")} className={errors.timestamp ? "border-destructive" : ""} />
                                {errors.timestamp && <p className="text-xs font-medium text-destructive">{errors.timestamp.message}</p>}
                            </div>

                            <div className="space-y-2">
                                <Label className="flex items-center gap-2"><Hash className="h-3.5 w-3.5" /> Wolumen</Label>
                                <Input type="number" step="0.00000001" placeholder="Wpisz wolumen..." {...register("quantity")} className={errors.quantity ? "border-destructive" : ""} />
                                {errors.quantity && <p className="text-xs font-medium text-destructive">{errors.quantity.message}</p>}
                            </div>

                            <div className="space-y-2">
                                <Label>Cena jednostkowa ({selectedAsset ? selectedAsset.currency : "—"})</Label>
                                <Input type="number" step="0.0001" placeholder="Wpisz cenę..." {...register("price")} className={errors.price ? "border-destructive" : ""} />
                                {errors.price && <p className="text-xs font-medium text-destructive">{errors.price.message}</p>}
                            </div>

                            {/* Wiersz 2: Rozliczenie finansowe netto, koszty poboczne i FX */}
                            <div className="space-y-2">
                                <Label>Wartość netto (PLN)</Label>
                                <Input type="number" step="0.01" placeholder="0.00" {...register("value_net")} className={errors.value_net ? "border-destructive" : ""} />
                                {errors.value_net && <p className="text-xs font-medium text-destructive">{errors.value_net.message}</p>}
                            </div>

                            <div className="space-y-2">
                                <Label>Prowizja / Fee (PLN)</Label>
                                <Input type="number" step="0.01" placeholder="0.00" {...register("fee")} className={errors.fee ? "border-destructive" : ""} />
                                {errors.fee && <p className="text-xs font-medium text-destructive">{errors.fee.message}</p>}
                            </div>

                            <div className="space-y-2">
                                <Label>Podatek / Tax (PLN)</Label>
                                <Input type="number" step="0.01" placeholder="0.00" {...register("tax")} className={errors.tax ? "border-destructive" : ""} />
                                {errors.tax && <p className="text-xs font-medium text-destructive">{errors.tax.message}</p>}
                            </div>

                            <div className="space-y-2">
                                <Label className="flex items-center gap-2"><Globe className="h-3.5 w-3.5" /> Kurs waluty (FX)</Label>
                                <Input type="number" step="0.0001" {...register("fx_rate")} className={errors.fx_rate ? "border-destructive" : ""} />
                                {errors.fx_rate && <p className="text-xs font-medium text-destructive">{errors.fx_rate.message}</p>}
                            </div>

                        </CardContent>
                    </Card>

                    {/* SEKCJA 3: Notatki */}
                    <Card className="shadow-sm">
                        <CardContent className="pt-6">
                            <div className="space-y-2">
                                <Label className="flex items-center gap-2"><Notebook className="h-3.5 w-3.5" /> Notatki</Label>
                                <Textarea {...register("notes")} className="min-h-[100px]" placeholder="Opcjonalne uwagi do transakcji..." />
                                {errors.notes && <p className="text-xs font-medium text-destructive">{errors.notes.message}</p>}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Przyciski sterujące */}
                    <div className="flex justify-end gap-3">
                        <Button type="button" variant="ghost" onClick={() => window.history.back()}>
                            Anuluj
                        </Button>
                        <Button
                            type="submit"
                            className="min-w-[200px] bg-slate-900 text-white hover:bg-slate-800 shadow-md transition-colors"
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? "Zapisywanie..." : <><Save className="mr-2 h-4 w-4" /> Dodaj transakcję</>}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    )
}