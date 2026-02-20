FROM node:20-alpine

WORKDIR /app


# Copy package files and install dependencies
COPY package.json package-lock.json ./
RUN npm install --legacy-peer-deps


# Copy all source files
COPY . .

# Copy .env file
COPY .env .


# Expose port from environment variable or default to 5000
ARG PORT=5000
ENV PORT=${PORT}
EXPOSE ${PORT}


# Start the application
CMD ["npm", "start"]
