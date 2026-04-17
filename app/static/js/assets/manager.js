// app/static/js/asset/manager.js

const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

document.addEventListener('DOMContentLoaded', () => {

    // --- 1. DYNAMICZNY FORMULARZ ---
    const typeSelect = $('#asset_type');

    const updateFormLayout = () => {
        const type = typeSelect.value;

        // Ukryj wszystkie sekcje i wyczyść wymogi "required" dla specyficznych pól
        $$('.dynamic-section').forEach(el => el.classList.add('d-none'));
        $('#req_maturity').required = false;
        $('#req_nominal').required = false;

        if (type === 'ETF') {
            $('#section-exchange').classList.remove('d-none');
            $('#section-etf').classList.remove('d-none');
        } else if (type === 'ETC') {
            $('#section-exchange').classList.remove('d-none');
            $('#section-etc').classList.remove('d-none');
        } else if (type === 'BOND') {
            $('#section-bond').classList.remove('d-none');
            // Obligacje wymuszają specyficzne parametry
            $('#req_maturity').required = true;
            $('#req_nominal').required = true;
        }
    };

    if (typeSelect) {
        typeSelect.addEventListener('change', updateFormLayout);
    }

    // --- 2. WYSYŁKA FORMULARZA (DODAWANIE) ---
    const form = $('#add-asset-form');
    const alertBox = $('#form-alert');

    const showAlert = (msg, type) => {
        alertBox.className = `alert alert-${type} mt-3 mb-4`;
        alertBox.textContent = msg;
        alertBox.classList.remove('d-none');
        window.scrollTo(0, 0);
    };

    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            $('#submit-btn').disabled = true;
            $('#submit-spinner').classList.remove('d-none');
            alertBox.classList.add('d-none');

            // Magia FormData -> JSON
            const formData = new FormData(form);
            const payload = Object.fromEntries(formData.entries());

            // FIX: FormData gubi odznaczone checkboxy, musimy je zmapować na boolean
            const checkboxes = ['physical_backing', 'is_indexed', 'secured', 'active'];
            checkboxes.forEach(cb => {
                const el = form.querySelector(`[name="${cb}"]`);
                if (el) payload[cb] = el.checked;
            });

            try {
                const res = await fetch('/asset/api/add', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });

                const result = await res.json();
                if (res.ok) {
                    showAlert(result.message, 'success');
                    form.reset();
                    updateFormLayout(); // Reset layoutu
                    // Odśwież stronę po sekundzie, by zaktualizować tabelę na dole
                    setTimeout(() => window.location.reload(), 1000);
                } else {
                    showAlert(result.message, 'danger');
                }
            } catch (err) {
                showAlert("Błąd połączenia z serwerem.", 'danger');
            } finally {
                $('#submit-btn').disabled = false;
                $('#submit-spinner').classList.add('d-none');
            }
        });
    }

    // --- 3. USUWANIE AKTYWÓW ---
    $$('.delete-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            if (!confirm("Na pewno chcesz usunąć to aktywo? Operacja usunie też przypisane do niego transakcje!")) return;

            const assetId = btn.dataset.id;
            btn.disabled = true;

            try {
                const res = await fetch(`/asset/api/delete/${assetId}`, { method: 'DELETE' });
                const result = await res.json();

                if (res.ok) {
                    // Animowane usunięcie wiersza bez reloadu
                    const row = $(`#row-${assetId}`);
                    row.style.transition = "opacity 0.4s";
                    row.style.opacity = "0";
                    setTimeout(() => row.remove(), 400);
                } else {
                    alert("Błąd: " + result.message);
                    btn.disabled = false;
                }
            } catch (err) {
                alert("Wystąpił błąd sieci.");
                btn.disabled = false;
            }
        });
    });
});