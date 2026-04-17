// app/static/js/asset/manager.js

document.addEventListener('DOMContentLoaded', function () {
    const assetTypeSelect = document.getElementById('asset_type');

    // Pobieramy referencje do sekcji
    const secExchange = document.getElementById('section-exchange');
    const secEtf = document.getElementById('sub-section-etf');
    const secEtc = document.getElementById('sub-section-etc');
    const secBond = document.getElementById('section-bond');

    // Pola wymagane warunkowo
    const reqMaturity = document.getElementById('req_maturity');
    const reqNominal = document.getElementById('req_nominal');

    function toggleFields() {
        const selectedType = assetTypeSelect.value;

        // 1. Reset: Ukryj wszystko
        secExchange.classList.add('d-none');
        secEtf.classList.add('d-none');
        secEtc.classList.add('d-none');
        secBond.classList.add('d-none');

        // Reset walidacji
        if (reqMaturity) reqMaturity.required = false;
        if (reqNominal) reqNominal.required = false;

        // 2. Aktywacja logiczna
        if (selectedType === 'ETF') {
            secExchange.classList.remove('d-none');
            secEtf.classList.remove('d-none');
        }
        else if (selectedType === 'ETC') {
            secExchange.classList.remove('d-none');
            secEtc.classList.remove('d-none');
        }
        else if (selectedType === 'BOND') {
            secBond.classList.remove('d-none');
            if (reqMaturity) reqMaturity.required = true;
            if (reqNominal) reqNominal.required = true;
        }
    }

    if (assetTypeSelect) {
        assetTypeSelect.addEventListener('change', toggleFields);
        // Uruchom przy starcie (np. przy odświeżeniu strony z zapamiętanym wyborem)
        toggleFields();
    }

    // --- Obsługa wysyłki formularza (Fetch API) ---
    const form = document.getElementById('add-asset-form');
    if (form) {
        form.addEventListener('submit', async function (e) {
            e.preventDefault();
            // ... tutaj logika wysyłki fetch (z poprzedniego kroku) ...
            console.log("Próba wysłania formularza dla typu:", assetTypeSelect.value);
        });
    }
});