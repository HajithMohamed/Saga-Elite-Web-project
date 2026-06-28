# Saga Elite — Production Deployment Guide

This guide covers deploying Saga Elite to its production stack:

| Layer    | Service              | What it hosts                          |
| -------- | -------------------- | -------------------------------------- |
| Frontend | **Netlify**          | React/Vite SPA (`Client-Side/`)        |
| Backend  | **Render**           | Express API + Socket.IO (`Server-side/`) |
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
3. **Render backend** — deploy with `FRONTEND_URL` / `CLIENT_URL` set to that
   Netlify URL (§1). Copy the resulting API URL, e.g.
   `https://saga-elite-api.onrender.com`.
4. **Netlify frontend** — deploy with `VITE_API_URL` pointing at the Render URL
   (§2).
5. Run the **verification checklist** (§5).

---

## 1. Backend → Render

A `render.yaml` blueprint is included at the repo root. You can either import it
(**New → Blueprint**) or configure a Web Service manually with the settings
below.

| Setting             | Value                                   |
| ------------------- | --------------------------------------- |
| Runtime             | Node                                    |
| Root Directory      | *(repo root — leave blank)*             |
| Build Command       | `npm install`                           |
| Start Command       | `npm start`                             |
| Health Check Path   | `/health`                               |
| Node version        | `20.19.0` (set via `NODE_VERSION` / `.nvmrc`) |

**Steps**

1. Create a Render account and **New → Web Service**; connect this GitHub repo.
2. Apply the settings in the table above.
3. Under **Environment**, add the variables from the
   [Backend variables](#backend-environment-variables) table. At minimum:
   `MONGO_DB_URI`, `JWT_SECRET`, `FRONTEND_URL`, `CLIENT_URL`, the three
   `CLOUDINARY_*`, and the `SMTP_*` set.
4. **Create Web Service** / **Deploy**. Watch the logs until
   `Server is listening` appears.
5. Verify `https://<your-service>.onrender.com/health` returns
   `{"status":"ok",...}`.

> **Free plan note:** Render free services sleep after inactivity and cold-start
> on the next request (~30–60s). The `/health` endpoint is used for health
> checks and to keep it warm if you add an external pinger.

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

1. **Add new site → Import an existing project**; connect this GitHub repo.
2. Netlify reads `netlify.toml` automatically — leave the build settings as
   detected.
3. **(Recommended)** Site settings → change the site name to your chosen slug so
   the URL is stable and matches what you set as `FRONTEND_URL` on Render.
4. Under **Site settings → Environment variables**, add the
   [Frontend variables](#frontend-environment-variables). At minimum
   `VITE_API_URL`.
5. **Deploy site.** After the build, open the site and confirm it loads.

> If you deployed Render *after* picking the Netlify name, double-check that
> Render's `FRONTEND_URL` / `CLIENT_URL` exactly match the final Netlify URL
> (scheme + host, no trailing slash), then trigger a Render redeploy.

---

## 3. Database → MongoDB Atlas

1. Create an account at [mongodb.com/atlas](https://www.mongodb.com/atlas) and a
   new **free (M0) cluster**.
2. **Database Access → Add New Database User**: create a user with a strong
   password and the *Read and write to any database* role. Record the username
   and password.
3. **Network Access → Add IP Address**: for Render, allow `0.0.0.0/0`
   (Render egress IPs are dynamic on the free plan). Tighten later if you move
   to a paid plan with static outbound IPs.
4. **Connect → Drivers** to copy the connection string. It looks like:
   ```
   mongodb+srv://<username>:<password>@<cluster>.mongodb.net/?retryWrites=true&w=majority
   ```
5. Insert the password and a **database name** before the `?`:
   ```
   mongodb+srv://saga_user:S3cr3t@cluster0.ab12c.mongodb.net/sagaelite?retryWrites=true&w=majority
   ```
6. Use this as `MONGO_DB_URI` on Render.

---

## 4. Environment variable reference

### Backend environment variables

Set these on **Render**. Required ones block startup or core features if missing.

| Variable | Description | Example | Required |
| -------- | ----------- | ------- | -------- |
| `NODE_ENV` | Runtime mode; enables prod CORS, secure cookies, stdout logging | `production` | ✅ |
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

> The full annotated list is in **`Server-side/.env.example`**.

### Frontend environment variables

Set these on **Netlify** (read at build time; `VITE_`-prefixed only).

| Variable | Description | Example | Required |
| -------- | ----------- | ------- | -------- |
| `VITE_API_URL` | Absolute backend API URL incl. `/api` (app appends `/v1`) | `https://saga-elite-api.onrender.com/api` | ✅ |
| `VITE_SOCKET_URL` | Socket.IO origin; derived from `VITE_API_URL` if blank | `https://saga-elite-api.onrender.com` | Optional |
| `VITE_APP_NAME` | Display name | `Saga Elite` | Optional |
| `VITE_GOOGLE_CLIENT_ID` | Google OAuth client id (blank hides the button) | *(client id)* | Optional |
| `VITE_FACEBOOK_APP_ID` | Facebook app id (blank hides the button) | *(app id)* | Optional |

> The full list is in **`Client-Side/.env.example`**.

---

## 5. Final verification checklist

After both sides are live, confirm each item:

- [ ] **No secrets in the repo** — `git ls-files | grep -i env` returns only
      `*.env.example` files (and `e2e/.env.test.example`).
- [ ] **Backend health** — `GET /health` on the Render URL returns `200 ok`.
- [ ] **MongoDB connects** — Render logs show `MongoDB connected successfully`.
- [ ] **Auth works** — register / log in from the live site; a session persists
      on refresh.
- [ ] **CORS** — no CORS errors in the browser console on the live site.
- [ ] **Socket.IO** — realtime features (notification bell, order updates)
      connect; no websocket errors in the console.
- [ ] **Image uploads** — an admin can upload a product image (Cloudinary).
- [ ] **Email** — a transactional email (e.g. OTP / order confirmation) is
      received.
- [ ] **Production build** — `npm run build` completes without errors.
- [ ] **No localhost references** — the network tab shows requests to the Render
      URL, not `localhost`.

---

## 6. Redeploying after changes

- **Code:** push to the connected branch — Render and Netlify auto-deploy.
- **Env vars:** see `CLIENT_HANDOVER.md` for how the client updates and restarts
  each service, and how to rotate a leaked secret.
