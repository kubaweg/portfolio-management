// app/static/js/asset/add.js

const $ = (sel) => document.querySelector(sel);

document.addEventListener('DOMContentLoaded', () => {
    const form = $('#add-asset-form');
    const alertBox = $('#form-alert');
    const submitBtn = $('#submit-btn');
    const assetTypeSelect = $('#assetType');
    const formBody = $('#form-body'); // NOWE: Odniesienie do głównego ciała formularza

    // Lista sekcji musi zgadzać się z ID w HTML
    const extraSections = ['section-ETF', 'section-ETC', 'section-BOND'];

    if (!form) return;

    // --- LOGIKA WIDOCZNOŚCI ---

    const updateVisibleSections = (selectedType) => {
        // 1. Zarządzanie widocznością całego ciała formularza
        if (selectedType) {
            if (formBody) formBody.classList.remove('d-none');
        } else {
            if (formBody) formBody.classList.add('d-none');
        }

        // 2. Zarządzanie widocznością dedykowanych sekcji
        extraSections.forEach(id => {
            const section = $(`#${id}`);
            if (section) {
                section.classList.add('d-none');
            }
        });

        if (selectedType) {
            const activeSection = $(`#section-${selectedType}`);
            if (activeSection) activeSection.classList.remove('d-none');
        }
    };

    assetTypeSelect.addEventListener('change', (e) => updateVisibleSections(e.target.value));

    // Obsługa przycisku Wyczyść (Reset)
    form.addEventListener('reset', () => {
        setTimeout(() => updateVisibleSections(null), 10);
        if (alertBox) alertBox.classList.add('d-none');
    });

    // --- LOGIKA WYSYŁKI ---

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        // UI: Start
        if (submitBtn) submitBtn.disabled = true;

        // 1. Pobranie surowych danych
        const formData = new FormData(form);
        const data = {};

        // 2. INTELIGENTNE PRZETWARZANIE DANYCH
        const checkboxNames = ['active', 'is_indexed', 'physical_backing', 'secured'];

        for (let [key, value] of formData.entries()) {
            if (value === "" && key !== 'ticker') {
                data[key] = null;
            } else {
                data[key] = value;
            }
        }

        checkboxNames.forEach(name => {
            if (form.querySelector(`input[name="${name}"]`)) {
                data[name] = formData.has(name);
            }
        });

        try {
            const response = await fetch('/add_asset/api/add', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });

            const result = await response.json();

            if (response.ok) {
                alert(`Sukces: ${result.message}`);
                form.reset();
            } else {
                alert(`Błąd: ${result.message}`);
            }
        } catch (error) {
            console.error('Error:', error);
            alert('Wystąpił błąd połączenia z serwerem.');
        } finally {
            if (submitBtn) submitBtn.disabled = false;
        }
    });
});