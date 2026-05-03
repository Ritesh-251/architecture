#!/bin/bash
# ================================================================
# Architect3D — One-command startup script
# Usage: ./start.sh
# ================================================================

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
RED='\033[0;31m'
RESET='\033[0m'

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$ROOT_DIR/backend"
LOG_DIR="$ROOT_DIR/.logs"
MONGO_CONF="/usr/local/etc/mongod.conf"

mkdir -p "$LOG_DIR"

echo ""
echo -e "${CYAN}  ╔═══════════════════════════════════╗${RESET}"
echo -e "${CYAN}  ║    Architect3D — Starting Up      ║${RESET}"
echo -e "${CYAN}  ╚═══════════════════════════════════╝${RESET}"
echo ""

# ── 1. MongoDB ──────────────────────────────────────────────────
echo -e "${YELLOW}[1/3] Starting MongoDB...${RESET}"

# Check if already running
if pgrep -x "mongod" > /dev/null 2>&1; then
  echo -e "${GREEN}      ✓ MongoDB already running${RESET}"
else
  if [ -f "$MONGO_CONF" ]; then
    mongod --config "$MONGO_CONF" > "$LOG_DIR/mongo.log" 2>&1 &
    MONGO_PID=$!
    sleep 2
    if ps -p $MONGO_PID > /dev/null 2>&1; then
      echo -e "${GREEN}      ✓ MongoDB started (PID $MONGO_PID)${RESET}"
    else
      echo -e "${RED}      ✗ MongoDB failed to start. Check $LOG_DIR/mongo.log${RESET}"
      exit 1
    fi
  else
    echo -e "${RED}      ✗ mongod.conf not found at $MONGO_CONF${RESET}"
    echo -e "      Is MongoDB Community installed? Run: brew install mongodb-community"
    exit 1
  fi
fi

# ── 2. Backend ──────────────────────────────────────────────────
echo -e "${YELLOW}[2/3] Starting Backend API (port 3003)...${RESET}"

cd "$BACKEND_DIR"

# Install deps if node_modules missing
if [ ! -d "node_modules" ]; then
  echo "      Installing backend dependencies..."
  npm install --silent
fi

npx nodemon server.js > "$LOG_DIR/backend.log" 2>&1 &
BACKEND_PID=$!
sleep 2

if ps -p $BACKEND_PID > /dev/null 2>&1; then
  echo -e "${GREEN}      ✓ Backend started (PID $BACKEND_PID) → http://localhost:3003${RESET}"
else
  echo -e "${RED}      ✗ Backend failed. Check $LOG_DIR/backend.log${RESET}"
  cat "$LOG_DIR/backend.log"
  exit 1
fi

# ── 3. Frontend ─────────────────────────────────────────────────
echo -e "${YELLOW}[3/3] Starting Frontend (port 10001)...${RESET}"

cd "$ROOT_DIR"

# Install deps if node_modules missing
if [ ! -d "node_modules" ]; then
  echo "      Installing frontend dependencies..."
  npm install --legacy-peer-deps --silent
fi

npm run dev > "$LOG_DIR/frontend.log" 2>&1 &
FRONTEND_PID=$!
sleep 4

if ps -p $FRONTEND_PID > /dev/null 2>&1; then
  echo -e "${GREEN}      ✓ Frontend started (PID $FRONTEND_PID) → http://localhost:10001${RESET}"
else
  echo -e "${RED}      ✗ Frontend failed. Check $LOG_DIR/frontend.log${RESET}"
  cat "$LOG_DIR/frontend.log"
  exit 1
fi

# ── Summary ─────────────────────────────────────────────────────
echo ""
echo -e "${GREEN}  ✓ All services are running!${RESET}"
echo ""
echo -e "  ${CYAN}Landing Page${RESET}  →  http://localhost:10001/landing.html"
echo -e "  ${CYAN}Editor       ${RESET} →  http://localhost:10001/index.html"
echo -e "  ${CYAN}Dashboard    ${RESET} →  http://localhost:10001/dashboard.html"
echo -e "  ${CYAN}Backend API  ${RESET} →  http://localhost:3003/api"
echo ""
echo -e "  Logs in: .logs/"
echo -e "  Press ${YELLOW}Ctrl+C${RESET} to stop all services."
echo ""

# ── Wait & cleanup on Ctrl+C ────────────────────────────────────
cleanup() {
  echo ""
  echo -e "${YELLOW}  Stopping all services...${RESET}"
  kill $FRONTEND_PID 2>/dev/null || true
  kill $BACKEND_PID  2>/dev/null || true
  # Don't kill mongo automatically (it may be shared)
  echo -e "${GREEN}  ✓ Done. MongoDB left running (stop manually if needed: brew services stop mongodb-community)${RESET}"
  exit 0
}

trap cleanup INT TERM

# Keep script alive
wait $FRONTEND_PID
