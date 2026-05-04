FROM node:22-alpine
WORKDIR /workspace
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
COPY package.json package-lock.json ./
COPY Server-side/package.json Server-side/package.json
COPY Client-Side/package.json Client-Side/package.json
RUN npm ci --workspace Server-side --no-audit --no-fund --fetch-retries=5 --fetch-retry-mintimeout=20000 --fetch-retry-maxtimeout=120000
COPY Server-side ./Server-side
RUN chown -R appuser:appgroup /workspace
USER appuser
WORKDIR /workspace/Server-side
EXPOSE 5001
CMD ["node", "--watch", "server.js"]
