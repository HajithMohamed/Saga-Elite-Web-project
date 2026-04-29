import { renderNav, updateHeader } from "./common.js";
import { cartTotals, loadCart, placeOrder } from "./demo-state.js";

const SHIPPING_COST = 100;

function renderCheckoutItems(cart) {
  const itemsContainer = document.getElementById("checkout-cart-items");
  if (!itemsContainer) {
    return;
  }

  itemsContainer.innerHTML = cart
    .map((item) => {
      const [size = "-", color = "-"] = (item.variant || "").split("/");
      return `
        <div class="flex items-center gap-4">
          <div class="h-24 w-20 flex-shrink-0 overflow-hidden rounded-lg border border-gray-800 bg-[#111]">
            <img src="${item.image || "LOGO.png"}" class="h-full w-full object-cover" alt="${item.name}" />
          </div>
          <div class="flex-1 space-y-1">
            <p class="line-clamp-1 text-sm font-bold leading-tight text-white">${item.name}</p>
            <p class="text-[10px] uppercase tracking-wider text-gray-400">${size} • ${color} • Qty: ${item.quantity}</p>
            <p class="mt-2 text-base font-bold text-[#D4AF37]">BDT ${(item.price * item.quantity).toLocaleString()}</p>
          </div>
        </div>
      `;
    })
    .join("");
}

function setPaymentMethod(selectedMethod) {
  const btnCod = document.getElementById("btn-cod");
  const btnCard = document.getElementById("btn-card");
  const cardForm = document.getElementById("card-form");

  [btnCod, btnCard].forEach((button) => {
    button.classList.remove("border-[#D4AF37]", "bg-[#0a0a0a]", "opacity-100", "shadow-[0_0_20px_rgba(212,175,55,0.1)]");
    button.classList.add("border-transparent", "bg-[#111]", "opacity-60");
    button.querySelector(".indicator").className = "indicator h-4 w-4 rounded-full border-2 border-gray-600";
    button.querySelector("span:nth-child(2)").classList.remove("text-white");
    button.querySelector("span:nth-child(2)").classList.add("text-gray-400");
    button.querySelector(".material-symbols-outlined").classList.remove("text-[#D4AF37]");
    button.querySelector(".material-symbols-outlined").classList.add("text-gray-400");
  });

  const activeButton = selectedMethod === "CARD" ? btnCard : btnCod;
  activeButton.classList.remove("border-transparent", "bg-[#111]", "opacity-60");
  activeButton.classList.add("border-[#D4AF37]", "bg-[#0a0a0a]", "opacity-100", "shadow-[0_0_20px_rgba(212,175,55,0.1)]");
  activeButton.querySelector(".indicator").className = "indicator h-4 w-4 rounded-full border-4 border-[#D4AF37]";
  activeButton.querySelector("span:nth-child(2)").classList.remove("text-gray-400");
  activeButton.querySelector("span:nth-child(2)").classList.add("text-white");
  activeButton.querySelector(".material-symbols-outlined").classList.remove("text-gray-400");
  activeButton.querySelector(".material-symbols-outlined").classList.add("text-[#D4AF37]");

  if (selectedMethod === "CARD") {
    cardForm.classList.remove("hidden");
  } else {
    cardForm.classList.add("hidden");
  }
}

function initCheckout() {
  renderNav({ activePath: "product-listing.html", mode: "shopping" });

  const cart = loadCart();
  if (cart.length === 0) {
    window.location.href = "cart.html";
    return;
  }

  renderCheckoutItems(cart);

  const subtotal = cartTotals(cart).subtotal;
  const total = subtotal + SHIPPING_COST;

  const subtotalEl = document.getElementById("checkout-subtotal");
  const totalEl = document.getElementById("checkout-total");
  subtotalEl.textContent = `BDT ${subtotal.toLocaleString()}`;
  totalEl.textContent = `BDT ${total.toLocaleString()}`;

  document.getElementById("btn-cod").addEventListener("click", () => setPaymentMethod("COD"));
  document.getElementById("btn-card").addEventListener("click", () => setPaymentMethod("CARD"));
  setPaymentMethod("COD");

  const onCheckout = (event) => {
    event.preventDefault();

    const address = document.getElementById("address").value.trim();
    const phone = document.getElementById("phone").value.trim();

    if (!address || !phone) {
      window.alert("Please fill out address and contact number.");
      return;
    }

    const orderId = `ORD-${Math.floor(100000 + Math.random() * 900000)}`;

    placeOrder({
      id: orderId,
      address,
      phone,
      notes: document.getElementById("notes").value.trim(),
      paymentMethod: document.getElementById("card-form").classList.contains("hidden") ? "COD" : "CARD",
      items: cart,
      subtotal,
      shipping: SHIPPING_COST,
      total,
      createdAt: new Date().toISOString()
    });

    localStorage.setItem("saga_demo_last_order", orderId);
    updateHeader();
    window.location.href = `order-success.html?orderId=${encodeURIComponent(orderId)}`;
  };

  document.getElementById("checkout-form").addEventListener("submit", onCheckout);
  document.getElementById("btn-submit-sidebar").addEventListener("click", () => {
    document.getElementById("checkout-form").requestSubmit();
  });
}

document.addEventListener("DOMContentLoaded", initCheckout);
