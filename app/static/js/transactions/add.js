// app/static/js/transactions/add.js

const $ = (sel) => document.querySelector(sel);

document.addEventListener('DOMContentLoaded', () => {
    const form = $('#add-transaction-form');
    const submitBtn = $('#submit-btn');
    const formBody = $('#form-body');

    // Zmienne do kaskadowego wyboru
    const assetTypeSelect = $('#assetTypeSelect');
    const assetSelectWrapper = $('#assetSelectWrapper');
    const assetSelect = $('#assetSelect');

    if (!form) return;

    // --- LOGIKA KASKADOWEGO WYBORU WIDOCZNOŚCI ---

    // 1. Zmiana w polu "Rodzaj instrumentu"
    assetTypeSelect.addEventListener('change', (e) => {
        const selectedType = e.target.value;

        // Odkrywamy pole wyboru aktywa
        assetSelectWrapper.classList.remove('d-none');

        // Resetujemy wybór konkretnego aktywa oraz ukrywamy resztę formularza
        assetSelect.value = "";
        formBody.classList.add('d-none');


        // Filtrujemy opcje na liście
        Array.from(assetSelect.options).forEach(option => {
            if (option.value === "") {
                // Zawsze pokazujemy domyślną, pustą opcję ("-- Wybierz aktywo --")
                option.hidden = false;
                option.disabled = false;
                return;
            }

            console.log(option.dataset.type, selectedType)
            // Pokaż tylko te aktywa, których data-type zgadza się z wybranym rodzajem
            if (option.dataset.type === selectedType) {
                option.hidden = false;
                option.disabled = false;
            } else {
                option.hidden = true;
                option.disabled = true; // Zabezpieczenie przed kliknięciem z klawiatury
            }
        });
    });

    // 2. Zmiana w polu "Konkretne aktywo"
    assetSelect.addEventListener('change', (e) => {
        // Odsłaniamy główną część formularza dopiero po wybraniu aktywa z listy
        if (e.target.value) {
            formBody.classList.remove('d-none');
        } else {
            formBody.classList.add('d-none');
        }
    });

    // Po kliknięciu "Wyczyść formularz", wracamy do stanu początkowego
    form.addEventListener('reset', () => {
        setTimeout(() => {
            assetSelectWrapper.classList.add('d-none');
            formBody.classList.add('d-none');
        }, 10);
    });

    // --- LOGIKA WYSYŁKI ---

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        // UI: Zablokuj przycisk
        if (submitBtn) submitBtn.disabled = true;

        const formData = new FormData(form);
        const data = {};

        // Przetwarzanie danych: puste pola tekstowe -> null
        for (let [key, value] of formData.entries()) {
            if (value.trim() === "") {
                data[key] = null;
            } else {
                data[key] = value;
            }
        }

        // Upewnijmy się, że liczby są wysyłane jako type Number/null
        const numericFields = ['asset_id', 'quantity', 'price', 'fx_rate'];
        numericFields.forEach(field => {
            if (data[field] !== null) {
                data[field] = Number(data[field]);
            }
        });

        try {
            const response = await fetch('/add_transaction/api/add', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });

            const result = await response.json();

            if (response.ok) {
                alert(`Sukces: ${result.message || 'Transakcja została dodana'}`);
                form.reset();
            } else {
                alert(`Błąd: ${result.message || 'Wystąpił błąd zapisu'}`);
            }
        } catch (error) {
            console.error('Error:', error);
            alert('Wystąpił błąd połączenia z serwerem.');
        } finally {
            if (submitBtn) submitBtn.disabled = false;
        }
    });
});