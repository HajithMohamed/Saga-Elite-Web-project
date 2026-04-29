# Saga Elite — Docker Setup

## Prerequisites
- Docker Desktop installed and running
- .env file created from .env.example with real values
- MongoDB Atlas cluster running and your IP whitelisted

## Atlas IP whitelisting (required before starting)
Go to MongoDB Atlas → Network Access → Add IP Address
- Development: add your current machine's public IP
  (find it at https://whatismyip.com)
- Production VPS: add the VPS public IP
- NEVER use 0.0.0.0/0 permanently in production

## Development

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

## Production

# On your VPS — create .env with production values first
docker compose -f docker-compose.prod.yml up -d --build

# Stop production:
docker compose -f docker-compose.prod.yml down

## Access points (development)
Frontend:  http://localhost:5173
Backend:   http://localhost:5001
API:       http://localhost:5001/api/v1/

## PayHere notify_url in development
PayHere cannot call localhost. Use ngrok to create a public tunnel:

  ngrok http 5001

Copy the https URL (e.g. https://abc123.ngrok.io)
Set in .env:
  BACKEND_URL=https://abc123.ngrok.io

The notify_url sent to PayHere will be:
  https://abc123.ngrok.io/api/v1/payhere/notify

Reset BACKEND_URL back to http://localhost:5001 after testing.

## Common problems and fixes

Problem: Backend cannot connect to MongoDB Atlas
Fix 1: Check your IP is whitelisted in Atlas Network Access
Fix 2: Verify MONGO_URI in .env is the full Atlas connection string
Fix 3: Confirm Atlas database user has readWrite permissions
Fix 4: docker compose logs backend — look for Mongoose connection error

Problem: Frontend hot reload not working
Fix: vite.config.js must have usePolling: true under server.watch

Problem: VITE_ variables undefined in browser (production)
Fix: They must be passed as build args in docker-compose.prod.yml
     They cannot be injected at runtime — rebuild the image

Problem: Port 5173 or 5001 already in use
Fix: docker compose down then docker compose up again
     Or: lsof -i :5173 then kill the process

Problem: node_modules errors on startup
Fix: The /app/node_modules anonymous volume must be present in 
     each service's volumes section. Without it the host bind 
     mount overwrites the container's node_modules.
