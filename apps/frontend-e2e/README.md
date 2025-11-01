# Cypress E2E Tests for myCalibreServer

Comprehensive end-to-end tests for the Calibre Library application using Cypress with test databases.

## Overview

The E2E tests use isolated test databases to ensure consistent, reproducible test results:
- **MongoDB test database**: `myCalibreDb_test` for user data
- **Calibre SQLite test database**: `test/data/calibre/metadata.db` for book data

## Setup

### Prerequisites

1. **MongoDB** running locally on `mongodb://localhost:27017`
2. **Backend API** running on `http://localhost:3333`
3. **Frontend app** running on `http://localhost:4200`
4. **Test databases** seeded with test data

### Install Dependencies

```bash
npm install
```

### Seed Test Databases

Before running E2E tests, seed the test databases:

```bash
# Seed both MongoDB and verify Calibre test database
nx run frontend-e2e:seed-test-db

# Or run directly
node apps/frontend-e2e/scripts/seed-test-db.js
```

This will:
- Create/reset the MongoDB test database with test users
- Verify the Calibre SQLite test database exists and is readable

## Running E2E Tests

### Quick Start (Automated)

Use the provided script to launch everything:

```bash
# Run all tests
./apps/frontend-e2e/scripts/run-e2e-tests.sh

# Run specific test file
./apps/frontend-e2e/scripts/run-e2e-tests.sh --spec "src/integration/app.spec.ts"

# Open Cypress Test Runner UI
./apps/frontend-e2e/scripts/run-e2e-tests.sh --open
```

The script will:
1. Check MongoDB is running
2. Seed test databases
3. Start backend with test configuration
4. Start frontend
5. Run Cypress tests
6. Clean up on exit

### Manual Setup (Step by Step)

#### 1. Seed the test databases

```bash
node apps/frontend-e2e/scripts/seed-test-db.js
```

#### 2. Start backend with test databases

```bash
MONGO_URL=mongodb://localhost:27017 \
MONGO_DB_NAME=myCalibreDb_test \
PATH_BOOKS=./test/data/calibre \
npx nx serve api
```

#### 3. Start frontend (in another terminal)

```bash
npx nx serve frontend
```

#### 4. Run Cypress tests (in another terminal)

```bash
# Run all tests in headless mode
cd apps/frontend-e2e
npx cypress run --config baseUrl=http://localhost:4200

# Open Cypress Test Runner UI
cd apps/frontend-e2e
npx cypress open

# Run specific test
npx cypress run --config baseUrl=http://localhost:4200 --spec "src/integration/app.spec.ts"
```

### Using Nx Commands

```bash
# Run with automatic database seeding
npx nx run frontend-e2e:e2e-with-seed

# Run tests only (databases already seeded, services running)
npx nx e2e frontend-e2e
```

**Note:** When using `npx nx e2e frontend-e2e`, Nx will try to start its own dev server. Make sure backend is running separately with test database configuration.

## Test Structure

### Test Files

- **`app.spec.ts`**: Basic application smoke tests
- **`authentication.spec.ts`**: User authentication flows (login, logout, sessions)
- **`books.spec.ts`**: Books browsing, searching, filtering, rating
- **`series-authors.spec.ts`**: Series and authors navigation and filtering

### Custom Commands

Custom Cypress commands are defined in `src/support/commands.ts`:

```typescript
// Authentication
cy.login(username, password)          // Login via API
cy.loginViaUI(username, password)     // Login and set localStorage
cy.logout()                           // Logout and clear auth

// Database
cy.seedDatabase()                     // Seed test databases

// Books API
cy.getBooks(filters)                  // Get books with optional filters
cy.getBook(bookId)                    // Get specific book
cy.rateBook(bookId, rating)          // Rate a book (authenticated)

// Series/Authors/Tags API
cy.getSeries()                        // Get series list
cy.getAuthors()                       // Get authors list
cy.getTags()                          // Get tags list

// Health
cy.checkApiHealth()                   // Check API health status
```

### Test Users

Test users are created during database seeding:

