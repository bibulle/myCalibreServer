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

### E2E Tests (Playwright)

Full-stack integration tests that run in a real browser, against the real
API and frontend dev servers:

```bash
npm run e2e:playwright
```

**What E2E tests cover:**

- ✅ Application loading, rendering, and responsive design (mobile, tablet, desktop)
- ✅ Backend API health checks (`/api/health`, `/api/version`)
- ✅ Authentication (login, roles, protected routes)
- ✅ Books, series, authors, and tags browsing, search, filtering, and sorting
- ✅ Book ratings

No MongoDB instance is required to run this suite, anywhere: the API's
`mongodb` driver is swapped for a small in-memory stub pre-seeded with test
users (see `apps/frontend-e2e-playwright/README.md` for details). This is
the only e2e suite in this workspace — it replaced an earlier Cypress suite
that needed a real local MongoDB.

### Running Tests in CI/CD

```bash
# Run all tests (frontend + backend)
npm run test

# Run all tests with a coverage report (frontend + backend)
npm run test:coverage
```

