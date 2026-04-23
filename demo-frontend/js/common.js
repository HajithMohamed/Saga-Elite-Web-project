import { loadCart, cartTotals, loadWishlist, toggleWishlist } from './demo-state.js';

export function updateHeader() {
  const cart = loadCart();
  const totals = cartTotals(cart);
  const wishlist = loadWishlist();
  
  const cartCountElements = document.querySelectorAll('.cart-count');
  cartCountElements.forEach(el => {
    el.textContent = totals.count;
    el.style.display = totals.count > 0 ? 'flex' : 'none';
  });

  const wishlistCountElements = document.querySelectorAll('.wishlist-count');
  wishlistCountElements.forEach(el => {
    el.textContent = wishlist.length;
    el.style.display = wishlist.length > 0 ? 'flex' : 'none';
  });
}

// Global toggle for user menu and mobile menu
document.addEventListener('DOMContentLoaded', () => {
  const userMenuBtn = document.getElementById('user-menu-btn');
  const userMenu = document.getElementById('user-menu');
  const mobileMenuBtn = document.getElementById('mobile-menu-btn');
  const mobileMenu = document.getElementById('mobile-menu');

  if (userMenuBtn && userMenu) {
    userMenuBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      userMenu.classList.toggle('hidden');
    });
    document.addEventListener('click', () => userMenu.classList.add('hidden'));
    userMenu.addEventListener('click', (e) => e.stopPropagation());
  }

  if (mobileMenuBtn && mobileMenu) {
    mobileMenuBtn.addEventListener('click', () => {
      mobileMenu.classList.toggle('hidden');
    });
  }

  updateHeader();
  
  // Countdown Logic
  const nextDropDate = new Date();
  nextDropDate.setDate(nextDropDate.getDate() + 5); // Mock 5 days from now
  
  function updateCountdown() {
    const banner = document.getElementById('drop-banner-timer');
    if (!banner) return;
    
    const now = new Date();
    const diff = nextDropDate - now;
    
    if (diff <= 0) {
      banner.textContent = "00d 00h 00m 00s";
      return;
    }
    
    const d = Math.floor(diff / (1000 * 60 * 60 * 24));
    const h = Math.floor((diff / (1000 * 60 * 60)) % 24);
    const m = Math.floor((diff / 1000 / 60) % 60);
    const s = Math.floor((diff / 1000) % 60);
    
    banner.textContent = `${d}d ${String(h).padStart(2, '0')}h ${String(m).padStart(2, '0')}m ${String(s).padStart(2, '0')}s`;
  }
  
  setInterval(updateCountdown, 1000);
  updateCountdown();
});
