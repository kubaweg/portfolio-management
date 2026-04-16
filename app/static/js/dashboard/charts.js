// app/static/js/dashboard/main.js

// --- POMOCNICY (Helpers) ---
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
        if (item.type === 'ETF') return `hsl(210, 80%, ${70 - (idx.ETF++ / (counts.ETF || 1) * 40)}%)`;
        if (item.type === 'ETC') return `hsl(50, 90%, ${65 - (idx.ETC++ / (counts.ETC || 1) * 35)}%)`;
        if (item.type === 'BOND') return `hsl(140, 60%, ${65 - (idx.BOND++ / (counts.BOND || 1) * 35)}%)`;
        return 'gray';
    });
};

// --- GŁÓWNA FUNKCJA INICJUJĄCA ---
export function initDashboard(allocationData, instrumentData) {
    // 1. Rejestracja wtyczki (zakładamy, że Chart jest dostępny globalnie z base.html)
    if (typeof ChartDataLabels !== 'undefined') {
        Chart.register(ChartDataLabels);
    }

    // 2. Wykres Alokacji
    const ctxAlloc = document.getElementById('allocationChart')?.getContext('2d');
    if (ctxAlloc) {
        new Chart(ctxAlloc, {
            type: 'doughnut',
            data: {
                labels: Object.keys(allocationData),
                datasets: [{
                    data: Object.values(allocationData),
                    backgroundColor: ['#198754', '#ffc107', '#0d6efd'],
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

    // 3. Wykres Instrumentów
    const ctxInstr = document.getElementById('instrumentChart')?.getContext('2d');
    if (ctxInstr) {
        new Chart(ctxInstr, {
            type: 'doughnut',
            data: {
                labels: instrumentData.map(i => i.label),
                datasets: [{
                    data: instrumentData.map(i => i.value),
                    backgroundColor: generateColors(instrumentData),
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