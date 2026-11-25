/* ==========================================================================
   Fills add_beverage.html template with data from each drink card (Café & Té)
   
   Product details can be seen in the URL:
     add_beverage.html?product=smoothie&name=Smoothie&price=6000

   Product details come from each card's 'data-labels'. As of right now,
   these details come from the HTML. Eventually, they should come from the DB
   ========================================================================== */

const API = 'http://localhost:3000';
const urlParams = new URLSearchParams(window.location.search);

let activeOrderId = null;
let orderItems = [];        
const stepperItemIds = {};  

// Option codes from the database -> the words the cashier reads.
// "N" (nothing chosen) is not shown.
const DETAIL_LABELS = {
    PA: 'Para aquí', PL: 'Para llevar', TP: 'Termo propio',
    MI: 'Miel', SP: 'Splenda', AM: 'Mascabado',
    CJE: 'Cajeta extra', CE: 'Caramelo extra', CL: 'Con leche'
};

function detailsText(codes) {
    return (codes || []).filter(c => c !== 'N').map(c => DETAIL_LABELS[c] || c).join(' · ');
}

function isValidId(v) {
    return v && v !== 'null' && v !== 'undefined' && !Number.isNaN(Number(v));
}

async function resolveActiveOrder() {
    const candidate = urlParams.get('order') || sessionStorage.getItem('activeOrderId');
    if (isValidId(candidate)) {
        try {
            const res = await fetch(`${API}/orders/${candidate}`);
            if (res.ok) {
                const data = await res.json();
                if (data.order && data.order.status) activeOrderId = candidate;
            }
        } catch (err) { console.error(err); }
    }
    if (!activeOrderId) await initializeNewOrder();

    if (activeOrderId) {
        sessionStorage.setItem('activeOrderId', activeOrderId);
        const titleEl = document.getElementById('order-title');
        if (titleEl) titleEl.textContent = `Pedido #${activeOrderId}`;
    }
}

document.addEventListener('DOMContentLoaded', async () => {
    await resolveActiveOrder();
    if (!activeOrderId) {
        alert('No se pudo crear o cargar el pedido. ¿Está corriendo el servidor?');
        return;
    }

    await loadExistingOrderItems(activeOrderId);
    await loadCatalogProducts();

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
            window.location.href = `payment.html?order=${activeOrderId}`;
        });
    }
});

async function initializeNewOrder() {
  try {
      const response = await fetch('http://localhost:3000/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      const result = await response.json();
      if (result.success) {
        activeOrderId = result.data.order_id;
      }
  } catch (err) {
    console.error("Error al inicializar el pedido:", err);
  }
}

async function loadCatalogProducts() {
    try {
      const response = await fetch('http://localhost:3000/products');
      const result = await response.json();

      if (result.success) {
        document.getElementById('cafe').querySelector('.product-grid').innerHTML = '';
        document.getElementById('te').querySelector('.product-grid').innerHTML = '';
        document.getElementById('panaderia').querySelector('.product-grid').innerHTML = '';
        document.getElementById('otros').querySelector('.product-grid').innerHTML = '';

        result.data.forEach(product => {
          renderCatalogProduct(product);
        });
      }
    } catch (err) {
        console.error("Error cargando catálogo de productos:", err);
    }
}

function renderCatalogProduct(product) {
    const section = document.getElementById(product.category);
    if (!section) return;
    const grid = section.querySelector('.product-grid');
    const li = document.createElement('li');

    const isDrink = product.category === 'cafe' || product.category === 'te';
    const imgSrc = product.image || '../../assets/colmena_logo.png';

    if (isDrink) {
        li.innerHTML = `
          <a class="product-card" href="add_beverage.html?product=${product.product_id}&name=${encodeURIComponent(product.product_name)}&price=${product.price}&category=${product.category}&order=${activeOrderId}"
            data-action="add-product" data-product-id="${product.product_id}"
            data-category="${product.category}" data-price-cents="${product.price}" data-customizable="true">
            <img class="product-card__photo" src="${imgSrc}" alt="" style="width: 100%; aspect-ratio: 4/3; object-fit: cover; border-radius: var(--radius);">
            <h3 class="product-card__name">${catalogNameHTML(product.product_name)}</h3>
            <p class="product-card__meta">$${(product.price / 100).toFixed(2)}</p>
          </a>
        `;
    } else {
        li.innerHTML = `
          <article class="product-card product-card--bakery"
                 data-product-id="${product.product_id}" data-category="${product.category}" data-price-cents="${product.price}" data-stock="${product.total_units || 0}">
            <img class="product-card__photo" src="${imgSrc}" alt="" style="width: 100%; aspect-ratio: 4/3; object-fit: cover; border-radius: var(--radius);">
            <h3 class="product-card__name">${catalogNameHTML(product.product_name)}</h3>
            <p class="product-card__meta">$${(product.price / 100).toFixed(2)} · ${product.total_units !== null ? product.total_units + ' disponibles' : ''}</p>
            <div class="stepper product-card__stepper">
              <button class="btn stepper__btn" type="button" data-action="qty-decrease" disabled>−</button>
              <span class="stepper__value" data-field="qty" aria-live="polite">0</span>
              <button class="btn stepper__btn" type="button" data-action="qty-increase">+</button>
            </div>
          </article>
        `;

        const minusBtn = li.querySelector('[data-action="qty-decrease"]');
        const plusBtn = li.querySelector('[data-action="qty-increase"]');
        const qtySpan = li.querySelector('[data-field="qty"]');
        const metaEl = li.querySelector('.product-card__meta');
        const priceLabel = `$${(product.price / 100).toFixed(2)}`;

        const tracksStock = product.total_units !== null && product.total_units !== undefined;
        const existing = orderItems.find(i => i.product_id === product.product_id);
        let currentQty = existing ? existing.qty : 0;
        if (existing) stepperItemIds[product.product_id] = existing.item_id;

        const maxQty = tracksStock ? Number(product.total_units) + currentQty : Infinity;

        const refresh = () => {
            qtySpan.textContent = currentQty;
            minusBtn.disabled = currentQty <= 0;
            plusBtn.disabled = currentQty >= maxQty;
            if (tracksStock) {
                const left = maxQty - currentQty;
                metaEl.textContent = left > 0 ? `${priceLabel} · ${left} disponibles` : `${priceLabel} · Agotado`;
                li.querySelector('[data-product-id]').toggleAttribute('data-sold-out', left === 0);
            }
};
refresh();

const change = async (delta) => {
    minusBtn.disabled = plusBtn.disabled = true;
    const ok = await syncStepperItem(product.product_id, currentQty + delta);
    if (ok) {
        currentQty += delta;
    } else {
        const actual = orderItems.find(i => i.product_id === product.product_id);
        currentQty = actual ? actual.qty : 0;
    }
    refresh();
};
plusBtn.addEventListener('click', () => change(+1));
minusBtn.addEventListener('click', () => change(-1));
    }

    grid.appendChild(li);
}

async function syncStepperItem(productId, qty) {
    try {
        const oldId = stepperItemIds[productId];
        if (oldId) {
            await fetch(`${API}/orders/items/${oldId}`, { method: 'DELETE' });
            delete stepperItemIds[productId];
        }
        if (qty > 0) {
            const res = await fetch(`${API}/orders/items`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ order_id: activeOrderId, product_id: productId, qty, details: ['N'] })
            });
            const result = await res.json();
            if (!result.success) {
                console.error(result.message);
                alert(result.message || 'Error al añadir el producto.');
                await loadExistingOrderItems(activeOrderId);
                return false;
            }
            stepperItemIds[productId] = result.data.item_id;
        }
        await loadExistingOrderItems(activeOrderId);
        return true;
    } catch (err) {
        console.error('Error al sincronizar item:', err);
        return false;
    }
}

