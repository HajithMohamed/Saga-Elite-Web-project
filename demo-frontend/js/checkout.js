import { renderNav } from './common.js';

const CART_KEY = 'saga_demo_cart';
const SHIPPING_COST = 100;

function initCheckout() {
    renderNav();
    
    const cart = JSON.parse(localStorage.getItem(CART_KEY) || '[]');
    
    if (cart.length === 0) {
        window.location.href = 'cart.html';
        return;
    }

    const itemsContainer = document.getElementById('checkout-cart-items');
    const subtotalEl = document.getElementById('checkout-subtotal');
    const totalEl = document.getElementById('checkout-total');
    
    let subtotal = 0;
    
    itemsContainer.innerHTML = cart.map(item => {
        const itemTotal = item.price * item.quantity;
        subtotal += itemTotal;
        const fallbackImg = item.image || 'https://via.placeholder.com/150';
        
        return `
        <div class="flex gap-4 items-center">
            <div class="w-20 h-24 bg-[#111] rounded-lg overflow-hidden flex-shrink-0 border border-gray-800">
                <img src="${fallbackImg}" class="w-full h-full object-cover" alt="${item.title}" />
            </div>
            <div class="flex-1 space-y-1">
                <p class="font-bold text-sm leading-tight line-clamp-1 text-white">${item.title}</p>
                <p class="text-[10px] text-gray-400 uppercase tracking-wider">
                    ${item.size} • ${item.color} • Qty: ${item.quantity}
                </p>
                <p class="font-bold text-base mt-2 text-[#D4AF37]">BDT ${item.price}</p>
            </div>
        </div>
        `;
    }).join('');

    subtotalEl.textContent = `BDT ${subtotal.toLocaleString()}`;
    totalEl.textContent = `BDT ${(subtotal + SHIPPING_COST).toLocaleString()}`;

    // Payment Method Toggle UI
    const btnCod = document.getElementById('btn-cod');
    const btnCard = document.getElementById('btn-card');
    const cardForm = document.getElementById('card-form');
    
    let method = 'COD';

    const setMethodUI = (selected) => {
        method = selected;
        // Reset
        [btnCod, btnCard].forEach(b => {
             b.classList.replace('border-[#D4AF37]', 'border-transparent');
             b.classList.replace('bg-[#0a0a0a]', 'bg-[#111]');
             b.classList.replace('opacity-100', 'opacity-60');
             b.querySelector('.indicator').className = 'indicator w-4 h-4 rounded-full border-2 border-gray-600';
             b.querySelector('span:nth-child(2)').classList.replace('text-white', 'text-gray-400');
             b.querySelector('.material-symbols-outlined').classList.replace('text-[#D4AF37]', 'text-gray-400');
        });
        
        // Active
        const activeBtn = selected === 'COD' ? btnCod : btnCard;
        activeBtn.classList.replace('border-transparent', 'border-[#D4AF37]');
        activeBtn.classList.replace('bg-[#111]', 'bg-[#0a0a0a]');
        activeBtn.classList.replace('opacity-60', 'opacity-100');
        activeBtn.querySelector('.indicator').className = 'indicator w-4 h-4 rounded-full border-4 border-[#D4AF37]';
        activeBtn.querySelector('span:nth-child(2)').classList.replace('text-gray-400', 'text-white');
        activeBtn.querySelector('.material-symbols-outlined').classList.replace('text-gray-400', 'text-[#D4AF37]');
        
        if (selected === 'CARD') {
            cardForm.classList.remove('hidden');
        } else {
            cardForm.classList.add('hidden');
        }
    };

    btnCod.addEventListener('click', () => setMethodUI('COD'));
    btnCard.addEventListener('click', () => setMethodUI('CARD'));

    // Form Submission
    const handleCheckout = (e) => {
        e.preventDefault();
        
        const address = document.getElementById('address').value;
        const phone = document.getElementById('phone').value;
        
        if(!address || !phone) {
            alert('Please fill out Address and Contact Number');
            return;
        }

        // Mock Order
        const orderId = `ORD-${Math.floor(Math.random()*100000)}`;
        localStorage.setItem('saga_demo_last_order', orderId);
        
        // Clear Cart
        localStorage.removeItem(CART_KEY);
        
        window.location.href = 'order-success.html';
    };

    document.getElementById('checkout-form').addEventListener('submit', handleCheckout);
    document.getElementById('btn-submit-sidebar').addEventListener('click', () => {
        document.getElementById('checkout-form').requestSubmit();
    });
}

document.addEventListener('DOMContentLoaded', initCheckout);
