import { DEMO_PRODUCTS } from './demo-data.js';

const featuredContainer = document.getElementById('featured-products');

if (featuredContainer) {
  const activeProducts = DEMO_PRODUCTS;
  featuredContainer.innerHTML = activeProducts.map((product) => {
    return `
      <div class="group relative bg-[#111] overflow-hidden border border-[#222]">
        <div class="relative aspect-[3/4] overflow-hidden bg-[#0a0a0a]">
          <div class="absolute inset-0 bg-[#D4AF37]/5 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <img src="${product.image}" alt="${product.name}" class="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700 ease-out" />
          
          <!-- Badges -->
          <div class="absolute top-4 left-4 z-20 flex flex-col gap-2">
            ${product.badges?.includes('Limited Drop') ? '<span class="bg-black text-[#D4AF37] text-[9px] font-bold px-3 py-1 tracking-widest uppercase border border-[#D4AF37]/30 shadow-[0_0_10px_rgba(212,175,55,0.2)]">Limited Drop</span>' : ''}
            <span class="bg-white text-black text-[9px] font-bold px-3 py-1 tracking-widest uppercase shadow-lg">New Arrival</span>
          </div>

          <!-- Wishlist Toggle -->
          <button class="absolute top-4 right-4 z-20 w-8 h-8 flex items-center justify-center bg-black/50 backdrop-blur-sm border border-white/10 hover:bg-[#D4AF37] hover:border-[#D4AF37] hover:text-black transition-all duration-300 text-white rounded-full">
            <span class="material-symbols-outlined text-[18px]">favorite</span>
          </button>

          <!-- Hover Action Overlay -->
          <div class="absolute inset-x-0 bottom-0 p-4 translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-out z-20 bg-gradient-to-t from-black/90 via-black/50 to-transparent">
            <button class="w-full bg-[#111] border border-[#333] hover:border-[#D4AF37] text-white hover:text-[#D4AF37] py-3 text-[10px] font-bold uppercase tracking-widest transition-colors shadow-2xl flex items-center justify-center gap-2">
              <span class="material-symbols-outlined text-[16px]">shopping_bag</span>
              Add to Cart
            </button>
          </div>
        </div>

        <div class="p-5 flex flex-col gap-3 relative z-10 bg-[#111]">
          <div class="flex justify-between items-start gap-4">
            <div class="flex-1">
              <p class="text-[#D4AF37] text-[9px] font-bold uppercase tracking-[0.2em] mb-1">${product.category}</p>
              <h3 class="text-white font-serif text-lg leading-tight group-hover:text-[#D4AF37] transition-colors line-clamp-1">${product.name}</h3>
            </div>
            <div class="text-right shrink-0">
              <span class="text-white font-serif text-lg tracking-wide block">LKR ${product.price}</span>
            </div>
          </div>
        </div>
      </div>
    `;
  }).join('');
}
