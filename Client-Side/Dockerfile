FROM node:20-alpine

WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
# using `npm install` since the repo doesn't include a package-lock.json;
# `npm ci` would fail in that case.  if you later add a lockfile you can
# switch back for faster builds.
RUN npm install

# copy source files
COPY . .

EXPOSE 5173

CMD ["npm", "run", "dev", "--", "--host"]
