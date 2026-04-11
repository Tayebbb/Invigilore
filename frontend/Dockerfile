# ============================================
# Multi-stage Dockerfile for React Frontend
# Optimized for Vercel & Production
# ============================================

# ──────────────────────────────────────────
# Stage 1: Builder (Dependencies & Build)
# ──────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /build

# Copy package files
COPY package*.json ./

# Install dependencies with clean cache
RUN npm ci --prefer-offline --no-audit

# Copy source code
COPY . .

# Build production bundle
RUN npm run build

# ──────────────────────────────────────────
# Stage 2: Runtime (Node server for preview)
# ──────────────────────────────────────────
FROM node:20-alpine AS runtime

LABEL maintainer="DevOps Team"
LABEL description="Production React Frontend Container"

WORKDIR /app

# Install serve to run production build (for Docker preview)
RUN npm install -g serve

# Copy built assets from builder
COPY --from=builder /build/dist ./dist
COPY --from=builder /build/package.json ./package.json

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD wget --quiet --tries=1 --spider http://localhost:3000/ || exit 1

# Serve production build (Note: Vercel doesn't use this, but useful for Docker setups)
CMD ["serve", "-s", "dist", "-l", "3000"]
