# Saga Elite — Client Handover & Credential Management

This document is for the **site owner**. It explains how to manage your own
credentials (database, email, image storage, etc.) **without touching the
code**. Every sensitive value lives in your hosting dashboards as an
"environment variable", so you can change them at any time.

Your site runs on three services:

| Service           | What it is                       | Dashboard                          |
| ----------------- | -------------------------------- | ---------------------------------- |
| **Railway**       | The backend / API server         | https://railway.com                |
| **Netlify**       | The website (what visitors see)  | https://app.netlify.com            |
| **MongoDB Atlas** | The database                     | https://cloud.mongodb.com          |

> You never edit code to change a password, key, or URL. You change an
> environment variable in the relevant dashboard and the service redeploys.

---

## 1. Which credentials you own

| Credential | Where it's used | Where to get / manage it |
| ---------- | --------------- | ------------------------ |
| **Database connection string** (`MONGO_DB_URI`) | Railway | MongoDB Atlas → Database → **Connect** |
| **JWT secret** (`JWT_SECRET`) | Railway | Any random 32+ character string you generate |
| **Cloudinary keys** (`CLOUDINARY_*`) | Railway | https://cloudinary.com → Dashboard → Account Details |
| **Email / SMTP** (`SMTP_*`, `FROM_EMAIL`) | Railway | Your email provider (e.g. Gmail App Password, SendGrid, Mailgun) |
| **Website → API URL** (`VITE_API_URL`) | Netlify | Your Railway service URL + `/api` |
| **Google / Facebook login** (optional) | Railway + Netlify | Google Cloud Console / Meta for Developers |
| **WhatsApp, PayHere, OpenAI** (optional) | Railway | The respective provider dashboards |

The complete annotated lists are in `Server-side/.env.example` (backend) and
`Client-Side/.env.example` (website). Names there match the dashboards exactly.

---

## 2. Updating a value on **Railway** (backend)

1. Go to https://railway.com and open your **Saga Elite** project, then the
   backend service.
2. Open the **Variables** tab.
3. Edit the value you want to change (or **+ New Variable**), then apply/save.
4. Railway automatically redeploys the service with the new value (takes ~1–2
   minutes). You can watch progress under the **Deployments** tab.
5. Confirm it's healthy: open `https://<your-service>.up.railway.app/health` — it
   should show `{"status":"ok"}`.

> Never delete or change `NODE_ENV` (must stay `production`). Never set `PORT`
> manually — Railway manages it.

## 3. Updating a value on **Netlify** (website)

1. Go to https://app.netlify.com and open your site.
2. **Site configuration → Environment variables**.
3. Edit or add the variable, then **Save**.
4. **Important:** the website only picks up changes on a new build.
   Go to **Deploys → Trigger deploy → Deploy site** (or **Clear cache and deploy
   site**).
5. When the deploy finishes, hard-refresh the live site (Ctrl/Cmd+Shift+R).

## 4. Updating the database (MongoDB Atlas)

- **Change the database password:** Atlas → **Database Access** → edit the user →
  set a new password. Then update `MONGO_DB_URI` on **Railway** (§2) with the new
  password; Railway redeploys automatically.
- **Connection string:** Atlas → **Database → Connect → Drivers** to copy it
  again if you ever need it.

---

## 5. Restarting the services

| Service  | How to restart |
| -------- | -------------- |
| Railway  | Saving a variable auto-redeploys; or **Deployments → ⋯ → Redeploy** on the latest deploy. |
| Netlify  | **Deploys → Trigger deploy → Deploy site** (env changes need a fresh build). |
| Database | MongoDB Atlas runs continuously — no restart needed; changes apply immediately. |

---

## 6. Rotating a secret (if a key is exposed)

If a credential is ever leaked or you simply want to refresh it:

1. **Generate a new value at the source:**
   - Database password → MongoDB Atlas → Database Access.
   - Cloudinary → Dashboard → **Regenerate API secret**.
   - Email → your provider (generate a new App Password / API key).
   - `JWT_SECRET` → generate a new random 32+ char string (note: rotating this
     logs every user out, which is the safe behaviour after a leak).
2. **Revoke / disable the old value** in that provider's dashboard.
3. **Update the variable** on Railway (§2) or Netlify (§3).
4. **Restart / redeploy** the affected service.
5. Verify the site still works using the checklist in `DEPLOYMENT.md` §5.

> **Golden rule:** never paste a real secret into code, a chat message, an
> email, or a screenshot. Keep them only in the Railway / Netlify / Atlas
> dashboards. If a secret was shared anywhere insecure, rotate it (above).

---

## 7. Who to contact

For code changes or new features, contact your developer. For credential and
billing questions, use the provider dashboards above — you have full ownership
of all three accounts.
