

(async () => {
  const API = 'http://localhost:3000';
  const money = (cents) =>
    '$' + (cents / 100).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const parse = (text) => {
    const t = String(text).trim().replace(',', '.');
    if (t === '') return null;
    const n = Number(t);
    return Number.isFinite(n) && n >= 0 ? Math.round(n * 100) : null;
  };

  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  const prev = new Date(start);
  prev.setDate(prev.getDate() - 1);
  const query = new URLSearchParams({ from: start.toISOString(), to: end.toISOString(), prev_from: prev.toISOString() });

  let s;
  try {
    const res = await fetch(`${API}/orders/summary?${query}`);
    const result = await res.json();
    if (!result.success) throw new Error(result.message);
    s = result.data;
  } catch (err) {
    console.error(err);
    alert('No se pudo cargar el corte de caja.');
    window.location.href = 'main.html';
    return;
  }

  if (s.open_orders.length > 0) {
    alert(`Hay pedidos sin cobrar (${s.open_orders.map(id => '#' + id).join(', ')}). Cóbralos antes de cerrar caja.`);
    window.location.href = 'main.html';
    return;
  }

  const byMethod = { efectivo: s.cash, tarjeta: s.card };

  document.querySelectorAll('.close-row').forEach((row) => {
    const data = byMethod[row.dataset.method];
    const expected = data.pay + data.tip;
    const input = row.querySelector('[data-field="counted"]');
    const diffEl = row.querySelector('[data-field="diff"]');
    const amountEl = row.querySelector('[data-field="diff-amount"]');
    const tagEl = row.querySelector('[data-field="diff-tag"]');

    row.querySelector('[data-field="expected"]').innerHTML =
      `${money(data.pay)} <span class="close-table__tip">+ ${money(data.tip)}</span>`;

    const update = () => {
      const counted = parse(input.value);
      if (counted === null) {
        diffEl.dataset.state = 'pending';
        amountEl.textContent = '—';
        tagEl.hidden = true;
        return;
      }
      const diff = counted - expected;
      const state = diff < 0 ? 'short' : diff === 0 ? 'exact' : 'over';
      const sign = diff < 0 ? '−' : diff > 0 ? '+' : '';
      const tag = {
        short: { icon: '#icon-alert', word: 'Falta' },
        exact: { icon: '#icon-check', word: 'Exacto' },
        over:  { icon: '#icon-up',    word: 'Sobra' }
      }[state];

      diffEl.dataset.state = state;
      diffEl.dataset.diffCents = diff;
      amountEl.innerHTML = `<span class="diff__sign">${sign}</span>${money(Math.abs(diff))}`;
      tagEl.innerHTML = `<svg class="icon icon--sm" aria-hidden="true" focusable="false"><use href="${tag.icon}"></use></svg>${tag.word}`;
      tagEl.hidden = false;
    };

    input.addEventListener('input', update);
    update();
  });

  const total = s.cash.pay + s.cash.tip + s.card.pay + s.card.tip;
  const change = total - s.yesterday_total;

  document.querySelector('[data-field="total"]').textContent = money(total);
  document.querySelector('[data-field="yesterday"]').textContent = `Ayer: ${money(s.yesterday_total)}`;

  const compare = document.querySelector('[data-field="compare"]');
  compare.dataset.state = change >= 0 ? 'up' : 'down';
  compare.querySelector('[data-field="compare-icon"]').setAttribute('href', change >= 0 ? '#icon-up' : '#icon-down');
  compare.querySelector('[data-field="compare-text"]').textContent =
    change > 0 ? `${money(change)} más que ayer`
    : change < 0 ? `${money(-change)} menos que ayer`
    : 'Igual que ayer';

  document.querySelector('[data-action="confirm-close"]').addEventListener('click', (e) => {
    e.preventDefault();
    try {
      localStorage.removeItem('isAuth');
      sessionStorage.removeItem('activeOrderId');
    } catch (err) { console.error(err); }
    window.location.href = 'login.html';
  });
})();