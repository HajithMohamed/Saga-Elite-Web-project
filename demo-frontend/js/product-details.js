import { renderNav } from './common.js';

const CACHE_KEY = 'saga_demo_products_cache';
const CART_KEY = 'saga_demo_cart';

// Fallback logic in case products don't exist yet
const localProductsFallback = [
    {
      _id: "prod-1",
      title: "Oversized Anime Tee",
      description: "Premium heavy cotton t-shirt featuring exclusive anime prints. Made for durability and daily comfort.",
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

function initProductDetails() {
    renderNav();
    
    // Parse URL for ID
    const urlParams = new URLSearchParams(window.location.search);
    const productId = urlParams.get('id');

    let products = JSON.parse(localStorage.getItem(CACHE_KEY));
    if (!products || products.length === 0) {
        products = localProductsFallback;
    }

    const product = products.find(p => p._id === productId) || products[0]; // fallback to first product

    if (!product) {
        document.querySelector('.container').innerHTML = '<div class="py-20 text-center"><h2 class="text-3xl text-[#D4AF37]">Product Not Found</h2></div>';
        return;
    }

    // State
    let selectedColor = product.colors && product.colors.length > 0 ? product.colors[0] : null;
    let selectedSize = product.sizes && product.sizes.length > 0 ? product.sizes[0] : null;
    let quantity = 1;
    const maxStock = 10; // Demo static stock

    // DOM Elements
    const titleEl = document.getElementById('product-title');
    const categoryEl = document.getElementById('product-category');
    const idEl = document.getElementById('product-id');
    const priceEl = document.getElementById('price-container');
    const descEl = document.getElementById('product-description');
    
    const mainImgEl = document.getElementById('main-product-image');
    const thumbnailContainer = document.getElementById('thumbnail-gallery');
    
    const variantsGrid = document.getElementById('variants-grid');
    const stockStatus = document.getElementById('stock-status');
    const qtyValue = document.getElementById('qty-value');
    const btnMinus = document.getElementById('qty-minus');
    const btnPlus = document.getElementById('qty-plus');
    
    const btnAddToCart = document.getElementById('add-to-cart-btn');
    const btnBuyNow = document.getElementById('buy-now-btn');
    const modal = document.getElementById('buy-now-modal');

    // Render static data
    titleEl.textContent = product.title;
    categoryEl.textContent = `${product.category || 'Collection'} • Limited Drop`;
    idEl.textContent = `Art No. ART-${product._id.split('-')[1] || Math.floor(Math.random() * 1000)}`;
    descEl.textContent = product.description;

    const hasSale = product.salePrice && product.salePrice < product.price;
    priceEl.innerHTML = hasSale 
        ? `<span class="text-3xl font-semibold text-[#D4AF37]">BDT ${product.salePrice}</span>
           <span class="text-xl text-gray-500 line-through">BDT ${product.price}</span>`
        : `<span class="text-3xl font-semibold">BDT ${product.price}</span>`;

    // Render Images
    const mainSrc = product.images?.[0]?.url || 'https://via.placeholder.com/800x1000';
    mainImgEl.src = mainSrc;
    
    const demoImages = [mainSrc, mainSrc, mainSrc]; // fake extra images
    thumbnailContainer.innerHTML = demoImages.map((src, index) => `
        <button 
            data-index="${index}"
            class="relative shrink-0 rounded-xl overflow-hidden border-2 w-20 lg:w-24 aspect-[4/5] transition-all hover:opacity-100 
            ${index === 0 ? 'border-[#D4AF37] opacity-100' : 'border-transparent opacity-50'}"
        >
            <img src="${src}" alt="View ${index + 1}" class="w-full h-full object-cover">
        </button>
    `).join('');

    thumbnailContainer.addEventListener('click', (e) => {
        const btn = e.target.closest('button');
        if (btn) {
            // Update active state
            thumbnailContainer.querySelectorAll('button').forEach(b => {
                b.classList.remove('border-[#D4AF37]', 'opacity-100');
                b.classList.add('border-transparent', 'opacity-50');
            });
            btn.classList.remove('border-transparent', 'opacity-50');
            btn.classList.add('border-[#D4AF37]', 'opacity-100');
            
            mainImgEl.style.opacity = '0';
            setTimeout(() => {
                mainImgEl.style.opacity = '1';
            }, 150);
        }
    });

    // Render Variants (Cartesian product of Sizes and Colors)
    const renderVariants = () => {
        if (!product.colors || !product.sizes) return;
        
        let variantsHtml = '';
        product.sizes.forEach(size => {
            product.colors.forEach(color => {
                const isSelected = selectedSize === size && selectedColor === color;
                // Fake OOS state for testing
                const isOos = size === 'XL' && color === 'White';
                
                if (isSelected) {
                    variantsHtml += `
                        <button class="py-3 px-4 rounded-xl border text-sm font-medium tracking-wide transition-all border-[#D4AF37] bg-[#D4AF37]/10 text-white">
                            ${size} - ${color}
                        </button>
                    `;
                } else if (isOos) {
                    variantsHtml += `
                        <button class="py-3 px-4 rounded-xl border text-sm font-medium tracking-wide transition-all opacity-30 cursor-not-allowed border-gray-800">
                            ${size} - ${color} <br/><span class="text-[10px] text-red-400">OOS</span>
                        </button>
                    `;
                } else {
                    variantsHtml += `
                        <button 
                            onclick="window.selectVariant('${size}', '${color}')"
                            class="py-3 px-4 rounded-xl border text-sm font-medium tracking-wide transition-all border-gray-800 hover:border-gray-500 text-gray-400"
                        >
                            ${size} - ${color}
                        </button>
                    `;
                }
            });
        });
        variantsGrid.innerHTML = variantsHtml;
        stockStatus.textContent = `Stock: ${maxStock}`;
    };

    window.selectVariant = (size, color) => {
        selectedSize = size;
        selectedColor = color;
        renderVariants();
    };

    renderVariants();

    // Quantity Handlers
    const updateQty = (newQty) => {
        if (newQty < 1) newQty = 1;
        if (newQty > maxStock) newQty = maxStock;
        quantity = newQty;
        qtyValue.textContent = quantity;
    };

    btnMinus.addEventListener('click', () => updateQty(quantity - 1));
    btnPlus.addEventListener('click', () => updateQty(quantity + 1));

    // Cart Handlers
    const handleAddToCart = () => {
        let cart = JSON.parse(localStorage.getItem(CART_KEY) || '[]');
        
        const existingIndex = cart.findIndex(item => 
            item.productId === product._id && 
            item.color === selectedColor && 
            item.size === selectedSize
        );

        if (existingIndex > -1) {
            // Already in cart - Show modal like React 
            modal.classList.remove('hidden');
            modal.classList.add('flex');
            return;
        }

        // Add
        cart.push({
            productId: product._id,
            title: product.title,
            image: mainSrc,
            price: hasSale ? product.salePrice : product.price,
            quantity: quantity,
            color: selectedColor,
            size: selectedSize
        });

        localStorage.setItem(CART_KEY, JSON.stringify(cart));
        
        // Show success and redirect locally
        const initText = btnAddToCart.textContent;
        btnAddToCart.textContent = 'ADDED!';
        btnAddToCart.classList.add('bg-green-500/20', 'text-green-400', 'border-green-500');
        
        setTimeout(() => {
            window.location.href = 'cart.html';
        }, 800);
    };

    btnAddToCart.addEventListener('click', handleAddToCart);
    btnBuyNow.addEventListener('click', () => {
        // Simple direct to checkout for demo
        window.location.href = 'checkout.html';
    });

    // Modal Close handlers
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.classList.remove('flex');
            modal.classList.add('hidden');
        }
    });
}

document.addEventListener('DOMContentLoaded', initProductDetails);
