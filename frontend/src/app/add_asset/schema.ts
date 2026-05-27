import * as z from "zod";

export const assetSchema = z.object({
    ticker: z.string().min(1, "Ticker jest wymagany"),
    name: z.string().min(1, "Nazwa jest wymagana"),
    asset_type: z.string().min(1, "Wybierz typ"),
    currency: z.string().length(3, "Kod waluty musi mieć 3 znaki"),
    category1: z.string().min(1, "Wymagane"),
    category2: z.string().optional(),
    geo_region: z.string().min(1, "Wymagane"),
    geo_country: z.string().optional(),
    market_type: z.string().min(1, "Wymagane"),
    active: z.boolean().default(true),
    notes: z.string().optional(),

    // ExchangeTradedMixin (only for ETF, ETC, EQUITY, CRYPTO; should be hidden for BOND)
    isin: z.string().optional(),
    issuer: z.string().optional(),
    ter: z.coerce.number().optional(),
    listing_venue: z.string().optional(),
    domicile: z.string().optional(),
    spread: z.coerce.number().default(0),

    // ETF Specific
    benchmark: z.string().optional(), // tutaj mała gwiazdka: benchmark jest też w obligacjach (BOND)
    distribution_policy: z.string().optional(),
    replication_method: z.string().optional(),

    // ETC Specific
    multiplier: z.coerce.number().default(1),
    physical_backing: z.boolean().default(true),

    // Equity Specific
    // not needed for now

    // Crypto Specific
    // not needed for now

    // BOND Specific
    retail_series_type: z.string().optional(),
    issue_date: z.string().optional(),
    maturity_date: z.string().optional(),
    nominal_value: z.coerce.number().optional(),
    interest_handling: z.string().optional(),
    coupon_frequency: z.string().optional(),
    initial_rate: z.coerce.number().optional(),
    is_indexed: z.boolean().optional(),
    margin: z.coerce.number().optional(),
    early_redemption_penalty: z.coerce.number().optional(),
    rating: z.string().optional(),
    secured: z.boolean().optional(),

}).refine((data) => {
    // Przykład zaawansowanej walidacji: Jeśli typ to BOND, daty muszą być podane
    if (data.asset_type === "Obligacja") {
        return !!data.issue_date && !!data.maturity_date && !!data.nominal_value;
    }
    return true;
}, {
    message: "Uzupełnij brakujące dane obligacji",
    path: ["asset_type"]
});

export type AssetFormValues = z.infer<typeof assetSchema>;