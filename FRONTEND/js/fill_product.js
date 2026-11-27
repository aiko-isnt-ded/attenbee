/* ==========================================================================
   Used by add_beverage.html
   
   Reads the address (?product=…&name=…&price=…) that was filled with 
   new_order.js and fills the product data. This should come from the DB & API
   in future versions.
   ========================================================================== */


// Translating database values to more readable ones
const DETAIL_LABELS = {
    PA: 'Para aquí', PL: 'Para llevar', TP: 'Termo propio',
    MI: 'Miel', SP: 'Splenda', AM: 'Mascabado',
    CJE: 'Cajeta extra', CE: 'Caramelo extra', CL: 'Con leche'
};

function detailsText(codes) {
    return (codes || []).filter(c => c !== 'N').map(c => DETAIL_LABELS[c] || c).join(' · ');
}

document.addEventListener('DOMContentLoaded', async () => {
    const params = new URLSearchParams(window.location.search);
    const productId = params.get('product');
    const productName = params.get('name') || 'Bebida';
    const basePriceCents = Number(params.get('price')) || 0;
    const temp = params.get('temp');
    const orderId = params.get('order');
    const category = params.get('category');

    document.querySelector('[data-field="product-id"]').value = productId;

    const backLinks = document.querySelectorAll('[data-action="back"], [data-action="cancel"]');
    backLinks.forEach((link) => {
        let targetHref = 'new_order.html';
        let queryParams = [];
        if (orderId) queryParams.push('order=' + encodeURIComponent(orderId));
        if (queryParams.length > 0) targetHref += '?' + queryParams.join('&');
        if (category) targetHref += '#' + encodeURIComponent(category);
        link.href = targetHref;
    });

    const tempWord = { hot: 'Caliente', cold: 'Frío' }[temp];
    const fill = (field, text) => {
        document.querySelectorAll(`[data-field="${field}"]`).forEach((el) => {
            el.textContent = text;
        });
    };

    fill('product-name', tempWord ? `${productName} ${tempWord}` : productName);
    fill('base-price', '$' + (basePriceCents / 100).toFixed(2));

    const icon = document.querySelector('[data-field="temp-icon"]');
    if (icon) {
        if (tempWord) {
            icon.querySelector('use').setAttribute('href', temp === 'hot' ? '#icon-hot' : '#icon-cold');
        }
        icon.toggleAttribute('hidden', !tempWord);
    }

    document.querySelectorAll('[data-only-for]').forEach((el) => {
        el.toggleAttribute('hidden', el.dataset.onlyFor !== productId);
    });

    if (orderId) {
        const orderPane = document.querySelector('[data-order-id]');
        if (orderPane) orderPane.dataset.orderId = orderId;
        const orderTitle = document.getElementById('order-title');
        if (orderTitle) orderTitle.textContent = `Pedido #${orderId}`;
        await loadOrderItems(orderId);
    }

    const form = document.querySelector('[data-add-form]');
    const qtyInput = document.getElementById('qty');
    const totalSpan = document.querySelector('[data-add-total]');

    function calculateTotal() {
        let currentUnitPrice = basePriceCents;

        form.querySelectorAll('input[type="radio"]:checked, input[type="checkbox"]:checked').forEach(input => {
            const delta = Number(input.dataset.priceDeltaCents) || 0;
            currentUnitPrice += delta;
        });

        if (currentUnitPrice < 0) currentUnitPrice = 0;
        const qty = Number(qtyInput.value) || 1;
        const finalTotal = currentUnitPrice * qty;

        totalSpan.textContent = '$' + (finalTotal / 100).toFixed(2);
    }

    document.querySelector('[data-action="qty-increase"]').addEventListener('click', () => {
        qtyInput.value = Number(qtyInput.value) + 1;
        calculateTotal();
    });
    document.querySelector('[data-action="qty-decrease"]').addEventListener('click', () => {
        if (Number(qtyInput.value) > 1) {
            qtyInput.value = Number(qtyInput.value) - 1;
            calculateTotal();
        }
    });
    qtyInput.addEventListener('input', calculateTotal);
    form.addEventListener('change', calculateTotal);
    calculateTotal();

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (!orderId) {
            alert("No hay un pedido activo asociado.");
            return;
        }

        let details = [];

        const endulzante = form.elements['endulzante']?.value;
        if (endulzante === 'miel') details.push('MI');
        else if (endulzante === 'splenda') details.push('SP');
        else if (endulzante === 'mascabado') details.push('AM');
        else details.push('N'); 

        const consumo = form.elements['consumo']?.value;
        if (consumo === 'aqui') details.push('PA');
        else if (consumo === 'termo') details.push('TP');
        else details.push('PL');

        const adicional = form.elements['adicional']?.value;
        if (adicional === 'cajeta') details.push('CJE');
        else if (adicional === 'caramelo') details.push('CE');

        if (form.elements['leche_extra']?.checked) {
            details.push('CL');
        }

        const qty = Number(qtyInput.value);

        try {
            const response = await fetch('http://localhost:3000/orders/items', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    order_id: orderId,
                    product_id: productId,
                    qty: qty,
                    details: details
                })
            });

            const result = await response.json();
            if (result.success) {
                window.location.href = `new_order.html?order=${orderId}`;
            } else {
                alert(result.message || "Error al agregar el producto.");
            }
        } catch (err) {
            console.error("Error de red:", err);
            alert("Error de conexión con el servidor.");
        }
    });

    const saveAndExitBtn = document.querySelector('[data-action="save-and-exit"]');
    if (saveAndExitBtn) {
        saveAndExitBtn.addEventListener('click', (e) => {
            e.preventDefault();
            sessionStorage.removeItem('activeOrderId');
            window.location.href = 'main.html';
        });
    }

    const checkoutBtn = document.querySelector('[data-action="checkout"]');
    if (checkoutBtn) {
        checkoutBtn.addEventListener('click', () => {
            if (orderId) {
                window.location.href = `payment.html?order=${orderId}`;
            }
        });
    }
});

