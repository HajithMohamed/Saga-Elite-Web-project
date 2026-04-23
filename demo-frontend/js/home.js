import { DEMO_PRODUCTS } from './demo-data.js';

const featuredContainer = document.getElementById('featured-products');

if (featuredContainer) {
  const featured = DEMO_PRODUCTS.slice(0, 4);
  featuredContainer.innerHTML = featured.map((product) => `
    <article class="group relative rounded-[2rem] border border-white/5 bg-surface-container-lowest p-5 transition-all duration-300 hover:border-saga/30 hover:shadow-2xl hover:shadow-saga/5">
      <!-- Badge -->
      <div class="absolute top-8 left-8 z-10">
        <span class="bg-black/80 backdrop-blur-md text-saga text-[10px] font-bold px-3 py-1 rounded-full border border-saga/20 tracking-widest uppercase">
          Limited Drop
        </span>
      </div>
      
      <!-- Image Wrapper -->
      <div class="relative overflow-hidden rounded-[1.5rem] aspect-[4/5]">
        <img class="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110 grayscale group-hover:grayscale-0" src="${product.image}" alt="${product.name}" />
        <div class="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex items-end p-6">
           <button class="w-full bg-saga text-black text-xs font-bold py-3 rounded-xl uppercase tracking-widest transform translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
             Quick Add
           </button>
        </div>
      </div>

      <!-- Content -->
      <div class="mt-6 space-y-2">
        <div class="flex justify-between items-start">
          <div>
            <p class="text-[10px] uppercase tracking-[0.2em] text-gray-500 font-bold">${product.category}</p>
            <h3 class="text-lg font-serif font-medium text-white group-hover:text-saga transition-colors mt-1">${product.name}</h3>
          </div>
          <button class="text-gray-500 hover:text-saga transition-colors">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path></svg>
          </button>
        </div>
        
        <div class="flex items-center justify-between pt-2">
          <span class="text-sm font-bold text-white tracking-widest">LKR ${product.price.toLocaleString()}</span>
          <a href="product-details.html?slug=${product.slug}" class="text-[10px] font-bold uppercase tracking-widest text-[#D4AF37] hover:text-white transition-colors flex items-center gap-2">
            Details
            <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8l4 4m0 0l-4 4m4-4H3"></path></svg>
          </a>
        </div>
      </div>
    </article>
  `).join('');
}
