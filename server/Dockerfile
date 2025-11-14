# ======== Testing Phase ========

# use node 20 as test image
FROM node:20-alpine AS test

# source code work dir
WORKDIR /src

# install dependencies
COPY package*.json ./
RUN npm install

# copy source code
COPY . .

# run tests
RUN npm test

# ======== Production Phase ========

# production image
FROM node:20-alpine AS production
WORKDIR /src

# Copy package files and install all dependencies
COPY package*.json ./
RUN npm ci

# Copy source code
COPY . .

# Expose port
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:8080/ || exit 1

# ts-node src/server.ts
CMD ["npm", "start"]