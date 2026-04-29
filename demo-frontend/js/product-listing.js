import { renderNav } from "./common.js";
import { DEMO_PRODUCTS } from "./demo-data.js";

function resolveCategoryFromQuery() {
  const params = new URLSearchParams(window.location.search);
  const queryCategory = params.get("category");

  if (!queryCategory || queryCategory === "drops") {
    return "all";
  }

  return ["all", "unisex", "boys", "girls"].includes(queryCategory) ? queryCategory : "all";
}

function categoryLabel(value) {
  if (value === "boys") {
    return "Men";
  }
  if (value === "girls") {
    return "Women";
  }
  if (value === "unisex") {
    return "Unisex";
  }
  return "Collection";
}

function collectColors(product) {
  const fromVariants = (product.variants || []).map((variant) => variant.color).filter(Boolean);
  if (fromVariants.length > 0) {
    return [...new Set(fromVariants)];
  }
  return product.colors || [];
}

function swatchColorValue(color) {
  const palette = {
    black: "#111111",
    white: "#f8f8f8",
    gray: "#9ca3af",
    grey: "#9ca3af",
    blue: "#2563eb",
    green: "#16a34a",
    red: "#dc2626",
    yellow: "#eab308",
    pink: "#db2777",
    beige: "#f5f5dc",
    slate: "#64748b",
    gold: "#D4AF37",
    navy: "#1e3a8a",
    olive: "#4d7c0f"
  };

  return palette[color.toLowerCase()] || "#6b7280";
}

function renderProducts(products) {
  const grid = document.getElementById("product-grid");
  if (!grid) {
    return;
  }

  if (products.length === 0) {
    grid.innerHTML = `
      <div class="col-span-full rounded-3xl border border-white/10 bg-[#0b0b0b] py-20 text-center">
        <p class="text-xl text-gray-400">No products found in this category.</p>
      </div>
    `;
    return;
  }

  grid.innerHTML = products
    .map((product) => {
      const primaryImage = product.images?.[0]?.url || product.image || "LOGO.png";
      const colors = collectColors(product);

      return `
        <a href="product-details.html?slug=${encodeURIComponent(product.slug)}" class="group relative flex flex-col overflow-hidden rounded-2xl bg-gradient-to-b from-[#0a0a0a] to-[#040404] transition-all hover:shadow-[0_0_40px_rgba(212,175,55,0.15)]">
          <div class="relative aspect-[3/4] w-full overflow-hidden bg-[#111]">
            <img
              src="${primaryImage}"
              alt="${product.name}"
              class="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
              loading="lazy"
            />
            <div class="absolute inset-0 bg-black/20 opacity-0 transition-opacity duration-500 group-hover:opacity-100"></div>
            <div class="absolute left-4 top-4 flex flex-col gap-2">
              <span class="rounded bg-[#D4AF37] px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-black">
                ${product.isLimited ? "Limited" : "New"}
              </span>
            </div>
          </div>

          <div class="flex flex-1 flex-col p-6">
            <div class="mb-2 text-xs font-bold uppercase tracking-widest text-[#D4AF37]">
              ${categoryLabel(product.category)}
            </div>

            <h3 class="mb-2 text-lg font-bold text-white transition-colors group-hover:text-[#D4AF37] line-clamp-1">
              ${product.name}
            </h3>

            <p class="mb-4 text-sm text-gray-400 line-clamp-2 min-h-[40px]">
              ${product.description}
            </p>

            <div class="mt-auto flex items-end justify-between border-t border-white/5 pt-4">
              <div class="flex flex-col gap-2">
                <span class="text-xs font-medium text-gray-500 uppercase tracking-wider">Colors</span>
                <div class="flex -space-x-1">
                  ${colors
                    .slice(0, 4)
                    .map((color, index) => {
                      return `<div class="h-4 w-4 rounded-full border border-gray-800 shadow-sm z-[${4 - index}]" title="${color}" style="background-color:${swatchColorValue(color)}"></div>`;
                    })
                    .join("")}
                  ${colors.length > 4
                    ? `<div class="flex h-4 w-4 items-center justify-center rounded-full border border-gray-800 bg-[#111] z-0"><span class="text-[8px] text-gray-400">+${
                        colors.length - 4
                      }</span></div>`
                    : ""}
                </div>
              </div>

              <div class="text-right">
                <div class="text-lg font-bold text-white">BDT ${product.price.toLocaleString()}</div>
              </div>
            </div>
          </div>
        </a>
      `;
    })
    .join("");
}

function initProductListing() {
  renderNav({ activePath: "product-listing.html", mode: "shopping" });

  let currentCategory = resolveCategoryFromQuery();

  const updateCategoryButtons = () => {
    document.querySelectorAll(".category-btn").forEach((button) => {
      const category = button.getAttribute("data-category");
      if (category === currentCategory) {
        button.classList.remove("bg-transparent", "text-white", "border-white/20");
        button.classList.add("bg-[#D4AF37]", "text-black", "border-[#D4AF37]");
      } else {
        button.classList.remove("bg-[#D4AF37]", "text-black", "border-[#D4AF37]");
        button.classList.add("bg-transparent", "text-white", "border-white/20");
      }
    });
  };

  const renderCurrent = () => {
    const filteredProducts =
      currentCategory === "all"
        ? DEMO_PRODUCTS
        : DEMO_PRODUCTS.filter((product) => product.category === currentCategory);
    renderProducts(filteredProducts);
  };

  document.querySelectorAll(".category-btn").forEach((button) => {
    button.addEventListener("click", (event) => {
      currentCategory = event.currentTarget.getAttribute("data-category") || "all";
      const params = new URLSearchParams(window.location.search);
      params.set("category", currentCategory);
      window.history.replaceState({}, "", `${window.location.pathname}?${params.toString()}`);
      updateCategoryButtons();
      renderCurrent();
    });
  });

  updateCategoryButtons();
  renderCurrent();
}

document.addEventListener("DOMContentLoaded", initProductListing);
