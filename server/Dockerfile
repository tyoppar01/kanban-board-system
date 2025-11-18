# ======== Testing Phase ========

# use node 20 as test image
FROM node:20-alpine AS test

# source code work dir
WORKDIR /src

# install dependencies
COPY server/package*.json ./
RUN npm install

# Install external-infra dependencies (will be mounted as volume)
RUN mkdir -p /external-infra
COPY external-infra/package*.json /external-infra/
RUN cd /external-infra && npm install

# copy source code
COPY server/ .

# run tests
RUN npm test

# ======== Production Phase ========

# production image
FROM node:20-alpine AS production
WORKDIR /src

# Copy package files and install all dependencies
COPY server/package*.json ./
RUN npm ci

# Install external-infra dependencies (will be mounted as volume)
RUN mkdir -p /external-infra
COPY external-infra/package*.json /external-infra/
RUN cd /external-infra && npm ci

# Copy source code
COPY server/ .

# Expose port
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:8080/ || exit 1

# ts-node src/server.ts
CMD ["npm", "start"]