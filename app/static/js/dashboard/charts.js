// app/static/js/dashboard/main.js

// 1. Definiujemy sztywną kolejność (BOND = 1, ETF = 2, ETC = 3)
const TYPE_ORDER = { 'BOND': 1, 'ETF': 2, 'ETC': 3 };

// Kolory techniczne dla alokacji (spójne z typami)
const ALLOC_COLORS = {
    'BOND': '#198754', // Zielony
    'ETF': '#0d6efd',  // Niebieski
    'ETC': '#ffc107'   // Złoty/Żółty
};

const formatVolume = (v) => {
    const num = Number(v);
    if (isNaN(num)) return v;
    return new Intl.NumberFormat('pl-PL', { useGrouping: true }).format(num);
};

const getLabelSettings = (fontSize = 12) => ({
    color: '#fff',
    font: { weight: 'bold', size: fontSize },
    formatter: (value, context) => {
        const dataset = context.chart.data.datasets[0].data;
        const localSum = dataset.reduce((a, b) => a + b, 0);
        if (localSum === 0) return '';
        const percentage = (value / localSum * 100).toFixed(1);
        return (percentage > 3) ? percentage + '%' : '';
    },
    display: 'auto'
});

const generateColors = (data) => {
    const counts = {
        'ETF': data.filter(i => i.type === 'ETF').length,
        'ETC': data.filter(i => i.type === 'ETC').length,
        'BOND': data.filter(i => i.type === 'BOND').length
    };
    let idx = { 'ETF': 0, 'ETC': 0, 'BOND': 0 };

    return data.map(item => {
        // Generujemy odcienie wewnątrz danej grupy
        if (item.type === 'ETF') return `hsl(210, 80%, ${70 - (idx.ETF++ / (counts.ETF || 1) * 40)}%)`;
        if (item.type === 'ETC') return `hsl(50, 90%, ${65 - (idx.ETC++ / (counts.ETC || 1) * 35)}%)`;
        if (item.type === 'BOND') return `hsl(140, 60%, ${65 - (idx.BOND++ / (counts.BOND || 1) * 35)}%)`;
        return 'gray';
    });
};

export function initDashboard(allocationData, instrumentData, instrumentDataAgg) {
    if (typeof ChartDataLabels !== 'undefined') {
        Chart.register(ChartDataLabels);
    }

    // --- LOGIKA SORTOWANIA ---

    // Sortowanie Wykresu 1 (Alokacja)
    const sortedAllocKeys = Object.keys(allocationData).sort((a, b) =>
        (TYPE_ORDER[a] || 99) - (TYPE_ORDER[b] || 99)
    );
    const sortedAllocValues = sortedAllocKeys.map(key => allocationData[key]);

    // Sortowanie Wykresów
    const sortedInstruments = [...instrumentData].sort((a, b) => {
        const orderA = TYPE_ORDER[a.type] || 99;
        const orderB = TYPE_ORDER[b.type] || 99;
        // Jeśli ten sam typ, sortuj malejąco po wartości (większe instrumenty najpierw)
        if (orderA === orderB) return b.value - a.value;
        return orderA - orderB;
    });

    const sortedInstrumentsAgg = [...instrumentDataAgg].sort((a, b) => {
        const orderA = TYPE_ORDER[a.type] || 99;
        const orderB = TYPE_ORDER[b.type] || 99;
        // Jeśli ten sam typ, sortuj malejąco po wartości (większe instrumenty najpierw)
        if (orderA === orderB) return b.value - a.value;
        return orderA - orderB;
    });

    // --- WYKRES ALOKACJI ---
    const ctxAlloc = document.getElementById('allocationChart')?.getContext('2d');
    if (ctxAlloc) {
        new Chart(ctxAlloc, {
            type: 'doughnut',
            data: {
                labels: sortedAllocKeys,
                datasets: [{
                    data: sortedAllocValues,
                    backgroundColor: sortedAllocKeys.map(key => ALLOC_COLORS[key] || '#6c757d'),
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: { position: 'bottom' },
                    datalabels: getLabelSettings(14),
                    tooltip: {
                        callbacks: {
                            label: (context) => {
                                const value = Math.round(parseFloat(context.raw));
                                const total = context.chart.data.datasets[0].data.reduce((a, b) => a + Number(b), 0);
                                const percent = total ? ((value / total) * 100).toFixed(1) : 0;
                                return ` Wartość [PLN]: ${formatVolume(value)} (${percent}%)`;
                            }
                        }
                    }
                }
            }
        });
    }

    // --- WYKRES INSTRUMENTÓW ---
    const ctxInstr = document.getElementById('instrumentChart')?.getContext('2d');
    if (ctxInstr) {
        new Chart(ctxInstr, {
            type: 'doughnut',
            data: {
                labels: sortedInstruments.map(i => i.label),
                datasets: [{
                    data: sortedInstruments.map(i => i.value),
                    backgroundColor: generateColors(sortedInstruments),
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: { position: 'bottom' },
                    datalabels: getLabelSettings(11),
                    tooltip: {
                        callbacks: {
                            label: (context) => {
                                const value = Math.round(parseFloat(context.raw));
                                const total = context.chart.data.datasets[0].data.reduce((a, b) => a + Number(b), 0);
                                const percent = total ? ((value / total) * 100).toFixed(1) : 0;
                                return ` Wartość [PLN]: ${formatVolume(value)} (${percent}%)`;
                            }
                        }
                    }
                }
            }
        });
    }

    // --- WYKRES ANALITYCZNY ---
    const ctxAnalytics = document.getElementById('analyticsChart')?.getContext('2d');
    if (ctxAnalytics) {
        new Chart(ctxAnalytics, {
            type: 'doughnut',
            data: {
                labels: sortedInstrumentsAgg.map(i => i.category),
                datasets: [{
                    data: sortedInstrumentsAgg.map(i => i.value),
                    backgroundColor: generateColors(sortedInstrumentsAgg),
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: { position: 'bottom' },
                    datalabels: getLabelSettings(11),
                    tooltip: {
                        callbacks: {
                            label: (context) => {
                                const value = Math.round(parseFloat(context.raw));
                                const total = context.chart.data.datasets[0].data.reduce((a, b) => a + Number(b), 0);
                                const percent = total ? ((value / total) * 100).toFixed(1) : 0;
                                return ` Wartość [PLN]: ${formatVolume(value)} (${percent}%)`;
                            }
                        }
                    }
                }
            }
        });
    }
}