async function loadExistingOrderItems(orderId) {
    try {
        const response = await fetch(`http://localhost:3000/orders/${orderId}`);
        const result = await response.json();
        if (result.success && result.order) {
            orderItems = result.items;
            updateOrderPaneTotal(result.order.pre_total);
            
            const listContainer = document.querySelector('[data-order-lines]');
            if (listContainer) {
                listContainer.innerHTML = ''; 
                result.items.forEach(item => {
                    const li = document.createElement('li');
                    li.className = 'order-line';
                    li.innerHTML = `
                        <div class="order-line__main">
                          <span><span>${item.qty}</span> × <span>${item.product_name}</span></span>
                          <span>$${(item.total_price / 100).toFixed(2)}</span>
                        </div>
                        <div class="order-line__detail">
                          <span data-field="temp">${tempIcon(tempInfo(item.product_name).temp)}</span>
                          <span>${detailsText(item.details)}</span>
                        </div>
                        <div class="order-line__actions">
                          <button class="btn" type="button" data-action="remove-line" data-item-id="${item.item_id}">Quitar</button>
                        </div>
                    `;
                    li.querySelector('[data-action="remove-line"]').addEventListener('click', async () => {
                        askToRemove(item, orderId);
                    });
                    listContainer.appendChild(li);
                });
            }
        }
    } catch (err) {
        console.error("Error cargando orden existente:", err);
    }
}

async function removeItemFromOrder(itemId, orderId) {
    try {
        const response = await fetch(`http://localhost:3000/orders/items/${itemId}`, {
            method: 'DELETE'
        });
        const result = await response.json();
        if (result.success) {
            await loadExistingOrderItems(orderId);
            // Catalog cards follow the order again (counter, "disponibles", Agotado)
            Object.keys(stepperItemIds).forEach(id => delete stepperItemIds[id]);
            await loadCatalogProducts();
        }
    } catch (err) {
        console.error("Error al quitar item:", err);
    }
}

// Asks before taking a line out of the order. "Sí, quitar" removes it; Cancelar or Esc keep it.
function askToRemove(item, orderId) {
    const modal = document.querySelector('[data-remove-line-modal]');
    modal.querySelector('[data-field="remove-line-name"]').textContent = `${item.qty} × ${item.product_name}`;
    modal.querySelector('[data-action="confirm-remove-line"]').onclick = async () => {
        modal.close();
        await removeItemFromOrder(item.item_id, orderId);
    };
    modal.showModal();
}

function updateOrderPaneTotal(totalCents) {
    const formatted = '$' + (totalCents / 100).toFixed(2);
    document.querySelectorAll('[data-order-total]').forEach(el => el.textContent = formatted);
    const hasItems = orderItems.length > 0;
    const cobrarBtn = document.querySelector('[data-action="checkout"]');
    if (cobrarBtn) cobrarBtn.disabled = !hasItems;
    const hint = document.querySelector('[data-checkout-hint]');
    if (hint) hint.hidden = hasItems;
}