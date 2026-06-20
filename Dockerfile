# ── Saga Elite Backend · Development ──────────────────────────
# Build context: project root (.)
# Usage: docker compose up --build backend
FROM node:22-alpine

WORKDIR /app

# Copy package files from correct path
COPY Server-side/package*.json ./

# Install dependencies
RUN npm install --no-audit --no-fund

# Copy application source
COPY Server-side/ ./

EXPOSE 5001

# Run as root for development (easier for file permissions)
# For production, use Dockerfile.prod which has proper user setup
CMD ["node", "--watch", "server.js"]