| Username   | Password     | Email                | Roles          |
|------------|--------------|----------------------|----------------|
| testuser   | password123  | test@example.com     | user           |
| adminuser  | password123  | admin@example.com    | user, admin    |

## Configuration

### Environment Variables

Configuration is in `cypress.env.json`:

```json
{
  "apiUrl": "http://localhost:3333/api",
  "testMongoUrl": "mongodb://localhost:27017",
  "testMongoDbName": "myCalibreDb_test",
  "testCalibreDbPath": "test/data/calibre/metadata.db"
}
```

### Cypress Configuration

Main configuration is in `cypress.json`:

```json
{
  "baseUrl": "http://localhost:4200",
  "env": {
    "apiUrl": "http://localhost:3333/api"
  },
  "defaultCommandTimeout": 10000,
  "retries": {
    "runMode": 2,
    "openMode": 0
  }
}
```

## Test Categories

### Authentication Tests
- Login with valid/invalid credentials
- Logout functionality
- Session persistence
- Protected routes
- User roles (user, admin)

### Books Tests
- Browse books library
- Search books by title/author
- Filter books by series, tags, author
- Sort books by title, date
- Pagination
- View book details
- Rate books (authenticated)
- Download tracking

### Series and Authors Tests
- Fetch series/authors lists
- View books in a series
- View books by an author
- Filter and sort series/authors
- Tag-based filtering
- Data consistency checks

## Best Practices

1. **Always seed databases before running tests**:
   ```bash
   nx run frontend-e2e:seed-test-db
   ```

2. **Use test-specific data**: Tests use predictable test data from seeded databases

3. **Clean state**: Each test starts with a clean authentication state

4. **API-first testing**: Test API endpoints directly before testing UI

5. **Isolation**: Tests don't depend on each other

6. **Retries**: Tests automatically retry twice in CI (runMode)

## CI/CD Integration

For CI/CD pipelines:

```bash
# 1. Start MongoDB
docker run -d -p 27017:27017 mongo:latest

# 2. Seed databases
nx run frontend-e2e:seed-test-db

# 3. Start backend (with test database config)
MONGO_URL=mongodb://localhost:27017 MONGO_DB_NAME=myCalibreDb_test nx serve api &

# 4. Start frontend
nx serve frontend &

# 5. Wait for services to be ready
sleep 10

# 6. Run E2E tests
nx e2e frontend-e2e
```

## Troubleshooting

### MongoDB Connection Issues

If you see MongoDB connection errors:

```bash
# Check MongoDB is running
docker ps | grep mongo

# Start MongoDB if not running
docker run -d -p 27017:27017 --name mongo-test mongo:latest
```

### Calibre Database Not Found

If the Calibre test database is missing:

```bash
# Check if file exists
ls -l test/data/calibre/metadata.db

# Copy from production data if needed
cp data/calibre/metadata.db test/data/calibre/
```

### Backend API Not Responding

Ensure the backend is running with test database configuration:

```bash
MONGO_URL=mongodb://localhost:27017 \
MONGO_DB_NAME=myCalibreDb_test \
nx serve api
```

### Frontend Not Loading

Ensure the frontend is running:

```bash
nx serve frontend
```

## Debugging Tests

### View test results in Cypress UI

```bash
nx e2e frontend-e2e --watch
```

### Enable debug logging

```bash
DEBUG=cypress:* nx e2e frontend-e2e
```

### Take screenshots on failure

Screenshots are automatically saved to:
```
dist/cypress/apps/frontend-e2e/screenshots/
```

### Record videos

Videos are saved to:
```
dist/cypress/apps/frontend-e2e/videos/
```

## Contributing

When adding new E2E tests:

1. Use existing custom commands when possible
2. Follow the existing test structure
3. Add tests to appropriate spec file (authentication, books, etc.)
4. Ensure tests work with seeded test data
5. Update this README if adding new features

## Resources

- [Cypress Documentation](https://docs.cypress.io/)
- [Cypress Best Practices](https://docs.cypress.io/guides/references/best-practices)
- [Nx Cypress Plugin](https://nx.dev/packages/cypress)
