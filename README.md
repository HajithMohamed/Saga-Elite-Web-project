# Saga Elite (SE Limited Edition Fashion Platform)
_Unisex | Youth-Driven | Statement Style_  
**Tagline:** Rare Fit Forever


## 📌 Project Overview

---

## 🚀 Getting Started (For Developers)

### Prerequisites

- [Git](https://git-scm.com/downloads)
- [Docker & Docker Compose](https://docs.docker.com/get-docker/)
- [Node.js & npm](https://nodejs.org/) (for manual/local dev; **Node 18+ is required**)

---

### 1. Clone the Repository

```bash
git clone https://github.com/<your-org-or-username>/Saga-Elite-Web-Project.git
cd Saga-Elite-Web-Project
```

---

### 2. Environment Variables

Current recommended setup:

```bash
cp .env.example .env
```

Use the root `.env` for both services. For Docker-based development on another
computer, make sure these values are set correctly:

- `MONGO_DB_URI`
- `JWT_SECRET`
- `EMAIL` and `PASS`
- `CLOUDINARY_*`
- `GOOGLE_CLIENT_ID`
- `HOST_FRONTEND_PORT` and `HOST_BACKEND_PORT` if you need different Docker host ports

If MongoDB is running on your computer and the backend runs in Docker, use
`host.docker.internal` instead of `localhost` in `MONGO_DB_URI`.

Optional (helpful for local development):

- `VITE_SOCKET_URL` to force the Socket.IO base URL (defaults to API host or window origin).
- `RATE_LIMIT_DEV_MULTIPLIER` to loosen rate limits in non-production (defaults to 10x).
- `RATE_LIMIT_*_MAX` and `RATE_LIMIT_*_WINDOW_MS` to override specific limiter values
  (`LOGIN`, `AUTH`, `GENERAL`, `CONTACT`).

The preferred pattern is to maintain a single `.env` file at the workspace root
which contains **all** the variables needed by both backend and frontend.
The backend code will automatically load the root `.env` (even when run from
`Server-side/`), so you normally do **not** need a second file.  A
`Server-side/.env` can still be used for overrides during isolated local
development, but it’s optional.

```bash
# create the shared workspace environment file
cp .env.example .env

# (optional) copy backend template if you need a local override
cp Server-side/.env.example Server-side/.env
```

Fill the resulting file(s) with your Mongo URI, JWT secret, Cloudinary keys,
mail credentials, etc.  The root `.env` additionally defines `BACKEND_PORT`
(mirrored to `PORT` for the server) and `VITE_API_URL` for the frontend.

> **Note:** Changing port numbers? Update both `.env` and
> `docker-compose.yml` (they use variable substitution).  The root npm
> scripts already read from the workspace `.env` when running
> `npm run dev`.
---

### 3. Start the Project

You now have two primary ways to start the system: via the workspace npm scripts or with Docker. The **workspace root** `package.json` contains helpers that run both backend and frontend in parallel, so you rarely need to navigate into subfolders manually.

#### (A) Workspace npm commands (recommended for manual development)

```bash
# from the repo root
npm install              # installs dependencies for both Server-side and Client-Side
npm run dev              # starts backend + frontend concurrently
```

- Backend will listen on the port defined by `PORT`/`BACKEND_PORT` in your `.env` (defaults to 5001 if you omit the variable).
  Docker publishes that service through `HOST_BACKEND_PORT`, which defaults to `5001`.
- Frontend runs on port 5173. Docker publishes it through `HOST_FRONTEND_PORT`, which defaults to `5173`.

Other root-level scripts:

```bash
npm run build            # builds the frontend for production
npm run lint             # runs ESLint across both projects
npm start                # launches the backend in production mode
```

The root scripts simply proxy into the corresponding `Server-side` or `Client-Side` commands using [`concurrently`](https://www.npmjs.com/package/concurrently). Feel free to run the individual projects manually if you prefer.

#### (B) Using Docker (recommended for a full-stack environment)

Docker is the fastest way to initialize the project on a fresh machine because it builds both the backend API and frontend app from the root workspace.

```bash
# first time only
cp .env.example .env

# edit .env with real MongoDB Atlas, JWT, email, Cloudinary, and payment values

# build and start the development containers
docker compose up --build
```

Development access points:

- Frontend: `http://localhost:5173` or `http://localhost:${HOST_FRONTEND_PORT}`
- Backend health check: `http://localhost:5001/health`
- Backend API: `http://localhost:5001/api/v1` or `http://localhost:${HOST_BACKEND_PORT}/api/v1`

Common Docker commands:

```bash
docker compose up -d --build        # start in the background
docker compose logs -f backend      # follow backend logs
docker compose logs -f frontend     # follow frontend logs
docker compose down                 # stop containers
docker compose down -v              # stop and remove anonymous volumes
```

Docker development notes:

- The root `.env` is loaded by the backend container through `env_file`.
- `HOST_BACKEND_PORT` defaults to `5001`; `HOST_FRONTEND_PORT` defaults to `5173`.
- Frontend requests use `VITE_API_URL=http://localhost:${HOST_BACKEND_PORT:-5001}/api/v1`.
- If MongoDB runs on your host machine, use `host.docker.internal` instead of `localhost` in the Mongo URI.
- MongoDB Atlas users must whitelist their current public IP before starting the backend.

Production initialization:

```bash
# create a production .env first, then run:
docker compose -f docker-compose.prod.yml up -d --build

# stop production containers
docker compose -f docker-compose.prod.yml down
```

#### (C) Manual/Local Development (alternate two-terminal approach)

You can still open separate shells if you like:

**Backend:**
```bash
cd Server-side
npm install
npm run dev
# Runs on http://localhost:5001
```

**Frontend:**
```bash
cd Client-Side
npm install
npm run dev -- --host
# Runs on http://localhost:5173
```

The behaviours are identical to the workspace commands above, just executed from inside each subfolder.

---

### 4. Useful Scripts

All of these may be executed from the **workspace root**; the root `package.json` will delegate to the appropriate sub‑project:

- `npm run dev` – start both backend and frontend concurrently
- `npm run build` – build the frontend for production
- `npm run lint` – run ESLint across the entire repository (JS/JSX/TS/TSX)
- `npm start` – start the backend in production mode

You can also execute the equivalent commands inside `Server-side` or `Client-Side` if you prefer working in isolated terminals.

---

### 5. Troubleshooting

- Ensure MongoDB URI is correct in `.env`
- If ports are busy, change them in `docker-compose.yml` and `.env`
- For Docker issues, try `docker compose down -v` then `docker compose up --build`
- For Windows: Use Git Bash or WSL for best compatibility

---

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
- **PayHere (Sri Lankan Payment Gateway)**
- **Google Pay**

**Flow:**
```
Checkout → Select Online Payment → PayHere/Google Pay → Payment Success → Auto-confirm Order → Gift Assigned → Notifications
```

**Features:**
- Instant payment confirmation
- Automatic order processing
- Real-time payment status updates
- Secure payment gateway integration

---

### 🔹 Manual Payments (Verification-Based)

Supported methods:
- Bank transfer  
- Mobile banking (Commercial Bank, Sampath Bank, etc.)
- ATM deposits
- Cash deposits

**Flow:**
```
Checkout → Select Manual Payment → View Bank Details → Make Payment → Upload Proof via WhatsApp → Admin Verification → Order Confirmation → Gift Assigned → Notifications
```

**Features:**
- Flexibility for customers without online payment options
- WhatsApp-based proof submission
- Admin verification system
- Manual confirmation process

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

## Admin Roles and Access Restrictions

The admin area uses role-based access control backed by `Server-side/Utils/admin-roles.js` and enforced by `Server-side/Middlewares/admin-middleware.js`.

### Admin role levels

| Role | Purpose | Access |
|------|---------|--------|
| `super_admin` / `superadmin` | Platform owner / highest privileged user | Bypasses permission checks, manages admins, views admin logs and system stats |
| `admin` | Full operational admin | Gets all admin permissions by default, except super-admin-only account control |
| `sub_admin` | Restricted admin account | Access depends on assigned sub-role and permission flags |
| `customer` / `user` | Shopper account | No admin panel access |

### Sub-admin roles

| Sub-role | Default permissions |
|----------|---------------------|
| `order_manager` | Orders and manual payment verification |
| `product_manager` | Products, drops, and inventory management |
| `marketing_manager` | Notifications, analytics, and campaigns |
| `support_admin` | Orders, users, and review moderation |
| `inventory_manager` | Products and inventory management |

### Permission keys

Admin routes can require one or more of these permissions:

- `products`
- `orders`
- `users`
- `notifications`
- `drops`
- `verifyPayments`
- `manageReviews`
- `viewAnalytics`
- `sendCampaigns`
- `manageInventory`
- `manageAdmins`

### Restriction rules

- All admin pages require authentication and an admin-level role.
- Super admins can access every admin feature and are the only users allowed into the super-admin console.
- Only super admins can create admins, change admin roles, update admin permissions, deactivate/reactivate admins, and view privileged activity logs.
- Super admin accounts cannot be modified through the normal admin-management actions.
- Sub-admins must have the required permission flag for each protected route.
- Customers/users are blocked from admin routes even if they are authenticated.
- Admin and super-admin users are blocked from Google customer sign-in flow.

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
- `frontend`: React/Vite development server from `Client-Side/Dockerfile`
- `backend`: Node.js/Express API from `Server-side/Dockerfile`
- Production adds `nginx` through `docker-compose.prod.yml`

MongoDB is expected to run externally, usually through MongoDB Atlas. Configure it with `MONGO_URI` or the matching MongoDB variable in `.env`.

### Initialize Docker development:
```bash
cp .env.example .env
docker compose up --build
```

### Initialize Docker production:
```bash
docker compose -f docker-compose.prod.yml up -d --build
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
├── .env                # shared environment variables for both services
├── package.json        # root npm scripts (dev/build/lint/start)
├── docker-compose.yml
├── Client-Side/        # React App
├── Server-side/        # Node.js + Express API
├── .github/
│   └── workflows/
│       └── ci.yml      # GitHub CI Pipeline
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

