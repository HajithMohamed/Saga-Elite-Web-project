# SE Limited Edition Fashion (Saga Elite)  
_Unisex | Youth-Driven | Statement Style_  
**Tagline:** Rare Fit Forever

---

## 📌 Project Overview

**SE Limited Edition Fashion (Saga Elite)** is a drop-based, limited-edition fashion e-commerce platform built with the **MERN stack**.

The platform is designed for a **Sri Lankan startup clothing brand**, focusing on **unisex streetwear**, while also supporting **Boys / Girls** classifications. Products are released as **limited drops** that create exclusivity and urgency.

A key highlight of this platform is the **Surprise Gift System**, where customers receive a free gift depending on their purchase amount once the payment is confirmed.

This repository contains the full web application:
- Customer frontend
- Admin panel
- Backend API
- Real-time features (Socket.io)

---

## 👥 Target Audience

- Teenagers & young adults (16–30)  
- Fashion-forward individuals  
- Limited-edition streetwear lovers  
- Customers who value unisex, boys, and girls products

---

## 🎨 Brand Tone & Identity

- **Tone:** Friendly, confident, luxury with emotion  
- **Style:** Dark luxury theme (Black / Gold / White)  
- **Brand Colors:**  
  - Black: `#0A0A0A`  
  - Gold: `#D4AF37`  
  - White: `#FFFFFF`

---

## 🧠 Business Model — Drop Based Selling

- Products are released in **Drops** (themed collections)
- Each drop includes:
  - A story or concept
  - Limited stock
  - Temporary availability
- Ads, banners, and hero UI components show drop highlights
- Sold-out drops are archived

---

## 👕 Product Classification

Products can be one of:
- **Unisex**
- **Boys**
- **Girls**

This provides flexible filtering while maintaining a streamlined catalog.

---

## 🎁 Surprise Gift System

Every confirmed order receives a surprise gift, with the gift tier based on purchase value:

| Order Amount (LKR) | Gift Tier |
|--------------------|------------|
| 1,000 – 2,999      | Basic Gift |
| 3,000 – 5,999      | Standard Gift |
| 6,000 – 9,999      | Premium Gift |
| 10,000+            | Elite Gift |

Gifts are:
- Configured via the admin panel
- Assigned automatically after payment confirmation
- Not visible before confirmation

---

## ✨ Features

### 🛍️ Customer-Facing Features
- Premium homepage with drop showcase
- Drop listing and product catalog
- Product detail pages with stock status
- Product filters (Unisex / Boys / Girls)
- Real-time stock updates (Socket.io)
- Cart and checkout pages
- Login / Signup
- Customer dashboard (order history)
- Surprise gift alerts
- One-click WhatsApp support
- Responsive design

---

## 💳 Manual Payment Workflow (Sri Lanka)

This project uses a **manual payment confirmation system** suitable for Sri Lankan users:

### Supported Payments
- Bank transfer (online/mobile)
- Mobile banking apps (e.g., Genie, FriMi)
- ATM slips / deposit slips

### Confirmation Flow
1. Customer places order → `Pending Payment`  
2. Instructions displayed at checkout  
3. User sends payment proof via WhatsApp  
4. Admin reviews and confirms or rejects  
5. Order status updated accordingly

---

## 🔔 Notification System

### Email Notifications
Customers:
- Signup confirmation
- Order received
- Payment confirmed / rejected
- Surprise gift assigned
- Order shipped

Admins:
- New order received
- Payment proof received
- Low stock alerts
- Drop sold out alerts

### Web Notifications (Socket.io)
- Live stock changes
- New order alerts
- Admin dashboard notifications

---

## 🛠️ Admin Panel Features

- Manage Drops
- Manage Products (Unisex / Boys / Girls)
- Surprise gift configuration
- Manual payment confirmation
- Order & user management
- Image management (separate model)
- Real-time stock monitoring
- Role-based access control

---

## 🧩 Tech Stack

**Frontend**  
- React.js  
- Redux Toolkit  
- Tailwind CSS

**Backend**  
- Node.js  
- Express.js

**Database**  
- MongoDB Atlas

**Real-Time**  
- Socket.io

**Image Storage**  
- Cloudinary

---

## 👨‍💻 Project Contributors

This project is built collaboratively with multiple contributors (from the GitHub repository).  
Replace the placeholders with the actual GitHub usernames from the **Contributors** section in your repo settings.

- **@HajithMohamed** – Lead Developer / Team Coordinator  
- **@<collaborator2-github>** – Drop & Homepage System  
- **@<collaborator3-github>** – Product Pages & Stock Logic  
- **@<collaborator4-github>** – Orders, Manual Payment, Surprise Gift Logic  
- **@<collaborator5-github>** – Admin Panel & Notifications

*(Update each username exactly from GitHub Insights → Contributors)*

---

---

## 🚀 Deployment

- **Frontend:** Vercel / Netlify  
- **Backend:** Render / AWS EC2 / Heroku  
- **Database:** MongoDB Atlas  
- **Domain & SSL:** Configured via hosting provider

---

## 📚 Academic Context

This is a **4-member undergraduate group project** applying real-world startup requirements with full-stack MERN development.

---

## 🔗 Design Reference

Design inspiration:  
https://parkofideas.com/moderno/demo/home-3/

---

## 📝 License

Open for academic and portfolio use.



