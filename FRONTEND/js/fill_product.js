/* ==========================================================================
   ATTENBEE – fill_product.js
   Used by add_product.html AND add_bakery.html.
   Reads the address (?product=…&name=…&price=…) and fills the page.
   Opened without an address (e.g. straight from the editor), the page keeps
   its sample product, so you can still style it.
   ========================================================================== */

const params = new URLSearchParams(window.location.search);
const productId = params.get('product');

if (productId) {
  const name = params.get('name');
  const temp = params.get('temp');                    // "hot", "cold" or nothing
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

  // Prices: drinks say "desde $X", panadería just "$X"
    fill('base-price', 'desde ' + price);

  // Options for one product only, e.g. "Con leche" → data-only-for="smoothie"
  document.querySelectorAll('[data-only-for]').forEach((el) => {
    el.toggleAttribute('hidden', el.dataset.onlyFor !== productId);
  });
}
