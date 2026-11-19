(() => {
  const API = 'http://localhost:3000';

  const dayRange = () => {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(end.getDate() + 1);
    const prev = new Date(start);
    prev.setDate(prev.getDate() - 1);
    return { from: start.toISOString(), to: end.toISOString(), prev_from: prev.toISOString() };
  };

  const loadSummary = async () => {
    const res = await fetch(`${API}/orders/summary?${new URLSearchParams(dayRange())}`);
    const result = await res.json();
    if (!result.success) throw new Error(result.message);
    return result.data;
  };

  document.addEventListener('DOMContentLoaded', async () => {
    const counter = document.querySelector('[data-field="active_orders"]');
    try {
      const s = await loadSummary();
      if (counter) counter.textContent = s.open_orders.length;
    } catch (err) {
      console.error(err);
    }

    const closeLink = document.querySelector('a[href="close_register.html"]');
    closeLink.addEventListener('click', async (e) => {
      e.preventDefault();
      try {
        const s = await loadSummary();
        if (s.open_orders.length > 0) {
          alert(`Hay pedidos sin cobrar (${s.open_orders.map(id => '#' + id).join(', ')}). Cóbralos antes de cerrar caja.`);
          return;
        }
        window.location.href = 'close_register.html';
      } catch (err) {
        console.error(err);
        alert('No se pudo verificar los pedidos abiertos.');
      }
    });
  });
})();