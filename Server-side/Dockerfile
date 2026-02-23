FROM node:20-alpine

WORKDIR /app


# Copy package files and install dependencies
COPY package.json package-lock.json ./
RUN npm install --legacy-peer-deps


# Copy all source files
COPY . .

# Copy .env file
COPY .env .


# Expose port from environment variable or default to 5001
ARG PORT=5001
ENV PORT=${PORT}
EXPOSE ${PORT}


# Start the application
CMD ["npm", "start"]
