FROM php:8.4-fpm

# Install system dependencies required by Laravel and SQL Server drivers
RUN apt-get update && apt-get install -y \
    git \
    curl \
    unzip \
    libzip-dev \
    libonig-dev \
    libxml2-dev \
    gnupg2 \
    ca-certificates \
    apt-transport-https \
    && rm -rf /var/lib/apt/lists/*

# Install Microsoft ODBC Driver 18 and unixODBC for sqlsrv support
RUN set -eux; \
    curl -sSL https://packages.microsoft.com/keys/microsoft.asc | gpg --dearmor > /usr/share/keyrings/microsoft.gpg; \
    echo "deb [arch=amd64 signed-by=/usr/share/keyrings/microsoft.gpg] https://packages.microsoft.com/debian/12/prod bookworm main" > /etc/apt/sources.list.d/microsoft-prod.list; \
    apt-get update; \
    ACCEPT_EULA=Y apt-get install -y msodbcsql18 unixodbc-dev; \
    rm -rf /var/lib/apt/lists/*

# Install required PHP extensions for Laravel and MySQL connectivity
RUN docker-php-ext-install mbstring bcmath zip pdo_mysql
# RUN pecl install sqlsrv pdo_sqlsrv && docker-php-ext-enable sqlsrv pdo_sqlsrv

# Install Composer
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

WORKDIR /var/www/html

# Copy only composer manifests first to optimize build layer caching
COPY composer.json composer.lock ./
RUN composer install --no-interaction --prefer-dist --optimize-autoloader --no-scripts --ignore-platform-req=php

# Copy application source
COPY . .

# Set writable permissions for Laravel runtime directories
RUN mkdir -p storage bootstrap/cache && \
    chown -R www-data:www-data storage bootstrap/cache && \
    chmod -R 775 storage bootstrap/cache

EXPOSE 9000

# Ensure dependencies exist even when vendor is mounted as an empty volume first run
CMD ["sh", "-lc", "if [ ! -f vendor/autoload.php ]; then composer install --no-interaction --prefer-dist --ignore-platform-req=php; fi; php-fpm"]
