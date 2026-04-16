// app/static/js/dashboard/table.js

export function renderStatusTable(portfolio) {
    const tableBody = document.getElementById('status-table-body');
    if (!tableBody) return;

    // Czyścimy tabelę przed renderowaniem
    tableBody.innerHTML = '';

    portfolio.forEach(item => {
        const row = document.createElement('tr');
        row.style.cursor = 'pointer';
        row.setAttribute('data-bs-toggle', 'collapse');
        row.setAttribute('data-bs-target', `#collapse-${item.asset_id}`);

        // Logika dla kursu walutowego (odpowiednik {% if %})
        const fxDisplay = item.currency !== 'PLN' ? item.fx_datetime : '-';

        row.innerHTML = `
            <td>
                <strong>${item.ticker}</strong><br>
                <small class="text-muted">${item.name}</small>
            </td>
            <td class="text-end font-monospace">
                ${fxDisplay}
            </td>
            <td class="text-end font-monospace">
                ${item.price_datetime}
            </td>
        `;

        tableBody.appendChild(row);
    });
}