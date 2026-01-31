# Saga Elite (SE Limited Edition Fashion Platform)
_Unisex | Youth-Driven | Statement Style_  
**Tagline:** Rare Fit Forever

---

## 📌 Project Overview

**Saga Elite (SE Limited Edition Fashion)** is a full-stack **MERN e-commerce platform** developed for a Sri Lankan limited-edition fashion brand.

The system follows a **drop-based selling model**, where products are released in limited quantities as themed drops instead of traditional category-based selling.

The platform supports:
- Unisex, Boys, and Girls product types  
- Hybrid payment system (online + manual)  
- Surprise gift system  
- Real-time stock updates  
- Admin management system  
- Customer engagement automation  

This project is developed as a **university group project**, while applying **real-world startup architecture, DevOps practices, and scalable system design**.

---

## 👥 Project Team

| Role | Name | Responsibilities |
|-----|------|------------------|
| **Lead Developer** | Mohamed Hajith | Overall project management, system architecture, MERN stack integration, code review |
| **Frontend Developer** | Member 1 | React.js components, responsive UI, Redux state management |
| **Backend Developer** | Member 2 | Node.js & Express APIs, MongoDB schema design, authentication, stock management |
| **Fullstack / Admin Panel Developer** | Member 3 | Admin panel, email notifications, WhatsApp integration, deployment support |

---

## 🎯 Business Model

### 🔹 Drop-Based Selling
- Products are released as limited **Drops**
- Each drop includes:
  - Theme
  - Story
  - Limited stock
  - Limited availability
- Sold-out drops are archived

### 🔹 Product Classification
- **Unisex**
- **Boys**
- **Girls**

---

## 🎁 Surprise Gift System

Every confirmed order receives a surprise gift.

Gift tier is based on purchase value:

| Order Amount (LKR) | Gift Tier |
|--------------------|-----------|
| 1,000 – 2,999 | Basic Gift |
| 3,000 – 5,999 | Standard Gift |
| 6,000 – 9,999 | Premium Gift |
| 10,000+ | Elite Gift |

**Rules:**
- Gifts are assigned only after payment confirmation  
- Gifts are hidden until confirmation  
- Managed via admin panel  

---

## 💳 Hybrid Payment System

### 🔹 Online Payments (Automated)
Supported methods:
- **PayHere (Sri Lanka Gateway)**
- **Card Payments (Visa / MasterCard)**
- **Google Pay**

**Flow:**
```
Checkout → Online Payment → Success → Auto-confirm Order → Gift Assigned → Notifications
```

---

### 🔹 Manual Payments (Verification-Based)

Supported methods:
- Bank transfer  
- Mobile banking  
- ATM slips / deposit slips  

**Flow:**
```
Checkout → Manual Payment → Instructions → WhatsApp Proof → Admin Verify → Confirm → Gift Assigned
```

---

## ✨ Features

### 🛍 Customer Features
- Premium homepage with drops
- Product listings
- Product detail pages
- Filters (Unisex / Boys / Girls)
- Cart system
- Checkout system
- Hybrid payment support
- Real-time stock alerts
- Surprise gift system
- User authentication
- User dashboard
- WhatsApp support
- Email notifications
- Web notifications
- Fully responsive UI

---

### 🛠 Admin Panel Features
- Drop management
- Product management
- Stock management
- Gift tier management
- Manual payment verification
- Online payment tracking
- Order management
- User management
- Notification management
- Role-based access control
- Real-time monitoring

---

## 🔔 Notification System

### Email
- Signup confirmation  
- Order confirmation  
- Payment confirmation  
- Payment rejection  
- Gift assigned  
- Order shipped  

### Web Notifications (Socket.io)
- New order alerts  
- Stock alerts  
- Drop sold-out alerts  
- Payment updates  
- Admin dashboard alerts  

---

## 🧩 Tech Stack

### Client-Side
- React.js  
- Redux Toolkit  
- Tailwind CSS  

### Server-Side
- Node.js  
- Express.js  

### Database
- MongoDB Atlas  

### Payments
- PayHere  
- Google Pay  
- Card Payments  
- Manual Bank Payments  

### Real-Time
- Socket.io  

### DevOps
- Docker  
- Docker Compose  
- GitHub Actions (CI)  
- GitHub Branch Protection  

---

## 🐳 Docker Support

### Services:
- Client-Side (React)
- Server-side (Node.js API)
- MongoDB
- Nginx (optional)

### Run with Docker:
```bash
docker-compose up --build
```

---

## ⚙ GitHub CI Integration

### CI Capabilities:
- Runs on all branches
- Runs on pull requests to `main`
- Builds Client-Side
- Builds Server-side
- Runs tests
- Blocks broken merges
- Enforces clean code merging

**Workflow:**
```
Push → CI Run → Build → Test → PR → Review → Merge to main
```

---

## 📁 Repository Structure

```
Saga-Elite-Web-project
├── Client-Side/     # React App
├── Server-side/     # Node.js + Express API
├── .github/
│   └── workflows/
│       └── ci.yml   # GitHub CI Pipeline
├── docker-compose.yml
└── README.md
```

---

## 👥 Contributors

- **HajithMohamed** – Mohamed Hajith
- **AKMJafran** – AK. Mohamed Jafran
- **DhanuiyaJey** – Dhanushiya
- **Dharshika2018** – Thamilvanan Dharshika

---

## 🚀 Deployment Plan

- Client-Side → Vercel / Netlify
- Server-side → Render / AWS
- Database → MongoDB Atlas
- Domain & SSL → Hosting provider

---

## 🧪 Testing & Quality Assurance

- Unit testing
- API testing
- Integration testing
- Manual testing
- CI automated checks
- Security validation
- Performance testing

---

## 🎓 Academic Context

This is a **4-member undergraduate group project** developed using:

- Real business requirements
- Startup architecture
- DevOps practices
- Hybrid payment systems
- Scalable system design
- Real-world software engineering standards

---

## 🔗 Design Reference

[https://parkofideas.com/moderno/demo/home-3/](https://parkofideas.com/moderno/demo/home-3/)

---

## 📝 License

Academic & portfolio use only.

---

## Author

**Mohamed Hajith**  
Lead Developer – MERN Stack  
SE Limited Edition Fashion Project
