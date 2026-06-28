# Saga Elite — Client Handover & Credential Management

This document is for the **site owner**. It explains how to manage your own
credentials (database, email, image storage, etc.) **without touching the
code**. Every sensitive value lives in your hosting dashboards as an
"environment variable", so you can change them at any time.

Your site runs on three services:

| Service           | What it is                       | Dashboard                          |
| ----------------- | -------------------------------- | ---------------------------------- |
| **Render**        | The backend / API server         | https://dashboard.render.com       |
| **Netlify**       | The website (what visitors see)  | https://app.netlify.com            |
| **MongoDB Atlas** | The database                     | https://cloud.mongodb.com          |

> You never edit code to change a password, key, or URL. You change an
> environment variable in the relevant dashboard and restart the service.

---

## 1. Which credentials you own

| Credential | Where it's used | Where to get / manage it |
| ---------- | --------------- | ------------------------ |
| **Database connection string** (`MONGO_DB_URI`) | Render | MongoDB Atlas → Database → **Connect** |
| **JWT secret** (`JWT_SECRET`) | Render | Any random 32+ character string you generate |
| **Cloudinary keys** (`CLOUDINARY_*`) | Render | https://cloudinary.com → Dashboard → Account Details |
| **Email / SMTP** (`SMTP_*`, `FROM_EMAIL`) | Render | Your email provider (e.g. Gmail App Password, SendGrid, Mailgun) |
| **Website → API URL** (`VITE_API_URL`) | Netlify | Your Render service URL + `/api` |
| **Google / Facebook login** (optional) | Render + Netlify | Google Cloud Console / Meta for Developers |
| **WhatsApp, PayHere, OpenAI** (optional) | Render | The respective provider dashboards |

The complete annotated lists are in `Server-side/.env.example` (backend) and
`Client-Side/.env.example` (website). Names there match the dashboards exactly.

---

## 2. Updating a value on **Render** (backend)

1. Go to https://dashboard.render.com and open the **saga-elite-api** service.
2. Left menu → **Environment**.
3. Click the value you want to change (or **Add Environment Variable**), edit it,
   and **Save Changes**.
4. Render automatically restarts the service with the new value (takes ~1–2
   minutes). To force it: **Manual Deploy → Deploy latest commit** /
   **Clear build cache & deploy**.
5. Confirm it's healthy: open `https://<your-service>.onrender.com/health` — it
   should show `{"status":"ok"}`.

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
  set a new password. Then update `MONGO_DB_URI` on **Render** (§2) with the new
  password and restart.
- **Connection string:** Atlas → **Database → Connect → Drivers** to copy it
  again if you ever need it.

---

## 5. Restarting the services

| Service  | How to restart |
| -------- | -------------- |
| Render   | Saving an env var auto-restarts; or **Manual Deploy → Deploy latest commit**. |
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
3. **Update the variable** on Render (§2) or Netlify (§3).
4. **Restart / redeploy** the affected service.
5. Verify the site still works using the checklist in `DEPLOYMENT.md` §5.

> **Golden rule:** never paste a real secret into code, a chat message, an
> email, or a screenshot. Keep them only in the Render / Netlify / Atlas
> dashboards. If a secret was shared anywhere insecure, rotate it (above).

---

## 7. Who to contact

For code changes or new features, contact your developer. For credential and
billing questions, use the provider dashboards above — you have full ownership
of all three accounts.