async function loadOrderItems(orderId) {
    try {
        const response = await fetch(`http://localhost:3000/orders/${orderId}`);
        const result = await response.json();

        if (result.success) {
            const listContainer = document.querySelector('[data-order-lines]');
            listContainer.innerHTML = ''; 

            result.items.forEach(item => {
                const li = document.createElement('li');
                li.className = 'order-line';
                li.innerHTML = `
                    <div class="order-line__main">
                      <span><span>${item.qty}</span> × <span>${lineNameHTML(item.product_name, item.temperature)}</span></span>
                      <span>$${(item.total_price / 100).toFixed(2)}</span>
                    </div>
                    <div class="order-line__detail">
                      <span>${detailsText(item.details)}</span>
                    </div>
                    <div class="order-line__actions">
                      <button class="btn" type="button" data-action="remove-line" data-item-id="${item.item_id}">Quitar</button>
                    </div>
                `;

                li.querySelector('[data-action="remove-line"]').addEventListener('click', async () => {
                    await removeItemFromOrder(item.item_id, orderId);
                });

                listContainer.appendChild(li);
            });

            const totalFormatted = '$' + (result.order.pre_total / 100).toFixed(2);
            document.querySelectorAll('[data-order-total]').forEach(el => {
                el.textContent = totalFormatted;
            });

            const cobrarBtn = document.querySelector('[data-action="checkout"]');
            if (cobrarBtn && result.items.length > 0) cobrarBtn.disabled = false;
        }
    } catch (err) {
        console.error("Error cargando líneas del pedido:", err);
    }
}

async function removeItemFromOrder(itemId, orderId) {
    try {
        const response = await fetch(`http://localhost:3000/orders/items/${itemId}`, {
            method: 'DELETE'
        });
        const result = await response.json();
        if (result.success) {
            loadOrderItems(orderId);
        }
    } catch (err) {
        console.error("Error al quitar item:", err);
    }
}