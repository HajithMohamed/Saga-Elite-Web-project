FROM node:22-alpine
WORKDIR /app
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
COPY package*.json ./
RUN npm install
COPY . .
RUN chown -R appuser:appgroup /app
USER appuser
EXPOSE 5001
CMD ["npx", "nodemon", "server.js"]
