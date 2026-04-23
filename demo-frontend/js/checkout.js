import { loadCart, cartTotals, placeOrder, formatCurrency } from './demo-state.js';

const subtotalEl = document.getElementById('subtotal');
const orderTotalEl = document.getElementById('order-total');
const paymentDetails = document.getElementById('payment-details');
const placeOrderButton = document.getElementById('place-order');
const paymentButtons = document.querySelectorAll('.payment-method');

let selectedMethod = 'online';
const cart = loadCart();
const totals = cartTotals(cart);
if (cart.length === 0) {
  alert('Your demo cart is empty. Please add items before checkout.');
  window.location.href = 'cart.html';
}
subtotalEl.textContent = formatCurrency(totals.subtotal);
orderTotalEl.textContent = formatCurrency(totals.subtotal);

if (paymentDetails) {
  paymentDetails.innerHTML = renderPaymentInstructions(selectedMethod);
}

paymentButtons.forEach((button) => {
  const method = button.dataset.method;
  if (method === selectedMethod) button.classList.add('border-saga', 'bg-surface');
  button.addEventListener('click', () => {
    selectedMethod = method;
    paymentButtons.forEach((btn) => btn.classList.toggle('border-saga', btn.dataset.method === method));
    paymentButtons.forEach((btn) => btn.classList.toggle('bg-surface', btn.dataset.method === method));
    if (paymentDetails) paymentDetails.innerHTML = renderPaymentInstructions(method);
  });
});

function renderPaymentInstructions(method) {
  if (method === 'online') {
    return `
      <h3 class="text-base font-semibold text-white">Online payment</h3>
      <p class="mt-3 text-sm leading-7">Enter your card details to simulate the online payment flow. This page does not submit to a gateway.</p>
      <div class="mt-4 space-y-3">
        <input type="text" placeholder="Card number" class="w-full rounded-3xl border border-white/10 bg-[#111111] px-4 py-3 text-sm text-on outline-none focus:border-saga" />
        <div class="grid gap-3 sm:grid-cols-2">
          <input type="text" placeholder="Expiry" class="rounded-3xl border border-white/10 bg-[#111111] px-4 py-3 text-sm text-on outline-none focus:border-saga" />
          <input type="text" placeholder="CVV" class="rounded-3xl border border-white/10 bg-[#111111] px-4 py-3 text-sm text-on outline-none focus:border-saga" />
        </div>
      </div>
    `;
  }
  return `
    <h3 class="text-base font-semibold text-white">Manual payment</h3>
    <p class="mt-3 text-sm leading-7">Upload proof of payment after transferring funds via bank or mobile banking. This demo does not submit files.</p>
    <div class="mt-4 space-y-3">
      <input type="text" placeholder="Bank reference" class="w-full rounded-3xl border border-white/10 bg-[#111111] px-4 py-3 text-sm text-on outline-none focus:border-saga" />
      <input type="file" class="w-full rounded-3xl border border-white/10 bg-[#111111] px-4 py-3 text-sm text-on outline-none" />
    </div>
  `;
}

placeOrderButton?.addEventListener('click', () => {
  const name = document.getElementById('customer-name')?.value.trim();
  const phone = document.getElementById('customer-phone')?.value.trim();
  const address = document.getElementById('customer-address')?.value.trim();
  if (!name || !phone || !address) {
    alert('Please fill in your shipping details to proceed.');
    return;
  }
  const orderId = `ORD-${Math.floor(Math.random() * 900000) + 100000}`;
  placeOrder({
    id: orderId,
    name,
    phone,
    address,
    paymentMethod: selectedMethod,
    total: totals.subtotal,
    items: cart,
    date: new Date().toLocaleDateString('en-LK'),
    status: 'Confirmed'
  });
  window.location.href = `order-success.html?orderId=${orderId}`;
});
