# Saga Elite — Production Deployment Guide

This guide covers deploying Saga Elite to its production stack:

| Layer    | Service              | What it hosts                          |
| -------- | -------------------- | -------------------------------------- |
| Frontend | **Netlify**          | React/Vite SPA (`Client-Side/`)        |
| Backend  | **Railway**          | Express API + Socket.IO (`Server-side/`) |
| Database | **MongoDB Atlas**    | Managed MongoDB cluster                |
| Media    | **Cloudinary**       | Product / banner image storage         |

> **Local development is unchanged.** It uses a single root `.env` (see the root
> `.env.example`). The per-workspace `Server-side/.env.example` and
> `Client-Side/.env.example` files document what each *deployment target* needs.

---

## 0. Recommended order

Because each side needs the other's URL, deploy in this order to avoid an extra
redeploy:

1. **MongoDB Atlas** — create the cluster + connection string (§3).
2. **Decide your Netlify site name** first (e.g. `saga-elite`) so you already
   know the frontend URL: `https://saga-elite.netlify.app`.
3. **Railway backend** — deploy with `FRONTEND_URL` / `CLIENT_URL` set to that
   Netlify URL (§1). Generate the public domain, e.g.
   `https://saga-elite-api.up.railway.app`.
4. **Netlify frontend** — deploy with `VITE_API_URL` pointing at the Railway
   domain (§2).
5. Run the **verification checklist** (§5).

---

## 1. Backend → Railway

A `railway.json` blueprint is included at the repo root (start command + health
check + restart policy). Railway builds with **Nixpacks** and pins the Node
version from `.nvmrc` (`20.19.0`).

| Setting             | Value                                   |
| ------------------- | --------------------------------------- |
| Builder             | Nixpacks (auto-detected)                |
| Root Directory      | *(repo root — leave blank / `/`)*       |
| Build               | `npm install` (auto, from the lockfile) |
| Start Command       | `npm start` (from `railway.json`)       |
| Health Check Path   | `/health` (from `railway.json`)         |
| Branch              | `Development` *(where the config lives)* |
| Node version        | `20.19.0` (from `.nvmrc`)               |

**Steps**

