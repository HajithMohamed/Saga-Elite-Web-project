import { DEMO_PRODUCTS } from './demo-data.js';

const featuredContainer = document.getElementById('featured-products');

if (featuredContainer) {
  const featured = DEMO_PRODUCTS.slice(0, 4);
  featuredContainer.innerHTML = featured.map((product) => `
    <article class="group rounded-[32px] border border-white/10 bg-[#0b0b0b] p-6 transition hover:-translate-y-1 hover:border-saga/30 hover:bg-[#121212]">
      <img class="h-72 w-full rounded-3xl object-cover" src="${product.image}" alt="${product.name}" />
      <div class="mt-6">
        <p class="text-xs uppercase tracking-[0.35em] text-slate-500">${product.category.toUpperCase()}</p>
        <h3 class="mt-3 text-xl font-semibold text-white">${product.name}</h3>
        <p class="mt-3 text-sm leading-6 text-slate-300">${product.description}</p>
      </div>
      <div class="mt-6 flex items-center justify-between">
        <span class="text-sm font-semibold text-saga">LKR ${product.price.toLocaleString()}</span>
        <a href="product-details.html?slug=${product.slug}" class="rounded-full bg-saga px-4 py-2 text-xs font-semibold uppercase text-black transition hover:bg-[#ffe088]">View</a>
      </div>
    </article>
  `).join('');
}
