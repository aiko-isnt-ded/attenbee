const API = 'http://localhost:3000';


const OPTION_LABELS = {
    MI:  { label: 'Miel' },
    SP:  { label: 'Splenda' },
    AM:  { label: 'Mascabado' },
    PA:  { label: 'Aquí',          delta: -500 },
    TP:  { label: 'Termo propio',  delta: -500 },
    PL:  { label: 'Para llevar' },
    CJE: { label: 'Cajeta extra',  delta: 500 },
    CE:  { label: 'Caramelo extra', delta: 500 },
    CL:  { label: 'Con leche',     delta: 500 }
};

const money = (cents) => '$' + (cents / 100).toFixed(2);

function esc(text) {
    const d = document.createElement('div');
    d.textContent = text ?? '';
    return d.innerHTML;
}

function todayRange() {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(end.getDate() + 1);
    return { from: start.toISOString(), to: end.toISOString() };
}

function formatTime(iso) {
    return new Date(iso).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', hour12: false });
}

function tempInfo(productId) {
    if (/-caliente$/.test(productId)) return { word: 'Caliente', icon: '#icon-hot' };
    if (/-frio$/.test(productId))     return { word: 'Frío',     icon: '#icon-cold' };
    return null;
}

function renderLine(item) {
    const temp = tempInfo(item.product_id);
    const name = temp
        ? item.product_name.replace(/\s+(caliente|fr[ií]o)$/i, '')
        : item.product_name;

    const tempHtml = temp
        ? ` <span class="order-line__temp">${temp.word} <svg class="icon icon--sm" aria-hidden="true" focusable="false"><use href="${temp.icon}"></use></svg></span>`
        : '';

    const options = (item.details || [])
        .map(code => ({ code, info: OPTION_LABELS[code] }))
        .filter(o => o.info);

    const optionsHtml = options.length
        ? `<ul class="order-line__options">${options.map(({ info }) => {
              const delta = info.delta
                  ? `<span class="order-line__delta">${info.delta < 0 ? '−' : '+'}${money(Math.abs(info.delta))}</span>`
                  : '';
              return `<li class="order-line__option"><span class="order-line__marker">•</span><span>${info.label}</span>${delta}</li>`;
          }).join('')}</ul>`
        : '';

    return `
      <li class="order-line" data-product-id="${esc(item.product_id)}">
        <div class="order-line__main">
          <span><span>${item.qty}</span> × <span>${esc(name)}</span>${tempHtml}</span>
          <span>${money(item.total_price)}</span>
        </div>
        ${optionsHtml}
      </li>`;
}

function renderTicket(order) {
    const li = document.createElement('li');
    li.className = 'ticket card';
    li.dataset.orderId = order.order_id;

    const hasItems = order.items.length > 0;
    const linesHtml = hasItems
        ? order.items.map(renderLine).join('')
        : '<li class="order-line"><div class="order-line__main"><span class="text-muted">Sin productos</span></div></li>';

    const checkout = hasItems
        ? `<a class="btn btn--confirm" href="payment.html?order=${order.order_id}" data-action="checkout"><span>Cobrar ${money(order.pre_total)}</span></a>`
        : `<a class="btn btn--confirm" aria-disabled="true" data-action="checkout"><span>Cobrar ${money(order.pre_total)}</span></a>`;

    li.innerHTML = `
      <div class="ticket__header">
        <h3 class="ticket__title">Pedido #${order.order_id}</h3>
        <time class="ticket__time" datetime="${esc(order.open_time)}">${formatTime(order.open_time)}</time>
      </div>
      <ul class="ticket__lines">${linesHtml}</ul>
      <p class="ticket__total"><span>Total</span><span class="ticket__total-value">${money(order.pre_total)}</span></p>
      <div class="ticket__actions">
        <a class="btn" href="new_order.html?order=${order.order_id}" data-action="edit-order">Editar</a>
        ${checkout}
      </div>`;
    return li;
}

document.addEventListener('DOMContentLoaded', async () => {
    const list = document.querySelector('[data-orders]');
    list.innerHTML = '';

    try {
        const { from, to } = todayRange();
        const res = await fetch(`${API}/orders?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`);
        const result = await res.json();
        if (!result.success) throw new Error(result.message);

        result.data.forEach(order => list.appendChild(renderTicket(order)));
    } catch (err) {
        console.error('Error cargando pedidos:', err);
        const msg = document.querySelector('.orders__empty p');
        if (msg) msg.textContent = 'No se pudieron cargar los pedidos.';
    }
});