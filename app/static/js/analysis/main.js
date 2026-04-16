// app/static/js/analysis/main.js

let chart = null;
let volumeChart = null;

// ==========================================
// 1. FUNKCJE POMOCNICZE (Helpers)
// ==========================================
const $ = (sel) => document.querySelector(sel);
const toNum = (v) => (typeof v === "number" && !isNaN(v) ? v : null);
const toDate = (d) => {
    const t = Date.parse(d);
    return isNaN(t) ? null : t;
};
const formatVolume = (v) => {
    if (typeof v !== "number" || isNaN(v)) return v;
    return new Intl.NumberFormat('pl-PL', { useGrouping: true }).format(v);
};
const formatDateStr = (timestamp) => new Date(timestamp).toISOString().slice(0, 10);

// ==========================================
// 2. LOGIKA TRANSAKCJI I DANYCH
// ==========================================
async function fetchChartData(ticker, period) {
    const response = await fetch(`/analysis/api/history/${ticker}?period=${period}`, { cache: "no-store" });
    if (!response.ok) throw new Error("Błąd HTTP: " + response.status);

    const result = await response.json();
    if (!result || typeof result !== "object") throw new Error("Niepoprawny format JSON");

    return result;
}

function buildTransactionMap(transactionsArr) {
    const transMap = new Map();
    if (!Array.isArray(transactionsArr)) return transMap;

    transactionsArr.forEach(t => {
        if (t?.date) transMap.set(t.date, t);
    });
    return transMap;
}

// ==========================================
// 3. FABRYKA WYKRESU CEN (OHLC)
// ==========================================
function buildPriceOptions(ticker, priceArr, transArr, transMap, avgPrice) {
    const markerIndices = [];
    const markerColors = [];

    // Mapowanie danych OHLC i zbieranie markerów
    const priceData = priceArr.map((item, idx) => {
        const ts = toDate(item.date);
        const o = toNum(item.open);
        const h = toNum(item.high);
        const l = toNum(item.low);
        const c = toNum(item.close);

        if (!ts || o === null || h === null || l === null || c === null) return null;

        const tr = transMap.get(item.date);
        if (tr) {
            markerIndices.push(idx);
            markerColors.push(tr.type === "BUY" ? "#198754" : "#dc3545"); // Zielony dla BUY, Czerwony dla SELL
        }

        return { x: ts, y: [o, h, l, c] };
    }).filter(Boolean);

    // Generowanie linii transakcji (adnotacje)
    const transactionLines = transArr.map(t => {
        const ts = toDate(t.date);
        if (!ts) return null;
        return {
            x: ts,
            borderColor: '#999',
            strokeDashArray: 4,
            label: {
                borderColor: '#999',
                orientation: 'horizontal',
                position: 'bottom',
                offsetY: 10,
                style: {
                    color: '#000',
                    background: '#e9ecef',
                    fontSize: '11px',
                    padding: { left: 6, right: 6, top: 2, bottom: 2 }
                },
                text: t.type
            }
        };
    }).filter(Boolean);

    // Generowanie punktów transakcji na wykresie
    const transactionPoints = transArr.map(t => {
        const ts = toDate(t.date);
        if (!ts || typeof t.price !== "number") return null;
        return {
            x: ts,
            y: t.price,
            marker: { size: 3, fillColor: '#999', strokeColor: '#fff', strokeWidth: 1 }
        };
    }).filter(Boolean);

    // Adnotacja średniej ceny
    const avgPriceAnnotation = avgPrice ? [{
        y: avgPrice,
        borderColor: '#444',
        label: { text: 'Średnia: ' + avgPrice.toFixed(2) }
    }] : [];

    return {
        chart: { type: 'candlestick', height: 380, id: 'price-chart', group: 'stock-sync', toolbar: { show: true }, animations: { enabled: false } },
        series: [{ name: ticker, data: priceData }],
        xaxis: { type: 'datetime', labels: { show: false }, tooltip: { enabled: false } },
        yaxis: { opposite: true, labels: { minWidth: 40, formatter: v => (typeof v === "number" ? v.toFixed(2) : "") } },
        markers: {
            size: 0,
            discrete: markerIndices.map((idx, i) => ({ seriesIndex: 0, dataPointIndex: idx, fillColor: markerColors[i], strokeColor: '#fff', size: 7 }))
        },
        annotations: {
            yaxis: avgPriceAnnotation,
            xaxis: transactionLines,
            points: transactionPoints
        },
        tooltip: {
            shared: false,
            x: { formatter: formatDateStr },
            custom: function ({ seriesIndex, dataPointIndex, w }) {
                const point = w.config.series[0].data[dataPointIndex];
                if (!point) return null;
                const dateStr = formatDateStr(point.x);
                const tr = transMap.get(dateStr);

                let html = `
                    <div style="padding:8px;">
                        <strong>${dateStr}</strong><br>
                        Open: ${point.y[0]}<br>High: ${point.y[1]}<br>Low: ${point.y[2]}<br>Close: ${point.y[3]}<br>
                `;
                if (tr) {
                    html += `
                        <hr style="margin:6px 0;">
                        <strong>${tr.type}</strong><br>Cena: ${tr.price}<br>Ilość: ${tr.quantity}
                    `;
                }
                return html + `</div>`;
            }
        }
    };
}

