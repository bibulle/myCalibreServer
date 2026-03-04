# MyCalibreServer
my own calibre server

## 🚀 Quick Start

### Prerequisites
- Node.js 24 LTS (use `.nvmrc` with `nvm use`)
- npm 10+
- A Calibre library

### Installation

1. Clone the repository
```bash
git clone https://github.com/bibulle/myCalibreServer.git
cd myCalibreServer
```

2. Install dependencies
```bash
npm install
```

3. Configure environment variables
```bash
cp .env.example .env
```

Edit `.env` and set your configuration:
- **SESSION_SECRET** (REQUIRED): Strong random string for session encryption
- **AUTHENT_JWT_SECRET** (REQUIRED): Strong random string for JWT tokens
- **PATH_BOOKS**: Path to your Calibre library
- **PATH_MY_CALIBRE**: Path for cache storage
- Google/Facebook OAuth credentials (optional)

You can generate secure secrets with:
```bash
openssl rand -base64 32
```

4. Start the application (2 terminals)

```bash
# Terminal 1: API NestJS
npm run start:api

# Terminal 2: Frontend Angular (avec proxy /api)
npm run start:frontend
```

## 🔧 Configuration

### Required Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `SESSION_SECRET` | Secret for session encryption (REQUIRED) | `your-random-secret-32-chars` |
| `AUTHENT_JWT_SECRET` | Secret for JWT token signing (REQUIRED) | `your-jwt-secret-32-chars` |
| `PORT` | Server port | `3333` |
| `PATH_BOOKS` | Path to Calibre library | `/path/to/calibre/library` |
| `PATH_MY_CALIBRE` | Cache directory | `/path/to/cache` |
| `LOG_LEVEL` | Logging level | `LOG`, `DEBUG`, `VERBOSE` |

### Optional Environment Variables (OAuth)

| Variable | Description |
|----------|-------------|
| `AUTHENT_GOOGLE_CLIENT_ID` | Google OAuth Client ID |
| `AUTHENT_GOOGLE_CLIENT_SECRET` | Google OAuth Client Secret |
| `AUTHENT_FACEBOOK_APP_ID` | Facebook App ID |
| `AUTHENT_FACEBOOK_APP_SECRET` | Facebook App Secret |

### Security Best Practices

⚠️ **Never commit your `.env` file to version control!**

- Use strong, randomly generated secrets for `SESSION_SECRET` and `AUTHENT_JWT_SECRET`
- Rotate secrets regularly in production
- Use different secrets for development and production environments
- Store production secrets securely (e.g., using secret management tools)

## 🧪 Testing

### Unit Tests

Run backend unit tests (using Jest):

```bash
# Run all tests
npx nx test api

# Run specific test file
npx nx test api --testPathPattern=health

# Run tests in watch mode
npx nx test api --watch
```

### E2E Tests (Cypress)

Full-stack integration tests that run in a real browser:

```bash
# Run E2E tests (headless mode)
npx nx e2e frontend-e2e

# Run E2E tests with Cypress UI (interactive mode)
npx nx e2e frontend-e2e --watch

# Run specific test file
npx nx e2e frontend-e2e --spec="apps/frontend-e2e/src/integration/app.spec.ts"
```

**What E2E tests cover:**

- ✅ Application loading and rendering
- ✅ Backend API health checks (`/api/health`, `/api/version`)
- ✅ Responsive design (mobile, tablet, desktop)
- ✅ Full-stack integration (frontend + backend)

**Test artifacts:**

- Screenshots: `dist/cypress/apps/frontend-e2e/screenshots/`
- Videos: `dist/cypress/apps/frontend-e2e/videos/`

### Running Tests in CI/CD

```bash
# Run all tests
npm run test

# Run tests with coverage
npx nx test api --coverage
```

