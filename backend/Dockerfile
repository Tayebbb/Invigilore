FROM php:8.4-cli

# Install system dependencies required by Laravel and Composer.
RUN apt-get update && apt-get install -y \
    git \
    curl \
        ca-certificates \
    unzip \
    libzip-dev \
    libonig-dev \
    libxml2-dev \
    && rm -rf /var/lib/apt/lists/*

# Install required PHP extensions for Laravel.
RUN docker-php-ext-install mbstring bcmath zip pdo_mysql

# Install Composer binary.
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

WORKDIR /var/www/html

# Copy only composer manifests first for better cache reuse.
COPY composer.json composer.lock ./

# Install production dependencies only to avoid dev-only extension failures on Render.
RUN composer install \
    --no-dev \
    --no-interaction \
    --prefer-dist \
    --optimize-autoloader \
    --no-scripts

# Copy application source.
COPY . .

# Set writable permissions for Laravel runtime directories.
RUN mkdir -p storage bootstrap/cache && \
    chown -R www-data:www-data storage bootstrap/cache && \
    chmod -R 775 storage bootstrap/cache

EXPOSE 10000

# Render requires an HTTP process bound to $PORT.
CMD ["sh", "-lc", "if [ ! -f vendor/autoload.php ]; then composer install --no-dev --no-interaction --prefer-dist --optimize-autoloader --no-scripts; fi; php artisan serve --host=0.0.0.0 --port=${PORT:-10000}"]
