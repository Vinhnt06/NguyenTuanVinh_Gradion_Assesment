#!/bin/bash
set -e

echo "🚀 Starting Book Illustration Studio..."

# Ensure .env exists
if [ ! -f .env ]; then
  if [ -f .env.example ]; then
    echo "📋 Creating .env from .env.example..."
    cp .env.example .env
  fi
fi

# Install dependencies if needed
if [ ! -d node_modules ]; then
  echo "📦 Installing npm dependencies..."
  npm install
fi

echo "🧹 Clearing stale build cache..."
rm -rf .next

echo "✨ Starting development server on http://localhost:3000..."
npm run dev
