/* ==========================================================================
   ATTENBEE – new_order.js
   Sends each drink card (Café and Té) to add_beverage.html, carrying the
   product's details in the address:
     add_beverage.html?product=smoothie&name=Smoothie&price=6000
   The details come from the card's data- labels, so adding a drink to the
   HTML is all it takes. No product list to keep in sync.
   Panadería cards are not links: they have their own − and + buttons.
   ========================================================================== */

document.querySelectorAll('[data-action="add-product"]').forEach((card) => {
  const data = card.dataset;

  // The visible name is the first piece of text in the card title
  // (this skips the hidden "Caliente"/"Frío" text that follows the icon).
  const name = card.querySelector('.product-card__name').firstChild.textContent.trim();

  const params = new URLSearchParams({
    product: data.productId,
    name: name,
    price: data.priceCents,
  });
  if (data.temp) params.set('temp', data.temp);    // drinks with a fixed temperature

  card.href = 'add_beverage.html?' + params.toString();
});