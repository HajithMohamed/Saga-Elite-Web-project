import { getProductBySlug, getGiftTier } from './demo-data.js';
import { addToCart, loadCart, cartTotals, formatCurrency } from './demo-state.js';

const detailsContainer = document.getElementById('product-details');
const params = new URLSearchParams(window.location.search);
const slug = params.get('slug');
const product = getProductBySlug(slug);

if (!product) {
  if (detailsContainer) {
    detailsContainer.innerHTML = '<div class="rounded-3xl bg-[#100f10] p-10 text-center text-slate-300">Product not found. Return to <a class="text-saga underline" href="product-listing.html">shop</a>.</div>';
  }
} else {
  const giftTier = getGiftTier(product.price);
  detailsContainer.innerHTML = `
    <div class="rounded-[28px] bg-[#111111] p-6">
      <img class="h-full w-full rounded-3xl object-cover" src="${product.image}" alt="${product.name}" />
    </div>
    <div class="space-y-6">
      <div class="space-y-3">
        <p class="text-sm uppercase tracking-[0.35em] text-slate-400">${product.category}</p>
        <h2 class="text-4xl font-serif font-semibold text-white">${product.name}</h2>
        <p class="text-sm leading-7 text-slate-300">${product.description}</p>
      </div>
      <div class="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-center">
        <div class="rounded-full bg-surface px-4 py-3 text-sm uppercase tracking-[0.35em] text-slate-300">Gift Tier: ${giftTier}</div>
        <span class="text-4xl font-semibold text-saga">${formatCurrency(product.price)}</span>
      </div>
      <div class="space-y-4 rounded-[28px] bg-[#090909] p-6">
        <div>
          <label class="mb-2 block text-sm uppercase tracking-[0.35em] text-slate-400">Variant</label>
          <select id="variant-select" class="w-full rounded-3xl border border-white/10 bg-[#111111] px-4 py-3 text-sm text-on outline-none focus:border-saga">
            ${product.variants.map((variant) => `<option value="${variant.value}">${variant.label} (${variant.stock} left)</option>`).join('')}
          </select>
        </div>
        <div>
          <label class="mb-2 block text-sm uppercase tracking-[0.35em] text-slate-400">Quantity</label>
          <input id="quantity-input" type="number" min="1" value="1" class="w-full rounded-3xl border border-white/10 bg-[#111111] px-4 py-3 text-sm text-on outline-none focus:border-saga" />
        </div>
        <button id="add-to-cart" class="w-full rounded-full bg-saga px-6 py-4 text-sm font-semibold uppercase text-black transition hover:bg-[#ffe088]">Add to cart</button>
        <div class="rounded-3xl bg-[#131313] p-4 text-sm text-slate-300">
          <p>Payment methods supported in demo mode:</p>
          <ul class="mt-3 list-disc space-y-2 pl-5 text-slate-400">
            <li>Online payment simulation</li>
            <li>Manual bank payment with receipt upload</li>
          </ul>
        </div>
      </div>
      <div class="rounded-[28px] bg-[#0d0d0d] p-5 text-sm leading-7 text-slate-300">
        <p class="font-semibold text-white">Why this product?</p>
        <p class="mt-3">This product demonstrates the Saga Elite sale experience with limited quantity availability, premium storytelling, and gift tier reward preview.</p>
      </div>
    </div>
  `;

  document.getElementById('add-to-cart')?.addEventListener('click', () => {
    const variantSelect = document.getElementById('variant-select');
    const quantityInput = document.getElementById('quantity-input');
    const variant = variantSelect?.value || product.variants[0].value;
    const quantity = Number(quantityInput?.value) || 1;
    addToCart(product, variant, quantity);
    const button = document.getElementById('add-to-cart');
    if (button) {
      button.textContent = 'Added';
      setTimeout(() => { button.textContent = 'Add to cart'; }, 900);
    }
  });
}
