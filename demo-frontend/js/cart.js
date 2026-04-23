import { loadCart, removeFromCart, updateCartQuantity, cartTotals, formatCurrency } from './demo-state.js';

const cartItemsContainer = document.getElementById('cart-items');
const subtotalElement = document.getElementById('subtotal');
const checkoutButton = document.getElementById('checkout-button');

function renderCart() {
  const cart = loadCart();
  const totals = cartTotals(cart);
  subtotalElement.textContent = formatCurrency(totals.subtotal);

  if (!cartItemsContainer) return;
  if (cart.length === 0) {
    cartItemsContainer.innerHTML = '<div class="rounded-[28px] bg-[#0d0d0d] p-12 text-center text-slate-300">Your cart is empty. Browse <a class="text-saga underline" href="product-listing.html">products</a> to add items.</div>';
    checkoutButton.classList.add('pointer-events-none', 'opacity-50');
    return;
  }

  checkoutButton.classList.remove('pointer-events-none', 'opacity-50');
  cartItemsContainer.innerHTML = cart.map((item) => `
    <div class="rounded-[32px] bg-[#0b0b0b] p-6 shadow-[0_18px_60px_rgba(0,0,0,0.35)]">
      <div class="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div class="flex items-center gap-4">
          <img class="h-28 w-28 rounded-3xl object-cover" src="${item.image}" alt="${item.name}" />
          <div>
            <p class="text-sm uppercase tracking-[0.35em] text-slate-400">${item.variant}</p>
            <h3 class="text-xl font-semibold text-white">${item.name}</h3>
            <p class="mt-2 text-sm text-slate-300">${formatCurrency(item.price)}</p>
          </div>
        </div>
        <div class="flex flex-col gap-4 text-right">
          <div class="flex items-center justify-end gap-2 text-sm text-slate-300">
            <button data-slug="${item.slug}" data-variant="${item.variant}" class="decrease rounded-full border border-white/10 px-3 py-2 transition hover:border-saga">-</button>
            <span class="w-10 text-center text-white">${item.quantity}</span>
            <button data-slug="${item.slug}" data-variant="${item.variant}" class="increase rounded-full border border-white/10 px-3 py-2 transition hover:border-saga">+</button>
          </div>
          <button data-slug="${item.slug}" data-variant="${item.variant}" class="remove inline-flex rounded-full border border-red-500/20 px-4 py-2 text-sm uppercase tracking-[0.35em] text-red-200 transition hover:bg-red-500/10">Remove</button>
        </div>
      </div>
    </div>
  `).join('');

  document.querySelectorAll('.decrease').forEach((button) => {
    button.addEventListener('click', () => {
      const slug = button.dataset.slug;
      const variant = button.dataset.variant;
      const item = cart.find((entry) => entry.slug === slug && entry.variant === variant);
      if (!item) return;
      updateCartQuantity(slug, variant, Math.max(1, item.quantity - 1));
      renderCart();
    });
  });

  document.querySelectorAll('.increase').forEach((button) => {
    button.addEventListener('click', () => {
      const slug = button.dataset.slug;
      const variant = button.dataset.variant;
      const item = cart.find((entry) => entry.slug === slug && entry.variant === variant);
      if (!item) return;
      updateCartQuantity(slug, variant, item.quantity + 1);
      renderCart();
    });
  });

  document.querySelectorAll('.remove').forEach((button) => {
    button.addEventListener('click', () => {
      const slug = button.dataset.slug;
      const variant = button.dataset.variant;
      removeFromCart(slug, variant);
      renderCart();
    });
  });
}

renderCart();
