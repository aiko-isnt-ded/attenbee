/* ==========================================================================
   Fills add_beverage.html template with data from each drink card (Café & Té)
   
   Product details can be seen in the URL:
     add_beverage.html?product=smoothie&name=Smoothie&price=6000

   Product details come from each card's 'data-labels'. As of right now,
   these details come from the HTML. Eventually, they should come from the DB
   ========================================================================== */

// Allow to return back to orders.html if you accessed add_beverage.html from there
const order = new URLSearchParams(window.location.search).get('order');
if (order) {
  document.querySelector('[data-action="back"]').href = 'orders.html';
  document.querySelector('[data-field="back-label"]').textContent = 'Pedidos';
}

document.querySelectorAll('[data-action="add-product"]').forEach((card) => {
  const data = card.dataset;

  // The visible name is the first piece of text in the card title
  // (this skips the hidden "Caliente"/"Frío" text that follows the icon).
  const name = card.querySelector('.product-card__name').firstChild.textContent.trim();

  const params = new URLSearchParams({
    product: data.productId,
    name: name,
    price: data.priceCents,
    category: data.category,
  });
  if (data.temp) params.set('temp', data.temp);    // drinks with a fixed temperature
  if (order) params.set('order', order);

  card.href = 'add_beverage.html?' + params.toString();
});