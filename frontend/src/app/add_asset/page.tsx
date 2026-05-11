"use client";

import React, { useMemo } from "react";
import { useForm, Controller } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { s } from "./styles";
import {
    PlusCircle,
    Save,
    Wallet,
    LineChart,
    DollarSign,
    Globe,
    Landmark,
} from "lucide-react";

/* ---------- TypeScript enumy (frontend mirror backend) ---------- */
export const AssetType = {
    ETF: "ETF",
    ETC: "ETC",
    BOND: "BOND",
    EQUITY: "EQUITY",
    CRYPTO: "CRYPTO",
} as const;
type AssetType = (typeof AssetType)[keyof typeof AssetType];

export const Category1 = {
    EQUITY: "EQUITY",
    BOND: "BOND",
    COMMODITY: "COMMODITY",
    CRYPTO: "CRYPTO",
    MIXED: "MIXED",
} as const;
type Category1 = (typeof Category1)[keyof typeof Category1];

export const DistributionPolicy = {
    ACCUMULATING: "ACCUMULATING",
    DISTRIBUTING: "DISTRIBUTING",
} as const;

export const ReplicationMethod = {
    PHYSICAL: "PHYSICAL",
    SYNTHETIC: "SYNTHETIC",
} as const;

export const GeoRegion = {
    GLOBAL: "GLOBAL",
    EUROPE: "EUROPE",
    EUROPE_WEST: "EUROPE_WEST",
    EUROPE_EAST: "EUROPE_EAST",
    ASIA_PACIFIC: "ASIA_PACIFIC",
    NORTH_AMERICA: "NORTH_AMERICA",
    SOUTH_AMERICA: "SOUTH_AMERICA",
    AFRICA: "AFRICA",
    AUSTRALIA: "AUSTRALIA",
} as const;

export const GeoCountry = {
    POLAND: "POLAND",
    USA: "USA",
    GERMANY: "GERMANY",
    UK: "UK",
    FRANCE: "FRANCE",
    JAPAN: "JAPAN",
    CHINA: "CHINA",
} as const;

export const MarketType = {
    DEVELOPED: "DEVELOPED",
    EMERGING: "EMERGING",
    FRONTIER: "FRONTIER",
    MIXED: "MIXED",
} as const;

/* ---------- Zod schema (walidacja) ---------- */
const BaseSchema = z.object({
    ticker: z.string().min(1, "Ticker jest wymagany"),
    name: z.string().min(1, "Nazwa jest wymagana"),
    asset_type: z.nativeEnum(z.enum(Object.values(AssetType) as unknown as [string, ...string[]])),
    category1: z.nativeEnum(z.enum(Object.values(Category1) as unknown as [string, ...string[]])),
    category2: z.string().optional(),
    geo_region: z.nativeEnum(z.enum(Object.values(GeoRegion) as unknown as [string, ...string[]])),
    geo_country: z.string().optional(),
    market_type: z.nativeEnum(z.enum(Object.values(MarketType) as unknown as [string, ...string[]])),
    currency: z.string().min(3, "Waluta (ISO)"),
    active: z.boolean().optional().default(true),
    notes: z.string().optional(),
    // exchange-traded mixin (optional)
    isin: z.string().optional(),
    issuer: z.string().optional(),
    ter: z.preprocess((v) => (v === "" ? undefined : Number(v)), z.number().positive().optional()),
    listing_venue: z.string().optional(),
    domicile: z.string().optional(),
    spread: z.preprocess((v) => (v === "" ? undefined : Number(v)), z.number().optional()),
});

/* ETF specific */
const EtfSchema = BaseSchema.extend({
    benchmark: z.string().optional(),
    distribution_policy: z.nativeEnum(z.enum(Object.values(DistributionPolicy) as unknown as [string, ...string[]])).optional(),
    replication_method: z.nativeEnum(z.enum(Object.values(ReplicationMethod) as unknown as [string, ...string[]])).optional(),
});

