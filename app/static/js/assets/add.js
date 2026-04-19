// app/static/js/asset/add.js

const $ = (sel) => document.querySelector(sel);

document.addEventListener('DOMContentLoaded', () => {
    const form = $('#add-asset-form');
    const alertBox = $('#form-alert');
    const submitBtn = $('#submit-btn');
    const assetTypeSelect = $('#assetType');
    const formBody = $('#form-body');

    const extraSections = ['section-ETF', 'section-ETC', 'section-BOND'];

    if (!form) return;

    // --- LOGIKA WIDOCZNOŚCI ---

    const updateVisibleSections = (selectedType) => {
        if (selectedType) {
            if (formBody) formBody.classList.remove('d-none');
        } else {
            if (formBody) formBody.classList.add('d-none');
        }

        extraSections.forEach(id => {
            const section = $(`#${id}`);
            if (section) {
                const isActive = (id === `section-${selectedType}`);

                // Przełącz widoczność
                section.classList.toggle('d-none', !isActive);

                // KLUCZOWA ZMIANA: Wyłączamy pola w nieaktywnych sekcjach, 
                // żeby FormData je ignorowało
                section.querySelectorAll('input, select, textarea').forEach(el => {
                    el.disabled = !isActive;
                });
            }
        });
    };

    assetTypeSelect.addEventListener('change', (e) => updateVisibleSections(e.target.value));

    form.addEventListener('reset', () => {
        setTimeout(() => updateVisibleSections(null), 10);
        if (alertBox) alertBox.classList.add('d-none');
    });

    // --- LOGIKA WYSYŁKI ---

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        if (submitBtn) submitBtn.disabled = true;

        // FormData teraz automatycznie pominie pola z atrybutem 'disabled'
        const formData = new FormData(form);
        const data = {};

        const checkboxNames = ['active', 'is_indexed', 'physical_backing', 'secured'];

        for (let [key, value] of formData.entries()) {
            if (value === "" && key !== 'ticker') {
                data[key] = null;
            } else {
                data[key] = value;
            }
        }

        checkboxNames.forEach(name => {
            const cb = form.querySelector(`input[name="${name}"]`);
            // Checkboxy sprawdzamy tylko jeśli nie są disabled
            if (cb && !cb.disabled) {
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