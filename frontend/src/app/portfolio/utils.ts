/**
 * Narzędzia do formatowania danych finansowych i dat.
 */

export const formatPLN = (val: number): string => {
    return new Intl.NumberFormat('pl-PL', {
        style: 'currency',
        currency: 'PLN',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(val);
};

export const formatPercent = (val: number): string => {
    return new Intl.NumberFormat('pl-PL', {
        style: 'percent',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(val);
};

export const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('pl-PL', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
    });
};

/**
 * Logika kolorów dla wykresów
 */
// --- Kolory dla wykresów ---
export const TYPE_HUES: Record<string, string> = {
    'Obligacja': '#198754', // Hex jako źródło prawdy dla odcienia (musi być liczba pojedyncza!)
    'ETF': '#0d6efd',
    'ETC': '#ffc107',
    'Akcja': '#0dcaf0',
    'Crypto': '#6f42c1',
};

// Funkcja konwertująca HEX na HSL
export const hexToHsl = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (!result) return { h: 0, s: 0, l: 50 };

    const r = parseInt(result[1], 16) / 255;
    const g = parseInt(result[2], 16) / 255;
    const b = parseInt(result[3], 16) / 255;

    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h = 0, s = 0, l = (max + min) / 2;

    if (max !== min) {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
            case r: h = (g - b) / d + (g < b ? 6 : 0); break;
            case g: h = (b - r) / d + 2; break;
            case b: h = (r - g) / d + 4; break;
        }
        h /= 6;
    }
    return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
};