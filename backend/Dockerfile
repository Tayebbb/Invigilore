# ============================================
# Multi-stage Dockerfile for Laravel Backend
# Optimized for Render & Production
# ============================================

# ──────────────────────────────────────────
# Stage 1: Builder (Composer dependencies)
# ──────────────────────────────────────────
FROM php:8.4-cli-alpine AS builder

RUN apk add --no-cache \
    git \
    curl \
    ca-certificates \
    unzip \
    libzip-dev \
    oniguruma-dev \
    libxml2-dev \
    alpine-sdk

RUN docker-php-ext-install \
    mbstring \
    bcmath \
    zip \
    pdo_mysql

COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

WORKDIR /build

# Copy only composer manifests first for better cache reuse
COPY composer.json composer.lock ./

# Install production dependencies with optimizations
RUN composer install \
    --no-dev \
    --no-interaction \
    --prefer-dist \
    --optimize-autoloader \
    --no-scripts \
    --no-progress

COPY . .

# Generate optimized composer autoloader
RUN composer dump-autoload --optimize --no-dev

# ──────────────────────────────────────────
# Stage 2: Runtime (Minimal production image)
# ──────────────────────────────────────────
FROM php:8.4-cli-alpine

LABEL maintainer="DevOps Team"
LABEL description="Production Laravel Backend Container"

# Install runtime dependencies only (no build tools)
RUN apk add --no-cache \
    ca-certificates \
    curl \
    libzip-dev \
    oniguruma-dev \
    libxml2-dev

# Install only required PHP extensions (production)
RUN docker-php-ext-install \
    mbstring \
    bcmath \
    zip \
    pdo_mysql

# Create non-root user for security
RUN addgroup -g 1000 laravel && \
    adduser -D -u 1000 -G laravel laravel

WORKDIR /var/www/html

# Copy pre-built composer dependencies from builder
COPY --from=builder --chown=laravel:laravel /build/vendor ./vendor

# Copy application files from builder
COPY --from=builder --chown=laravel:laravel /build/. ./

# Create required Laravel directories
RUN mkdir -p \
    storage/app \
    storage/framework/cache \
    storage/framework/sessions \
    storage/framework/views \
    storage/logs \
    bootstrap/cache && \
    chown -R laravel:laravel \
    storage \
    bootstrap/cache && \
    chmod -R 775 \
    storage \
    bootstrap/cache

# Switch to non-root user
USER laravel

EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD sh -c "curl -fsS http://localhost:${PORT:-8000}/api/health || exit 1"

# Apply pending migrations before serving so schema drift does not break sign-up flows.
CMD ["sh", "-c", "php artisan migrate --force && php artisan serve --host=0.0.0.0 --port=${PORT:-8000}"]
