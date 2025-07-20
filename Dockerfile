FROM node:alpine AS builder

WORKDIR /app

COPY package.json ./
RUN yarn

COPY tsconfig.json .
COPY src/ src/
RUN yarn build

# Runtime stage
FROM node:alpine

WORKDIR /app

# Copy only necessary files
COPY --from=builder /app/dist ./dist
COPY package.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY .env ./

CMD ["node", "dist/main.js"]