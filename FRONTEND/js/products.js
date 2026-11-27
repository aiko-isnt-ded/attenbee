const CATEGORY_NAMES = {cafe: "Café", te: "Té", panaderia: "Panadería", otros: "Otros"};

async function loadProduct()
{
  try
  {
    const response = await fetch('http://localhost:3000/products/');
    const result = await response.json();

    if (result.success)
    {
      const tbody = document.querySelector('[data-products]');
      tbody.innerHTML = '';

      result.data.forEach(product =>
      {
        addProductRow(product);
      })
    }
  } catch (err)
  {
    console.error("Error cargando productos", err.message);
  }
}

function addProductRow(product)
{
  const template = document.getElementById('tpl-product-row');
  const row = template.content.firstElementChild.cloneNode(true);
  const slot = (fieldName) => row.querySelector('[data-field="' + fieldName + '"]');

  row.dataset.productId = product.product_id;
  row.dataset.category = product.category;
  row.dataset.priceCents = String(product.price);

  if (product.total_units !== null && product.total_units !== undefined)
  {
    row.dataset.stock = product.total_units;
    slot('stock').textContent = product.total_units;
    const unit = document.createElement('span');
    unit.className = 'product-table__unit';
    unit.textContent = ' disponibles';
    slot('stock').append(unit);
  }

  row.dataset.name = product.product_name;
  if (product.temperature) row.dataset.temperature = product.temperature;
  slot('name').innerHTML = productNameHTML(product.product_name, product.temperature);
  slot('category').textContent = CATEGORY_NAMES[product.category] || product.category;
  slot('price').textContent = '$' + (product.price / 100).toFixed(2);

  row.querySelectorAll('[data-field="label"]').forEach((elem) =>
  {
    elem.textContent = ' ' + product.product_name;
  });

  if (product.image)
  {
    const img = document.createElement('img');
    img.className = 'product-table__photo';
    img.alt = '';
    img.src = product.image;
    slot('image').replaceWith(img);
  }

  document.querySelector('[data-products]').append(row);
}

document.addEventListener('DOMContentLoaded', loadProduct);

/* ==========================================================================
   Fill the edit panel with a product data when clicking "Editar".
   Only reads and loads data
   ========================================================================== */
const form = document.querySelector('[data-product-form]');
const field = (name) => form.querySelector('[data-field="' + name + '"]');

