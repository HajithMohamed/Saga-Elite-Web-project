import { renderNav, updateHeader } from "./common.js";
import { loadOrders } from "./demo-state.js";

function resolveOrderId() {
  const params = new URLSearchParams(window.location.search);
  const fromQuery = params.get("orderId");
  if (fromQuery) {
    return fromQuery;
  }

  const fromStorage = localStorage.getItem("saga_demo_last_order");
  if (fromStorage) {
    return fromStorage;
  }

  const orders = loadOrders();
  return orders.length > 0 ? orders[orders.length - 1].id : "ORD-000000";
}

function initOrderSuccess() {
  renderNav({ activePath: "product-listing.html", mode: "shopping" });
  updateHeader();

  const display = document.getElementById("order-id-display");
  if (!display) {
    return;
  }

  display.textContent = resolveOrderId();
  display.classList.remove("hidden");
}

document.addEventListener("DOMContentLoaded", initOrderSuccess);
