# Multi-stage Dockerfile for spark-automate---workflow-studio
# Builder stage
FROM node:20-alpine AS builder
WORKDIR /app

# Install build dependencies
COPY package.json package-lock.json* tsconfig.json ./
COPY package.json ./
# Copy full source for build
COPY . .

# Install all dependencies (including dev) and build
RUN npm ci && npm run build

# Production stage
FROM node:20-alpine AS production
WORKDIR /app
ENV NODE_ENV=production

# Create non-root user
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# Copy built artifacts from builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/node_modules ./node_modules

# Expose default port
EXPOSE 3000

USER appuser
CMD ["node", "dist/server.cjs"]

