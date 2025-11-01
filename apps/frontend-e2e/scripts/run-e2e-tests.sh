#!/bin/bash

# E2E Test Runner Script
# This script:
# 1. Seeds the test databases
# 2. Starts backend with test databases
# 3. Starts frontend
# 4. Runs Cypress E2E tests
# 5. Cleans up processes on exit

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Get the project root directory (3 levels up from this script)
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"
cd "$PROJECT_ROOT"

echo -e "${BLUE}════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}  E2E Test Runner for myCalibreServer${NC}"
echo -e "${BLUE}════════════════════════════════════════════════════${NC}\n"

# PIDs to track for cleanup
BACKEND_PID=""
FRONTEND_PID=""

# Cleanup function
cleanup() {
  echo -e "\n${YELLOW}🧹 Cleaning up processes...${NC}"
  
  # First try graceful shutdown
  if [ ! -z "$BACKEND_PID" ]; then
    echo "  Stopping backend (PID: $BACKEND_PID)..."
    kill -TERM $BACKEND_PID 2>/dev/null || true
    sleep 2
  fi
  
  if [ ! -z "$FRONTEND_PID" ]; then
    echo "  Stopping frontend (PID: $FRONTEND_PID)..."
    kill -TERM $FRONTEND_PID 2>/dev/null || true
    sleep 2
  fi
  
  # Force kill any remaining processes on ports
  echo "  Force stopping any remaining processes on ports 3333 and 4200..."
  lsof -ti:3333 | xargs kill -9 2>/dev/null || true
  lsof -ti:4200 | xargs kill -9 2>/dev/null || true
  
  # Clean up log files older than 1 day
  find /tmp -name "e2e-*.log" -mtime +1 -delete 2>/dev/null || true
  
  echo -e "${GREEN}✓ Cleanup complete${NC}"
}

# Register cleanup on exit
trap cleanup EXIT INT TERM

# Check if MongoDB is running
echo -e "${YELLOW}🔍 Checking prerequisites...${NC}"
if ! pgrep -x "mongod" > /dev/null; then
  echo -e "${RED}✗ MongoDB is not running!${NC}"
  echo -e "  Please start MongoDB first: brew services start mongodb-community"
  exit 1
fi
echo -e "${GREEN}✓ MongoDB is running${NC}"

# Step 1: Seed test databases
echo -e "\n${YELLOW}🌱 Step 1: Seeding test databases...${NC}"
node apps/frontend-e2e/scripts/seed-test-db.js
if [ $? -ne 0 ]; then
  echo -e "${RED}✗ Database seeding failed!${NC}"
  exit 1
fi

# Step 2: Start backend with test databases
echo -e "\n${YELLOW}🚀 Step 2: Starting backend API with test databases...${NC}"
export MONGO_URL=mongodb://localhost:27017
export MONGO_DB_NAME=myCalibreDb_test
export PATH_BOOKS="$PROJECT_ROOT/test/data/calibre"

# Start backend in background with nohup and detached from terminal
nohup npx nx serve api < /dev/null > /tmp/e2e-backend.log 2>&1 &
BACKEND_PID=$!
disown $BACKEND_PID 2>/dev/null || true

echo -e "  Backend starting (PID: $BACKEND_PID)..."
echo -e "  Waiting for backend to be ready..."

# Wait for backend to be ready (max 30 seconds)
for i in {1..30}; do
  if curl -s http://localhost:3333/api/health > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Backend is ready on port 3333${NC}"
    break
  fi
  if [ $i -eq 30 ]; then
    echo -e "${RED}✗ Backend failed to start in 30 seconds${NC}"
    echo -e "  Check logs: tail /tmp/e2e-backend.log"
    exit 1
  fi
  sleep 1
  echo -n "."
done

