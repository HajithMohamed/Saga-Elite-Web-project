# syntax=docker/dockerfile:1.7
FROM node:22-alpine
ENV NPM_CONFIG_UPDATE_NOTIFIER=false
WORKDIR /workspace
COPY package.json package-lock.json ./
COPY Server-side/package.json Server-side/package.json
COPY Client-Side/package.json Client-Side/package.json
RUN --mount=type=cache,target=/root/.npm,sharing=locked npm ci --no-audit --no-fund --maxsockets=1 --fetch-timeout=300000 --fetch-retries=5 --fetch-retry-mintimeout=20000 --fetch-retry-maxtimeout=120000
COPY Client-Side ./Client-Side
WORKDIR /workspace/Client-Side
EXPOSE 5173
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "5173"]
