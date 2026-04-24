import { renderNav, updateHeader } from "./common.js";
import { DEMO_PRODUCTS, getProductBySlug } from "./demo-data.js";
import { addToCart, loadCart, loadWishlist, toggleWishlist } from "./demo-state.js";

function productByQuery() {
  const params = new URLSearchParams(window.location.search);
  const slug = params.get("slug");
  const id = params.get("id");

  if (slug) {
    return getProductBySlug(slug);
  }

  if (id) {
    const byId = DEMO_PRODUCTS.find((product) => product._id === id || product.id === id);
    if (byId) {
      return byId;
    }
  }

  return DEMO_PRODUCTS[0];
}

function normalizeVariants(product) {
  if (Array.isArray(product.variants) && product.variants.length > 0) {
    return product.variants.map((variant) => ({
      size: variant.size || variant.label || "One Size",
      color: variant.color || "Black",
      stock: variant.stock ?? 1
    }));
  }

  const sizes = product.sizes || ["One Size"];
  const colors = product.colors || ["Black"];
  const variants = [];
  sizes.forEach((size) => {
    colors.forEach((color) => {
      variants.push({ size, color, stock: 4 });
    });
  });
  return variants;
}

function initProductDetails() {
  renderNav({ activePath: "product-listing.html", mode: "shopping" });

  const product = productByQuery();
  if (!product) {
    return;
  }

  const variants = normalizeVariants(product);
  let selectedVariant = variants.find((variant) => variant.stock > 0) || variants[0];
  let quantity = 1;

  const titleEl = document.getElementById("product-title");
  const categoryEl = document.getElementById("product-category");
  const idEl = document.getElementById("product-id");
  const priceEl = document.getElementById("price-container");
  const descEl = document.getElementById("product-description");
  const mainImgEl = document.getElementById("main-product-image");
  const thumbnailContainer = document.getElementById("thumbnail-gallery");
  const variantsGrid = document.getElementById("variants-grid");
  const stockStatus = document.getElementById("stock-status");
  const qtyValue = document.getElementById("qty-value");
  const btnMinus = document.getElementById("qty-minus");
  const btnPlus = document.getElementById("qty-plus");
  const btnAddToCart = document.getElementById("add-to-cart-btn");
  const btnBuyNow = document.getElementById("buy-now-btn");
  const modal = document.getElementById("buy-now-modal");
  const wishlistBtn = document.getElementById("wishlist-btn");

  titleEl.textContent = product.name;
  categoryEl.textContent = `${product.categoryLabel || product.category || "Collection"} • Limited Drop`;
  idEl.textContent = `Art No. ART-${(product.id || product._id || "000").replace(/[^0-9]/g, "").padStart(3, "0")}`;
  descEl.textContent = product.description;
  priceEl.innerHTML = `<span class="text-3xl font-semibold text-[#D4AF37]">BDT ${product.price.toLocaleString()}</span>`;

  const images = (product.images || []).map((entry) => entry.url).filter(Boolean);
  if (images.length === 0) {
    images.push(product.image || "LOGO.png");
  }

  mainImgEl.src = images[0];
  mainImgEl.alt = product.name;

  thumbnailContainer.innerHTML = images
    .map(
      (src, index) => `
        <button data-index="${index}" class="relative shrink-0 rounded-xl overflow-hidden border-2 w-20 lg:w-24 aspect-[4/5] transition-all hover:opacity-100 ${
          index === 0 ? "border-[#D4AF37] opacity-100" : "border-transparent opacity-60"
        }">
          <img src="${src}" alt="View ${index + 1}" class="h-full w-full object-cover">
        </button>
      `
    )
    .join("");

  thumbnailContainer.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-index]");
    if (!button) {
      return;
    }

    const index = Number(button.dataset.index);
    const nextImage = images[index] || images[0];

    thumbnailContainer.querySelectorAll("button").forEach((node) => {
      node.classList.remove("border-[#D4AF37]", "opacity-100");
      node.classList.add("border-transparent", "opacity-60");
    });
    button.classList.remove("border-transparent", "opacity-60");
    button.classList.add("border-[#D4AF37]", "opacity-100");

    mainImgEl.style.opacity = "0";
    window.setTimeout(() => {
      mainImgEl.src = nextImage;
      mainImgEl.style.opacity = "1";
    }, 160);
  });

  const renderVariants = () => {
    variantsGrid.innerHTML = variants
      .map((variant) => {
        const isSelected = selectedVariant.size === variant.size && selectedVariant.color === variant.color;
        const isOutOfStock = variant.stock <= 0;

        return `
          <button
            type="button"
            data-size="${variant.size}"
            data-color="${variant.color}"
            class="variant-btn py-3 px-4 rounded-xl border text-sm font-medium tracking-wide transition-all ${
              isSelected
                ? "border-[#D4AF37] bg-[#D4AF37]/10 text-white"
                : isOutOfStock
                ? "border-gray-800 text-gray-600 opacity-40 cursor-not-allowed"
                : "border-gray-800 text-gray-300 hover:border-gray-500"
            }"
            ${isOutOfStock ? "disabled" : ""}
          >
            ${variant.size} - ${variant.color}
            ${isOutOfStock ? '<span class="block text-[10px] text-red-400">OOS</span>' : ""}
          </button>
        `;
      })
      .join("");

    stockStatus.textContent = `Stock: ${selectedVariant.stock}`;
  };

  variantsGrid.addEventListener("click", (event) => {
    const button = event.target.closest("button.variant-btn");
    if (!button) {
      return;
    }

    const size = button.dataset.size;
    const color = button.dataset.color;
    const found = variants.find((variant) => variant.size === size && variant.color === color);
    if (!found || found.stock <= 0) {
      return;
    }

    selectedVariant = found;
    quantity = 1;
    qtyValue.textContent = "1";
    renderVariants();
  });

  const updateQuantity = (value) => {
    quantity = Math.max(1, Math.min(value, selectedVariant.stock || 1));
    qtyValue.textContent = String(quantity);
  };

  btnMinus.addEventListener("click", () => updateQuantity(quantity - 1));
  btnPlus.addEventListener("click", () => updateQuantity(quantity + 1));

  const variantLabel = () => `${selectedVariant.size}/${selectedVariant.color}`;

  const syncWishlistState = () => {
    const wishlist = loadWishlist();
    const exists = wishlist.some((entry) => entry.id === product.id);
    const icon = wishlistBtn.querySelector(".material-symbols-outlined");

    icon.textContent = exists ? "favorite" : "favorite_border";
    icon.classList.toggle("text-red-500", exists);
    icon.classList.toggle("text-white", !exists);
  };

  wishlistBtn.addEventListener("click", () => {
    toggleWishlist({ id: product.id, slug: product.slug, name: product.name, image: images[0], price: product.price });
    syncWishlistState();
    updateHeader();
  });

  btnAddToCart.addEventListener("click", () => {
    const existing = loadCart().find((item) => item.slug === product.slug && item.variant === variantLabel());
    if (existing) {
      modal.classList.remove("hidden");
      modal.classList.add("flex");
      return;
    }

    addToCart({ ...product, image: images[0] }, variantLabel(), quantity);
    updateHeader();

    const originalText = btnAddToCart.textContent;
    btnAddToCart.textContent = "Added";
    window.setTimeout(() => {
      btnAddToCart.textContent = originalText;
    }, 1000);
  });

  btnBuyNow.addEventListener("click", () => {
    const existing = loadCart().find((item) => item.slug === product.slug && item.variant === variantLabel());
    if (!existing) {
      addToCart({ ...product, image: images[0] }, variantLabel(), quantity);
      updateHeader();
    }
    window.location.href = "checkout.html";
  });

  modal.addEventListener("click", (event) => {
    if (event.target === modal) {
      modal.classList.add("hidden");
      modal.classList.remove("flex");
    }
  });

  renderVariants();
  syncWishlistState();
}

document.addEventListener("DOMContentLoaded", initProductDetails);