/* ETC specific */
const EtcSchema = BaseSchema.extend({
    multiplier: z.preprocess((v) => (v === "" ? undefined : Number(v)), z.number().optional()),
    physical_backing: z.boolean().optional(),
});

/* Bond specific */
const BondSchema = BaseSchema.extend({
    retail_series_type: z.string().optional(),
    issue_date: z.string().min(1, "Data emisji wymagana"),
    maturity_date: z.string().min(1, "Data zapadalności wymagana"),
    nominal_value: z.preprocess((v) => (v === "" ? undefined : Number(v)), z.number().positive()),
    interest_handling: z.string().min(1, "Sposób obsługi odsetek wymagany"),
    coupon_frequency: z.string().optional(),
    initial_rate: z.preprocess((v) => (v === "" ? undefined : Number(v)), z.number().optional()),
    is_indexed: z.boolean().optional(),
    margin: z.preprocess((v) => (v === "" ? undefined : Number(v)), z.number().optional()),
    benchmark: z.string().optional(),
    early_redemption_penalty: z.preprocess((v) => (v === "" ? undefined : Number(v)), z.number().optional()),
    rating: z.string().optional(),
    secured: z.boolean().optional(),
});

/* Union schema: wybieramy odpowiedni w zależności od asset_type */
const AssetFormSchema = z.union([EtfSchema, EtcSchema, BondSchema, BaseSchema]);

type AssetForm = z.infer<typeof AssetFormSchema>;

