const CART_KEY = 'saga-demo-cart';
const ORDERS_KEY = 'saga-demo-orders';

export function loadCart() {
  try {
    const value = localStorage.getItem(CART_KEY);
    return value ? JSON.parse(value) : [];
  } catch (error) {
    return [];
  }
}

export function saveCart(cart) {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
}

export function addToCart(product, variant, quantity = 1) {
  const cart = loadCart();
  const existing = cart.find((item) => item.slug === product.slug && item.variant === variant);
  if (existing) {
    existing.quantity += quantity;
  } else {
    cart.push({
      id: product.id,
      slug: product.slug,
      name: product.name,
      price: product.price,
      variant,
      quantity,
      image: product.image
    });
  }
  saveCart(cart);
  return cart;
}

export function removeFromCart(itemSlug, variant) {
  const cart = loadCart();
  const next = cart.filter((item) => !(item.slug === itemSlug && item.variant === variant));
  saveCart(next);
  return next;
}

export function updateCartQuantity(itemSlug, variant, quantity) {
  const cart = loadCart();
  const next = cart.map((item) => {
    if (item.slug === itemSlug && item.variant === variant) {
      return { ...item, quantity: Math.max(1, quantity) };
    }
    return item;
  });
  saveCart(next);
  return next;
}

export function cartTotals(cart) {
  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  return { subtotal, count: cart.reduce((sum, item) => sum + item.quantity, 0) };
}

export function placeOrder(order) {
  const orders = loadOrders();
  const next = [...orders, order];
  localStorage.setItem(ORDERS_KEY, JSON.stringify(next));
  saveCart([]);
  return next;
}

export function loadOrders() {
  try {
    const value = localStorage.getItem(ORDERS_KEY);
    return value ? JSON.parse(value) : [];
  } catch (error) {
    return [];
  }
}

export function formatCurrency(value) {
  return new Intl.NumberFormat('en-LK', { style: 'currency', currency: 'LKR' }).format(value);
}
