import { loadOrders } from './demo-state.js';

const orderIdEl = document.getElementById('order-id');
const params = new URLSearchParams(window.location.search);
const orderId = params.get('orderId');

if (orderIdEl) {
  const orders = loadOrders();
  const order = orders.find((item) => item.id === orderId);
  orderIdEl.textContent = order ? order.id : orderId || 'ORD-000000';
}