/* ---------- Komponent ---------- */
export default function AddAssetPage() {
    const {
        register,
        handleSubmit,
        control,
        watch,
        reset,
        formState: { errors, isSubmitting },
    } = useForm<AssetForm>({
        resolver: zodResolver(AssetFormSchema),
        defaultValues: {
            ticker: "",
            name: "",
            asset_type: "" as any,
            category1: "EQUITY" as any,
            category2: "",
            geo_region: "GLOBAL" as any,
            geo_country: "",
            market_type: "DEVELOPED" as any,
            currency: "PLN",
            active: true,
            notes: "",
            // mixin defaults
            isin: "",
            issuer: "",
            ter: undefined,
            listing_venue: "",
            domicile: "",
            spread: undefined,
        },
    });

    const assetType = watch("asset_type") as AssetType | "";

    const onSubmit = async (data: AssetForm) => {
        // przygotowanie payloadu: konwersja dat i usunięcie pustych stringów
        const payload: Record<string, any> = {};
        Object.entries(data).forEach(([k, v]) => {
            if (v === "" || v === undefined) return;
            // daty: jeśli pole wygląda jak YYYY-MM-DD (bond), zostaw ISO
            payload[k] = v;
        });

        // dodatkowe konwersje (jeśli trzeba)
        if (payload.issue_date) payload.issue_date = new Date(payload.issue_date).toISOString().slice(0, 10);
        if (payload.maturity_date) payload.maturity_date = new Date(payload.maturity_date).toISOString().slice(0, 10);

        try {
            const res = await fetch("/api/assets", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });
            if (!res.ok) {
                const body = await res.json().catch(() => null);
                throw new Error(body?.detail ?? `Błąd serwera ${res.status}`);
            }
            reset();
            alert("Aktywo dodane pomyślnie");
        } catch (err: any) {
            alert("Błąd: " + (err?.message ?? "nieznany"));
        }
    };

    const category1Options = useMemo(
        () => [
            { value: "EQUITY", label: "Akcje" },
            { value: "BOND", label: "Obligacje" },
            { value: "COMMODITY", label: "Surowce/towary" },
            { value: "CRYPTO", label: "Kryptowaluty" },
            { value: "MIXED", label: "Mix" },
        ],
        []
    );

    return (
        <div className={s.container}>
            <div className="max-w-4xl mx-auto">
                <header className="mb-8 text-center md:text-left">
                    <h1 className="text-3xl font-extrabold flex items-center gap-3">
                        <PlusCircle size={34} className="text-blue-600" />
                        Dodaj aktywo
                    </h1>
                    <p className="text-gray-500 mt-1">Wypełnij dane instrumentu zgodnie z modelem bazy.</p>
                </header>

                <form className={s.card} onSubmit={handleSubmit(onSubmit)} noValidate>
                    {/* podstawowe */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className={s.label}><Wallet size={14} /> Typ instrumentu</label>
                            <select {...register("asset_type" as any)} className={s.select}>
                                <option value="">-- wybierz --</option>
                                <option value={AssetType.ETF}>ETF</option>
                                <option value={AssetType.ETC}>ETC</option>
                                <option value={AssetType.BOND}>Obligacja</option>
                                <option value={AssetType.EQUITY}>Akcja</option>
                                <option value={AssetType.CRYPTO}>Kryptowaluta</option>
                            </select>
                            {errors.asset_type && <div className="text-red-600 text-sm mt-1">{(errors.asset_type as any).message}</div>}
                        </div>

                        <div>
                            <label className={s.label}><LineChart size={14} /> Ticker</label>
                            <input {...register("ticker")} className={s.input} placeholder="np. AAPL.US" />
                            {errors.ticker && <div className="text-red-600 text-sm mt-1">{(errors.ticker as any).message}</div>}
                        </div>

                        <div>
                            <label className={s.label}>Nazwa</label>
                            <input {...register("name")} className={s.input} placeholder="Pełna nazwa instrumentu" />
                            {errors.name && <div className="text-red-600 text-sm mt-1">{(errors.name as any).message}</div>}
                        </div>

                        <div>
                            <label className={s.label}><DollarSign size={14} /> Waluta</label>
                            <input {...register("currency")} className={s.input} placeholder="PLN" />
                            {errors.currency && <div className="text-red-600 text-sm mt-1">{(errors.currency as any).message}</div>}
                        </div>
                    </div>

                    {/* geografia i rynek */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className={s.label}><Globe size={14} /> Region</label>
                            <select {...register("geo_region" as any)} className={s.select}>
                                {Object.entries(GeoRegion).map(([k, v]) => (
                                    <option key={k} value={k}>{v}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className={s.label}>Kraj (opcjonalnie)</label>
                            <select {...register("geo_country" as any)} className={s.select}>
                                <option value="">-- brak --</option>
                                {Object.entries(GeoCountry).map(([k, v]) => (
                                    <option key={k} value={k}>{v}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className={s.label}>Typ rynku</label>
                            <select {...register("market_type" as any)} className={s.select}>
                                {Object.entries(MarketType).map(([k, v]) => (
                                    <option key={k} value={k}>{v}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* exchange-traded mixin (pokazujemy dla ETF/ETC/EQUITY/CRYPTO) */}
                    {(assetType === AssetType.ETF ||
                        assetType === AssetType.ETC ||
                        assetType === AssetType.EQUITY ||
                        assetType === AssetType.CRYPTO) && (
                            <div className={s.subCardEtf}>
                                <h3 className="font-bold mb-3">Dane notowane (opcjonalne)</h3>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                    <input {...register("isin")} className={s.input} placeholder="ISIN" />
                                    <input {...register("issuer")} className={s.input} placeholder="Emitent" />
                                    <input {...register("listing_venue")} className={s.input} placeholder="Giełda / listing" />
                                    <input {...register("domicile")} className={s.input} placeholder="Domicyl" />
                                    <input {...register("ter" as any)} className={s.input} placeholder="TER (%)" type="number" step="0.0001" />
                                    <input {...register("spread" as any)} className={s.input} placeholder="Spread" type="number" step="0.000001" />
                                </div>
                            </div>
                        )}

                    {/* ETF */}
                    {assetType === AssetType.ETF && (
                        <div className={s.subCardEtf}>
                            <h3 className="font-bold mb-3">Parametry ETF</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <input {...register("benchmark")} className={s.input} placeholder="Benchmark" />
                                <select {...register("distribution_policy" as any)} className={s.select}>
                                    <option value="">-- polityka dystrybucji --</option>
                                    <option value="ACCUMULATING">Akumulujący</option>
                                    <option value="DISTRIBUTING">Dystrybuujący</option>
                                </select>
                                <select {...register("replication_method" as any)} className={s.select}>
                                    <option value="">-- metoda replikacji --</option>
                                    <option value="PHYSICAL">Fizyczna</option>
                                    <option value="SYNTHETIC">Syntetyczna</option>
                                </select>
                            </div>
                        </div>
                    )}

                    {/* ETC */}
                    {assetType === AssetType.ETC && (
                        <div className={s.subCardEtf}>
                            <h3 className="font-bold mb-3">Parametry ETC</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <input {...register("multiplier" as any)} className={s.input} placeholder="Multiplier" type="number" step="0.000001" />
                                <div className="flex items-center gap-3">
                                    <Controller
                                        control={control}
                                        name="physical_backing"
                                        render={({ field }) => (
                                            <input type="checkbox" {...field} checked={!!field.value} className="w-5 h-5" />
                                        )}
                                    />
                                    <label className="font-medium">Fizyczne pokrycie</label>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* BOND */}
                    {assetType === AssetType.BOND && (
                        <div className={s.subCardBond}>
                            <h3 className="font-bold mb-3">Szczegóły obligacji</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <input {...register("retail_series_type")} className={s.input} placeholder="Seria detaliczna" />
                                <input {...register("issue_date")} className={s.input} type="date" />
                                <input {...register("maturity_date")} className={s.input} type="date" />
                                <input {...register("nominal_value" as any)} className={s.input} placeholder="Wartość nominalna" type="number" step="0.0001" />
                                <input {...register("initial_rate" as any)} className={s.input} placeholder="Oprocentowanie początkowe (%)" type="number" step="0.0001" />
                                <select {...register("interest_handling" as any)} className={s.select}>
                                    <option value="">-- sposób obsługi odsetek --</option>
                                    <option value="PAYOUT">Wypłata</option>
                                    <option value="CAPITALIZATION">Kapitalizacja</option>
                                </select>
                                <select {...register("coupon_frequency" as any)} className={s.select}>
                                    <option value="">-- częstotliwość kuponu --</option>
                                    <option value="MONTHLY">Co miesiąc</option>
                                    <option value="QUARTERLY">Co kwartał</option>
                                    <option value="SEMI_ANNUALLY">Co pół roku</option>
                                    <option value="YEARLY">Co roku</option>
                                    <option value="AT_THE_END">Przy wykupie</option>
                                </select>
                                <input {...register("margin" as any)} className={s.input} placeholder="Marża (%)" type="number" step="0.0001" />
                                <input {...register("early_redemption_penalty" as any)} className={s.input} placeholder="Opłata przedterminowa" type="number" step="0.0001" />
                                <input {...register("rating")} className={s.input} placeholder="Rating" />
                                <div className="flex items-center gap-3">
                                    <Controller control={control} name="is_indexed" render={({ field }) => (
                                        <input type="checkbox" {...field} checked={!!field.value} className="w-5 h-5" />
                                    )} />
                                    <label className="font-medium">Indeksowana inflacją</label>
                                </div>
                                <div className="flex items-center gap-3">
                                    <Controller control={control} name="secured" render={({ field }) => (
                                        <input type="checkbox" {...field} checked={!!field.value} className="w-5 h-5" />
                                    )} />
                                    <label className="font-medium">Zabezpieczona</label>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* dodatkowe meta */}
                    <div>
                        <label className={s.label}>Kategoria główna</label>
                        <select {...register("category1" as any)} className={s.select}>
                            {category1Options.map((o) => (
                                <option key={o.value} value={o.value}>{o.label}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className={s.label}>Kategoria szczegółowa (opcjonalnie)</label>
                        <input {...register("category2")} className={s.input} placeholder="np. Akcje - kraj" />
                    </div>

                    <div>
                        <label className={s.label}>Notatki</label>
                        <textarea {...register("notes")} className={s.input} rows={3} />
                    </div>

                    <div className="pt-3">
                        <button type="submit" className={s.button} disabled={isSubmitting}>
                            <Save size={18} />
                            {isSubmitting ? "Zapis..." : "Zapisz aktywo"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
