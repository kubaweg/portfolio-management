import * as z from "zod";

export const transactionSchema = z.object({
    // ID aktywa, którego dotyczy transakcja
    asset_id: z.coerce.number().int().positive("Musisz wybrać aktywo"),

    // Typ transakcji
    type: z.string().min(1, "Wybierz typ"),

    // Data i godzina transakcji (input type="datetime-local" wysyła string)
    timestamp: z.string().min(1, "Wymagane)"),

    // Ilość (Numeric 18, 8) - używamy coerce.number() dla łatwej walidacji
    quantity: z.coerce.number().describe("Ilość jednostek"),

    // Cena jednostkowa
    price: z.coerce.number().nonnegative("Cena nie może być ujemna"),

    // Kurs wymiany walut (opcjonalny, domyślnie 1.0 jeśli transakcja w walucie konta)
    fx_rate: z.coerce.number().positive("Kurs wymiany musi być dodatni").default(1.0),

    // Notatki (opcjonalne)
    notes: z.string().optional().or(z.literal("")),
});

// Typ wyciągnięty ze schematu do użycia w React Hook Form
export type TransactionFormValues = z.infer<typeof transactionSchema>;