// ==========================================
// 4. FABRYKA WYKRESU WOLUMENU
// ==========================================
function buildVolumeOptions(volArr, transMap) {
    const volumeData = volArr.map((item) => {
        const ts = toDate(item.date);
        const v = toNum(item.volume);
        if (!ts || v === null) return null;
        return { x: ts, y: v, fillColor: "#6c757d" };
    }).filter(Boolean);

    return {
        chart: { type: 'bar', height: 150, id: 'vol-chart', group: 'stock-sync', toolbar: { show: false }, animations: { enabled: false } },
        series: [{ name: 'Wolumen', data: volumeData }],
        xaxis: { type: 'datetime', labels: { show: true, format: 'yyyy-MM-dd' } },
        yaxis: { opposite: true, labels: { minWidth: 40, formatter: v => formatVolume(v) } },
        plotOptions: { bar: { columnWidth: '85%' } },
        dataLabels: { enabled: false },
        tooltip: {
            shared: false,
            x: { formatter: formatDateStr },
            custom: function ({ seriesIndex, dataPointIndex, w }) {
                const point = w.config.series[0].data[dataPointIndex];
                if (!point) return null;
                const dateStr = formatDateStr(point.x);
                const tr = transMap.get(dateStr);
                const volFmt = formatVolume(point.y);

                let html = `
                    <div style="padding:10px; background:#fff; border:1px solid #ccc; border-radius:6px; font-size:13px;">
                        Wolumen: <strong>${volFmt}</strong>
                `;
                if (tr) {
                    html += `
                        <hr style="margin:6px 0;">
                        <strong>${tr.type}</strong><br>Cena: ${tr.price}<br>Ilość: ${tr.quantity}
                    `;
                }
                return html + `</div>`;
            }
        }
    };
}

// ==========================================
// 5. GŁÓWNY ORKIESTRATOR (Main Controller)
// ==========================================
async function updateChart() {
    const ticker = $('#tickerSelect')?.value;
    const period = $('#periodButtons .active')?.dataset.period || '3mo';

    if (!ticker) return;

    // 1. UI: Przygotowanie do ładowania
    $('#chart-loader').classList.remove('d-none');
    $('#chart-error').classList.add('d-none');

    // Ukrywamy kontener wykresów przed nowym renderem
    const container = $('#charts-container');
    container.classList.add('d-none');
    container.style.opacity = "0";

    // 2. Czyszczenie starych instancji
    if (chart) { try { chart.destroy(); } catch { } chart = null; }
    if (volumeChart) { try { volumeChart.destroy(); } catch { } volumeChart = null; }

    try {
        const result = await fetchChartData(ticker, period);

        const priceArr = Array.isArray(result.historical_data) ? result.historical_data : [];
        const volArr = Array.isArray(result.historical_volume) ? result.historical_volume : [];
        const transArr = Array.isArray(result.transactions) ? result.transactions : [];

        if (priceArr.length === 0) throw new Error("Brak danych");

        const transMap = buildTransactionMap(transArr);
        const priceOptions = buildPriceOptions(ticker, priceArr, transArr, transMap, result.avg_price);
        const volOptions = buildVolumeOptions(volArr, transMap);

        // 3. Inicjalizacja nowych instancji
        chart = new ApexCharts($("#main-chart"), priceOptions);
        volumeChart = new ApexCharts($("#volume-chart"), volOptions);

        // 4. KLUCZ: Renderujemy oba jednocześnie i czekamy na koniec
        await Promise.all([
            chart.render(),
            volumeChart.render()
        ]);

        // 5. Sukces: Pokazujemy wszystko na raz
        $('#chart-loader').classList.add('d-none');
        container.classList.remove('d-none');

        // Mały timeout, żeby przeglądarka zdążyła zarejestrować usunięcie d-none przed animacją opacity
        setTimeout(() => {
            container.style.opacity = "1";
        }, 10);

    } catch (err) {
        console.error("Błąd:", err);
        $('#chart-loader').classList.add('d-none');
        $('#chart-error').classList.remove('d-none');
    }
}

// ==========================================
// 6. INICJALIZACJA (Event Listeners)
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    const tickerSelect = $('#tickerSelect');
    if (tickerSelect) {
        tickerSelect.addEventListener('change', updateChart);
    }

    document.querySelectorAll('#periodButtons button').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('#periodButtons button')
                .forEach(b => b.classList.remove('active'));

            btn.classList.add('active');
            updateChart();
        });
    });
});