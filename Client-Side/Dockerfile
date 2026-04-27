FROM node:20-alpine

WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm config set fetch-retries 5 \
    && npm config set fetch-retry-mintimeout 20000 \
    && npm config set fetch-retry-maxtimeout 120000 \
    && npm config set fetch-timeout 300000 \
    && if [ -f package-lock.json ]; then npm ci; else npm install; fi

# copy source files
COPY . .

EXPOSE 5173

CMD ["npm", "run", "dev", "--", "--host"]
