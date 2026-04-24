import { renderNav, updateHeader } from "./common.js";
import { cartTotals, formatCurrency, loadCart, removeFromCart, updateCartQuantity } from "./demo-state.js";

function parseVariant(value = "") {
  const [size = "-", color = "-"] = value.split("/");
  return { size, color };
}

function renderCart() {
  const cartItemsRoot = document.getElementById("cart-items");
  const subtotalEl = document.getElementById("subtotal");
  const checkoutButton = document.getElementById("checkout-button");

  if (!cartItemsRoot || !subtotalEl || !checkoutButton) {
    return;
  }

  const items = loadCart();

  if (items.length === 0) {
    cartItemsRoot.innerHTML = `
      <div class="rounded-[32px] border border-white/10 bg-[#0d0d0d] p-12 text-center shadow-[0_18px_60px_rgba(0,0,0,0.35)]">
        <h2 class="text-2xl font-serif text-white">Your cart is empty</h2>
        <p class="mt-3 text-sm text-gray-400">Looks like you have not added any drop items yet.</p>
        <a href="product-listing.html" class="mt-6 inline-flex rounded-full bg-[#D4AF37] px-6 py-3 text-sm font-bold uppercase tracking-widest text-black transition hover:bg-[#F2CA50]">
          Continue Shopping
        </a>
      </div>
    `;

    subtotalEl.textContent = formatCurrency(0);
    checkoutButton.classList.add("pointer-events-none", "opacity-40");
    return;
  }

  checkoutButton.classList.remove("pointer-events-none", "opacity-40");

  cartItemsRoot.innerHTML = items
    .map((item) => {
      const { size, color } = parseVariant(item.variant);
      return `
        <article class="group rounded-[32px] border border-white/10 bg-[#0d0d0d] p-6 shadow-[0_18px_60px_rgba(0,0,0,0.35)] transition-all hover:border-[#D4AF37]/40">
          <div class="flex flex-col gap-6 sm:flex-row">
            <div class="h-28 w-24 overflow-hidden rounded-2xl border border-white/10 bg-black sm:h-32 sm:w-28">
              <img src="${item.image || "LOGO.png"}" alt="${item.name}" class="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
            </div>

            <div class="flex flex-1 flex-col">
              <div class="flex items-start justify-between gap-4">
                <div>
                  <p class="text-xs uppercase tracking-[0.24em] text-[#D4AF37]">${color}</p>
                  <h3 class="mt-1 text-lg font-semibold text-white">${item.name}</h3>
                  <p class="mt-2 text-xs uppercase tracking-[0.18em] text-gray-400">Size ${size}</p>
                </div>
                <button type="button" data-remove-slug="${item.slug}" data-remove-variant="${item.variant}" class="rounded-full p-2 text-gray-500 transition hover:bg-white/5 hover:text-red-400" aria-label="Remove item">
                  <span class="material-symbols-outlined text-[20px]">delete</span>
                </button>
              </div>

              <div class="mt-6 flex items-center justify-between">
                <div class="flex h-11 items-center rounded-full border border-gray-700 bg-black px-2">
                  <button type="button" data-qty-slug="${item.slug}" data-qty-variant="${item.variant}" data-qty-delta="-1" class="h-8 w-8 text-gray-400 transition hover:text-[#D4AF37]">-</button>
                  <span class="w-8 text-center text-sm font-semibold text-white">${item.quantity}</span>
                  <button type="button" data-qty-slug="${item.slug}" data-qty-variant="${item.variant}" data-qty-delta="1" class="h-8 w-8 text-gray-400 transition hover:text-[#D4AF37]">+</button>
                </div>
                <p class="text-lg font-semibold text-white">${formatCurrency(item.price * item.quantity)}</p>
              </div>
            </div>
          </div>
        </article>
      `;
    })
    .join("");

  subtotalEl.textContent = formatCurrency(cartTotals(items).subtotal);
}

function bindCartEvents() {
  const cartItemsRoot = document.getElementById("cart-items");
  if (!cartItemsRoot) {
    return;
  }

  cartItemsRoot.addEventListener("click", (event) => {
    const removeButton = event.target.closest("[data-remove-slug]");
    if (removeButton) {
      removeFromCart(removeButton.dataset.removeSlug, removeButton.dataset.removeVariant);
      renderCart();
      updateHeader();
      return;
    }

    const qtyButton = event.target.closest("[data-qty-slug]");
    if (!qtyButton) {
      return;
    }

    const slug = qtyButton.dataset.qtySlug;
    const variant = qtyButton.dataset.qtyVariant;
    const delta = Number(qtyButton.dataset.qtyDelta || 0);
    const item = loadCart().find((entry) => entry.slug === slug && entry.variant === variant);

    if (!item) {
      return;
    }

    updateCartQuantity(slug, variant, item.quantity + delta);
    renderCart();
    updateHeader();
  });
}

function initCart() {
  renderNav({ activePath: "product-listing.html", mode: "shopping" });
  bindCartEvents();
  renderCart();
  updateHeader();
}

document.addEventListener("DOMContentLoaded", initCart);
