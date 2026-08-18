#!/bin/bash
set -e

echo "🧪 Running Book Illustration Studio Test Suite (Frontend + Backend)..."

# Ensure dependencies installed
if [ ! -d node_modules ]; then
  npm install
fi

npm run test -- --passWithNoTests
