# syntax=docker/dockerfile:1.7
FROM node:22-alpine
ENV NPM_CONFIG_UPDATE_NOTIFIER=false
ARG NPM_REGISTRY=https://registry.npmjs.org
WORKDIR /workspace
COPY package.json package-lock.json ./
COPY Server-side/package.json Server-side/package.json
COPY Client-Side/package.json Client-Side/package.json
COPY scripts/docker-npm-ci.sh scripts/docker-npm-ci.sh
RUN --mount=type=cache,target=/root/.npm,sharing=locked sh scripts/docker-npm-ci.sh --workspace Server-side --registry=$NPM_REGISTRY --no-audit --no-fund --maxsockets=1 --fetch-timeout=300000 --fetch-retries=3 --fetch-retry-mintimeout=5000 --fetch-retry-maxtimeout=30000
COPY Server-side ./Server-side
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
RUN chown -R appuser:appgroup /workspace
USER appuser
WORKDIR /workspace/Server-side
EXPOSE 5001
CMD ["node", "--watch", "server.js"]
