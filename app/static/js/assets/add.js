// app/static/js/asset/add.js

const $ = (sel) => document.querySelector(sel);

document.addEventListener('DOMContentLoaded', () => {
    const form = $('#add-asset-form');
    const alertBox = $('#form-alert');
    const submitBtn = $('#submit-btn');
    const assetTypeSelect = $('#assetType');

    // Lista sekcji musi zgadzać się z ID w HTML
    const extraSections = ['section-ETF', 'section-ETC', 'section-BOND'];

    if (!form) return;

    // --- LOGIKA WIDOCZNOŚCI ---

    const updateVisibleSections = (selectedType) => {
        extraSections.forEach(id => {
            const section = $(`#${id}`);
            if (section) {
                section.classList.add('d-none');
                // Opcjonalne: czyścimy pola ukrytej sekcji przy zmianie typu
                // section.querySelectorAll('input, select').forEach(i => i.value = '');
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
        // Musimy ręcznie obsłużyć checkboxy i puste pola

        // Pobieramy listę wszystkich nazw pól, które są checkboxami w Twoim HTML
        const checkboxNames = ['active', 'is_indexed', 'physical_backing', 'secured'];

        // Iterujemy po wszystkich polach formularza
        for (let [key, value] of formData.entries()) {
            // Jeśli pole jest puste, zamień na null (ważne dla bazy danych!)
            if (value === "" && key !== 'ticker') {
                data[key] = null;
            } else {
                data[key] = value;
            }
        }

        // Specjalna obsługa checkboxów (jeśli nie ma go w formData, znaczy że false)
        checkboxNames.forEach(name => {
            // Sprawdzamy czy dany checkbox w ogóle istnieje w formularzu
            if (form.querySelector(`input[name="${name}"]`)) {
                data[name] = formData.has(name);
            }
        });

        try {
            const response = await fetch('/asset/api/add', {
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