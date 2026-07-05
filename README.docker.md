# Saga Elite — Docker Setup

## Prerequisites
- Docker Desktop installed and running (Windows / macOS / Linux)
- `.env` file created from `.env.example` with real values
- MongoDB Atlas cluster running and your IP whitelisted

## Project Structure

```
Saga-Elite-Web-project/
├── Dockerfile              ← Backend dev
├── Dockerfile.prod         ← Backend production
├── docker-compose.yml      ← Development compose
├── docker-compose.prod.yml ← Production compose
├── .dockerignore           ← Root ignore (backend builds)
├── Client-Side/
│   ├── Dockerfile          ← Frontend dev
│   ├── Dockerfile.prod     ← Frontend production (multi-stage + nginx)
│   ├── .dockerignore
│   └── nginx.conf          ← Nginx config for SPA + API proxy
└── Server-side/
    ├── .dockerignore
    └── ...
```

## Atlas IP Whitelisting (required before starting)
Go to MongoDB Atlas → Network Access → Add IP Address
- **Development**: add your current machine's public IP
  (find it at https://whatismyip.com)
- **Production VPS**: add the VPS public IP
- **NEVER** use `0.0.0.0/0` permanently in production

---

## Development

```bash
# First time only:
cp .env.example .env
# Fill in your real Atlas URI, PayHere keys, Cloudinary keys, etc.

# Start both services (backend + frontend):
docker compose up --build

# Start in background:
docker compose up -d --build

# View logs:
docker compose logs -f backend
docker compose logs -f frontend

# Stop:
docker compose down

# Rebuild after adding npm packages:
docker compose up -d --build backend
# or
docker compose up -d --build frontend
```

## Production

```bash
# On your VPS — create .env with production values first
docker compose -f docker-compose.prod.yml up -d --build

# Stop production:
docker compose -f docker-compose.prod.yml down
```

## Access Points

| Service  | Development              | Production          |
|----------|--------------------------|---------------------|
| Frontend | http://localhost:5173     | http://your-domain  |
| Backend  | http://localhost:5001     | (internal :5001)    |
| API      | http://localhost:5001/api | http://your-domain/api/v1 |

## PayHere notify_url in Development
PayHere cannot call localhost. Use ngrok to create a public tunnel:

```bash
ngrok http 5001
```

Copy the https URL (e.g. `https://abc123.ngrok.io`)
Set in `.env`:
```
BACKEND_URL=https://abc123.ngrok.io
```

The notify_url sent to PayHere will be:
```
https://abc123.ngrok.io/api/webhooks/payhere
```

Reset `BACKEND_URL` back to `http://localhost:5001` after testing.

---

## Cross-Platform Notes

### Windows
- Docker Desktop with WSL 2 backend is recommended
- Vite hot-reload uses polling (`usePolling: true` in `vite.config.js`)
- Shell scripts use LF line endings (Git should handle this via `.gitattributes`)

### macOS (Apple Silicon / M1+)
- All images use multi-arch tags (`node:22-alpine`, `nginx:1.27-alpine`)
- No platform-specific workarounds needed

### Linux
- Docker Compose V2 (`docker compose`) is used (not the legacy `docker-compose`)
- BuildKit is NOT required — all Dockerfiles use standard syntax

---

## Common Problems and Fixes

**Problem:** Backend cannot connect to MongoDB Atlas
- Check your IP is whitelisted in Atlas → Network Access
- Verify `MONGO_URI` / `MONGO_DB_URI` in `.env` is the full Atlas connection string
- Confirm Atlas database user has readWrite permissions
- Run `docker compose logs backend` — look for Mongoose connection error

**Problem:** Frontend hot reload not working
- `vite.config.js` must have `usePolling: true` under `server.watch`
- Check that the volume mount exists in `docker-compose.yml`

**Problem:** `VITE_` variables undefined in browser (production)
- They must be passed as build args in `docker-compose.prod.yml`
- They cannot be injected at runtime — rebuild the image

**Problem:** Port 5173 or 5001 already in use
- `docker compose down` then `docker compose up` again
- Or: find and kill the process using the port

**Problem:** node_modules errors on startup
- The anonymous volume (e.g. `/app/node_modules`) must be present
  in each service's volumes section. Without it, the host bind
  mount overwrites the container's node_modules.

**Problem:** Shell script errors (`bad interpreter`, `not found`)
- Caused by Windows CRLF line endings in `.sh` files
- Fix: convert to LF (`dos2unix scripts/*.sh` or configure Git)