function fillPanel(row) {
  const data = row.dataset;
  const fullName = data.name;
  const tempWord = TEMP_WORDS[data.temperature];

  field('title').textContent = 'Editar: ' + (tempWord ? fullName + ' ' + tempWord : fullName);
  field('product-id').value = data.productId;
  field('name').value = fullName;
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

const editForm = document.querySelector('[data-product-form]');

editForm.addEventListener('submit', async (e) =>
{
  e.preventDefault();

  const product_id = field('product-id').value;
  const name = field('name').value.trim();
  const price_cents = Math.round(Number(field('price').value) * 100);
  const stock_field = field('stock');
  const total_units = stock_field && !stock_field.closest('.field').hidden ? Number(stock_field.value) : null;

  if (!name)
  {
    alert("El nombre no puede ser vacío");
    return;
  }

  if (isNaN(price_cents) || price_cents < 0)
  {
    alert("El precio no puede ser negativo!");
    return;
  }

  if (total_units !== null && total_units < 0)
  {
    alert("las existencias no pueden ser menores a cero");
    return;
  }

  try
  {
    const response = await fetch(`http://localhost:3000/products/${product_id}`,
    {
      method: "PUT",
      headers: {'Content-Type': "application/json"},
      body: JSON.stringify({product_name: name, price: price_cents, total_units: total_units})
    });

    const result = await response.json();

    if (result.success)
    {
      const row = document.querySelector(`[data-product-id="${product_id}"]`);
      if (row)
      {
        row.dataset.priceCents = String(price_cents);

        row.dataset.name = name;
        row.querySelector('[data-field="name"]').innerHTML = productNameHTML(name, row.dataset.temperature);

        row.querySelector('[data-field="price"]').textContent = "$" + (price_cents / 100).toFixed(2);

        if (total_units !== null)
        {
          row.dataset.stock = total_units;
          const stock_cell = row.querySelector('[data-field="stock"]');
          if (stock_cell)
          {
            stock_cell.firstChild.textContent = total_units;
          }
        }
      }

      alert("Producto actualizado exitosamente");
    } else
    {
      alert(result.message || "Error al actualizar producto");
    }
  } catch (err)
  {
    alert("Error de conexión con el servidor");
  }
})

const modal = document.querySelector('[data-new-product-modal]');
const new_form = document.querySelector('[data-new-product-form]');

function updateNewFormFields()
{
  let category = new_form.elements.category.value;
  let needs_stock = category === 'panaderia' || category === "otros";

  new_form.querySelectorAll('[data-when-stock]').forEach((elem) =>
  {
    elem.hidden = !needs_stock;
    elem.querySelectorAll('input').forEach((input) =>
    {
      input.disabled = !needs_stock;
    });
  });

  new_form.querySelectorAll('[data-when-drink]').forEach((elem) =>
  {
    elem.hidden = needs_stock;
    elem.querySelectorAll('input').forEach((input) =>
    {
      input.disabled = needs_stock;
    });
  });
}

modal.addEventListener('close', () =>
{
  new_form.reset();
  new_form.querySelector('[data-field="image-name"]').textContent = "Opcional";
  updateNewFormFields();
});

document.querySelector('[data-action="new-product"]').addEventListener('click', () =>
{
  updateNewFormFields();
  modal.showModal();
});

modal.querySelector('[data-action="cancel-new-product"]').addEventListener('click', () => modal.close());

new_form.elements.category.forEach((radio) => radio.addEventListener('change', updateNewFormFields));

modal.querySelector('[data-field="image-input"]').addEventListener('change', (e) =>
{
  let file = e.target.files[0];
  new_form.querySelector('[data-field="image-name"]').textContent = file ? file.name : 'Opcional.';
});

new_form.addEventListener('submit', async (e) =>
{
  e.preventDefault();

  const form_data = new FormData(new_form);
  const name = form_data.get('product_name').trim();
  const category = form_data.get('category');
  const price_cents = Math.round(Number(form_data.get('price')) * 100);
  const total_units = (category === 'panaderia' || category === "otros") ? Number(form_data.get('total_units')) : null;
  const temperature = (category === 'cafe' || category === 'te') ? (form_data.get('temperature') || null) : null;

  if (!name)
  {
    alert("El nombre es obligatorio");
    return;
  }

  if (isNaN(price_cents) || price_cents < 0)
  {
    alert("El precio no puede ser negativo");
    return;
  }

  try
  {
    const response = await fetch('http://localhost:3000/products', 
    {
      method: "POST",
      headers: {"Content-Type": 'application/json'},
      body: JSON.stringify
      ({
        product_name: name,
        category: category,
        price: price_cents,
        total_units: total_units,
        temperature: temperature,
        image: '../../assets/colmena_logo.png'
      })
    });

    const result = await response.json();

    if (result.success)
    {
      addProductRow(result.data);
      modal.close();

      document.getElementById('filter-all').checked = true;
      const row = document.querySelector(`[data-product-id="${result.data.product_id}"]`);
      if (row) fillPanel(row);

      alert("Producto creado exitosamente");
    } else
    {
      alert(result.message || "Error al crear producto");
    }
  } catch (err)
  {
    alert("Error de conexión en el servidor", err.message);
    console.error(err.message);
  }
})

let id_to_delete = null;

document.addEventListener('click', (e) =>
{
  const delete_button = e.target.closest('[data-action="delete-product"]');

  if (!delete_button) return;

  const row = delete_button.closest('[data-product-id]');
  if (row)
  {
    id_to_delete = row.dataset.productId;

    const product_name = row.querySelector('[data-field="name"]').textContent.trim();
    const modal_title_span = document.querySelector('#delete-modal [data-field="product-name"]');

    if (modal_title_span)
    {
      modal_title_span.textContent = product_name;
    }
  }
});

const confirm_delete_button = document.querySelector('[data-action="confirm-delete"]');
if (confirm_delete_button)
{
  confirm_delete_button.addEventListener('click', async () =>
  {
    if (!id_to_delete) return;

    try
    {
      const response = await fetch(`http://localhost:3000/products/${id_to_delete}`, {method: "DELETE"});

      const result = await response.json();

      if (result.success)
      {
        const row = document.querySelector(`[data-product-id="${id_to_delete}"]`);
        if (row)
        {
          row.remove();
        }

        const active_form_id = field('product-id').value;
        if (active_form_id === id_to_delete)
        {
          form.reset();
          form.querySelectorAll('[data-when-filled]').forEach((elem) => {elem.hidden = true; });
          form.querySelectorAll('[data-when-empty]').forEach((elem) => {elem.hidden = false; });
        }

        id_to_delete = null;
        alert("Producto eliminado exitosamente!");
      }
    } catch (err)
    {
      console.error(err.message);
      alert("Error de conexión con el servidor", err.message);
    }
  })
}

const stockInput = field('stock');
form.querySelector('[data-action="qty-decrease"]').addEventListener('click', () => {
  stockInput.value = Math.max(0, Number(stockInput.value) - 1);
});
form.querySelector('[data-action="qty-increase"]').addEventListener('click', () => {
  stockInput.value = Number(stockInput.value) + 1;
});