# use node 22 as base image
FROM node:22 AS builder

WORKDIR /app

# install dependencies
COPY client/package*.json ./
RUN npm install
RUN npx playwright install --with-deps chromium

# copy source code
COPY client/ .

# run tests (unit tests only)
RUN npm test
# RUN npm run test:e2e
# build the application
RUN npm run build 

# production image
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