import { renderNav } from './common.js';

// Get products from demo-data since we can't fetch them
const CACHE_KEY = 'saga_demo_products_cache';

// Using local images instead of placeholder
const localProductsFallback = [
    {
      _id: "prod-1",
      title: "Oversized Anime Tee",
      description: "Premium heavy cotton t-shirt featuring exclusive anime prints.",
      price: 1200,
      salePrice: 999,
      category: "unisex",
      images: [{ url: "../demo-frontend/assets/P1FRONT.jpg", publicId: "img1" }],
      colors: ["Black", "White"],
      sizes: ["S", "M", "L", "XL"]
    },
    {
      _id: "prod-2",
      title: "Streetwear Hoodie",
      description: "Comfortable fleece hoodie with modern fit.",
      price: 2500,
      salePrice: 2199,
      category: "boys",
      images: [{ url: "../demo-frontend/assets/HOODIE2.jpg", publicId: "img2" }],
      colors: ["Black", "Grey", "Navy"],
      sizes: ["M", "L", "XL"]
    },
    {
      _id: "prod-3",
      title: "Basic Drop Shoulder",
      description: "Minimalist drop shoulder design for everyday wear.",
      price: 800,
      salePrice: null,
      category: "unisex",
      images: [{ url: "../demo-frontend/assets/T2B.jpg", publicId: "img3" }],
      colors: ["White", "Beige", "Olive"],
      sizes: ["S", "M", "L"]
    }
  ];

function initProductListing() {
    renderNav();
    
    let products = JSON.parse(localStorage.getItem(CACHE_KEY));
    if (!products || products.length === 0) {
        products = localProductsFallback;
    }
    
    let currentCategory = 'all';

    // Map UI React classes for Product cards
    const renderProducts = () => {
        const grid = document.getElementById('product-grid');
        const filtered = currentCategory === 'all' 
            ? products 
            : products.filter(p => p.category === currentCategory);

        if (filtered.length === 0) {
            grid.innerHTML = `
                <div class="col-span-full py-20 text-center">
                    <p class="text-xl text-gray-500">No products found in this category.</p>
                </div>
            `;
            return;
        }

        grid.innerHTML = filtered.map(product => {
            const hasSale = product.salePrice && product.salePrice < product.price;
            const primaryImage = product.images?.[0]?.url || 'https://via.placeholder.com/600x800';
            
            return `
            <div 
              class="group relative flex flex-col overflow-hidden rounded-2xl bg-gradient-to-b from-[#0a0a0a] to-[#040404] transition-all hover:shadow-[0_0_40px_rgba(212,175,55,0.15)]"
              onclick="window.location.href='product-details.html?id=${product._id}'"
            >
              <div class="relative aspect-[3/4] w-full overflow-hidden bg-[#111]">
                <img
                  src="${primaryImage}"
                  alt="${product.title}"
                  class="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                  loading="lazy"
                />
                <div class="absolute inset-0 bg-black/20 opacity-0 transition-opacity duration-500 group-hover:opacity-100"></div>

                <!-- Badges -->
                <div class="absolute left-4 top-4 flex flex-col gap-2">
                  ${hasSale ? `
                    <span class="rounded bg-[#D4AF37] px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-black">
                      Sale
                    </span>
                  ` : ''}
                  <span class="rounded bg-black/80 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-white backdrop-blur-md border border-white/10">
                    New
                  </span>
                </div>
              </div>

              <div class="flex flex-1 flex-col p-6 cursor-pointer">
                <div class="mb-2 text-xs font-bold uppercase tracking-widest text-[#D4AF37]">
                  ${product.category || 'Collection'}
                </div>

                <h3 class="mb-2 text-lg font-bold text-white transition-colors group-hover:text-[#D4AF37] line-clamp-1">
                  ${product.title}
                </h3>
                
                <p class="mb-4 text-sm text-gray-400 line-clamp-2 min-h-[40px]">
                  ${product.description}
                </p>

                <!-- Colors & Price alignment -->
                <div class="mt-auto flex items-end justify-between border-t border-white/5 pt-4">
                  <div class="flex flex-col gap-2">
                    <span class="text-xs font-medium text-gray-500 uppercase tracking-wider">Colors</span>
                    <div class="flex -space-x-1">
                      ${(product.colors || []).slice(0,4).map((color, idx) => `
                        <div class="h-4 w-4 rounded-full border border-gray-800 bg-gray-200 shadow-sm z-[${4-idx}]" title="${color}"></div>
                      `).join('')}
                      ${(product.colors?.length > 4) ? `
                        <div class="flex h-4 w-4 items-center justify-center rounded-full border border-gray-800 bg-[#111] z-0">
                          <span class="text-[8px] text-gray-400">+${product.colors.length - 4}</span>
                        </div>
                      ` : ''}
                    </div>
                  </div>

                  <div class="text-right">
                    ${hasSale ? `
                      <div class="text-xs text-gray-500 line-through">BDT ${product.price}</div>
                      <div class="text-lg font-bold text-[#D4AF37]">BDT ${product.salePrice}</div>
                    ` : `
                      <div class="text-lg font-bold text-white">BDT ${product.price}</div>
                    `}
                  </div>
                </div>
              </div>
            </div>
            `;
        }).join('');
    };

    // Category filtering
    const updateCategoryButtons = () => {
        document.querySelectorAll('.category-btn').forEach(btn => {
            const cat = btn.getAttribute('data-category');
            if (cat === currentCategory) {
                btn.classList.remove('bg-transparent', 'text-white', 'border-white/20');
                btn.classList.add('bg-[#D4AF37]', 'text-black', 'border-[#D4AF37]');
            } else {
                btn.classList.remove('bg-[#D4AF37]', 'text-black', 'border-[#D4AF37]');
                btn.classList.add('bg-transparent', 'text-white', 'border-white/20');
            }
        });
    };

    document.querySelectorAll('.category-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            currentCategory = e.target.getAttribute('data-category');
            updateCategoryButtons();
            renderProducts();
        });
    });

    // Initial render
    renderProducts();
}

document.addEventListener('DOMContentLoaded', initProductListing);

// Expose openBuyNowModal to window for the "Already in cart" emulation
window.openBuyNowModal = function() {
    document.getElementById('buy-now-modal').classList.remove('hidden');
};
