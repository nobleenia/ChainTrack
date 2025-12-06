# 🔄 ChainTrack CI/CD Guide

This document explains the Continuous Integration and Continuous Deployment (CI/CD) pipeline for ChainTrack.

---

## What is CI/CD?

- **CI (Continuous Integration)**: Automatically test code when you push changes
- **CD (Continuous Deployment)**: Automatically deploy code after tests pass

---

## Our Pipeline

```
┌──────────────────────────────────────────────────────────────────────────┐
│                         GitHub Actions Workflow                           │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│   Push/PR to main or develop                                             │
│         │                                                                │
│         ▼                                                                │
│   ┌─────────────────────────────────────────────────────────┐           │
│   │              PARALLEL JOBS                               │           │
│   │  ┌─────────────┐ ┌─────────────┐ ┌─────────────────┐   │           │
│   │  │  Backend    │ │  Frontend   │ │ Smart Contract  │   │           │
│   │  │   Tests     │ │   Tests     │ │     Tests       │   │           │
│   │  │             │ │             │ │                 │   │           │
│   │  │ • Linting   │ │ • Linting   │ │ • Compile       │   │           │
│   │  │ • PyTest    │ │ • Build     │ │ • Hardhat Test  │   │           │
│   │  │ • Coverage  │ │ • TypeCheck │ │ • Size Check    │   │           │
│   │  └─────────────┘ └─────────────┘ └─────────────────┘   │           │
│   └─────────────────────────────────────────────────────────┘           │
│         │                     │                                          │
│         ▼                     ▼                                          │
│   ┌───────────┐        ┌────────────┐                                   │
│   │ Security  │        │   Docker   │  (only on main)                   │
│   │   Audit   │        │   Build    │                                   │
│   └───────────┘        └────────────┘                                   │
│         │                     │                                          │
│         ▼                     ▼                                          │
│   ┌───────────────────────────────────────────┐                         │
│   │                  DEPLOY                    │                         │
│   │  • PR → Preview Environment               │                         │
│   │  • main → Production                      │                         │
│   └───────────────────────────────────────────┘                         │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## File Location

`.github/workflows/ci.yml`

---

## Jobs Explained

### 1. Backend Tests

```yaml
backend-test:
  runs-on: ubuntu-latest
  services:
    postgres: ...  # Spins up real PostgreSQL for tests
```

**What it does:**
- Starts a PostgreSQL container
- Installs Python dependencies
- Runs `flake8` for linting (catches syntax errors)
- Runs `pytest` with coverage
- Uploads coverage report to Codecov

**Triggers:** Every push and PR to `main` or `develop`

### 2. Frontend Tests

```yaml
frontend-test:
  runs-on: ubuntu-latest
```

**What it does:**
- Installs Node.js dependencies
- Runs ESLint for code quality
- Runs TypeScript type checking
- Builds production bundle (catches build errors)

### 3. Smart Contract Tests

```yaml
contracts-test:
  runs-on: ubuntu-latest
```

**What it does:**
- Compiles Solidity contracts
- Runs Hardhat tests
- Checks contract sizes (prevent exceeding 24KB limit)

### 4. Security Audit

```yaml
security:
  needs: [contracts-test]
```

**What it does:**
- Runs Slither (static analysis tool for Solidity)
- Detects potential vulnerabilities
- Non-blocking (warnings don't fail build)

### 5. Docker Build

```yaml
docker-build:
  needs: [backend-test, frontend-test]
  if: github.ref == 'refs/heads/main'
```

**What it does:**
- Only runs on `main` branch
- Builds Docker images for backend and frontend
- Validates Dockerfiles work correctly

### 6. Deploy

```yaml
deploy-production:
  needs: [backend-test, frontend-test, contracts-test, docker-build]
  if: github.ref == 'refs/heads/main'
  environment: production
```

**What it does:**
- Requires all tests to pass
- Only triggers on `main` branch
- Uses GitHub environment protection rules

---

## Automatic Deployments

### Vercel (Frontend)

Vercel has **built-in GitHub integration**:

1. Every push to `main` → Deploys to production
2. Every PR → Creates preview deployment
3. No configuration needed in GitHub Actions

**Setup:**
1. Connect your repo to Vercel
2. Vercel automatically detects pushes
3. Preview URLs appear in PR comments

### Railway (Backend)

Railway also has **GitHub integration**:

1. Connect your repo to Railway
2. Set the branch to watch (`main`)
3. Railway auto-deploys on push

**Alternative: GitHub Actions Deploy**

To deploy from GitHub Actions instead:

```yaml
deploy-railway:
  runs-on: ubuntu-latest
  needs: [backend-test]
  if: github.ref == 'refs/heads/main'
  steps:
    - uses: actions/checkout@v4
    - name: Install Railway CLI
      run: npm i -g @railway/cli
    - name: Deploy to Railway
      run: railway up
      env:
        RAILWAY_TOKEN: ${{ secrets.RAILWAY_TOKEN }}
