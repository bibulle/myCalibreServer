# MongoDB Test Database

This directory contains the MongoDB test database setup for integration testing.

## Overview

The test database contains sample user data for testing the `MyCalibreDbService`.

### Test Database Schema

- **Database**: `myCalibreDb_test`
- **Collection**: `users`
- **Documents**: 4 test users

### Test Users

1. **test-user-1** - Local authentication user
   - Username: `testuser`
   - Email: `test@example.com`
   - Has download history and ratings

2. **test-user-2** - Google OAuth user
   - Google ID: `google-123456`
   - Email: `googleuser@gmail.com`

3. **test-user-3** - Facebook OAuth user
   - Facebook ID: `facebook-789012`
   - Email: `fbuser@facebook.com`
   - Admin role

4. **test-user-4** - Admin user with temporary token
   - Username: `adminuser`
   - Email: `admin@example.com`
   - Temporary token: `temp-token-123456`

## Setup

### Option 1: Using Docker (Recommended)

Start a test MongoDB instance using Docker:

```bash
# Start MongoDB container
docker run -d -p 27017:27017 --name mongo-test mongo:latest

# Initialize test database
node test/data/mongo/init-test-db.js

# Stop MongoDB when done
docker stop mongo-test
docker rm mongo-test
```

### Option 2: Using Local MongoDB

If you have MongoDB installed locally:

```bash
# Make sure MongoDB is running on localhost:27017
mongod

# Initialize test database
node test/data/mongo/init-test-db.js
```

### Option 3: Using MongoDB in CI/CD

For CI/CD pipelines, use MongoDB as a service:

**GitHub Actions example:**
```yaml
services:
  mongodb:
    image: mongo:latest
    ports:
      - 27017:27017
```

**GitLab CI example:**
```yaml
services:
  - mongo:latest

variables:
  MONGO_TEST_URL: mongodb://mongo:27017
```

## Running Tests

```bash
# Run MyCalibreDbService tests
npx nx test api --testPathPattern=my-calibre-db.service.spec

# Run with coverage
npx nx test api --testPathPattern=my-calibre-db.service.spec --coverage
```

## Environment Variables

Configure the test database connection with these environment variables:

- `MONGO_TEST_URL` - MongoDB connection URL (default: `mongodb://localhost:27017`)

Example:
```bash
export MONGO_TEST_URL=mongodb://localhost:27017
npx nx test api --testPathPattern=my-calibre-db.service.spec
```

## Test Data Structure

### User Document Schema

```typescript
{
  id: string;                    // Unique user ID
  email: string;                 // User email
  roles: string[];               // User roles ['user', 'admin']
  created: Date;                 // Creation timestamp
  updated: Date;                 // Last update timestamp
  
  // Local authentication
  local?: {
    username: string;
    password: string;            // bcrypt hashed
  };
  
  // OAuth authentication
  google?: {
    id: string;
    email: string;
    name: string;
  };
  
  facebook?: {
    id: string;
    email: string;
    name: string;
  };
  
  // Optional fields
  temporary_token?: string;
  
  // User history
  history?: {
    downloadedBooks: Array<{
      book_id: number;
      book_title: string;
      date: Date;
    }>;
    ratings: Array<{
      book_id: number;
      rating: number;
      date: Date;
    }>;
  };
}
```

## Cleanup

The test setup automatically cleans the database before each test run. To manually clean:

```bash
# Using MongoDB shell
mongosh myCalibreDb_test --eval "db.users.deleteMany({})"

# Or reinitialize
node test/data/mongo/init-test-db.js
```

## Troubleshooting

### Connection Refused

If you get "connection refused" errors:

1. Verify MongoDB is running:
   ```bash
   docker ps | grep mongo-test
   # or
   ps aux | grep mongod
   ```

2. Check the connection URL:
   ```bash
   echo $MONGO_TEST_URL
   ```

3. Test connection manually:
   ```bash
   mongosh $MONGO_TEST_URL
   ```

### Tests Timing Out

Increase the Jest timeout in the test file:

```typescript
beforeEach(async () => {
  jest.setTimeout(10000); // 10 seconds
  // ...
});
```

### Permission Denied

If running MongoDB without authentication, ensure your connection string doesn't include credentials:

```bash
export MONGO_TEST_URL=mongodb://localhost:27017
```

## Notes

- Test database is automatically created if it doesn't exist
- Indexes are created for optimal query performance
- All dates are stored as proper Date objects (not strings)
- Test data is reset before each test suite run
- The test database is separate from production/development databases
