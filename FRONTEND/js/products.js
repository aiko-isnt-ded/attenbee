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

// "Editar" (also on rows added later with "Nuevo producto")
document.addEventListener('click', (event) => {
  const button = event.target.closest('[data-action="edit-product"]');
  if (!button) return;
  event.preventDefault();
  fillPanel(button.closest('[data-product-id]'));
});


/* NEW PRODUCT MODAL ---------------------------------------------------------
   Opens the dialog, shows Existencias only for Panadería and the options only
   for drinks, and on "Crear producto" adds a row to the table.
   Nothing is saved: the row disappears when the page reloads. */

const modal = document.querySelector('[data-new-product-modal]');
const newForm = modal.querySelector('[data-new-product-form]');
const CATEGORY_NAMES = { cafe: 'Café', te: 'Té', panaderia: 'Panadería' };

function updateNewFormFields() {
  const isBakery = newForm.elements.category.value === 'panaderia';
  // Hidden fields are also disabled, so the browser doesn't ask for them
  newForm.querySelectorAll('[data-when-bakery]').forEach((el) => {
    el.hidden = !isBakery;
    el.querySelectorAll('input').forEach((input) => { input.disabled = !isBakery; });
  });
  newForm.querySelectorAll('[data-when-drink]').forEach((el) => {
    el.hidden = isBakery;
    el.querySelectorAll('input').forEach((input) => { input.disabled = isBakery; });
  });
}

// Clear the form every time the modal closes (Cancelar, Esc or after creating)
modal.addEventListener('close', () => {
  newForm.reset();
  newForm.querySelector('[data-field="image-name"]').textContent = 'Opcional.';
  updateNewFormFields();
});

// A unique id from the name, e.g. "Pan de Elote" -> "pan-de-elote" (the database will use ObjectId)
function makeProductId(name) {
  const base = name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'producto';
  let id = base;
  let n = 2;
  while (document.querySelector('[data-product-id="' + id + '"]')) { id = base + '-' + n; n += 1; }
  return id;
}

function addProductRow(form) {
  const values = new FormData(form);
  const name = values.get('product_name').trim();
  const category = values.get('category');
  const priceCents = Math.round(Number(values.get('price')) * 100);
  const isDrink = category !== 'panaderia';

  const row = document.getElementById('tpl-product-row').content.firstElementChild.cloneNode(true);
  const slot = (fieldName) => row.querySelector('[data-field="' + fieldName + '"]');

  row.dataset.productId = makeProductId(name);
  row.dataset.category = category;
  row.dataset.priceCents = String(priceCents);
  row.dataset.drink = String(isDrink);
  if (isDrink) {
    row.dataset.details = ['N'].concat(values.getAll('details')).join(' ');   // e.g. "N PA PL MI"
  } else {
    const units = values.get('total_units');
    row.dataset.stock = units;
    slot('stock').textContent = units;
    const unit = document.createElement('span');
    unit.className = 'product-table__unit';
    unit.textContent = ' disponibles';
    slot('stock').append(unit);
  }

  slot('name').textContent = name;
  slot('category').textContent = CATEGORY_NAMES[category];
  slot('price').textContent = '$' + (priceCents / 100).toFixed(2);
  row.querySelectorAll('[data-field="label"]').forEach((el) => { el.textContent = ' ' + name; });

  // Show the chosen photo instead of the grey placeholder
  const file = values.get('image');
  if (file && file.size) {
    const img = document.createElement('img');
    img.className = 'product-table__photo';
    img.alt = '';
    img.src = URL.createObjectURL(file);
    slot('image').replaceWith(img);
  }

  document.querySelector('[data-products]').append(row);
  return row;
}

document.querySelector('[data-action="new-product"]').addEventListener('click', () => {
  updateNewFormFields();
  modal.showModal();
});
modal.querySelector('[data-action="cancel-new-product"]').addEventListener('click', () => modal.close());
newForm.elements.category.forEach((radio) => radio.addEventListener('change', updateNewFormFields));
modal.querySelector('[data-field="image-input"]').addEventListener('change', (event) => {
  const file = event.target.files[0];
  newForm.querySelector('[data-field="image-name"]').textContent = file ? file.name : 'Opcional.';
});

newForm.addEventListener('submit', (event) => {
  event.preventDefault();             // the browser already checked required / min
  const row = addProductRow(newForm);
  modal.close();

  // Show the new product: "Todos" filter, scroll to it, open it in the panel
  document.getElementById('filter-all').checked = true;
  fillPanel(row);
  // Big screens: scroll only the table (the page itself never moves)
  const list = row.closest('[role="region"]');
  if (window.matchMedia('(min-width: 901px)').matches) {
    const offset = row.getBoundingClientRect().top - list.getBoundingClientRect().top;
    list.scrollBy({ top: offset - list.clientHeight / 2, behavior: 'smooth' });
  }
});