#!/bin/sh
# Start API and Web for e2e testing
set -e

# Build web first
cd "$(dirname "$0")/../src/web"
npx next build > /dev/null 2>&1
cp -r public .next/standalone/src/web/public 2>/dev/null || true
cp -r .next/static .next/standalone/src/web/.next/static 2>/dev/null || true

# Start API
cd "$(dirname "$0")/../src/api"
PORT=5001 npx tsx src/index.ts &

# Start Web (standalone)
cd "$(dirname "$0")/../src/web"
PORT=3002 HOSTNAME=0.0.0.0 NEXT_PUBLIC_API_URL=http://localhost:5001 node .next/standalone/src/web/server.js &

# Wait for both
sleep 3
wait
