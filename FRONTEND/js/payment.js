/* Cobro (payment.html)
   - Pago completo: one tap pays the whole order (+ optional tip) and closes it.
   - Dividir cuenta: each person's payment is added to the list until nothing is left.
   Reads and writes data- attributes only. Money is always in cents. */

(async () => {
  const root = document.querySelector('[data-payment]');
  if (!root) return;

  const API = 'http://localhost:3000';
  const orderId = new URLSearchParams(window.location.search).get('order');

  const field = (name) => root.querySelector(`[data-field="${name}"]`);
  const fields = (name) => root.querySelectorAll(`[data-field="${name}"]`);

  const money = (cents) =>
    '$' + (cents / 100).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const toCents = (text) => {
    const n = Number(String(text).trim().replace(',', '.'));
    return Number.isFinite(n) && n > 0 ? Math.round(n * 100) : 0;
  };

  const esc = (text) => {
    const d = document.createElement('div');
    d.textContent = text ?? '';
    return d.innerHTML;
  };

  const leave = (message, href = 'orders.html') => {
    alert(message);
    window.location.href = href;
  };

  let order, items;
  try {
    const res = await fetch(`${API}/orders/${orderId}`);
    const result = await res.json();
    if (!result.success) throw new Error(result.message);
    order = result.order;
    items = result.items;
  } catch (err) {
    console.error('Error cargando el pedido:', err);
    leave('No se pudo cargar el pedido.');
    return;
  }
  if (!order.status) { leave('Este pedido ya fue cobrado.'); return; }
  if (!(order.pre_total > 0)) { leave('El pedido no tiene productos.', `new_order.html?order=${order.order_id}`); return; }

  const totalCents = order.pre_total;
  const baseReceived = order.total_pay_cash + order.total_pay_card;
  const baseTips = order.total_tip_cash + order.total_tip_card;

  const OPTION_LABELS = {
    MI:  { label: 'Miel' },
    SP:  { label: 'Splenda' },
    AM:  { label: 'Mascabado' },
    PA:  { label: 'Aquí',           delta: -500 },
    TP:  { label: 'Termo propio',   delta: -500 },
    PL:  { label: 'Para llevar' },
    CJE: { label: 'Cajeta extra',   delta: 500 },
    CE:  { label: 'Caramelo extra', delta: 500 },
    CL:  { label: 'Con leche',      delta: 500 }
  };

  const tempInfo = (productId) => {
    if (/-caliente$/.test(productId)) return { word: 'Caliente', icon: '#icon-hot' };
    if (/-frio$/.test(productId))     return { word: 'Frío',     icon: '#icon-cold' };
    return null;
  };

  const renderLine = (item) => {
    const temp = tempInfo(item.product_id);
    const name = temp ? item.product_name.replace(/\s+(caliente|fr[ií]o)$/i, '') : item.product_name;
    const opts = [];
    if (temp) {
      opts.push(`<li class="order-line__option"><svg class="icon icon--sm" aria-hidden="true" focusable="false"><use href="${temp.icon}"></use></svg>${temp.word}</li>`);
    }
    (item.details || []).forEach((code) => {
      const info = OPTION_LABELS[code];
      if (!info) return;
      const delta = info.delta
        ? `<span class="order-line__delta">${info.delta < 0 ? '−' : '+'}${money(Math.abs(info.delta))}</span>`
        : '';
      opts.push(`<li class="order-line__option order-line__option--dot">${info.label}${delta}</li>`);
    });
    return `
      <div class="order-line">
        <div class="order-line__main"><span>${item.qty} × ${esc(name)}</span><span>${money(item.total_price)}</span></div>
        ${opts.length ? `<ul class="order-line__options">${opts.join('')}</ul>` : ''}
      </div>`;
  };

  root.setAttribute('aria-label', `Cobro del pedido #${order.order_id}`);
  document.getElementById('order-title').textContent = `Pedido #${order.order_id}`;
  const timeEl = document.querySelector('.order-pane__header .order-pane__hint');
  if (timeEl) timeEl.textContent = new Date(order.open_time).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', hour12: false });
  document.querySelector('.order-pane__lines').innerHTML = items.map(renderLine).join('');
  document.querySelector('.order-pane__total-value').textContent = money(totalCents);
  document.querySelectorAll('[data-field="order-total"]').forEach((el) => { el.textContent = money(totalCents); });

  const postJSON = async (url, body) => {
    const res = await fetch(`${API}${url}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body || {})
    });
    const result = await res.json();
    if (!result.success) throw new Error(result.message || 'Error al registrar el pago.');
    return result;
  };
  const postPayment = (method, amount, tip, close = false) =>
    postJSON(`/orders/${order.order_id}/payments`, { method, amount, tip, close });

  const makeTip = (key, base) => {
    const group = root.querySelector(`[data-tip-group="${key}"]`);
    const other = group.querySelector('[data-field="tip-other"]');
    const chosen = () => group.querySelector('[data-tip]:checked').dataset.tip;
    const pct = (p) => Math.round((base() * p) / 100);
    return {
      group,
      cents: () => {
        const c = chosen();
        if (c === 'other') return toCents(other.value);
        return pct(Number(c));
      },
      refresh: () => {
        group.querySelector('[data-field="tip-10"]').textContent = money(pct(10));
        group.querySelector('[data-field="tip-15"]').textContent = money(pct(15));
      },
      reset: () => {
        group.querySelector('[data-tip="0"]').checked = true;
        other.value = '';
      },
      focusOther: () => { if (chosen() === 'other') other.focus(); },
    };
  };

  const paidModal = document.querySelector('[data-paid-modal]');
  const showPaid = (tipCents) => {
    try { sessionStorage.removeItem('activeOrderId'); } catch (e) {}
    paidModal.querySelector('[data-field="paid-title"]').textContent = `Pedido #${order.order_id} pagado`;
    paidModal.querySelector('[data-field="paid-tips"]').textContent = money(tipCents);
    paidModal.querySelector('[data-field="paid-total"]').textContent = money(totalCents + tipCents);
    paidModal.showModal();
  };
  paidModal.addEventListener('close', () => { window.location.href = 'orders.html'; });

  const fullTip = makeTip('full', () => totalCents);

  const updateFull = () => {
    const tip = fullTip.cents();
    field('full-tip-shown').textContent = money(tip);
    field('full-charge').textContent = money(totalCents + tip);
    fields('full-amount').forEach((el) => { el.textContent = money(totalCents + tip); });
  };
  fullTip.group.addEventListener('input', updateFull);
  fullTip.group.addEventListener('change', fullTip.focusOther);
  fullTip.refresh();
  updateFull();

  const fullButtons = root.querySelectorAll('[data-action="pay-full"]');
  fullButtons.forEach((btn) => {
    btn.addEventListener('click', async () => {
      const tip = fullTip.cents();
      fullButtons.forEach((b) => { b.disabled = true; });
      try {
        await postPayment(btn.dataset.method, totalCents, tip, true);
        showPaid(tip);
      } catch (err) {
        console.error(err);
        alert(err.message);
        fullButtons.forEach((b) => { b.disabled = false; });
      }
    });
  });

  const payments = [];                       
  const list = field('payments');
  const rowTemplate = document.getElementById('tpl-payment-row');
  const amountInput = field('split-amount');
  const splitTip = makeTip('split', () => Math.min(toCents(amountInput.value), totalCents - received()));
  const modeFull = field('mode-full');

  const received = () => baseReceived + payments.reduce((sum, p) => sum + p.amountCents, 0);
  const tips = () => baseTips + payments.reduce((sum, p) => sum + p.tipCents, 0);
  const left = () => Math.max(totalCents - received(), 0);

  if (baseReceived > 0) document.getElementById('mode-split').checked = true;

  const updateEntry = () => {
    const amount = toCents(amountInput.value);
    const extra = amount - left();
    fields('split-btn-amount').forEach((el) => { el.textContent = money(amount + splitTip.cents()); });
    splitTip.refresh();
    root.querySelectorAll('[data-action="pay-split"]').forEach((btn) => { btn.disabled = amount === 0; });

    const note = field('overpay');
    note.hidden = extra <= 0;
    if (extra > 0) {
      note.textContent = `Sobran ${money(extra)}: con Efectivo es cambio; con Tarjeta se suma a la propina.`;
    }
  };

  const render = () => {
    field('received').textContent = money(received());
    field('left').textContent = money(left());
    field('tips').textContent = money(tips());
    root.dataset.state = left() === 0 ? 'covered' : 'open';
    modeFull.disabled = payments.length > 0 || baseReceived > 0;

    if (left() > 0) {
      amountInput.value = (left() / 100).toFixed(2);
      splitTip.reset();
    }
    updateEntry();
  };

  const splitButtons = root.querySelectorAll('[data-action="pay-split"]');

  const addPayment = async (method) => {
    let amount = toCents(amountInput.value);
    let tip = splitTip.cents();
    if (amount === 0) return;

    let change = 0;
    if (amount > left()) {
      const extra = amount - left();
      amount = left();
      if (method === 'tarjeta') tip += extra;
      else change = extra;
    }
    if (amount === 0) return;

    splitButtons.forEach((b) => { b.disabled = true; });
    try {
      await postPayment(method, amount, tip);
    } catch (err) {
      console.error(err);
      alert(err.message);
      updateEntry();
      return;
    }

    payments.push({ method, amountCents: amount, tipCents: tip });

    const row = rowTemplate.content.firstElementChild.cloneNode(true);
    row.dataset.method = method;
    row.dataset.amountCents = amount;
    row.dataset.tipCents = tip;
    row.querySelector('[data-field="num"]').textContent = payments.length;
    row.querySelector('[data-field="tip"]').textContent = tip ? money(tip) : '—';
    row.querySelector('[data-field="amount"]').textContent = money(amount);
    list.append(row);
    row.scrollIntoView({ block: 'nearest' });

    const changeNote = field('change-note');
    changeNote.hidden = change === 0;
    if (change) changeNote.textContent = `Entrega ${money(change)} de cambio.`;

    render();

    const label = method === 'tarjeta' ? 'Tarjeta' : 'Efectivo';
    field('announce').textContent =
      `Pago ${payments.length}: ${label} ${money(amount)}. ` +
      (change ? `Cambio ${money(change)}. ` : '') +
      (left() ? `Falta ${money(left())}.` : 'Pedido cubierto.');

    if (left() > 0) amountInput.select();
    else root.querySelector('[data-action="close-order"]').focus();
  };

  splitButtons.forEach((btn) => {
    btn.addEventListener('click', () => addPayment(btn.dataset.method));
  });
  amountInput.addEventListener('input', updateEntry);
  splitTip.group.addEventListener('change', splitTip.focusOther);
  splitTip.group.addEventListener('input', updateEntry);

  const closeBtn = root.querySelector('[data-action="close-order"]');
  closeBtn.addEventListener('click', async () => {
    closeBtn.disabled = true;
    try {
      await postJSON(`/orders/${order.order_id}/close`);
      showPaid(tips());
    } catch (err) {
      console.error(err);
      alert(err.message);
      closeBtn.disabled = false;
    }
  });

  render();
})();