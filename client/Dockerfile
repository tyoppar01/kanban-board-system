# ======== Build Phase ========
FROM node:22 AS builder

WORKDIR /app

# Accept build arguments
ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_GRAPHQL_URL

# Set as environment variables for Next.js build
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_GRAPHQL_URL=$NEXT_PUBLIC_GRAPHQL_URL

# install dependencies
COPY client/package*.json ./
RUN npm install

# copy source code
COPY client/ .

# build the application
RUN npm run build

# ======== Testing Phase ========
FROM builder AS test

WORKDIR /app

# run tests (unit tests only)
RUN npm test 

# ======== Production Phase ========
FROM node:22-alpine AS production

WORKDIR /app

COPY --from=builder /app/package*.json ./
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/next.config.ts ./
COPY --from=builder /app/tsconfig.json ./

RUN npm install --omit=dev

EXPOSE 3000

CMD ["npm", "run", "start"]