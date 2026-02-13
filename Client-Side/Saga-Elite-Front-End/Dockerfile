# ---------- Build Stage ----------
FROM node:20-alpine AS build

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm install

COPY . .
RUN npm run build


# ---------- Production Stage ----------
FROM nginx:alpine

# Remove default nginx config (optional but cleaner)
RUN rm -rf /usr/share/nginx/html/*

# Copy built files
COPY --from=build /app/dist /usr/share/nginx/html

# Expose nginx default port
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
