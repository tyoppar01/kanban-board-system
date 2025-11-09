# use node 22 alpine as base image
FROM node:22-alpine AS builder

WORKDIR /app

# install dependencies
COPY package*.json ./
RUN npm install

# copy source code
COPY . .

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
# COPY --from=builder /app/.env ./.env

RUN npm install --omit=dev

EXPOSE 3000

CMD ["npm", "run", "start"]