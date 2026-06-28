# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Saga Elite — a MERN e-commerce platform for a Sri Lankan limited-edition ("drop-based") fashion brand. npm workspaces monorepo with two packages: `Server-side` (Express API) and `Client-Side` (React/Vite SPA). See `README.md` for the full business model, third-party service setup, and admin-role reference.

## Commands

Run from the **repo root** (root scripts proxy into the workspaces via `npm --prefix`):

```bash
npm install              # installs both workspaces
npm run dev              # backend + frontend concurrently (scripts/dev.cjs)
npm run dev:backend      # backend only
npm run dev:frontend     # frontend only (Vite on :5173)
npm run build            # builds Client-Side for production
npm run lint             # ESLint across both workspaces
npm start                # backend in production mode (node Server-side/server.js)
npm run seed:demo-admins # create/update demo admins for every role
npm run test:e2e         # Playwright e2e (config: e2e/playwright.config.js)
```

There is **no unit-test runner** — `Server-side` `npm test` is a stub (`exit 0`) and `Client-Side` has no test script. The only real tests are Playwright e2e under `e2e/`. To run a single e2e test: `npx playwright test --config=e2e/playwright.config.js <file> -g "<test name>"`.

Backend dev uses a custom watcher (`scripts/backend-watch.cjs`), not nodemon. Backend defaults to port **5001**, frontend to **5173**.

Docker is the alternative full-stack path: `docker compose up --build` (dev) / `docker-compose.prod.yml` (prod, adds nginx). Mongo runs externally (Atlas).

### Environment

A **single root `.env`** drives both workspaces. `Server-side/server.js` loads `../.env` first, then a local `.env`; Vite (`Client-Side/vite.config.js`) reads env from the root via `envDir: '../'`. Many env vars have multiple aliases (e.g. `MONGO_DB_URI`/`MONGO_URI`/`MONGODB_URI`) — set all aliases to the same value. `Config/runtime-config.js` (`validateRuntimeConfig()`) hard-fails startup if required vars are missing; optional services are feature-flagged off when blank. See README §"Prerequisites & Service Setup" for the full list.

## Architecture

### Backend (`Server-side/`, CommonJS)

Layered Express app. `server.js` is the entry: it wires middleware, mounts every route under `/api/v1/*`, creates the Socket.IO server, and runs `runDeferredStartupTasks()` (seeds, index reconciliation, and cron jobs) **after** `server.listen` so health checks stay responsive.

Directory roles:
- `Routes/` — one router per domain; mounted in `server.js`. Routes wire validation + auth middleware to controller methods.
- `Controllers/` — request handlers. Every async handler is wrapped in `Utils/catchAsync` (catches rejections → `next`), and errors are thrown as `new AppError(message, statusCode)` (`Utils/appError.js`). A single `Controllers/errorController.js` is the global error handler (mounted last).
- `Models/` — Mongoose schemas, **PascalCase filenames** (`User.js`, `Order.js`, `ManualPayment.js`).
- `Middlewares/` — auth, admin/permission gates, rate limiting, validation, guest/customer tracking, maintenance mode.
- `Utils/` — services and background jobs (email, socket, notifications, bank-email/SMS parsers, recommendation & smart-alert jobs, etc.).
- `Config/` — cors, cloudinary, runtime-config validation.
- `DataBase/db.js` — Mongo connection.
- `scripts/` — seed/migration scripts (run via `node scripts/<name>.js` or the `seed:*` npm scripts).

**Auth chain:** `auth-middleware.js` reads a JWT from `Authorization: Bearer` header **or** the `token` cookie, verifies it, loads the user, and sets `req.userInfo`. `optional-auth-middleware.js` is the non-throwing variant (used by `/check-auth`). Admin routes layer `admin-middleware.js` on top: `requireAdmin`, `requireSuperAdmin`, and `requirePermission(...keys)`.

**Roles & permissions** are centralized in `Utils/admin-roles.js` — the single source of truth for `ADMIN_ROLES`, `SUPER_ADMIN_ROLES`, the 11 `PERMISSION_KEYS`, the 5 sub-roles, and their default permission presets. Super admins bypass all permission checks. Always import role/permission logic from here rather than re-checking role strings inline.

**Real-time:** Socket.IO server is created in `server.js`, stored on `app.set("io", io)` and registered via `Utils/socket-service.js` (`setSocketServer`/`registerSocketHandlers`). Notifications go through `Utils/notification-service.js` + `Utils/socket-events.js`.

**Webhooks** mount outside `/api/v1`: `/api/webhooks/whatsapp` and `/api/webhooks/bank-sms`. **Dev-only** routes (`/api/v1/dev`) are only mounted when `NODE_ENV !== production`.

### Frontend (`Client-Side/`, ESM, React 19 + Vite)

- **State:** Redux Toolkit. Store assembled in `src/store/store.js`; each domain is a slice folder/file under `src/store/` (`auth-slice`, `cart-slice`, `order-slice`, `admin/*`, etc.). Async work uses `createAsyncThunk`. Note slices mix `.js` and `.jsx` extensions.
- **Routing:** all routes live in `src/App.jsx`. Three areas: **public** (`PublicLayout`), **`/admin/*`** (`AdminLayout` + per-route `<PermissionGuard permission="..."|superAdminOnly>`), and **`/shopping/*`** (`ShoppinLayout`). Admin page components are code-split via `React.lazy`; auth/shopping pages are eager. `CheckAuth` guards authenticated areas; `checkAuthAction` runs once on mount.
- **API calls:** use the shared `src/api/axiosInstance.js` — it sets `baseURL` to the v1 API, sends credentials, attaches a `Bearer` token from `localStorage.authToken`, auto-stores any `token` in responses, and clears it on 401. In dev, Vite proxies `/api/v1`, `/socket.io`, and `/Uploads` to the backend (`vite.config.js`), so the frontend is same-origin (important for cookies — see `Client-Side/README.md`).
- **Path alias:** `@/` → `src/`.
- **UI:** Tailwind CSS, Radix primitives + shadcn-style components in `src/components/ui/`. Admin shares primitives under `src/components/admin-components/_shared` and `_form`. Socket bridge is mounted app-wide (`SocketBridge`).

### Conventions worth matching

- Backend is CommonJS (`require`/`module.exports`); frontend is ESM. Don't mix.
- Wrap new async controllers in `catchAsync`; signal errors with `AppError`, never ad-hoc `res.status().json()` for error cases handled by the global handler.
- New env vars: add validation to `Config/runtime-config.js` if required, and remember the root-`.env`/alias pattern.
- Reuse `axiosInstance` for all frontend HTTP; don't import `axios` directly in feature code.
- Gate new admin pages with `PermissionGuard` (frontend) **and** `requirePermission` (backend) using a key from `admin-roles.js`.
