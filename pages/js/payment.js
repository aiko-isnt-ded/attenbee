/* Cobro (payment.html)
   - Pago completo: one tap pays the whole order (+ optional tip) and closes it.
   - Dividir cuenta: each person's payment is added to the list until nothing is left.
   Reads and writes data- attributes only. Money is always in cents. */

(() => {
  const root = document.querySelector('[data-payment]');
  if (!root) return;

  const totalCents = Number(root.dataset.totalCents);
  const field = (name) => root.querySelector(`[data-field="${name}"]`);
  const fields = (name) => root.querySelectorAll(`[data-field="${name}"]`);

  // "$1,234.50"
  const money = (cents) =>
    '$' + (cents / 100).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  // "50", "50.5", "50,50" -> cents. Anything else -> 0
  const toCents = (text) => {
    const n = Number(String(text).trim().replace(',', '.'));
    return Number.isFinite(n) && n > 0 ? Math.round(n * 100) : 0;
  };

  /* ---------- TIP: Sin propina / 10% / 15% / Otra ---------- */
  // base() = the amount the % is taken from. Returns the tip in cents.
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
      // Chip labels follow the base: "10% · $23.00"
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

  /* ---------- PEDIDO PAGADO (pop-up) ---------- */
  const paidModal = document.querySelector('[data-paid-modal]');
  // No backend yet. This is where the order would be saved:
  // status = closed, close_time = now, pre_total = totalCents,
  // total_income = sum of amounts + tips, payments = [{ method, amount, tip }]
  const closeOrder = (tipCents) => {
    paidModal.querySelector('[data-field="paid-tips"]').textContent = money(tipCents);
    paidModal.querySelector('[data-field="paid-total"]').textContent = money(totalCents + tipCents);
    paidModal.showModal();
  };
  // Esc also leaves: the order is already paid
  paidModal.addEventListener('close', () => { window.location.href = 'orders.html'; });

  /* ---------- PAGO COMPLETO ---------- */
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

  root.querySelectorAll('[data-action="pay-full"]').forEach((btn) => {
    btn.addEventListener('click', () => closeOrder(fullTip.cents()));
  });

  /* ---------- DIVIDIR CUENTA ---------- */
  const payments = [];                       // { method, amountCents, tipCents }
  const list = field('payments');
  const rowTemplate = document.getElementById('tpl-payment-row');
  const amountInput = field('split-amount');
  // % is taken from what this person pays (never more than what's left)
  const splitTip = makeTip('split', () => Math.min(toCents(amountInput.value), totalCents - received()));
  const modeFull = field('mode-full');

  const received = () => payments.reduce((sum, p) => sum + p.amountCents, 0);
  const tips = () => payments.reduce((sum, p) => sum + p.tipCents, 0);
  const left = () => Math.max(totalCents - received(), 0);

  // Button labels and the "pay more than what's left" note follow what's typed
  const updateEntry = () => {
    const amount = toCents(amountInput.value);
    const extra = amount - left();
    // What gets charged now: this person's amount + their tip
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
    modeFull.disabled = payments.length > 0;   // no going back to "Pago completo"

    if (left() > 0) {
      amountInput.value = (left() / 100).toFixed(2);
      splitTip.reset();
    }
    updateEntry();
  };

  const addPayment = (method) => {
    let amount = toCents(amountInput.value);
    let tip = splitTip.cents();
    if (amount === 0) return;

    // Paid more than what's left: card -> the rest is tip; cash -> the rest is change
    let change = 0;
    if (amount > left()) {
      const extra = amount - left();
      amount = left();
      if (method === 'tarjeta') tip += extra;
      else change = extra;
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

  root.querySelectorAll('[data-action="pay-split"]').forEach((btn) => {
    btn.addEventListener('click', () => addPayment(btn.dataset.method));
  });
  amountInput.addEventListener('input', updateEntry);
  splitTip.group.addEventListener('change', splitTip.focusOther);
splitTip.group.addEventListener('input', updateEntry);
  root.querySelector('[data-action="close-order"]').addEventListener('click', () => closeOrder(tips()));

  render();
})();