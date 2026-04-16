// app/static/js/analysis/main.js

let chart = null;
let volumeChart = null;

// Bezpieczne pobieranie elementu
const $ = (sel) => document.querySelector(sel);

// Bezpieczne parsowanie liczby
const toNum = (v) => (typeof v === "number" && !isNaN(v) ? v : null);

// Bezpieczne parsowanie daty
const toDate = (d) => {
    const t = Date.parse(d);
    return isNaN(t) ? null : t;
};

const formatVolume = (v) => {
    if (typeof v !== "number" || isNaN(v)) return v;
    return new Intl.NumberFormat('pl-PL', { useGrouping: true }).format(v);
};

async function updateChart() {
    const tickerSelect = $('#tickerSelect');
    const periodBtn = $('#periodButtons .active');

    const ticker = tickerSelect ? tickerSelect.value : null;
    const period = periodBtn ? periodBtn.dataset.period : '3mo';

    if (!ticker) return;

    $('#chart-loader').classList.remove('d-none');
    $('#chart-error').classList.add('d-none');

    // Usuwamy poprzednie wykresy BEZ ryzyka błędów
    if (chart) { try { await chart.destroy(); } catch { } chart = null; }
    if (volumeChart) { try { await volumeChart.destroy(); } catch { } volumeChart = null; }

    try {
        const response = await fetch(`/analysis/api/history/${ticker}?period=${period}`, { cache: "no-store" });

        if (!response.ok) throw new Error("Błąd HTTP: " + response.status);

        const result = await response.json();

        if (!result || typeof result !== "object") {
            throw new Error("Niepoprawny format JSON");
        }

        const priceArr = Array.isArray(result.historical_data) ? result.historical_data : [];
        const volArr = Array.isArray(result.historical_volume) ? result.historical_volume : [];
        const transArr = Array.isArray(result.transactions) ? result.transactions : [];

        if (priceArr.length === 0) {
            throw new Error("Brak danych cenowych");
        }

        // Mapa transakcji
        const transMap = new Map();
        transArr.forEach(t => {
            if (t?.date) transMap.set(t.date, t);
        });

        // --- DANE CENOWE ---
        const markerIndices = [];
        const markerColors = [];

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
                markerColors.push(tr.type === "BUY" ? "#198754" : "#dc3545");
            }

            return { x: ts, y: [o, h, l, c] };
        }).filter(Boolean);

        // --- DANE WOLUMENU ---
        const volumeData = volArr.map((item, idx) => {
            const ts = toDate(item.date);
            const v = toNum(item.volume);
            if (!ts || v === null) return null;

            return {
                x: ts,
                y: v,
                fillColor: "#6c757d"
            };
        }).filter(Boolean);

        // --- OPCJE WYKRESU CEN ---
        const transactionLines = transArr
            .map(t => {
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
            })
            .filter(Boolean);

        const priceOptions = {
            chart: {
                type: 'candlestick',
                height: 380,
                id: 'price-chart',
                group: 'stock-sync',
                toolbar: { show: true },
                animations: { enabled: false }
            },
            series: [{ name: ticker, data: priceData }],
            xaxis: { type: 'datetime', labels: { show: false }, tooltip: { enabled: false } },
            yaxis: {
                opposite: true,
                labels: {
                    minWidth: 40,
                    formatter: v => (typeof v === "number" ? v.toFixed(2) : "")
                }
            },
            markers: {
                size: 0,
                discrete: markerIndices.map((idx, i) => ({
                    seriesIndex: 0,
                    dataPointIndex: idx,
                    fillColor: markerColors[i],
                    strokeColor: '#fff',
                    size: 7
                }))
            },
            annotations: {
                yaxis: result.avg_price ? [{
                    y: result.avg_price,
                    borderColor: '#444',
                    label: { text: 'Średnia: ' + result.avg_price.toFixed(2) }
                }] : [],
                xaxis: transactionLines,
                points: transArr.map(t => {
                    const ts = toDate(t.date);
                    if (!ts || typeof t.price !== "number") return null;

                    return {
                        x: ts,
                        y: t.price,
                        marker: {
                            size: 3,
                            fillColor: '#999',
                            strokeColor: '#fff',
                            strokeWidth: 1
                        }
                    };
                }).filter(Boolean)
            },
            tooltip: {
                shared: false,
                x: {
                    formatter: function (value) {
                        const d = new Date(value);
                        return d.toISOString().slice(0, 10);
                    }
                },
                custom: function ({ seriesIndex, dataPointIndex, w }) {
                    const point = w.config.series[0].data[dataPointIndex];
                    if (!point) return null;

                    const dateStr = new Date(point.x).toISOString().slice(0, 10);
                    const tr = transMap.get(dateStr);

                    let html = `
                        <div style="padding:8px;">
                            <strong>${dateStr}</strong><br>
                            Open: ${point.y[0]}<br>
                            High: ${point.y[1]}<br>
                            Low: ${point.y[2]}<br>
                            Close: ${point.y[3]}<br>
                    `;

                    if (tr) {
                        html += `
                            <hr style="margin:6px 0;">
                            <strong>${tr.type}</strong><br>
                            Cena: ${tr.price}<br>
                            Ilość: ${tr.quantity}
                        `;
                    }

                    html += `</div>`;
                    return html;
                }
            }
        };

        // --- OPCJE WYKRESU WOLUMENU ---
        const volOptions = {
            chart: {
                type: 'bar',
                height: 150,
                id: 'vol-chart',
                group: 'stock-sync',
                toolbar: { show: false },
                animations: { enabled: false }
            },
            series: [{ name: 'Wolumen', data: volumeData }],
            xaxis: { type: 'datetime', labels: { show: true, format: 'yyyy-MM-dd' } },
            yaxis: {
                opposite: true,
                labels: {
                    minWidth: 40,
                    formatter: v => formatVolume(v)
                }
            },
            plotOptions: { bar: { columnWidth: '85%' } },
            dataLabels: { enabled: false },
            tooltip: {
                shared: false,
                x: {
                    formatter: function (value) {
                        const d = new Date(value);
                        return d.toISOString().slice(0, 10);
                    }
                },
                custom: function ({ seriesIndex, dataPointIndex, w }) {
                    const point = w.config.series[0].data[dataPointIndex];
                    if (!point) return null;

                    const dateStr = new Date(point.x).toISOString().slice(0, 10);
                    const tr = transMap.get(dateStr);

                    const vol = point.y;
                    const volFmt = formatVolume(vol);

                    let html = `
                        <div style="
                            padding:10px;
                            background:#fff;
                            border:1px solid #ccc;
                            border-radius:6px;
                            font-size:13px;
                        ">
                            Wolumen: <strong>${volFmt}</strong>
                    `;

                    if (tr) {
                        html += `
                            <hr style="margin:6px 0;">
                            <strong>${tr.type}</strong><br>
                            Cena: ${tr.price}<br>
                            Ilość: ${tr.quantity}
                        `;
                    }

                    html += `</div>`;
                    return html;
                }
            }
        };

        // Render
        chart = new ApexCharts($("#main-chart"), priceOptions);
        volumeChart = new ApexCharts($("#volume-chart"), volOptions);

        await chart.render();
        await volumeChart.render();

    } catch (err) {
        console.error("Błąd:", err);
        $('#chart-error').classList.remove('d-none');
    } finally {
        $('#chart-loader').classList.add('d-none');
    }
}

// Inicjalizacja: Podpinamy listenery dopiero, gdy HTML w pełni się załaduje
document.addEventListener('DOMContentLoaded', () => {
    const tickerSelect = $('#tickerSelect');
    if (tickerSelect) {
        tickerSelect.addEventListener('change', updateChart);
    }

    document.querySelectorAll('#periodButtons button').forEach(btn => {
        btn.addEventListener('click', () => {
            // Zdejmij klasę 'active' ze wszystkich przycisków
            document.querySelectorAll('#periodButtons button')
                .forEach(b => b.classList.remove('active'));

            // Dodaj do klikniętego i zaktualizuj
            btn.classList.add('active');
            updateChart();
        });
    });
});