```

---

## Setting Up Secrets

### GitHub Repository Secrets

Go to: **Settings** → **Secrets and variables** → **Actions**

Add these secrets:

| Secret | Purpose |
|--------|---------|
| `CODECOV_TOKEN` | Upload coverage reports |
| `RAILWAY_TOKEN` | Deploy to Railway (if using) |
| `VERCEL_TOKEN` | Deploy to Vercel (if using) |

### GitHub Environments

Go to: **Settings** → **Environments** → **New environment**

Create `production` environment with:
- Required reviewers (optional)
- Wait timer before deploy (optional)
- Environment secrets

---

## Branch Strategy

```
main (production)
  │
  ├── develop (staging)
  │     │
  │     ├── feature/new-feature
  │     └── bugfix/fix-issue
  │
  └── hotfix/urgent-fix (direct to main)
```

### Workflow

1. **Feature Development**
   ```bash
   git checkout develop
   git checkout -b feature/my-feature
   # ... make changes ...
   git push origin feature/my-feature
   # Create PR to develop
   ```

2. **Merge to Develop** → CI runs, preview deploys

3. **Release to Production**
   ```bash
   git checkout main
   git merge develop
   git push origin main
   # CI runs, production deploys
   ```

---

## Running CI Locally

### Backend Tests
```bash
cd backend
pip install -r requirements.txt
pytest --cov=app
```

### Frontend Tests
```bash
cd frontend
npm install
npm run lint
npm run build
```

### Contract Tests
```bash
cd contracts
npm install
npm test
```

---

## Viewing CI Results

### GitHub Actions Dashboard

1. Go to your repository
2. Click **"Actions"** tab
3. See all workflow runs

### PR Status Checks

When you open a PR:
- ✅ Green check = tests passed
- ❌ Red X = tests failed
- 🟡 Yellow dot = in progress

### Required Status Checks

Protect your `main` branch:

1. **Settings** → **Branches** → **Add rule**
2. Branch name pattern: `main`
3. Enable:
   - ✅ Require status checks to pass
   - ✅ Select: `backend-test`, `frontend-test`, `contracts-test`
   - ✅ Require branches to be up to date

---

## Customizing the Pipeline

### Add New Test Job

```yaml
new-test:
  name: My New Tests
  runs-on: ubuntu-latest
  steps:
    - uses: actions/checkout@v4
    - name: Run tests
      run: ./run-my-tests.sh
```

### Add Notifications

```yaml
- name: Notify Slack
  uses: 8398a7/action-slack@v3
  with:
    status: ${{ job.status }}
  env:
    SLACK_WEBHOOK_URL: ${{ secrets.SLACK_WEBHOOK }}
```

### Add E2E Tests

```yaml
e2e-test:
  runs-on: ubuntu-latest
  needs: [backend-test, frontend-test]
  steps:
    - uses: actions/checkout@v4
    - name: Start backend
      run: |
        cd backend
        docker-compose up -d
    - name: Run Cypress
      uses: cypress-io/github-action@v6
      with:
        working-directory: frontend
        start: npm run dev
        wait-on: http://localhost:5173
```

---

## Troubleshooting CI

### "Tests pass locally but fail in CI"

Common causes:
- Different Python/Node versions
- Missing environment variables
- Database not available

**Fix:** Match CI versions in your local development

### "Build takes too long"

**Fix:** Enable caching:
```yaml
- uses: actions/setup-python@v5
  with:
    cache: 'pip'  # Caches pip packages
```

### "Flaky tests"

**Fix:** 
- Add retries: `pytest --reruns 3`
- Use fixtures for consistent test data
- Mock external services

---

## Summary

| Event | What Happens |
|-------|--------------|
| Push to `develop` | Tests run, preview deploys |
| PR to `main` | Tests run, blocks merge if fail |
| Merge to `main` | Tests run, production deploys |
| Push to feature branch | Tests run |

Your CI/CD pipeline is already configured and running! Just push code and watch it work.

---

Need to modify the pipeline? Edit `.github/workflows/ci.yml`
