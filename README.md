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

## 👥 Contributors & Page-Wise Work Distribution  
---

### 🔹 HajithMohamed – Mohamed Hajith  
**Role:** Lead Developer / Project Coordinator  

**Assigned Modules / Pages:**
- 🏠 **Landing Page & Hero Section**
  - Drop showcase UI  
  - Brand story section  
  - Limited edition banners  
  - API integration for featured drops  
  - Admin drop controller  
- 🎁 **Surprise Gift System**
  - Gift tier logic  
  - Purchase amount mapping  
  - Admin gift configuration panel  
  - Gift assignment after order confirmation  
  - Email & web notification triggers  
- 🧠 **System Architecture**
  - Global API structure  
  - Socket.io core setup  
  - Authentication middleware  
  - Database design validation  

---

### 🔹 AKMJafran – AK. Mohamed Jafran  

**Assigned Modules / Pages:**
- 🛍️ **Product Listing & Drop Pages**
  - Drop-based product UI  
  - Filters (Unisex / Boys / Girls)  
  - Product cards  
  - Backend product APIs  
  - Stock validation logic  
  - Admin product management  
- 📦 **Stock System**
  - Real-time stock updates  
  - Low-stock alerts  
  - “Selling Fast” logic  
  - Socket.io stock broadcasting  

---

### 🔹 DhanuiyaJey – Dhanushiya  

**Assigned Modules / Pages:**
- 🧾 **Checkout & Order Flow**
  - Checkout UI  
  - Order creation logic  
  - Order status system  
  - Database order models  
- 💳 **Manual Payment System (Sri Lanka Model)**
  - Payment instruction page  
  - WhatsApp payment proof submission  
  - Payment states:
    - Pending  
    - Verified  
    - Rejected  
  - Admin payment confirmation panel  
- 📧 **Customer Notifications**
  - Order confirmation emails  
  - Payment status emails  
  - Web notifications  

---

### 🔹 Dharshika2018 – Thamilvanan Dharshika  

**Assigned Modules / Pages:**
- 👤 **User System**
  - Signup / Login pages  
  - JWT authentication  
  - User dashboard  
  - Order history  
  - Profile management  
- 🛠️ **Admin Panel Core**
  - Admin dashboard UI  
  - Order management  
  - User management  
  - Role-based access control  
- 🔔 **Admin Notifications**
  - New order alerts  
  - Payment proof alerts  
  - Stock alerts  
  - Drop alerts  

---

✅ This project follows a **page-wise full-stack collaboration model**, where each contributor:
- Designs UI  
- Builds APIs  
- Manages database schemas  
- Implements business logic  
- Develops admin controls  
- Handles notifications  


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




