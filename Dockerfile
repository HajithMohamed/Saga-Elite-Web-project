# ── Saga Elite Backend · Development ──────────────────────────
# Build context: project root (.)
# Usage: docker compose up --build backend
FROM node:22-alpine

WORKDIR /workspace/Server-side

# Install dependencies first (layer cache optimisation)
COPY Server-side/package.json Server-side/package-lock.json ./
RUN npm ci --no-audit --no-fund

# Copy application source
COPY Server-side/ .

# Non-root user for security
RUN addgroup -S appgroup && adduser -S appuser -G appgroup && \
    chown -R appuser:appgroup /workspace
USER appuser

EXPOSE 5001

# --watch enables automatic restart on file changes (Node >= 18.11)
CMD ["node", "--watch", "server.js"]
