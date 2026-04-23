# Saga Elite Static Frontend Demo

This demo folder contains a standalone frontend-only prototype for the Saga Elite project.
It uses plain HTML, vanilla JavaScript, and Tailwind CSS via CDN.

## Files
- `index.html` — demo homepage
- `product-listing.html` — product browsing and category filters
- `product-details.html` — product detail page with add-to-cart
- `cart.html` — cart page with quantity controls and summary
- `checkout.html` — checkout page with online/manual payment selection
- `admin-dashboard.html` — admin dashboard stub for demo purposes
- `js/demo-data.js` — mock products, drops, notifications, and gift tier rules
- `js/demo-state.js` — cart state and order persistence helpers
- `js/home.js` — homepage rendering logic
- `js/product-listing.js` — product listing page logic
- `js/product-details.js` — product details page logic
- `js/cart.js` — cart page logic
- `js/checkout.js` — checkout page logic
- `css/styles.css` — custom page styling

## Run locally
Open `demo-frontend/index.html` in a browser.

For a better local experience, use a lightweight static file server such as:
```bash
cd "c:\Fullstack development course\Saga-Elite-Web-Project\demo-frontend"
python -m http.server 8000
```
Then open `http://localhost:8000`.
