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
- `FRONTEND_PORT` and `BACKEND_PORT` if you need different host ports

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
> `docker-compose.yaml` (they use variable substitution).  The root npm
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

- Backend will listen on the port defined by `BACKEND_PORT`/`PORT` in your `.env` (defaults to 5001 if you omit the variable).
  The `docker-compose.yaml` file uses `:${BACKEND_PORT:-5001}` so a container
  will still publish port 5001 even when no `.env` file is present; however you
  should still create a `.env` so your own value is persisted.
- Frontend runs on port 5173 (or 5174 when served through Docker).

Other root-level scripts:

```bash
npm run build            # builds the frontend for production
npm run lint             # runs ESLint across both projects
npm start                # launches the backend in production mode
```

The root scripts simply proxy into the corresponding `Server-side` or `Client-Side` commands using [`concurrently`](https://www.npmjs.com/package/concurrently). Feel free to run the individual projects manually if you prefer.

#### (B) Using Docker (Recommended for full-stack environment)

Docker quick notes for a fresh machine:

- Frontend default URL: `http://localhost:5174`
- Backend default URL: `http://localhost:5001/api`
- Frontend hot reload uses polling for better Docker Desktop compatibility
- Backend uses `nodemon --legacy-watch` for shared-volume reloads
- `host.docker.internal` is mapped for the backend container

```bash
# make sure you have a `.env` file at the root; you can copy
# `.env.example` and edit as needed.  If you forget, Docker will still start
# and publish port 5001 using the built-in default, but the service won’t
# reflect your custom configuration.

docker compose up --build
```

- Frontend: http://localhost:5174
- Backend API: http://localhost:5001/api (or whatever `BACKEND_PORT` you set)

This is the same as before and remains the easiest way to get a fully containerised environment.

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
- If ports are busy, change them in `docker-compose.yaml` and `.env`
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

