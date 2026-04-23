import { DEMO_PRODUCTS, getProductsByCategory } from './demo-data.js';
import { addToCart, loadCart, cartTotals, formatCurrency } from './demo-state.js';

const grid = document.getElementById('product-grid');
const categoryButtons = document.querySelectorAll('.category-btn');

const queryCategory = new URLSearchParams(window.location.search).get('category') || 'all';
let activeCategory = queryCategory;

function renderProducts(category) {
  const products = getProductsByCategory(category);
  if (!grid) return;
  if (products.length === 0) {
    grid.innerHTML = '<div class="rounded-[28px] bg-[#0d0d0d] p-12 text-center text-slate-300">No products available in this category.</div>';
    return;
  }

  grid.innerHTML = products.map((product) => `
    <article class="group rounded-[32px] border border-white/10 bg-[#0b0b0b] p-6 transition hover:-translate-y-1 hover:border-saga/30 hover:bg-[#121212]">
      <div class="relative overflow-hidden rounded-3xl">
        <img class="h-72 w-full object-cover" src="${product.image}" alt="${product.name}" />
        <div class="absolute left-4 top-4 rounded-full bg-black/60 px-3 py-1 text-xs uppercase tracking-[0.35em] text-slate-300">${product.category}</div>
      </div>
      <div class="mt-6 space-y-3">
        <h3 class="text-2xl font-semibold text-white">${product.name}</h3>
        <p class="text-sm leading-6 text-slate-300">${product.description}</p>
        <div class="flex flex-wrap gap-2">
          ${product.badges.map((badge) => `<span class="rounded-full bg-white/5 px-3 py-1 text-xs uppercase tracking-[0.35em] text-slate-300">${badge}</span>`).join('')}
        </div>
        <div class="mt-4 flex items-center justify-between gap-4">
          <span class="text-lg font-semibold text-saga">${formatCurrency(product.price)}</span>
          <div class="flex items-center gap-2">
            <a href="product-details.html?slug=${product.slug}" class="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs uppercase tracking-[0.35em] text-slate-200 hover:border-saga">Details</a>
            <button data-slug="${product.slug}" class="add-cart rounded-full bg-saga px-4 py-2 text-xs font-semibold uppercase text-black transition hover:bg-[#ffe088]">Add</button>
          </div>
        </div>
      </div>
    </article>
  `).join('');

  document.querySelectorAll('.add-cart').forEach((button) => {
    button.addEventListener('click', () => {
      const slug = button.dataset.slug;
      const product = DEMO_PRODUCTS.find((item) => item.slug === slug);
      if (!product) return;
      addToCart(product, product.variants[0].value, 1);
      renderCartCount();
      button.textContent = 'Added';
      setTimeout(() => { button.textContent = 'Add'; }, 900);
    });
  });
}

function renderCartCount() {
  const cart = loadCart();
  const totals = cartTotals(cart);
  const count = document.getElementById('cart-count');
  if (count) count.textContent = totals.count;
}

categoryButtons.forEach((button) => {
  const category = button.dataset.category;
  button.addEventListener('click', () => {
    activeCategory = category;
    renderProducts(category);
    window.history.replaceState(null, '', `?category=${category}`);
    categoryButtons.forEach((btn) => btn.classList.remove('border-saga', 'bg-surface', 'text-white'));
    button.classList.add('border-saga', 'bg-surface', 'text-white');
  });
  if (category === activeCategory) {
    button.classList.add('border-saga', 'bg-surface', 'text-white');
  }
});

renderProducts(activeCategory);
renderCartCount();
