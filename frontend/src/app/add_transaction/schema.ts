import * as z from "zod";

export const transactionSchema = z.object({
    // ID aktywa, którego dotyczy transakcja
    asset_id: z.coerce.number().int().positive("Musisz wybrać aktywo"),

    // Typ transakcji
    type: z.string().min(1, "Wybierz typ transakcji"),

    // Data i godzina transakcji (input type="datetime-local" wysyła string)
    timestamp: z.string().min(1, "Data i godzina są wymagane"),

    // Wartość netto (nowe pole, odpowiada value_net: float = Field(..., ge=0))
    value_net: z.coerce.number().nonnegative("Wartość netto nie może być ujemna"),

    // Prowizja (nowe pole, odpowiada fee: float = Field(..., ge=0))
    fee: z.coerce.number().nonnegative("Prowizja nie może być ujemna"),

    // Podatek (nowe pole, odpowiada tax: float = Field(..., ge=0))
    tax: z.coerce.number().nonnegative("Podatek nie może być ujemny"),

    // Ilość (dodano wymóg .nonnegative(), aby pasowało do ge=0 na backendzie)
    quantity: z.coerce.number().nonnegative("Ilość nie może być ujemna").describe("Ilość jednostek"),

    // Cena jednostkowa
    price: z.coerce.number().nonnegative("Cena nie może być ujemna"),

    // Kurs wymiany walut
    fx_rate: z.coerce.number().positive("Kurs wymiany musi być dodatni").default(1.0),

    // Czy to zamiana obligacji (nowe pole)
    is_exchange: z.boolean({
        message: "Określenie typu giełdowego jest wymagane (prawda/fałsz)",
    }),

    // Czy to przeterminowy wykup? (nowe pole)
    is_early_redemption: z.boolean({
        message: "Określenie wczesnego wykupu jest wymagane (prawda/fałsz)",
    }),

    // Notatki (opcjonalne)
    notes: z.string().optional().or(z.literal("")),
});

// Opcjonalnie: wyciągnięcie typu TypeScriptowego z tego schematu, 
// co bardzo ułatwia typowanie formularzy i payloadów
export type TransactionFormValues = z.infer<typeof transactionSchema>;