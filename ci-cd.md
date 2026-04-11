# Invigilore CI/CD Explained (Professor Version)

Last updated: April 11, 2026  
Current state: Passing on main branch

## 1. Purpose of this pipeline

The CI/CD pipeline automates quality checks and deployment for two parts of the project:

- Backend: Laravel 12 (PHP 8.4)
- Frontend: React + Vite

When code is pushed, GitHub Actions does the following:

1. Checks code quality and build validity.
2. Runs backend tests against a temporary MySQL service.
3. Builds and pushes a backend Docker image to GHCR.
4. Triggers/records backend deployment flow for Render.
5. Deploys frontend to Vercel.
6. Performs a post-deployment backend health check.

## 2. Where the CI/CD logic lives

- Workflow definition: `.github/workflows/ci-cd.yml`
- Backend container build rules: `backend/Dockerfile`
- Test DB SSL behavior: `backend/config/database.php`
- PHPUnit test environment defaults: `backend/phpunit.xml`
- Migration order safety:
  - `database/migrations/2026_03_08_000007_create_answers_table.php`
  - `database/migrations/2026_04_03_000010_create_questions_table.php`

## 3. Trigger rules

The workflow runs on:

- Push to `main`
- Pull request targeting `main`

Behavior by event:

- Push to `main`: Full pipeline including image build and deployments.
- Pull request: Validation-focused run (lint/build checks + backend tests). Deployment jobs are skipped because they are gated to push on `main`.

## 4. Job dependency graph

```text
lint-and-analyze (matrix: backend + frontend)
        |
        +--> test-backend --> build-backend-docker --> deploy-backend-render --+
        |                                                                      |
        +-------------------------------------> deploy-frontend-vercel ---------+--> post-deployment-check

pr-validation (runs on pull_request, informational summary job)
```

Important dependency note:

- `deploy-frontend-vercel` depends on `lint-and-analyze` only.
- This means frontend deployment can proceed on main even if backend tests fail.

## 5. What happens on a push to main

### 5.1 lint-and-analyze

Runs in a matrix with two tracks:

- Backend track:
  - Installs Composer dependencies.
  - Runs Laravel Pint in test mode.
  - Pint failures create warnings and do not block deployment.
- Frontend track:
  - Runs `npm ci`.
  - Runs `npm run build` to validate production build.

### 5.2 test-backend

Runs after lint job:

- Starts MySQL 8.0 service container.
- Installs backend dependencies.
- Creates `.env.test` from `.env.example` and rewrites DB settings to local CI MySQL.
- Clears test config cache and generates test key.
- Runs:
  - `php artisan migrate --force --env=test`
  - `php artisan test --no-coverage`

### 5.3 build-backend-docker

Runs only for push to main, after backend tests pass:

- Uses Buildx.
- Authenticates to GHCR.
- Builds `backend/Dockerfile`.
- Pushes tags (branch, SHA-based, latest on default branch).

### 5.4 deploy-backend-render

Runs after Docker build:

- Logs deployment context.
- Render deployment itself is done through Render GitHub auto-deploy on main.

### 5.5 deploy-frontend-vercel

Runs on push to main after lint job:

- Installs Vercel CLI.
- Validates required Vercel secrets.
- Deploys frontend with production flag and build env values.

### 5.6 post-deployment-check

Runs after backend and frontend deploy jobs:

- Waits 60 seconds.
- Tries backend health endpoint up to 5 times.
- Uses `continue-on-error: true` (non-blocking final check).

## 6. Why Docker is used in this CI/CD

Docker is used for backend artifact consistency:

- CI builds the exact backend runtime image once.
- Image is pushed to GHCR.
- Same image definition is used for deployment platform execution.
- Multi-stage Dockerfile reduces size and improves security posture.

Backend image characteristics:

- Base: `php:8.4-cli-alpine`
- PHP extensions installed in both build/runtime stages.
- Non-root runtime user.
- Built-in container health check to `/api/health`.
- Optional startup migrations using `RUN_MIGRATIONS=true`.

## 7. Recent real failures and how they were fixed

These are important to explain because they show CI/CD debugging maturity.

### Issue A: MySQL SSL error in CI tests

Symptom:

- CI migration step failed trying SSL against local `127.0.0.1:3306` test DB.

Fix:

- Updated `backend/config/database.php` so SSL CA fallback is not forced for local/test hosts or testing env.
- Updated workflow-generated `.env.test` values to local CI MySQL and cleared `MYSQL_ATTR_SSL_CA`.
- Updated `backend/phpunit.xml` test DB defaults to match CI service.

### Issue B: Migration order FK failure

Symptom:

- `answers` migration referenced `questions` before `questions` table existed.

Fix:

- Added defensive table-exists checks.
- Deferred/conditionally attached foreign key in both migrations to avoid order-sensitive failure.

### Issue C: Missing APP_KEY in tests

Symptom:

- `MissingAppKeyException` during test run.

Fix:

- Added testing `APP_KEY` in `backend/phpunit.xml`.

### Issue D: Docker build package failures on Alpine

Symptom:

- Runtime stage extension compile failed due package naming/header mismatch.

Fix:

- Replaced old package names with Alpine-correct packages.
- Ensured required dev headers are present in runtime stage for `docker-php-ext-install`.

## 8. Final validated result

Latest monitored workflow run completed successfully with all core jobs green:

- lint-and-analyze (backend/frontend)
- test-backend
- build-backend-docker
- deploy-backend-render
- deploy-frontend-vercel
- post-deployment-check

## 9. 60-second explanation for viva/professor

Use this script:

"Our GitHub Actions pipeline starts on pushes and pull requests to main. It first validates backend and frontend quality, then runs backend tests with a temporary MySQL container. On main pushes, if tests pass, it builds a production Docker image for Laravel and pushes it to GHCR, while frontend is deployed to Vercel. Backend deployment is handled by Render auto-deploy on main. Finally, a non-blocking health check pings the backend API. We recently fixed SSL test DB mismatch, migration ordering, missing APP_KEY, and Alpine Docker package issues, and now the full pipeline is passing end to end."

## 10. Known design choices and limitations

- Frontend deploy currently does not wait for backend tests.
- Post-deployment health check is intentionally non-blocking.
- `pr-validation` job is informational and does not run additional checks beyond what main jobs already do.

These are acceptable for now but can be tightened if stricter release gates are required.
