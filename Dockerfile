FROM node:alpine AS builder

WORKDIR /app

COPY package.json ./
RUN yarn


COPY tsconfig.json .
COPY src/ src/
COPY tsconfig.node.json .
RUN yarn compile-config
ENV NODE_OPTIONS="--max-old-space-size=2048"
RUN yarn build

# Runtime stage
FROM node:alpine

WORKDIR /app

# Copy only necessary files
COPY --from=builder /app/dist ./dist
COPY package.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY src/dsl dist/dsl
COPY .env ./

CMD ["node", "dist/main.js"]