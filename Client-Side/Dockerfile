FROM node:22-alpine
WORKDIR /workspace
COPY package.json package-lock.json ./
COPY Client-Side/package.json Client-Side/package.json
COPY Server-side/package.json Server-side/package.json
RUN npm ci --workspace Client-Side --no-audit --no-fund --fetch-retries=5 --fetch-retry-mintimeout=20000 --fetch-retry-maxtimeout=120000
COPY Client-Side ./Client-Side
WORKDIR /workspace/Client-Side
EXPOSE 5173
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "5173"]
