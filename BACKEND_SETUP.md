# Backend Local Setup Guide

This document explains how to run the Laravel backend locally for Invigilore, including what was installed or changed during setup and why.

## 1) PHP Version Used

The backend was run using:

```powershell
php -v
```

Observed version:

- PHP 8.2.12 (CLI)
- Meets the backend requirement from composer.json: php ^8.2

Why this matters:

- Laravel 12 in this project requires PHP 8.2 or higher.

## 2) Composer Installation and Packages Installed

Composer used:

```powershell
composer --version
```

Observed version:

- Composer 2.8.12

Install command used:

```powershell
cd backend
composer install
```

What happened:

- Composer installed backend dependencies into backend/vendor.
- A full dependency graph was resolved and installed (including transitive packages).
- Main direct packages from backend/composer.json:
  - laravel/framework
  - laravel/sanctum
  - laravel/tinker
  - tymon/jwt-auth
  - dev packages like phpunit, pint, collision, faker

Why this matters:

- The backend cannot run without backend/vendor/autoload.php, which is created by Composer.

## 3) Database Setup (SQL Server Configuration)

Laravel already includes a sqlsrv connection in backend/config/database.php.
To use SQL Server locally, configure backend/.env as below.

### Required SQL Server .env values

```env
DB_CONNECTION=sqlsrv
DB_HOST=127.0.0.1
DB_PORT=1433
DB_DATABASE=invigilore
DB_USERNAME=sa
DB_PASSWORD=YourStrongPassword
```

### Optional SQL Server security values

If your SQL Server setup requires encryption settings, add:

```env
DB_ENCRYPT=yes
DB_TRUST_SERVER_CERTIFICATE=true
```

Then clear and reload Laravel config:

```powershell
cd backend
php artisan config:clear
```

Why this matters:

- DB_CONNECTION selects the driver Laravel will use.
- SQL Server needs the sqlsrv driver and valid credentials to run migrations and API operations.

## 4) Environment Variables Added in .env

In this workspace, backend/.env did not exist initially. Create it from backend/.env.example first:

```powershell
cd backend
copy .env.example .env
```

Then update at minimum:

```env
APP_NAME=Invigilore
APP_ENV=local
APP_DEBUG=true
APP_URL=http://localhost:8000

DB_CONNECTION=sqlsrv
DB_HOST=127.0.0.1
DB_PORT=1433
DB_DATABASE=invigilore
DB_USERNAME=sa
DB_PASSWORD=YourStrongPassword

# JWT package support
JWT_SECRET=
```

Generate required app keys/secrets:

```powershell
php artisan key:generate
php artisan jwt:secret
```

Why this matters:

- APP_KEY is required by Laravel encryption/session features.
- JWT_SECRET is required by tymon/jwt-auth token signing.

## 5) Commands Used During Setup

The setup flow (and recommended repeatable flow) is:

```powershell
# 1. Go to backend
cd backend

# 2. Install dependencies
composer install

# 3. Create environment file
copy .env.example .env

# 4. Generate app key
php artisan key:generate

# 5. (If JWT is used) generate JWT secret
php artisan jwt:secret

# 6. Run database migrations
php artisan migrate

# 7. (Optional) seed data
php artisan db:seed

# 8. Start backend server
php artisan serve --host=0.0.0.0 --port=8000
```

Useful verification commands:

```powershell
php artisan migrate:status
php -m | findstr /I "zip sqlsrv pdo_sqlsrv"
```

## 6) PHP Drivers and Extensions Installed/Changed

Relevant extensions detected in the local PHP runtime:

- openssl
- pdo_mysql
- pdo_sqlsrv
- sqlsrv
- zip

Important change made during setup:

- zip extension was enabled in PHP configuration so Composer can download/install packages from dist archives efficiently.
- File changed: C:/xampp/php/php.ini
- Setting enabled: extension=zip

Why this matters:

- Without zip support, Composer may be slow or fail over to source downloads.
- SQL Server support requires sqlsrv and pdo_sqlsrv extensions.

## 7) How to Start the Backend Server

From the backend folder:

```powershell
php artisan serve --host=0.0.0.0 --port=8000
```

Expected output:

```text
INFO  Server running on [http://0.0.0.0:8000]
```

Access locally at:

- http://localhost:8000

## Troubleshooting

### Error: vendor/autoload.php not found

Run:

```powershell
cd backend
composer install
```

### SQL Server connection errors

Check:

- SQL Server service is running
- .env DB values are correct
- sqlsrv and pdo_sqlsrv are loaded

```powershell
php -m | findstr /I "sqlsrv pdo_sqlsrv"
```

### Config changes not reflected

Run:

```powershell
php artisan config:clear
php artisan cache:clear
```