# Verify backend is using test database
HEALTH_CHECK=$(curl -s http://localhost:3333/api/health)
echo -e "  Backend health: $HEALTH_CHECK"

# Step 3: Start frontend
echo -e "\n${YELLOW}🎨 Step 3: Starting frontend application...${NC}"

# Start frontend in background with nohup and detached from terminal
nohup npx nx serve frontend < /dev/null > /tmp/e2e-frontend.log 2>&1 &
FRONTEND_PID=$!
disown $FRONTEND_PID 2>/dev/null || true

echo -e "  Frontend starting (PID: $FRONTEND_PID)..."
echo -e "  Waiting for frontend to be ready..."

# Wait for frontend to be ready (max 120 seconds for compilation)
echo -e "  This may take up to 2 minutes for initial compilation..."
for i in {1..120}; do
  # Check if process is still running
  if ! kill -0 $FRONTEND_PID 2>/dev/null; then
    echo -e "${RED}✗ Frontend process died unexpectedly${NC}"
    echo -e "  Check logs: tail /tmp/e2e-frontend.log"
    exit 1
  fi
  
  # Check if port is listening AND if we get a valid response
  if lsof -ti:4200 > /dev/null 2>&1; then
    # Port is open, now check if Angular is compiled
    RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:4200 2>/dev/null)
    if [ "$RESPONSE" = "200" ]; then
      # Give it more time to ensure full compilation and stabilization
      # Wait longer to let Angular dev server fully stabilize
      echo -e "  Frontend responding, waiting for full stabilization..."
      sleep 30
      echo -e "${GREEN}✓ Frontend is ready on port 4200${NC}"
      
      # Verify process is still running
      if ! kill -0 $FRONTEND_PID 2>/dev/null; then
        echo -e "${YELLOW}⚠ Frontend PID changed, getting new PID...${NC}"
        FRONTEND_PID=$(lsof -ti:4200)
        echo -e "  New Frontend PID: $FRONTEND_PID"
      fi
      break
    fi
  fi
  if [ $i -eq 120 ]; then
    echo -e "${RED}✗ Frontend failed to start in 120 seconds${NC}"
    echo -e "  Check logs: tail /tmp/e2e-frontend.log"
    exit 1
  fi
  sleep 1
  if [ $((i % 10)) -eq 0 ]; then
    echo -n "."
  fi
done

# Step 4: Run Cypress tests
echo -e "\n${YELLOW}🧪 Step 4: Running Cypress E2E tests...${NC}"
echo -e "${BLUE}════════════════════════════════════════════════════${NC}\n"

# Parse command line arguments for Cypress
CYPRESS_ARGS=""
if [ "$1" == "--headless" ] || [ -z "$1" ]; then
  # Run in headless mode (CI)
  cd apps/frontend-e2e
  npx cypress run --config baseUrl=http://localhost:4200
  TEST_EXIT_CODE=$?
elif [ "$1" == "--open" ]; then
  # Run in interactive mode
  echo -e "${GREEN}Opening Cypress Test Runner...${NC}"
  echo -e "${YELLOW}Note: Tests will continue running in the background${NC}"
  echo -e "${YELLOW}Press Ctrl+C in this terminal to stop servers${NC}\n"
  cd apps/frontend-e2e
  npx cypress open
  TEST_EXIT_CODE=$?
elif [ "$1" == "--spec" ] && [ ! -z "$2" ]; then
  # Run specific spec file
  cd apps/frontend-e2e
  npx cypress run --config baseUrl=http://localhost:4200 --spec "$2"
  TEST_EXIT_CODE=$?
else
  # Run in headless mode by default
  cd apps/frontend-e2e
  npx cypress run --config baseUrl=http://localhost:4200
  TEST_EXIT_CODE=$?
fi

cd "$PROJECT_ROOT"

# Report results
echo -e "\n${BLUE}════════════════════════════════════════════════════${NC}"
if [ $TEST_EXIT_CODE -eq 0 ]; then
  echo -e "${GREEN}✅ All E2E tests passed!${NC}"
else
  echo -e "${RED}❌ Some E2E tests failed (exit code: $TEST_EXIT_CODE)${NC}"
fi
echo -e "${BLUE}════════════════════════════════════════════════════${NC}"

# Cleanup will happen automatically via trap
exit $TEST_EXIT_CODE
