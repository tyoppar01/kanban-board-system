# ======== Testing Phase ========

# use node 20 as test image
FROM node:20-alpine AS test

# source code work dir
WORKDIR /src

# install dependencies
COPY server/package*.json ./
RUN npm install

# copy source code
COPY server/ .

# run tests
RUN npm test

# ======== Production Phase ========

# production image
FROM node:20-alpine AS production

# Install OpenSSL for Prisma
RUN apk add --no-cache openssl

# Setup external-apis first
WORKDIR /app/external-apis
COPY external-apis/package*.json ./
COPY external-apis/prisma ./prisma
COPY external-apis/src ./src
COPY external-apis/tsconfig.json ./
RUN npm install && npm run prisma:generate

# Setup server
WORKDIR /app/server
COPY server/package*.json ./
# Copy rest of server code now so npm can resolve file:../external-apis
COPY server/ ./
RUN npm install

# Expose port
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:8080/ || exit 1

# Start script: run migrations then start server
CMD cd /app/external-apis && npx prisma db push && cd /app/server && npm start