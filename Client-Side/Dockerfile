FROM node:20-alpine

WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm ci

# copy source files
COPY . .

EXPOSE 5173

CMD ["npm", "run", "dev", "--", "--host"]
