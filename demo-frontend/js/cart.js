import { getProductBySlug } from './demo-data.js';

export function loadCart() {
  const container = document.getElementById('cart-items-container');
  if (!container) return;

  const storageItems = JSON.parse(localStorage.getItem('saga_demo_cart')) || [];
  if (storageItems.length === 0) {
    container.innerHTML = `
      <div class="col-span-1 md:col-span-8 bg-[#111] border border-[#222] p-12 text-center flex flex-col items-center justify-center gap-4">
        <div class="h-16 w-16 mb-4 flex items-center justify-center border border-[#333] text-[#D4AF37]">
          <span class="material-symbols-outlined text-[32px]">shopping_bag</span>
        </div>
        <h2 class="text-xl font-serif text-white tracking-widest">YOUR CART IS EMPTY</h2>
        <p class="text-sm text-gray-500 max-w-md">Looks like you haven't added anything to your cart yet.</p>
        <a href="index.html" class="mt-4 bg-[#D4AF37] hover:bg-[#c49a2a] text-black px-8 py-3 text-[10px] font-bold uppercase tracking-widest transition-colors inline-block">
          Continue Shopping
        </a>
      </div>
    `;
    const summary = document.getElementById('order-summary-content');
    if (summary) summary.innerHTML = '<p class="text-gray-500">No items.</p>';
    return;
  }

  // Generate React-like Cart UI
  container.innerHTML = storageItems.map((item) => {
    return `
      <div class="group flex flex-col sm:flex-row items-start sm:items-center gap-6 p-6 bg-[#111] border border-[#222] hover:border-[#D4AF37]/50 transition-colors relative overflow-hidden">
        <div class="absolute left-0 top-0 bottom-0 w-1 bg-[#D4AF37] scale-y-0 group-hover:scale-y-100 transition-transform duration-300 origin-top"></div>
        <div class="w-full sm:w-32 aspect-[3/4] sm:aspect-square bg-black overflow-hidden relative border border-[#333]">
          <img src="${item.image}" alt="${item.name}" class="w-full h-full object-cover object-center group-hover:scale-110 transition-transform duration-700" />
        </div>
        <div class="flex-1 flex flex-col gap-3 w-full">
          <div class="flex justify-between">
            <h3 class="text-lg font-serif text-white group-hover:text-[#D4AF37] transition-colors">${item.name}</h3>
            <button onclick="window.removeFromCart('${item.slug}')" class="text-gray-500 hover:text-red-500 transition-colors p-2 hover:bg-red-500/10 rounded-full">
              <span class="material-symbols-outlined text-[20px]">delete</span>
            </button>
          </div>
          <div class="flex items-center gap-6 text-xs text-gray-400 font-mono">
            <span>SIZE: <strong class="text-white">${item.variant.toUpperCase()}</strong></span>
            <span>SKU: <strong class="text-white">${item.id}</strong></span>
          </div>
          <div class="flex items-center justify-between mt-2 pt-4 border-t border-[#222]">
            <div class="flex items-center gap-4 bg-black border border-[#333] px-2 py-1">
               <button onclick="window.updateQuantity('${item.slug}', -1)" class="w-6 h-6 flex items-center justify-center text-gray-400 hover:text-[#D4AF37] transition-colors"><span class="material-symbols-outlined text-[16px]">remove</span></button>
               <span class="w-4 text-center font-mono text-sm text-white">${item.quantity}</span>
               <button onclick="window.updateQuantity('${item.slug}', 1)" class="w-6 h-6 flex items-center justify-center text-gray-400 hover:text-[#D4AF37] transition-colors"><span class="material-symbols-outlined text-[16px]">add</span></button>
            </div>
            <span class="font-serif font-medium text-lg text-white">LKR ${(item.price * item.quantity).toLocaleString()}</span>
          </div>
        </div>
      </div>
    `;
  }).join('');

  updateSummary(storageItems);
}

function updateSummary(items) {
  const sumContainer = document.getElementById('order-summary-content');
  if(!sumContainer) return;
  const subtotal = items.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  sumContainer.innerHTML = `
    <div class="space-y-4 font-body border-b border-[#222] pb-6 mb-6">
      <div class="flex justify-between text-sm text-gray-400">
        <span>Subtotal</span>
        <span class="font-mono text-white">LKR ${subtotal.toLocaleString()}</span>
      </div>
      <div class="flex justify-between text-sm text-gray-400">
        <span>Shipping</span>
        <span class="font-mono font-bold text-[#D4AF37] uppercase tracking-widest text-[10px]">Calculated at Checkout</span>
      </div>
    </div>
    <div class="flex justify-between items-end mb-8">
      <span class="text-white font-serif tracking-widest text-lg">TOTAL</span>
      <span class="text-2xl font-serif text-white">LKR ${subtotal.toLocaleString()}</span>
    </div>
    <button class="w-full bg-[#D4AF37] hover:bg-[#c49a2a] text-black font-bold uppercase tracking-widest text-[10px] py-4 transition-colors flex items-center justify-center gap-2 group">
      PROCEED TO CHECKOUT
      <span class="material-symbols-outlined text-[16px] group-hover:translate-x-1 transition-transform">arrow_forward</span>
    </button>
  `;
}

window.updateQuantity = (slug, delta) => {
  let cart = JSON.parse(localStorage.getItem('saga_demo_cart')) || [];
  const curr = cart.find(x => x.slug === slug);
  if(curr) {
    curr.quantity = Math.max(1, curr.quantity + delta);
    localStorage.setItem('saga_demo_cart', JSON.stringify(cart));
    loadCart();
  }
};
window.removeFromCart = (slug) => {
  let cart = JSON.parse(localStorage.getItem('saga_demo_cart')) || [];
  cart = cart.filter(x => x.slug !== slug);
  localStorage.setItem('saga_demo_cart', JSON.stringify(cart));
  loadCart();
};

document.addEventListener('DOMContentLoaded', loadCart);
