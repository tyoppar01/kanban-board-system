# use node 20 as builder image
FROM node:20-alpine AS builder

# source code work dir
WORKDIR /src

# install dependencies
COPY package*.json ./
RUN npm install

# copy source code
COPY . .

# build the application
RUN npm run build 

# production image
FROM node:22-alpine AS production

WORKDIR /src

# Copy package files and install production dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy built application from builder stage
COPY --from=builder /src/dist ./dist
COPY --from=builder /src/src ./src

# Install ts-node for runtime TypeScript execution
RUN npm install -g ts-node typescript

# Expose port
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:8080/ || exit 1

CMD ["ts-node", "src/server.ts"]