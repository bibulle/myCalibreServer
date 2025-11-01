#!/bin/bash
# Simple E2E test runner - shows output in real-time

set -e

echo "════════════════════════════════════════════════════"
echo "  Simple E2E Test Runner"
echo "════════════════════════════════════════════════════"
echo ""

# Cleanup function
cleanup() {
  echo ""
  echo "🧹 Cleaning up..."
  lsof -ti:3333 | xargs kill -9 2>/dev/null || true
  lsof -ti:4200 | xargs kill -9 2>/dev/null || true
  echo "✓ Cleanup complete"
}

trap cleanup EXIT INT TERM

# Step 1: Seed database
echo "🌱 Step 1: Seeding test databases..."
node apps/frontend-e2e/scripts/seed-test-db.js || exit 1
echo ""

# Step 2: Start backend
echo "🚀 Step 2: Starting backend with test databases..."
MONGO_URL=mongodb://localhost:27017 \
MONGO_DB_NAME=myCalibreDb_test \
PATH_BOOKS="$(pwd)/test/data/calibre" \
npx nx serve api &

BACKEND_PID=$!
echo "  Backend PID: $BACKEND_PID"
echo "  Waiting 10 seconds for backend..."
sleep 10

# Step 3: Start frontend  
echo ""
echo "🎨 Step 3: Starting frontend..."
npx nx serve frontend &

FRONTEND_PID=$!
echo "  Frontend PID: $FRONTEND_PID"
echo "  Waiting 30 seconds for frontend to compile..."
sleep 30

# Step 4: Run Cypress
echo ""
echo "🧪 Step 4: Running Cypress tests..."
cd apps/frontend-e2e
npx cypress run --config baseUrl=http://localhost:4200 --spec "$1"
TEST_RESULT=$?

cd ../..

echo ""
echo "════════════════════════════════════════════════════"
if [ $TEST_RESULT -eq 0 ]; then
  echo "✅ Tests passed!"
else
  echo "❌ Tests failed!"
fi
echo "════════════════════════════════════════════════════"

exit $TEST_RESULT
