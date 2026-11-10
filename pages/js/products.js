/* ==========================================================================
   ATTENBEE – products.js
   Fills the edit panel with a product's data when you tap its "Editar".
   Reads only data- attributes. Nothing is saved yet.
   ========================================================================== */

const form = document.querySelector('[data-product-form]');
const field = (name) => form.querySelector('[data-field="' + name + '"]');

function fillPanel(row) {
  const data = row.dataset;
  const nameCell = row.querySelector('[data-field="name"]');
  const tempCell = nameCell.querySelector('[data-field="temp"]');
  const name = nameCell.firstChild.textContent.trim();          // "Capuchino"
  const fullName = tempCell ? name + ' ' + tempCell.textContent.trim() : name; // "Capuchino Caliente"

  field('title').textContent = 'Editar: ' + fullName;
  field('product-id').value = data.productId;
  field('name').value = name;
  field('category').value = data.category;
  field('price').value = (Number(data.priceCents) / 100).toFixed(2);
  field('product-name').textContent = ' ' + fullName;

  // Existencias: only for products that have stock (Panadería)
  const hasStock = data.stock !== undefined;
  field('stock-field').hidden = !hasStock;
  field('stock').value = hasStock ? data.stock : 0;

  // Show the fields, hide the "Toca Editar…" message
  form.querySelectorAll('[data-when-filled]').forEach((el) => { el.hidden = false; });
  form.querySelectorAll('[data-when-empty]').forEach((el) => { el.hidden = true; });

  // Mark the row being edited
  document.querySelectorAll('[data-product-id][aria-current]').forEach((r) => r.removeAttribute('aria-current'));
  row.setAttribute('aria-current', 'true');

  // Small screens: the panel is under the list, so bring it into view
  if (window.matchMedia('(max-width: 900px)').matches) {
    form.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

document.querySelectorAll('[data-action="edit-product"]').forEach((button) => {
  button.addEventListener('click', (event) => {
    event.preventDefault();
    fillPanel(button.closest('[data-product-id]'));
  });
});