# ── Saga Elite Frontend · Development ─────────────────────────
FROM node:22-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies with legacy-peer-deps for compatibility
RUN npm install --legacy-peer-deps

# Copy source
COPY . .

EXPOSE 5173

CMD ["npx", "vite", "--host", "0.0.0.0", "--port", "5173"]