1. Go to [railway.com](https://railway.com) and **sign in with GitHub**.
2. **New Project → Deploy from GitHub repo** → authorize and select
   `Saga-Elite-Web-project`.
3. Open the service → **Settings → Source**: set **Branch = `Development`** and
   **Root Directory = `/`**. Railway picks up `railway.json` automatically.
4. Open the **Variables** tab and add the variables from the
   [Backend variables](#backend-environment-variables) table. **Minimum to boot
   and test login:** `NODE_ENV=production`, `MONGO_DB_URI`, `JWT_SECRET`,
   `FRONTEND_URL`, `CLIENT_URL`. Add the `CLOUDINARY_*` and `SMTP_*` sets for
   image uploads and email.
   - ⚠️ **Set `NODE_ENV=production` yourself** — Railway does **not** set it for
     you, and without it the app runs in dev mode (permissive CORS, non-secure
     cookies, file-only logging).
   - ⚠️ **Do NOT set `PORT`** — Railway injects it automatically and the server
     already reads `process.env.PORT`.
5. **Settings → Networking → Generate Domain** to get the public URL, e.g.
   `https://saga-elite-api.up.railway.app`.
6. Watch **Deploy Logs** until `MongoDB connected successfully` and
   `Server is listening` appear (redeploy from the Deployments tab if you added
   variables after the first build).
7. Verify `https://<your-domain>.up.railway.app/health` returns
   `{"status":"ok",...}`.

> **Plan note:** Railway has no permanent free tier — you get a one-time trial
> credit, then the usage-based Hobby plan (see
> [railway.com/pricing](https://railway.com/pricing)). The upside over a free
> tier is that the service does **not** sleep, so there are no cold starts.

---

## 2. Frontend → Netlify

A `netlify.toml` blueprint is included at the repo root (build command, publish
dir, Node version, and SPA redirect are pre-configured).

| Setting           | Value                |
| ----------------- | -------------------- |
| Base directory    | *(repo root — blank)* |
| Build command     | `npm run build`      |
| Publish directory | `Client-Side/dist`   |

**Steps**

1. **Add new site → Import an existing project**; connect this GitHub repo and
   pick the `Development` branch.
2. Netlify reads `netlify.toml` automatically — leave the build settings as
   detected.
3. **(Recommended)** Site settings → change the site name to your chosen slug so
   the URL is stable and matches what you set as `FRONTEND_URL` on Railway.
4. Under **Site settings → Environment variables**, add the
   [Frontend variables](#frontend-environment-variables). At minimum
   `VITE_API_URL`.
5. **Deploy site.** After the build, open the site and confirm it loads.

> If you deployed Railway *after* picking the Netlify name, double-check that
> Railway's `FRONTEND_URL` / `CLIENT_URL` exactly match the final Netlify URL
> (scheme + host, no trailing slash), then trigger a Railway redeploy.

---

## 3. Database → MongoDB Atlas

1. Create an account at [mongodb.com/atlas](https://www.mongodb.com/atlas) and a
   new **free (M0) cluster** (pick a region near you).
2. **Database Access → Add New Database User**: create a user with a strong
   password and the *Read and write to any database* role. Record the username
   and password.
3. **Network Access → Add IP Address**: for Railway, allow `0.0.0.0/0`
   (Railway egress IPs are dynamic). Tighten later if you adopt static egress.
4. **Connect → Drivers** to copy the connection string. It looks like:
   ```
   mongodb+srv://<username>:<password>@<cluster>.mongodb.net/?retryWrites=true&w=majority
   ```
5. Insert the password and a **database name** before the `?`:
   ```
   mongodb+srv://saga_user:S3cr3t@cluster0.ab12c.mongodb.net/sagaelite?retryWrites=true&w=majority
   ```
6. Use this as `MONGO_DB_URI` on Railway.

---

## 4. Environment variable reference

### Backend environment variables

Set these on **Railway** (Variables tab). Required ones block startup or core
features if missing.

| Variable | Description | Example | Required |
| -------- | ----------- | ------- | -------- |
| `NODE_ENV` | Runtime mode; enables prod CORS, secure cookies, stdout logging — **Railway does not set this for you** | `production` | ✅ |
| `MONGO_DB_URI` | MongoDB Atlas connection string (incl. db name) | `mongodb+srv://user:pass@c0.mongodb.net/sagaelite` | ✅ |
| `JWT_SECRET` | Secret used to sign JWTs — **min 32 chars** | *(32+ random chars)* | ✅ |
| `FRONTEND_URL` | SPA origin; gates CORS + Socket.IO in production | `https://saga-elite.netlify.app` | ✅ |
| `CLIENT_URL` | Socket.IO allowed origin (usually = `FRONTEND_URL`) | `https://saga-elite.netlify.app` | ✅ |
| `FRONTEND_URLS` | Extra comma-separated origins | `https://www.sagaelite.com` | Optional |
| `JWT_EXPIRES_IN` | Token lifetime | `7d` | Optional (default `7d`) |
| `JWT_COOKIE_EXPIRES_IN` | Cookie lifetime in days | `7` | Optional (default `7`) |
| `LOG_LEVEL` | Winston level | `info` | Optional |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name | `saga-elite` | ✅ (image uploads) |
| `CLOUDINARY_API_KEY` | Cloudinary API key | `1234567890` | ✅ (image uploads) |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret | *(secret)* | ✅ (image uploads) |
| `SMTP_HOST` | SMTP server host | `smtp.gmail.com` | ✅ (email) |
| `SMTP_PORT` | SMTP port | `587` | ✅ (email) |
| `SMTP_USER` | SMTP username | `apikey` / account | ✅ (email) |
| `SMTP_PASS` | SMTP password / app password | *(secret)* | ✅ (email) |
| `FROM_EMAIL` | "From" address on outgoing mail | `noreply@sagaelite.com` | ✅ (email) |
| `FROM_NAME` | "From" display name | `Saga Elite` | Optional |
| `ADMIN_EMAIL` | Admin notification recipient | `admin@sagaelite.com` | Optional |
| `GOOGLE_CLIENT_ID` | Google OAuth client id (server check) | *(client id)* | Optional |
| `FACEBOOK_APP_ID` / `FACEBOOK_APP_SECRET` | Facebook login | *(app id/secret)* | Optional |
| `PAYHERE_MERCHANT_ID` / `PAYHERE_MERCHANT_SECRET` / `PAYHERE_SANDBOX` | PayHere gateway | *(merchant creds)* | Optional |
| `MANUAL_PAYMENT_*` | Bank-transfer display details on checkout | see `Server-side/.env.example` | Optional |
| `BANK_INBOX_*` / `BANK_SMS_WEBHOOK_SECRET` | Auto-confirm bank transfers | see template | Optional |
| `WHATSAPP_*` | WhatsApp Cloud API (order alerts / OTP) | see template | Optional |
| `OPENAI_API_KEY` / `OPENAI_MODEL` | Review classification & recommendations | `sk-...` / `gpt-4o-mini` | Optional |

> Do **not** set `PORT` — Railway injects it. The full annotated list is in
> **`Server-side/.env.example`**.

### Frontend environment variables

Set these on **Netlify** (read at build time; `VITE_`-prefixed only).

| Variable | Description | Example | Required |
| -------- | ----------- | ------- | -------- |
| `VITE_API_URL` | Absolute backend API URL incl. `/api` (app appends `/v1`) | `https://saga-elite-api.up.railway.app/api` | ✅ |
| `VITE_SOCKET_URL` | Socket.IO origin; derived from `VITE_API_URL` if blank | `https://saga-elite-api.up.railway.app` | Optional |
| `VITE_APP_NAME` | Display name | `Saga Elite` | Optional |
| `VITE_GOOGLE_CLIENT_ID` | Google OAuth client id (blank hides the button) | *(client id)* | Optional |
| `VITE_FACEBOOK_APP_ID` | Facebook app id (blank hides the button) | *(app id)* | Optional |

> The full list is in **`Client-Side/.env.example`**.

---

## 5. Final verification checklist

After both sides are live, confirm each item:

- [ ] **No secrets in the repo** — `git ls-files | grep -i env` returns only
      `*.env.example` files (and `e2e/.env.test.example`).
- [ ] **Backend health** — `GET /health` on the Railway URL returns `200 ok`.
- [ ] **MongoDB connects** — Railway logs show `MongoDB connected successfully`.
- [ ] **Auth works** — register / log in from the live site; a session persists
      on refresh.
- [ ] **CORS** — no CORS errors in the browser console on the live site.
- [ ] **Socket.IO** — realtime features (notification bell, order updates)
      connect; no websocket errors in the console.
- [ ] **Image uploads** — an admin can upload a product image (Cloudinary).
- [ ] **Email** — a transactional email (e.g. OTP / order confirmation) is
      received.
- [ ] **Production build** — `npm run build` completes without errors.
- [ ] **No localhost references** — the network tab shows requests to the
      Railway URL, not `localhost`.

---

## 6. Redeploying after changes

- **Code:** push to the connected branch — Railway and Netlify auto-deploy.
- **Env vars:** see `CLIENT_HANDOVER.md` for how the client updates and restarts
  each service, and how to rotate a leaked secret.
