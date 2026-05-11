module.exports = [
"[project]/src/app/add_asset/styles.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "s",
    ()=>s
]);
const s = {
    container: "min-h-screen bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-50 via-gray-50 to-white py-12 px-4 sm:px-6 lg:px-8 text-gray-900",
    card: "bg-white/90 backdrop-blur-md p-6 rounded-2xl shadow-[0_20px_50px_rgba(8,_112,_184,_0.06)] border border-gray-100 space-y-6",
    label: "flex items-center gap-2 text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1",
    input: "w-full p-3 bg-gray-50 border border-gray-200 rounded-xl transition-all duration-150 outline-none focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 placeholder:text-gray-400",
    select: "w-full p-3 bg-gray-50 border border-gray-200 rounded-xl transition-all duration-150 outline-none focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 cursor-pointer",
    button: "w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold py-3 rounded-xl shadow-lg transform transition-all duration-150 hover:-translate-y-0.5 flex items-center justify-center gap-3",
    subCardBond: "bg-blue-50 p-4 rounded-xl border border-blue-100",
    subCardEtf: "bg-emerald-50 p-4 rounded-xl border border-emerald-100"
};
}),
"[project]/src/app/add_asset/page.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>AddAssetPage
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$hook$2d$form$2f$dist$2f$index$2e$esm$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/react-hook-form/dist/index.esm.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$add_asset$2f$styles$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/app/add_asset/styles.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$circle$2d$plus$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__PlusCircle$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/circle-plus.mjs [app-ssr] (ecmascript) <export default as PlusCircle>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$save$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Save$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/save.mjs [app-ssr] (ecmascript) <export default as Save>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$wallet$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Wallet$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/wallet.mjs [app-ssr] (ecmascript) <export default as Wallet>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$chart$2d$line$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__LineChart$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/chart-line.mjs [app-ssr] (ecmascript) <export default as LineChart>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$dollar$2d$sign$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__DollarSign$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/dollar-sign.mjs [app-ssr] (ecmascript) <export default as DollarSign>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$globe$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Globe$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/globe.mjs [app-ssr] (ecmascript) <export default as Globe>");
// src/app/add_asset/page.tsx
"use client";
;
;
;
;
;
/* ---------- Helper: rozpoznawanie typu aktywa (backend może zwracać PL lub EN) ---------- */ function isETF(value) {
    return value === "ETF";
}
function isETC(value) {
    return value === "ETC";
}
function isBOND(value) {
    return value === "BOND" || value === "Obligacja" || value === "Obligacje";
}
function isEQUITY(value) {
    return value === "EQUITY" || value === "Akcja" || value === "Akcje";
}
function isCRYPTO(value) {
    return value === "CRYPTO" || value === "Kryptowaluta" || value === "Kryptowaluty";
}
function AddAssetPage() {
    const { register, handleSubmit, control, watch, reset, formState } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$hook$2d$form$2f$dist$2f$index$2e$esm$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useForm"])({
        defaultValues: {
            ticker: "",
            name: "",
            asset_type: "",
            category1: "",
            category2: "",
            geo_region: "",
            geo_country: "",
            market_type: "",
            currency: "PLN",
            active: true,
            notes: "",
            // exchange-traded mixin defaults
            isin: "",
            issuer: "",
            ter: "",
            listing_venue: "",
            domicile: "",
            spread: ""
        }
    });
    const [meta, setMeta] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])({});
    const [metaLoading, setMetaLoading] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(true);
    const [metaError, setMetaError] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(null);
    const [submitError, setSubmitError] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(null);
    const [submitSuccess, setSubmitSuccess] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(null);
    const assetType = watch("asset_type");
    const isSubmitting = formState.isSubmitting;
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        let mounted = true;
        setMetaLoading(true);
        setMetaError(null);
        fetch("/api/assets/meta").then(async (res)=>{
            if (!res.ok) {
                const body = await res.text().catch(()=>null);
                throw new Error(body || `HTTP ${res.status}`);
            }
            return res.json();
        }).then((data)=>{
            if (!mounted) return;
            setMeta(data);
        }).catch((err)=>{
            if (!mounted) return;
            setMetaError(err?.message ?? "Błąd pobierania meta");
        }).finally(()=>{
            if (!mounted) return;
            setMetaLoading(false);
        });
        return ()=>{
            mounted = false;
        };
    }, []);
    const onSubmit = async (data)=>{
        setSubmitError(null);
        setSubmitSuccess(null);
        // prosta walidacja klienta
        if (!data.asset_type) {
            setSubmitError("Wybierz typ instrumentu.");
            return;
        }
        if (!data.ticker || !data.ticker.trim()) {
            setSubmitError("Podaj ticker/symbol.");
            return;
        }
        if (!data.name || !data.name.trim()) {
            setSubmitError("Podaj nazwę instrumentu.");
            return;
        }
        // przygotowanie payloadu: usuń puste stringi i konwertuj liczby/datę
        const payload = {};
        Object.entries(data).forEach(([k, v])=>{
            if (v === "" || v === null || v === undefined) return;
            // checkboxy mogą być boolean
            if (typeof v === "string") {
                // daty typu YYYY-MM-DD zostaw jako są (backend Pydantic/SQLAlchemy przyjmie ISO date)
                payload[k] = v;
                return;
            }
            payload[k] = v;
        });
        // konwersje dodatkowe: jeśli są pola numeryczne w stringu -> Number
        [
            "ter",
            "spread",
            "nominal_value",
            "initial_rate",
            "margin",
            "early_redemption_penalty",
            "multiplier"
        ].forEach((k)=>{
            if (payload[k] !== undefined && payload[k] !== null && payload[k] !== "") {
                const n = Number(payload[k]);
                if (!Number.isNaN(n)) payload[k] = n;
            }
        });
        try {
            const res = await fetch("/api/assets", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(payload)
            });
            if (!res.ok) {
                const body = await res.json().catch(()=>null);
                throw new Error(body?.detail ?? `Błąd serwera ${res.status}`);
            }
            setSubmitSuccess("Aktywo dodane pomyślnie.");
            reset();
        } catch (err) {
            setSubmitError(err?.message ?? "Nieznany błąd podczas zapisu.");
        }
    };
    const category1Options = meta.category1 ?? [];
    const category2Options = meta.category2 ?? [];
    const assetTypeOptions = meta.asset_type ?? [];
    const geoRegionOptions = meta.geo_region ?? [];
    const geoCountryOptions = meta.geo_country ?? [];
    const marketTypeOptions = meta.market_type ?? [];
    const distributionPolicyOptions = meta.distribution_policy ?? [];
    const replicationMethodOptions = meta.replication_method ?? [];
    const couponFrequencyOptions = meta.coupon_frequency ?? [];
    const interestHandlingOptions = meta.interest_handling ?? [];
    const retailBondBenchmarkOptions = meta.retail_bond_benchmark ?? [];
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$add_asset$2f$styles$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["s"].container,
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "max-w-4xl mx-auto",
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("header", {
                    className: "mb-8 text-center md:text-left",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h1", {
                            className: "text-3xl font-extrabold flex items-center gap-3",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$circle$2d$plus$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__PlusCircle$3e$__["PlusCircle"], {
                                    size: 34,
                                    className: "text-blue-600"
                                }, void 0, false, {
                                    fileName: "[project]/src/app/add_asset/page.tsx",
                                    lineNumber: 179,
                                    columnNumber: 25
                                }, this),
                                "Dodaj aktywo"
                            ]
                        }, void 0, true, {
                            fileName: "[project]/src/app/add_asset/page.tsx",
                            lineNumber: 178,
                            columnNumber: 21
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                            className: "text-gray-500 mt-1",
                            children: "Wypełnij dane instrumentu zgodnie z modelem bazy."
                        }, void 0, false, {
                            fileName: "[project]/src/app/add_asset/page.tsx",
                            lineNumber: 182,
                            columnNumber: 21
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/src/app/add_asset/page.tsx",
                    lineNumber: 177,
                    columnNumber: 17
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("form", {
                    className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$add_asset$2f$styles$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["s"].card,
                    onSubmit: handleSubmit(onSubmit),
                    noValidate: true,
                    children: [
                        metaLoading && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "text-sm text-gray-500",
                            children: "Ładowanie wartości do list rozwijanych…"
                        }, void 0, false, {
                            fileName: "[project]/src/app/add_asset/page.tsx",
                            lineNumber: 186,
                            columnNumber: 37
                        }, this),
                        metaError && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "text-sm text-red-600",
                            children: [
                                "Błąd pobierania meta: ",
                                metaError
                            ]
                        }, void 0, true, {
                            fileName: "[project]/src/app/add_asset/page.tsx",
                            lineNumber: 187,
                            columnNumber: 35
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "grid grid-cols-1 md:grid-cols-2 gap-4",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                            className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$add_asset$2f$styles$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["s"].label,
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$wallet$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Wallet$3e$__["Wallet"], {
                                                    size: 14
                                                }, void 0, false, {
                                                    fileName: "[project]/src/app/add_asset/page.tsx",
                                                    lineNumber: 192,
                                                    columnNumber: 56
                                                }, this),
                                                " Typ instrumentu"
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/src/app/add_asset/page.tsx",
                                            lineNumber: 192,
                                            columnNumber: 29
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("select", {
                                            ...register("asset_type"),
                                            className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$add_asset$2f$styles$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["s"].select,
                                            disabled: metaLoading,
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                                    value: "",
                                                    children: "-- wybierz --"
                                                }, void 0, false, {
                                                    fileName: "[project]/src/app/add_asset/page.tsx",
                                                    lineNumber: 194,
                                                    columnNumber: 33
                                                }, this),
                                                assetTypeOptions.map((v)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                                        value: v,
                                                        children: v
                                                    }, v, false, {
                                                        fileName: "[project]/src/app/add_asset/page.tsx",
                                                        lineNumber: 196,
                                                        columnNumber: 37
                                                    }, this))
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/src/app/add_asset/page.tsx",
                                            lineNumber: 193,
                                            columnNumber: 29
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/src/app/add_asset/page.tsx",
                                    lineNumber: 191,
                                    columnNumber: 25
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                            className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$add_asset$2f$styles$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["s"].label,
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$chart$2d$line$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__LineChart$3e$__["LineChart"], {
                                                    size: 14
                                                }, void 0, false, {
                                                    fileName: "[project]/src/app/add_asset/page.tsx",
                                                    lineNumber: 202,
                                                    columnNumber: 56
                                                }, this),
                                                " Ticker"
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/src/app/add_asset/page.tsx",
                                            lineNumber: 202,
                                            columnNumber: 29
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                            ...register("ticker"),
                                            className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$add_asset$2f$styles$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["s"].input,
                                            placeholder: "np. AAPL.US"
                                        }, void 0, false, {
                                            fileName: "[project]/src/app/add_asset/page.tsx",
                                            lineNumber: 203,
                                            columnNumber: 29
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/src/app/add_asset/page.tsx",
                                    lineNumber: 201,
                                    columnNumber: 25
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                            className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$add_asset$2f$styles$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["s"].label,
                                            children: "Nazwa"
                                        }, void 0, false, {
                                            fileName: "[project]/src/app/add_asset/page.tsx",
                                            lineNumber: 207,
                                            columnNumber: 29
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                            ...register("name"),
                                            className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$add_asset$2f$styles$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["s"].input,
                                            placeholder: "Pełna nazwa instrumentu"
                                        }, void 0, false, {
                                            fileName: "[project]/src/app/add_asset/page.tsx",
                                            lineNumber: 208,
                                            columnNumber: 29
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/src/app/add_asset/page.tsx",
                                    lineNumber: 206,
                                    columnNumber: 25
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                            className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$add_asset$2f$styles$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["s"].label,
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$dollar$2d$sign$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__DollarSign$3e$__["DollarSign"], {
                                                    size: 14
                                                }, void 0, false, {
                                                    fileName: "[project]/src/app/add_asset/page.tsx",
                                                    lineNumber: 212,
                                                    columnNumber: 56
                                                }, this),
                                                " Waluta"
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/src/app/add_asset/page.tsx",
                                            lineNumber: 212,
                                            columnNumber: 29
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                            ...register("currency"),
                                            className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$add_asset$2f$styles$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["s"].input,
                                            placeholder: "PLN"
                                        }, void 0, false, {
                                            fileName: "[project]/src/app/add_asset/page.tsx",
                                            lineNumber: 213,
                                            columnNumber: 29
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/src/app/add_asset/page.tsx",
                                    lineNumber: 211,
                                    columnNumber: 25
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/src/app/add_asset/page.tsx",
                            lineNumber: 190,
                            columnNumber: 21
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "grid grid-cols-1 md:grid-cols-3 gap-4",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                            className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$add_asset$2f$styles$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["s"].label,
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$globe$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Globe$3e$__["Globe"], {
                                                    size: 14
                                                }, void 0, false, {
                                                    fileName: "[project]/src/app/add_asset/page.tsx",
                                                    lineNumber: 220,
                                                    columnNumber: 56
                                                }, this),
                                                " Region"
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/src/app/add_asset/page.tsx",
                                            lineNumber: 220,
                                            columnNumber: 29
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("select", {
                                            ...register("geo_region"),
                                            className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$add_asset$2f$styles$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["s"].select,
                                            disabled: metaLoading,
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                                    value: "",
                                                    children: "-- wybierz --"
                                                }, void 0, false, {
                                                    fileName: "[project]/src/app/add_asset/page.tsx",
                                                    lineNumber: 222,
                                                    columnNumber: 33
                                                }, this),
                                                geoRegionOptions.map((v)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                                        value: v,
                                                        children: v
                                                    }, v, false, {
                                                        fileName: "[project]/src/app/add_asset/page.tsx",
                                                        lineNumber: 224,
                                                        columnNumber: 37
                                                    }, this))
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/src/app/add_asset/page.tsx",
                                            lineNumber: 221,
                                            columnNumber: 29
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/src/app/add_asset/page.tsx",
                                    lineNumber: 219,
                                    columnNumber: 25
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                            className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$add_asset$2f$styles$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["s"].label,
                                            children: "Kraj (opcjonalnie)"
                                        }, void 0, false, {
                                            fileName: "[project]/src/app/add_asset/page.tsx",
                                            lineNumber: 230,
                                            columnNumber: 29
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("select", {
                                            ...register("geo_country"),
                                            className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$add_asset$2f$styles$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["s"].select,
                                            disabled: metaLoading,
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                                    value: "",
                                                    children: "-- brak --"
                                                }, void 0, false, {
                                                    fileName: "[project]/src/app/add_asset/page.tsx",
                                                    lineNumber: 232,
                                                    columnNumber: 33
                                                }, this),
                                                geoCountryOptions.map((v)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                                        value: v,
                                                        children: v
                                                    }, v, false, {
                                                        fileName: "[project]/src/app/add_asset/page.tsx",
                                                        lineNumber: 234,
                                                        columnNumber: 37
                                                    }, this))
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/src/app/add_asset/page.tsx",
                                            lineNumber: 231,
                                            columnNumber: 29
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/src/app/add_asset/page.tsx",
                                    lineNumber: 229,
                                    columnNumber: 25
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                            className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$add_asset$2f$styles$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["s"].label,
                                            children: "Typ rynku"
                                        }, void 0, false, {
                                            fileName: "[project]/src/app/add_asset/page.tsx",
                                            lineNumber: 240,
                                            columnNumber: 29
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("select", {
                                            ...register("market_type"),
                                            className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$add_asset$2f$styles$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["s"].select,
                                            disabled: metaLoading,
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                                    value: "",
                                                    children: "-- wybierz --"
                                                }, void 0, false, {
                                                    fileName: "[project]/src/app/add_asset/page.tsx",
                                                    lineNumber: 242,
                                                    columnNumber: 33
                                                }, this),
                                                marketTypeOptions.map((v)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                                        value: v,
                                                        children: v
                                                    }, v, false, {
                                                        fileName: "[project]/src/app/add_asset/page.tsx",
                                                        lineNumber: 244,
                                                        columnNumber: 37
                                                    }, this))
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/src/app/add_asset/page.tsx",
                                            lineNumber: 241,
                                            columnNumber: 29
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/src/app/add_asset/page.tsx",
                                    lineNumber: 239,
                                    columnNumber: 25
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/src/app/add_asset/page.tsx",
                            lineNumber: 218,
                            columnNumber: 21
                        }, this),
                        (isETF(assetType) || isETC(assetType) || isEQUITY(assetType) || isCRYPTO(assetType)) && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$add_asset$2f$styles$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["s"].subCardEtf,
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                                    className: "font-bold mb-3",
                                    children: "Dane notowane (opcjonalne)"
                                }, void 0, false, {
                                    fileName: "[project]/src/app/add_asset/page.tsx",
                                    lineNumber: 253,
                                    columnNumber: 29
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "grid grid-cols-1 md:grid-cols-3 gap-3",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                            ...register("isin"),
                                            className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$add_asset$2f$styles$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["s"].input,
                                            placeholder: "ISIN"
                                        }, void 0, false, {
                                            fileName: "[project]/src/app/add_asset/page.tsx",
                                            lineNumber: 255,
                                            columnNumber: 33
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                            ...register("issuer"),
                                            className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$add_asset$2f$styles$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["s"].input,
                                            placeholder: "Emitent"
                                        }, void 0, false, {
                                            fileName: "[project]/src/app/add_asset/page.tsx",
                                            lineNumber: 256,
                                            columnNumber: 33
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                            ...register("listing_venue"),
                                            className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$add_asset$2f$styles$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["s"].input,
                                            placeholder: "Giełda / listing"
                                        }, void 0, false, {
                                            fileName: "[project]/src/app/add_asset/page.tsx",
                                            lineNumber: 257,
                                            columnNumber: 33
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                            ...register("domicile"),
                                            className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$add_asset$2f$styles$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["s"].input,
                                            placeholder: "Domicyl"
                                        }, void 0, false, {
                                            fileName: "[project]/src/app/add_asset/page.tsx",
                                            lineNumber: 258,
                                            columnNumber: 33
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                            ...register("ter"),
                                            className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$add_asset$2f$styles$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["s"].input,
                                            placeholder: "TER (%)",
                                            type: "number",
                                            step: "0.0001"
                                        }, void 0, false, {
                                            fileName: "[project]/src/app/add_asset/page.tsx",
                                            lineNumber: 259,
                                            columnNumber: 33
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                            ...register("spread"),
                                            className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$add_asset$2f$styles$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["s"].input,
                                            placeholder: "Spread",
                                            type: "number",
                                            step: "0.000001"
                                        }, void 0, false, {
                                            fileName: "[project]/src/app/add_asset/page.tsx",
                                            lineNumber: 260,
                                            columnNumber: 33
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/src/app/add_asset/page.tsx",
                                    lineNumber: 254,
                                    columnNumber: 29
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/src/app/add_asset/page.tsx",
                            lineNumber: 252,
                            columnNumber: 25
                        }, this),
                        isETF(assetType) && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$add_asset$2f$styles$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["s"].subCardEtf,
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                                    className: "font-bold mb-3",
                                    children: "Parametry ETF"
                                }, void 0, false, {
                                    fileName: "[project]/src/app/add_asset/page.tsx",
                                    lineNumber: 268,
                                    columnNumber: 29
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "grid grid-cols-1 md:grid-cols-2 gap-3",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                            ...register("benchmark"),
                                            className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$add_asset$2f$styles$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["s"].input,
                                            placeholder: "Benchmark"
                                        }, void 0, false, {
                                            fileName: "[project]/src/app/add_asset/page.tsx",
                                            lineNumber: 270,
                                            columnNumber: 33
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("select", {
                                            ...register("distribution_policy"),
                                            className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$add_asset$2f$styles$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["s"].select,
                                            disabled: metaLoading,
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                                    value: "",
                                                    children: "-- polityka dystrybucji --"
                                                }, void 0, false, {
                                                    fileName: "[project]/src/app/add_asset/page.tsx",
                                                    lineNumber: 272,
                                                    columnNumber: 37
                                                }, this),
                                                distributionPolicyOptions.map((v)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                                        value: v,
                                                        children: v
                                                    }, v, false, {
                                                        fileName: "[project]/src/app/add_asset/page.tsx",
                                                        lineNumber: 273,
                                                        columnNumber: 75
                                                    }, this))
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/src/app/add_asset/page.tsx",
                                            lineNumber: 271,
                                            columnNumber: 33
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("select", {
                                            ...register("replication_method"),
                                            className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$add_asset$2f$styles$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["s"].select,
                                            disabled: metaLoading,
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                                    value: "",
                                                    children: "-- metoda replikacji --"
                                                }, void 0, false, {
                                                    fileName: "[project]/src/app/add_asset/page.tsx",
                                                    lineNumber: 276,
                                                    columnNumber: 37
                                                }, this),
                                                replicationMethodOptions.map((v)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                                        value: v,
                                                        children: v
                                                    }, v, false, {
                                                        fileName: "[project]/src/app/add_asset/page.tsx",
                                                        lineNumber: 277,
                                                        columnNumber: 74
                                                    }, this))
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/src/app/add_asset/page.tsx",
                                            lineNumber: 275,
                                            columnNumber: 33
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/src/app/add_asset/page.tsx",
                                    lineNumber: 269,
                                    columnNumber: 29
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/src/app/add_asset/page.tsx",
                            lineNumber: 267,
                            columnNumber: 25
                        }, this),
                        isETC(assetType) && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$add_asset$2f$styles$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["s"].subCardEtf,
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                                    className: "font-bold mb-3",
                                    children: "Parametry ETC"
                                }, void 0, false, {
                                    fileName: "[project]/src/app/add_asset/page.tsx",
                                    lineNumber: 286,
                                    columnNumber: 29
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "grid grid-cols-1 md:grid-cols-2 gap-3",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                            ...register("multiplier"),
                                            className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$add_asset$2f$styles$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["s"].input,
                                            placeholder: "Multiplier",
                                            type: "number",
                                            step: "0.000001"
                                        }, void 0, false, {
                                            fileName: "[project]/src/app/add_asset/page.tsx",
                                            lineNumber: 288,
                                            columnNumber: 33
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "flex items-center gap-3",
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$hook$2d$form$2f$dist$2f$index$2e$esm$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Controller"], {
                                                    control: control,
                                                    name: "physical_backing",
                                                    render: ({ field })=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                                            type: "checkbox",
                                                            ...field,
                                                            checked: !!field.value,
                                                            className: "w-5 h-5"
                                                        }, void 0, false, {
                                                            fileName: "[project]/src/app/add_asset/page.tsx",
                                                            lineNumber: 294,
                                                            columnNumber: 45
                                                        }, this)
                                                }, void 0, false, {
                                                    fileName: "[project]/src/app/add_asset/page.tsx",
                                                    lineNumber: 290,
                                                    columnNumber: 37
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                                    className: "font-medium",
                                                    children: "Fizyczne pokrycie"
                                                }, void 0, false, {
                                                    fileName: "[project]/src/app/add_asset/page.tsx",
                                                    lineNumber: 297,
                                                    columnNumber: 37
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/src/app/add_asset/page.tsx",
                                            lineNumber: 289,
                                            columnNumber: 33
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/src/app/add_asset/page.tsx",
                                    lineNumber: 287,
                                    columnNumber: 29
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/src/app/add_asset/page.tsx",
                            lineNumber: 285,
                            columnNumber: 25
                        }, this),
                        isBOND(assetType) && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$add_asset$2f$styles$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["s"].subCardBond,
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                                    className: "font-bold mb-3",
                                    children: "Szczegóły obligacji"
                                }, void 0, false, {
                                    fileName: "[project]/src/app/add_asset/page.tsx",
                                    lineNumber: 306,
                                    columnNumber: 29
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "grid grid-cols-1 md:grid-cols-2 gap-3",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                            ...register("retail_series_type"),
                                            className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$add_asset$2f$styles$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["s"].input,
                                            placeholder: "Seria detaliczna"
                                        }, void 0, false, {
                                            fileName: "[project]/src/app/add_asset/page.tsx",
                                            lineNumber: 308,
                                            columnNumber: 33
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                            ...register("issue_date"),
                                            className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$add_asset$2f$styles$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["s"].input,
                                            type: "date"
                                        }, void 0, false, {
                                            fileName: "[project]/src/app/add_asset/page.tsx",
                                            lineNumber: 309,
                                            columnNumber: 33
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                            ...register("maturity_date"),
                                            className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$add_asset$2f$styles$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["s"].input,
                                            type: "date"
                                        }, void 0, false, {
                                            fileName: "[project]/src/app/add_asset/page.tsx",
                                            lineNumber: 310,
                                            columnNumber: 33
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                            ...register("nominal_value"),
                                            className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$add_asset$2f$styles$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["s"].input,
                                            placeholder: "Wartość nominalna",
                                            type: "number",
                                            step: "0.0001"
                                        }, void 0, false, {
                                            fileName: "[project]/src/app/add_asset/page.tsx",
                                            lineNumber: 311,
                                            columnNumber: 33
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                            ...register("initial_rate"),
                                            className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$add_asset$2f$styles$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["s"].input,
                                            placeholder: "Oprocentowanie początkowe (%)",
                                            type: "number",
                                            step: "0.0001"
                                        }, void 0, false, {
                                            fileName: "[project]/src/app/add_asset/page.tsx",
                                            lineNumber: 312,
                                            columnNumber: 33
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("select", {
                                            ...register("interest_handling"),
                                            className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$add_asset$2f$styles$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["s"].select,
                                            disabled: metaLoading,
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                                    value: "",
                                                    children: "-- sposób obsługi odsetek --"
                                                }, void 0, false, {
                                                    fileName: "[project]/src/app/add_asset/page.tsx",
                                                    lineNumber: 314,
                                                    columnNumber: 37
                                                }, this),
                                                interestHandlingOptions.map((v)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                                        value: v,
                                                        children: v
                                                    }, v, false, {
                                                        fileName: "[project]/src/app/add_asset/page.tsx",
                                                        lineNumber: 315,
                                                        columnNumber: 73
                                                    }, this))
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/src/app/add_asset/page.tsx",
                                            lineNumber: 313,
                                            columnNumber: 33
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("select", {
                                            ...register("coupon_frequency"),
                                            className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$add_asset$2f$styles$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["s"].select,
                                            disabled: metaLoading,
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                                    value: "",
                                                    children: "-- częstotliwość kuponu --"
                                                }, void 0, false, {
                                                    fileName: "[project]/src/app/add_asset/page.tsx",
                                                    lineNumber: 318,
                                                    columnNumber: 37
                                                }, this),
                                                couponFrequencyOptions.map((v)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                                        value: v,
                                                        children: v
                                                    }, v, false, {
                                                        fileName: "[project]/src/app/add_asset/page.tsx",
                                                        lineNumber: 319,
                                                        columnNumber: 72
                                                    }, this))
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/src/app/add_asset/page.tsx",
                                            lineNumber: 317,
                                            columnNumber: 33
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                            ...register("margin"),
                                            className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$add_asset$2f$styles$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["s"].input,
                                            placeholder: "Marża (%)",
                                            type: "number",
                                            step: "0.0001"
                                        }, void 0, false, {
                                            fileName: "[project]/src/app/add_asset/page.tsx",
                                            lineNumber: 321,
                                            columnNumber: 33
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                            ...register("early_redemption_penalty"),
                                            className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$add_asset$2f$styles$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["s"].input,
                                            placeholder: "Opłata przedterminowa",
                                            type: "number",
                                            step: "0.0001"
                                        }, void 0, false, {
                                            fileName: "[project]/src/app/add_asset/page.tsx",
                                            lineNumber: 322,
                                            columnNumber: 33
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                            ...register("rating"),
                                            className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$add_asset$2f$styles$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["s"].input,
                                            placeholder: "Rating"
                                        }, void 0, false, {
                                            fileName: "[project]/src/app/add_asset/page.tsx",
                                            lineNumber: 323,
                                            columnNumber: 33
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "flex items-center gap-3",
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$hook$2d$form$2f$dist$2f$index$2e$esm$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Controller"], {
                                                    control: control,
                                                    name: "is_indexed",
                                                    render: ({ field })=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                                            type: "checkbox",
                                                            ...field,
                                                            checked: !!field.value,
                                                            className: "w-5 h-5"
                                                        }, void 0, false, {
                                                            fileName: "[project]/src/app/add_asset/page.tsx",
                                                            lineNumber: 326,
                                                            columnNumber: 41
                                                        }, this)
                                                }, void 0, false, {
                                                    fileName: "[project]/src/app/add_asset/page.tsx",
                                                    lineNumber: 325,
                                                    columnNumber: 37
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                                    className: "font-medium",
                                                    children: "Indeksowana inflacją"
                                                }, void 0, false, {
                                                    fileName: "[project]/src/app/add_asset/page.tsx",
                                                    lineNumber: 328,
                                                    columnNumber: 37
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/src/app/add_asset/page.tsx",
                                            lineNumber: 324,
                                            columnNumber: 33
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "flex items-center gap-3",
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$hook$2d$form$2f$dist$2f$index$2e$esm$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Controller"], {
                                                    control: control,
                                                    name: "secured",
                                                    render: ({ field })=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                                            type: "checkbox",
                                                            ...field,
                                                            checked: !!field.value,
                                                            className: "w-5 h-5"
                                                        }, void 0, false, {
                                                            fileName: "[project]/src/app/add_asset/page.tsx",
                                                            lineNumber: 332,
                                                            columnNumber: 41
                                                        }, this)
                                                }, void 0, false, {
                                                    fileName: "[project]/src/app/add_asset/page.tsx",
                                                    lineNumber: 331,
                                                    columnNumber: 37
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                                    className: "font-medium",
                                                    children: "Zabezpieczona"
                                                }, void 0, false, {
                                                    fileName: "[project]/src/app/add_asset/page.tsx",
                                                    lineNumber: 334,
                                                    columnNumber: 37
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/src/app/add_asset/page.tsx",
                                            lineNumber: 330,
                                            columnNumber: 33
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("select", {
                                            ...register("benchmark"),
                                            className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$add_asset$2f$styles$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["s"].select,
                                            disabled: metaLoading,
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                                    value: "",
                                                    children: "-- benchmark obligacji (opcjonalnie) --"
                                                }, void 0, false, {
                                                    fileName: "[project]/src/app/add_asset/page.tsx",
                                                    lineNumber: 337,
                                                    columnNumber: 37
                                                }, this),
                                                retailBondBenchmarkOptions.map((v)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                                        value: v,
                                                        children: v
                                                    }, v, false, {
                                                        fileName: "[project]/src/app/add_asset/page.tsx",
                                                        lineNumber: 338,
                                                        columnNumber: 76
                                                    }, this))
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/src/app/add_asset/page.tsx",
                                            lineNumber: 336,
                                            columnNumber: 33
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/src/app/add_asset/page.tsx",
                                    lineNumber: 307,
                                    columnNumber: 29
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/src/app/add_asset/page.tsx",
                            lineNumber: 305,
                            columnNumber: 25
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                    className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$add_asset$2f$styles$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["s"].label,
                                    children: "Kategoria główna"
                                }, void 0, false, {
                                    fileName: "[project]/src/app/add_asset/page.tsx",
                                    lineNumber: 346,
                                    columnNumber: 25
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("select", {
                                    ...register("category1"),
                                    className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$add_asset$2f$styles$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["s"].select,
                                    disabled: metaLoading,
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                            value: "",
                                            children: "-- wybierz --"
                                        }, void 0, false, {
                                            fileName: "[project]/src/app/add_asset/page.tsx",
                                            lineNumber: 348,
                                            columnNumber: 29
                                        }, this),
                                        category1Options.map((v)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                                value: v,
                                                children: v
                                            }, v, false, {
                                                fileName: "[project]/src/app/add_asset/page.tsx",
                                                lineNumber: 349,
                                                columnNumber: 58
                                            }, this))
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/src/app/add_asset/page.tsx",
                                    lineNumber: 347,
                                    columnNumber: 25
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/src/app/add_asset/page.tsx",
                            lineNumber: 345,
                            columnNumber: 21
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                    className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$add_asset$2f$styles$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["s"].label,
                                    children: "Kategoria szczegółowa (opcjonalnie)"
                                }, void 0, false, {
                                    fileName: "[project]/src/app/add_asset/page.tsx",
                                    lineNumber: 354,
                                    columnNumber: 25
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("select", {
                                    ...register("category2"),
                                    className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$add_asset$2f$styles$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["s"].select,
                                    disabled: metaLoading,
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                            value: "",
                                            children: "-- brak --"
                                        }, void 0, false, {
                                            fileName: "[project]/src/app/add_asset/page.tsx",
                                            lineNumber: 356,
                                            columnNumber: 29
                                        }, this),
                                        category2Options.map((v)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                                value: v,
                                                children: v
                                            }, v, false, {
                                                fileName: "[project]/src/app/add_asset/page.tsx",
                                                lineNumber: 357,
                                                columnNumber: 58
                                            }, this))
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/src/app/add_asset/page.tsx",
                                    lineNumber: 355,
                                    columnNumber: 25
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/src/app/add_asset/page.tsx",
                            lineNumber: 353,
                            columnNumber: 21
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                    className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$add_asset$2f$styles$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["s"].label,
                                    children: "Notatki"
                                }, void 0, false, {
                                    fileName: "[project]/src/app/add_asset/page.tsx",
                                    lineNumber: 362,
                                    columnNumber: 25
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("textarea", {
                                    ...register("notes"),
                                    className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$add_asset$2f$styles$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["s"].input,
                                    rows: 3
                                }, void 0, false, {
                                    fileName: "[project]/src/app/add_asset/page.tsx",
                                    lineNumber: 363,
                                    columnNumber: 25
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/src/app/add_asset/page.tsx",
                            lineNumber: 361,
                            columnNumber: 21
                        }, this),
                        submitError && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "text-sm text-red-600",
                            children: submitError
                        }, void 0, false, {
                            fileName: "[project]/src/app/add_asset/page.tsx",
                            lineNumber: 366,
                            columnNumber: 37
                        }, this),
                        submitSuccess && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "text-sm text-green-600",
                            children: submitSuccess
                        }, void 0, false, {
                            fileName: "[project]/src/app/add_asset/page.tsx",
                            lineNumber: 367,
                            columnNumber: 39
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "pt-3",
                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                type: "submit",
                                className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$add_asset$2f$styles$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["s"].button,
                                disabled: isSubmitting || metaLoading,
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$save$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Save$3e$__["Save"], {
                                        size: 18
                                    }, void 0, false, {
                                        fileName: "[project]/src/app/add_asset/page.tsx",
                                        lineNumber: 371,
                                        columnNumber: 29
                                    }, this),
                                    isSubmitting ? "Zapis..." : "Zapisz aktywo"
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/app/add_asset/page.tsx",
                                lineNumber: 370,
                                columnNumber: 25
                            }, this)
                        }, void 0, false, {
                            fileName: "[project]/src/app/add_asset/page.tsx",
                            lineNumber: 369,
                            columnNumber: 21
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/src/app/add_asset/page.tsx",
                    lineNumber: 185,
                    columnNumber: 17
                }, this)
            ]
        }, void 0, true, {
            fileName: "[project]/src/app/add_asset/page.tsx",
            lineNumber: 176,
            columnNumber: 13
        }, this)
    }, void 0, false, {
        fileName: "[project]/src/app/add_asset/page.tsx",
        lineNumber: 175,
        columnNumber: 9
    }, this);
}
}),
];

//# sourceMappingURL=src_app_add_asset_0n1.75m._.js.map