# Install dependencies only when needed
FROM node:16.12.0-alpine3.14 AS deps
WORKDIR /app
COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile

# Rebuild the source code only when needed
FROM node:16.12.0-alpine3.14 AS builder
WORKDIR /app
COPY package.json yarn.lock tsconfig.json tsconfig.build.json nest-cli.json ./
COPY ./src ./src
COPY --from=deps /app/node_modules ./node_modules
RUN yarn build && yarn install

# Production image, copy all the files and run nest
FROM node:16.12.0-alpine3.14 AS runner
WORKDIR /app

ENV NODE_ENV production

RUN addgroup -g 1001 -S nodejs \
  && adduser -S nestjs -u 1001

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder --chown=nextjs:nestjs /app/dist ./dist

USER nestjs

EXPOSE 3001

CMD ["yarn", "start:prod"]