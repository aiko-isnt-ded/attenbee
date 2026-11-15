/* ==========================================================================
   Used by add_beverage.html
   
   Reads the address (?product=…&name=…&price=…) that was filled with 
   new_order.js and fills the product data. This should come from the DB & API
   in future versions.
   ========================================================================== */

const params = new URLSearchParams(window.location.search);
const productId = params.get('product');

if (productId) {
  const name = params.get('name');
  // Get hot, cold or nothing
  const temp = params.get('temp');                    
  const price = '$' + (Number(params.get('price')) / 100).toFixed(2);

  // Fill one or more [data-field="…"] slots with text
  const fill = (field, text) => {
    document.querySelectorAll(`[data-field="${field}"]`).forEach((el) => {
      el.textContent = text;
    });
  };

  document.querySelector('[data-field="product-id"]').value = productId;

  // Name + temperature: "Capuchino Caliente", "Capuchino Frío", or just "Chai"
  const tempWord = { hot: 'Caliente', cold: 'Frío' }[temp];
  fill('product-name', tempWord ? `${name} ${tempWord}` : name);

  const icon = document.querySelector('[data-field="temp-icon"]');
  if (icon) {
    if (tempWord) icon.querySelector('use').setAttribute('href', temp === 'hot' ? '#icon-hot' : '#icon-cold');
    icon.toggleAttribute('hidden', !tempWord);   // SVG icons need the attribute itself
  }

  fill('base-price', price);

  // Back and Cancelar return to the product's category
  const category = params.get('category');
  if (category) {
    document.querySelectorAll('[data-action="back"], [data-action="cancel"]').forEach((link) => {
      link.href = 'new_order.html#' + encodeURIComponent(category);
    });
  }

  // Options for one product only, e.g. "Con leche" → data-only-for="smoothie"
  document.querySelectorAll('[data-only-for]').forEach((el) => {
    el.toggleAttribute('hidden', el.dataset.onlyFor !== productId);
  });
}
