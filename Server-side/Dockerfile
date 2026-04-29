FROM node:20-alpine

WORKDIR /app

# Copy package files and install dependencies (cache-friendly)
COPY package*.json ./
RUN npm config set fetch-retries 5 \
    && npm config set fetch-retry-mintimeout 20000 \
    && npm config set fetch-retry-maxtimeout 120000 \
    && npm config set fetch-timeout 300000 \
    && npm ci --legacy-peer-deps

# copy the rest of the sources
COPY . .

# The .env file is mounted by docker-compose or provided at runtime,
# so we don't copy it into the image to avoid leaking secrets into layers.

# Expose port from environment variable or default to 5001
ARG PORT=5001
ENV PORT=${PORT}
EXPOSE ${PORT}

# default command (in compose we use dev script; in production use start)
CMD ["npm", "start"]
