# CI/CD Pipeline Documentation - Invigilore

**Last Updated:** April 11, 2026  
**Status:** Production-Ready  
**Version:** 1.0.0

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Deployment Platforms](#deployment-platforms)
3. [CI/CD Workflow](#cicd-workflow)
4. [Docker Configuration](#docker-configuration)
5. [Environment Variables](#environment-variables)
6. [GitHub Secrets Setup](#github-secrets-setup)
7. [Deployment Flow](#deployment-flow)
8. [Monitoring & Debugging](#monitoring--debugging)
9. [Manual Deployment](#manual-deployment)
10. [Troubleshooting](#troubleshooting)
11. [Scaling & Future Improvements](#scaling--future-improvements)

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                       GitHub Repository                          │
│                    (push to main branch)                          │
└────────┬────────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────────┐
│              GitHub Actions CI/CD Pipeline (.github/workflows)   │
│  ┌────────────────┐  ┌──────────────┐  ┌────────────────┐      │
│  │ Lint & Analyze │  │ Run Tests    │  │ Build Docker   │      │
│  │ (Frontend/Bk)  │  │ (PHPUnit)    │  │ Image (GHCR)   │      │
│  └────────────────┘  └──────────────┘  └────────────────┘      │
│                                                                   │
│         ▼ (on main branch only)                                  │
│  ┌──────────────────────────────────────┐                       │
│  │  Deploy Backend (Render Docker)      │                       │
│  │  Deploy Frontend (Vercel)            │                       │
│  │  Health Checks                       │                       │
│  └──────────────────────────────────────┘                       │
└─────────────────────────────────────────────────────────────────┘
         │
    ┌────┴────┐
    │          │
    ▼          ▼
┌─────────┐  ┌──────────┐
│ Vercel  │  │  Render  │
├─────────┤  ├──────────┤
│Frontend │  │ Backend  │
│         │  │ (Docker) │
└────┬────┘  └────┬─────┘
     │            │
     └─────┬──────┘
           ▼
      ┌──────────────┐
      │ Aiven MySQL  │
      │ (Production) │
      │ (SSL)        │
      └──────────────┘
```

---

## Deployment Platforms

### Frontend: Vercel

- **Platform:** Vercel (Next.js/React hosting)
- **Framework:** React 18 + TypeScript + Vite
- **Build Command:** `npm run build`
- **Output:** Static files in `dist/` folder
- **Auto-Deploy:** On merge to `main` branch
- **Region:** Global CDN (auto-optimized)
- **SSL/TLS:** Built-in (automatic)

**Vercel Features:**

- Edge Functions for serverless logic
- Image optimization
- Analytics
- Preview deployments for PRs (optional)

---

### Backend: Render

- **Platform:** Render (Docker container hosting)
- **Service Type:** Docker Web Service (public)
- **Framework:** Laravel 12 + PHP 8.4
- **Container:** Multi-stage optimized Alpine Linux image
- **Runtime:** PHP CLI with Laravel built-in server
- **Deploy Method:** GitHub auto-deploy (on main branch)
- **Health Check:** HTTP endpoint `/api/health`
- **Port:** 8000 (configurable via PORT env)

**Render Features:**

- Automatic HTTPS
- Zero-downtime deployments
- Environment variables management
- Integrated Docker registry
- Auto-scaling options

---

### Database: Aiven MySQL

- **Provider:** Aiven (Cloud MySQL)
- **Version:** MySQL 8.0+
- **Connection:** SSL/TLS encrypted mandatory
- **High Availability:** Automatic failover
- **Backups:** Automated daily
- **Monitoring:** Built-in dashboards

**Connection Details:**

- Host: `invigilore-learnova.a.aivencloud.com:21642`
- SSL Certificate: Required in production
- Network: Public (IP allowlisting optional)

---

## CI/CD Workflow

### Workflow Triggers

```yaml
Events that trigger the pipeline:
├── push to main branch          → Full deployment pipeline
├── pull_request to main         → Validation only (no deploy)
└── manual workflow dispatch     → On-demand (future feature)
```

### Pipeline Jobs (Sequential)

#### 1️⃣ **lint-and-analyze** (Always runs)

**Purpose:** Code quality checks and build validation

**Backend:**

```bash
composer install --no-interaction
./vendor/bin/pint --test  # Laravel code style
```

**Frontend:**

```bash
npm ci  # clean install
npm run build  # validate build succeeds
```

**Artifacts:** Code quality reports (if enabled)

**Duration:** ~2-3 minutes

**Failure Action:** Blocks subsequent jobs

---

#### 2️⃣ **test-backend** (Depends on lint-and-analyze)

**Purpose:** Run PHPUnit test suite

**Setup:**

- Spin up MySQL 8.0 service in GitHub Actions
- Create test database
- Run Laravel migrations
- Execute all tests

**Test Suite:**

```bash
php artisan test --no-coverage
# Runs 25 tests across:
# - AdminUserManagementTest
# - ExamAttemptFlowTest
# - SubmissionEvaluationTest
# - SystemWorkflowTest
```

**Environment (Testing):**

```
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=invigilore_test
DB_USERNAME=invigilore_user
DB_PASSWORD=test_password
APP_ENV=testing
```

**Duration:** ~3-5 minutes

**Failure Action:** Blocks Docker build & deployment

---

#### 3️⃣ **build-backend-docker** (On main push only)

**Purpose:** Build optimized Docker image and push to GHCR

**Image Details:**

- **Base:** Alpine Linux (minimal)
- **Build Stage:** Composer dependencies installed
- **Runtime Stage:** Only production code & extensions
- **Security:** Non-root user (`laravel:laravel`)
- **Health Check:** Built-in HEALTHCHECK directive
- **Size:** ~150-200 MB (optimized)

**Docker Build Process:**

```bash
# Multi-stage build in ./backend/Dockerfile
# Stage 1: Builder
#   - Install composer dependencies
#   - Optimize autoloader
# Stage 2: Runtime
#   - Copy only vendor from builder
#   - Non-root user setup
#   - Health check registration
```

**Image Tagging:**

```
ghcr.io/tayebbb/invigilore/backend:main    # Branch tag
ghcr.io/tayebbb/invigilore/backend:sha-abc123  # Commit SHA
ghcr.io/tayebbb/invigilore/backend:latest  # Latest on main
```

**Registry:** GitHub Container Registry (GHCR)

**Caching:** Uses GitHub Actions cache for layers

**Duration:** ~1-2 minutes

---

#### 4️⃣ **deploy-backend-render** (On main push only)

**Purpose:** Trigger backend deployment on Render

**Deployment Method:**

- GitHub auto-deploy integration (main branch)

**Render Deployment Process:**

1. Render detects push to main branch
2. Automatically pulls latest code
3. Builds Docker image from Dockerfile
4. Spins up container with env variables
5. Optionally runs migrations when `RUN_MIGRATIONS=true`
6. Starts server on PORT 8000
7. Health checks validate responsiveness

**Health Check Mechanism:**

```
Endpoint: GET /api/health
Interval: 30s
Timeout: 10s
Initial delay: 5s
Retries: 3
Failure action: Rollback to previous version
```

**Environment Variables Passed:**

- From GitHub Secrets
- From Render dashboard
- See [Environment Variables](#environment-variables) section

**Duration:** ~3-5 minutes (excluding build)

---

#### 5️⃣ **deploy-frontend-vercel** (On main push only)

**Purpose:** Deploy frontend to Vercel

**Deployment Method:**

- Vercel CLI via GitHub Actions
- Uses authentication token

**Vercel Deployment Process:**

1. CLI authenticates with VERCEL_TOKEN
2. Builds production bundle: `npm run build`
3. Optimizes and uploads dist/ folder
4. CDN distributes globally
5. Automatic SSL certificate
6. Instant propagation

**Build Environment:**

```bash
VITE_API_BASE_URL="https://backend-url/api"
```

**Deployment Command:**

```bash
vercel deploy \
  --token $VERCEL_TOKEN \
  --prod \
  --build-env VITE_API_BASE_URL="value"
```

**URL Pattern:** `https://invigilore.vercel.app`

**Duration:** ~1-2 minutes

---

#### 6️⃣ **post-deployment-check** (Optional, after both deploy jobs)

**Purpose:** Validate production environment

**Checks:**

1. Wait 60s for backend to stabilize
2. Hit `/api/health` endpoint
3. Retry 5 times with 10s intervals
4. Display deployment summary
5. Continue-on-error (doesn't fail pipeline if health check fails)

**Output:**

```
✅ CI/CD Pipeline Completed
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Backend: Pushed to GHCR & deploying on Render
Frontend: Deployed on Vercel
```

---

## Docker Configuration

### Backend Dockerfile Optimization

**Multi-stage Build Strategy:**

```dockerfile
# Stage 1: Builder
FROM php:8.4-cli-alpine AS builder
RUN install dependencies...
RUN composer install --no-dev --optimize-autoloader

# Stage 2: Runtime (Final image)
FROM php:8.4-cli-alpine
COPY --from=builder /build/vendor ./vendor
RUN adduser -D laravel  # Non-root user
USER laravel
EXPOSE 8000
HEALTHCHECK --interval=30s --timeout=10s...
CMD ["php", "artisan", "serve", "--host=0.0.0.0", "--port=8000"]
```

**Benefits:**

- ✅ Smaller final image (~150 MB vs ~500 MB)
- ✅ No build tools in production
- ✅ Faster deployments
- ✅ Security hardening (non-root)
- ✅ Automatic health checks

### Frontend Dockerfile Optimization

```dockerfile
# Stage 1: Builder
FROM node:20-alpine AS builder
RUN npm ci && npm run build

# Stage 2: Runtime (Static server)
FROM node:20-alpine
RUN npm install -g serve
COPY --from=builder /build/dist ./dist
EXPOSE 3000
CMD ["serve", "-s", "dist", "-l", "3000"]
```

**Benefits:**

- ✅ Static files only shipped to production
- ✅ No source code or dev dependencies
- ✅ Fast DL (~100 MB image)
- ✅ Serve as static via serve or nginx

### .dockerignore Files

Both `.dockerignore` files are configured to exclude:

**Backend excludes:**

```
.git, .github, node_modules
tests, phpunit.xml
composer.phar
storage/logs, bootstrap/cache
*.sql, *.db
README.md, docker-compose.yml
```

**Frontend excludes:**

```
.git, .github, node_modules
dist/, build/ (rebuilt on each build)
coverage, .nyc_output
*.md, docker-compose.yml
```

---

## Environment Variables

### Backend (Laravel) Environment Variables

**Database Configuration:**

```env
DB_CONNECTION=mysql
DB_HOST=invigilore-learnova.a.aivencloud.com
DB_PORT=21642
DB_DATABASE=invigilore_prod
DB_USERNAME=avnadmin
DB_PASSWORD=***REDACTED***
```

**SSL/TLS for Aiven MySQL:**

```env
MYSQL_ATTR_SSL_CA=/etc/ssl/certs/ca-bundle.crt
MYSQL_ATTR_SSL_MODE=VERIFY_IDENTITY
```

**Laravel Application:**

```env
APP_NAME=Invigilore
APP_ENV=production
APP_DEBUG=false
APP_URL=https://api.invigilore.com  # or Render URL
APP_KEY=base64:xxxxx  # Generated via artisan key:generate

LOG_CHANNEL=stack
LOG_LEVEL=warning
```

**Authentication & Security:**

```env
SANCTUM_STATEFUL_DOMAINS=invigilore.vercel.app
SESSION_DOMAIN=invigilore.com
CORS_ALLOWED_ORIGINS=https://invigilore.vercel.app

JWT_SECRET=***REDACTED***
JWT_ALGORITHM=HS256
JWT_TTL=1440
```

**Cache & Queue (Optional):**

```env
CACHE_DRIVER=file
QUEUE_CONNECTION=sync
SESSION_DRIVER=file
```

### Frontend (React) Environment Variables

**API Configuration:**

```env
VITE_API_BASE_URL=https://api.invigilore.com/api
```

**Example variations by deployment:**

```
Local Dev:     http://localhost:8080/api
Docker:        http://backend:8000/api
Render Prod:   https://invigilore.onrender.com/api
Custom Domain: https://api.invigilore.com/api
```

### Environment Variable Sources

| Variable        | Local Dev    | Docker Compose       | GitHub Actions | Vercel   | Render  |
| --------------- | ------------ | -------------------- | -------------- | -------- | ------- |
| `DB_*`          | `.env`       | `.env.docker`        | Secrets        | N/A      | Secrets |
| `APP_KEY`       | `.env`       | `.env.docker`        | Secrets        | N/A      | Env var |
| `JWT_SECRET`    | `.env`       | `.env.docker`        | Secrets        | N/A      | Env var |
| `VITE_*`        | `.env.local` | Built into container | Secrets        | Built-in | N/A     |
| `PORT` (Render) | N/A          | N/A                  | N/A            | N/A      | Auto    |

---

## GitHub Secrets Setup

### Required Secrets for CI/CD

Go to: **GitHub Repository → Settings → Secrets and variables → Actions**

#### Vercel Deployment Secrets

| Secret              | Obtaining It                          | Used By         | Example          |
| ------------------- | ------------------------------------- | --------------- | ---------------- |
| `VERCEL_TOKEN`      | Vercel Dashboard → Settings → Tokens  | Frontend deploy | `ajKm9k_l29d...` |
| `VERCEL_ORG_ID`     | Vercel Dashboard → Settings → General | Frontend deploy | `team_abc123xyz` |
| `VERCEL_PROJECT_ID` | Vercel → Project Settings → General   | Frontend deploy | `prj_abc123xyz`  |

**How to get Vercel secrets:**

1. Log in to https://vercel.com
2. Click on your project
3. Go to **Settings → General**
4. Copy `Project ID` → set as `VERCEL_PROJECT_ID`
5. Go to **Settings → Tokens**
6. Create new token → set as `VERCEL_TOKEN`
7. Organization ID is in dashboard context

---

#### Render Deployment Secrets (Optional)

| Secret              | Obtaining It                   | Used By               | Optional |
| ------------------- | ------------------------------ | --------------------- | -------- |
| `RENDER_SERVICE_ID` | Render Dashboard → Settings    | Informational logging | ✅ Yes   |
| `BACKEND_URL`       | Render Dashboard → Environment | Health check          | ✅ Yes   |

**How to get Render secrets:**

1. Log in to https://render.com
2. Select your service
3. Ensure GitHub auto-deploy is enabled for `main`
4. Service ID visible in URL: `https://dashboard.render.com/web/srv_xxxxx`

---

#### Database & Application Secrets

| Secret              | Value                    | Used By            | Example                                |
| ------------------- | ------------------------ | ------------------ | -------------------------------------- |
| `DB_HOST`           | Aiven MySQL hostname     | Backend build/test | `invigilore-learnova.a.aivencloud.com` |
| `DB_PORT`           | Aiven MySQL port         | Backend build/test | `21642`                                |
| `DB_USERNAME`       | Aiven admin user         | Backend build/test | `avnadmin`                             |
| `DB_PASSWORD`       | Aiven admin password     | Backend build/test | `***REDACTED***`                       |
| `DB_DATABASE`       | Production database name | Backend build/test | `invigilore_prod`                      |
| `APP_KEY`           | Laravel encryption key   | Backend deployment | `base64:xxxxx`                         |
| `JWT_SECRET`        | JWT signing key          | Backend deployment | `***REDACTED***`                       |
| `VITE_API_BASE_URL` | Backend API URL          | Frontend build     | `https://api.invigilore.com/api`       |

**How to get Aiven secrets:**

1. Log in to https://aiven.io
2. Select MySQL service
3. Go to **Connection Information**
4. Copy hostname, port, username, password
5. SSL certificates also available there

---

### Setting Up Secrets in GitHub

1. Go to repository **Settings**
2. Select **Secrets and variables → Actions**
3. Click **New repository secret**
4. Enter name and value pairs:

```
VERCEL_TOKEN          = your_token_here
VERCEL_ORG_ID         = org_id_here
VERCEL_PROJECT_ID     = proj_id_here
DB_HOST               = invigilore-learnova.a.aivencloud.com
DB_PORT               = 21642
DB_USERNAME           = avnadmin
DB_PASSWORD           = ***
DB_DATABASE           = invigilore_prod
APP_KEY               = base64:xxxxxx
JWT_SECRET            = xxxxxx
VITE_API_BASE_URL     = https://api.domain.com/api
```

---

## Deployment Flow

### Production Deployment (main branch push)

```
Developer → Push to main
            ↓
GitHub Actions Workflow Triggered
            ↓
1. Lint & Analyze (Backend + Frontend)
   Tests code style, syntax
   Duration: ~2-3 min
   ✋ Block if failed
            ↓
2. Test Backend (PHPUnit)
   Run 25 tests against test DB
   Duration: ~3-5 min
   ✋ Block if failed
            ↓
3. Build Backend Docker
   Multi-stage build, push to GHCR
   Duration: ~1-2 min
            ↓
4A. Deploy Backend (in parallel)
    Render auto-detects push
    Builds container
   Optional migrations run (RUN_MIGRATIONS=true)
    Server starts
    Duration: ~3-5 min
    ↓
    Health check endpoints
    Retry on failure
            ↓
4B. Deploy Frontend (in parallel)
    Vercel CLI build & deploy
    CDN distribution
    Duration: ~1-2 min
            ↓
5. Post-Deployment Check
   Validate backend health
   Display summary
   Duration: ~1 min
            ↓
✅ PRODUCTION DEPLOYMENT COMPLETE
```

### Pull Request Validation (non-main-branch)

```
Developer → Create/Push to PR branch
            ↓
GitHub Actions Workflow Triggered (validation only)
            ↓
1. Lint & Analyze (Backend + Frontend)
            ↓
2. Test Backend (PHPUnit)
            ↓
3. ✋ STOP HERE (no build/deploy for PRs)
            ↓
PR comments show test results
✅ VALIDATION ONLY (No Deployment)
```

---

## Monitoring & Debugging

### Viewing Workflow Runs

1. Go to GitHub repository
2. Click **Actions** tab
3. Select workflow run to inspect
4. Click job for detailed logs

### Common Issues & Solutions

#### ❌ Tests Failing in CI

**Problem:** Tests pass locally but fail in GitHub Actions

**Solution:**

```bash
# Check database connectivity
# Ensure test database credentials match .env.test
# Verify MySQL service is running in workflow
# Check for timezone mismatches
```

**Debug Steps:**

1. Review **test-backend** job logs
2. Look for specific test failures
3. Check MySQL service initialization
4. Verify environment variables in workflow

#### ❌ Docker Build Fails

**Problem:** `docker build` fails with missing dependencies

**Solution:**

```bash
# Ensure .dockerignore doesn't exclude needed files
# Verify composer.json/package.json are copied
# Check layer caching issues
```

**Debug Steps:**

1. Review **build-backend-docker** job logs
2. Look for missing files in `COPY` commands
3. Check `composer install` errors
4. Verify PHP extension availability

#### ❌ Vercel Deployment Fails

**Problem:** `VERCEL_TOKEN` not found or invalid

**Solution:**

1. Verify secrets are set in GitHub
2. Confirm token hasn't expired
3. Check organization ID matches project

**Debug Steps:**

```bash
# Test Vercel CLI locally
vercel deploy --token $VERCEL_TOKEN --prod

# Verify project setup
vercel project list
```

#### ❌ Render Deployment Fails

**Problem:** Backend doesn't start or crashes on startup

**Solution:**

1. Check Docker image built successfully
2. Verify environment variables set in Render
3. If `RUN_MIGRATIONS=true`, review migration output
4. Check Laravel logs

**Debug Steps:**

1. Render Dashboard → Logs → View live logs
2. Check if migrations ran successfully
3. Verify database connectivity
4. Ensure `php artisan key:generate` ran

#### ❌ Health Check Failing

**Problem:** `/api/health` endpoint not responding

**Solution:**

1. Verify Laravel app is running
2. Check app configuration
3. Ensure health route exists

**Health Route (to add if missing):**

```php
// routes/api.php
Route::get('/health', function () {
    return response()->json(['status' => 'ok'], 200);
});
```

---

### Accessing Logs

**GitHub Actions Logs:**

```
GitHub → Actions → [Workflow] → [Run] → [Job] → View logs
```

**Vercel Logs:**

```
Vercel Dashboard → [Project] → Deployments → [Deployment] → View Logs
```

**Render Logs:**

```
Render Dashboard → [Service] → Logs → View live streaming logs
```

**Aiven MySQL Logs:**

```
Aiven Console → [Service] → Logs → Query logs
```

---

## Manual Deployment

### Deploying Manually Without CI/CD

#### Manual Backend Deployment to Render

```bash
# 1. Build Docker locally
cd backend
docker build -t invigilore-backend:v1.0.0 .

# 2. Tag for GHCR
docker tag invigilore-backend:v1.0.0 ghcr.io/tayebbb/invigilore/backend:v1.0.0

# 3. Push to registry
docker login ghcr.io
docker push ghcr.io/tayebbb/invigilore/backend:v1.0.0

# 4. Update Render service to use new image
# Go to Render Dashboard → Services → [Service] → Settings
# Update Docker Image URL to pushed tag
```

---

#### Manual Frontend Deployment to Vercel

```bash
# 1. Install Vercel CLI
npm install -g vercel

# 2. Deploy production
cd frontend
vercel deploy --prod

# 3. Vercel will prompt for confirmations
# Select your org and project
```

---

#### Manual Test Run

```bash
# Backend tests
cd backend
php artisan test

# Frontend build validation
cd frontend
npm run build

# Check build output
ls -lh dist/
```

---

## Troubleshooting

### 🔴 Common Errors & Solutions

#### Error: "SQLSTATE[HY000]: General error: 2006 MySQL server has gone away"

**Cause:** Database connection timeout or SSL issue

**Solution:**

```env
DB_HOST=invigilore-learnova.a.aivencloud.com
DB_PORT=21642
MYSQL_ATTR_SSL_CA=/etc/ssl/certs/ca-bundle.crt
MYSQL_ATTR_SSL_MODE=VERIFY_IDENTITY
# Add connection pool timeout
DB_CONNECTION_POOL_TIMEOUT=60
```

---

#### Error: "PDOException: SQLSTATE[HY000]: General error: 1030"

**Cause:** MySQL table max file size exceeded or data corruption

**Solution:**

```bash
# Check table sizes
mysql -h host -u user -p -e "SELECT table_name, ROUND(((data_length + index_length) / 1024 / 1024), 2) MB FROM information_schema.TABLES WHERE table_schema='invigilore_prod';"

# If needed, optimize tables
php artisan db:optimize
```

---

#### Error: "No such file or directory: /var/www/html/ca.pem"

**Cause:** SSL certificate not found in container

**Solution:**

```dockerfile
# The Dockerfile expects ca.pem at root
# Use system trust store instead:
MYSQL_ATTR_SSL_MODE=VERIFY_IDENTITY
# (System will use /etc/ssl/certs/ca-bundle.crt)
```

---

#### Error: "composer install: Package could not be found"

**Cause:** Private Composer package without authentication

**Solution:**

```bash
# Configure Composer auth for private repos
composer config github-oauth.github.com $GITHUB_TOKEN
composer install --no-interaction --prefer-dist
```

---

#### Error: "Vercel: Project not found"

**Cause:** Invalid PROJECT_ID or ORG_ID

**Solution:**

1. Verify secrets in GitHub
2. Re-generate Vercel token
3. Check project still exists

```bash
# List Vercel projects
vercel projects list

# Get current project info
vercel project inspect
```

---

#### Error: "Docker image too large (>1GB)"

**Cause:** .dockerignore not excluding node_modules/vendor

**Solution:**

```dockerfile
# Ensure .dockerignore excludes:
node_modules/
vendor/ (builder only)
dist/ (already built)
src/ (frontend only)
tests/
coverage/
```

---

### 🟡 Performance Optimization

#### Speed up tests

```bash
# Use --parallel flag
php artisan test --parallel

# Or use specific test suite
php artisan test --filter=ExamAttemptFlowTest
```

#### Speed up Docker builds

```bash
# Use buildkit caching
DOCKER_BUILDKIT=1 docker build .

# Or in CI:
uses: docker/setup-buildx-action@v3
```

#### Speed up Vercel Deploy

```bash
# Ensure .vercelignore is optimal
# Only include necessary files
echo "node_modules/" >> .vercelignore
echo "tests/" >> .vercelignore
echo "*.md" >> .vercelignore
```

---

### 🟢 Debug Commands Reference

```bash
# Check Docker image size
docker images | grep invigilore

# Inspect Docker layers
docker history ghcr.io/tayebbb/invigilore/backend:latest

# Test local build
cd backend && docker build -t test:local .

# Run backend locally
docker run -p 8000:8000 -e APP_KEY=base64:xxx test:local

# Test database connection
mysql -h invigilore-learnova.a.aivencloud.com -u avnadmin -p -e "SELECT 1;"

# Check GitHub Actions cache
gh actions-cache list

# Validate YAML syntax
yamllint .github/workflows/ci-cd.yml
```

---

## Scaling & Future Improvements

### Immediate Enhancements

1. **Add Preview Deployments for PRs**

   ```yaml
   # Add Vercel preview URL to PR comments
   - name: 📱 Comment PR with preview URL
     if: github.event_name == 'pull_request'
     uses: actions/github-script@v7
   ```

2. **Add Database Migrations Testing**

   ```bash
   # Test fresh migrations
   php artisan migrate:refresh --seed
   ```

3. **Add Code Coverage Reports**

   ```bash
   php artisan test --coverage --coverage-html=coverage/
   ```

4. **Add Performance Benchmarks**
   ```yaml
   - name: 📊 Benchmark key endpoints
     run: |
       php artisan tinker --execute="..."
   ```

### Medium-Term Improvements

1. **Add Staging Environment**
   - Branch: `staging` → Deploy to staging Render service
   - GitHub environment protection rules
   - Manual approval before production

2. **Add Docker Registry Scanning**
   - Trivy security scanning
   - Dependabot for dependency updates
   - SBOM (Software Bill of Materials)

3. **Add Monitoring & Alerting**
   - Sentry for error tracking
   - New Relic or Datadog for APM
   - Slack notifications on failures

4. **Add Database Backup Automation**
   - Automated Aiven backups
   - GitHub Actions scheduled jobs
   - S3 backup storage

### Long-Term Improvements

1. **Kubernetes Deployment**
   - Helm charts for complex deployments
   - Auto-scaling based on metrics
   - Service mesh (Istio)

2. **Multi-Region Deployment**
   - AWS CloudFront CDN for frontend
   - RDS Read Replicas for database
   - Multi-region backend failover

3. **Advanced Testing**
   - Load testing (K6, Locust)
   - Security scanning (OWASP ZAP)
   - Integration tests

4. **GitOps Workflow**
   - ArgoCD for declarative deployments
   - Pull request driven infrastructure
   - Automated rollbacks

---

## Reference Links

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Render Documentation](https://render.com/docs)
- [Vercel Documentation](https://vercel.com/docs)
- [Laravel Documentation](https://laravel.com/docs)
- [React Documentation](https://react.dev)
- [Docker Best Practices](https://docs.docker.com/develop/dev-best-practices/)
- [GHCR Documentation](https://docs.github.com/en/packages/working-with-a-github-packages-registry/working-with-the-container-registry)
- [Aiven MySQL Documentation](https://aiven.io/help/mysql)

---

## Support & Contact

- **DevOps Team:** devops@invigilore.com
- **GitHub Issues:** [Report issues here](https://github.com/Tayebbb/Invigilore/issues)
- **Slack Channel:** #devops-support

---

**Document Version:** 1.0.0  
**Last Updated:** April 11, 2026  
**Status:** Production-Ready ✅
