#!/bin/bash
# deploy.sh - Script for building and deploying Islamic Reminders Hub

set -e

echo "================================================="
echo "  Deploying Islamic Reminders Hub - Aalame Platform"
echo "================================================="

# 1. Install dependencies
echo "[1/4] Installing dependencies..."
pnpm install

# 2. Extract and Process PDFs
echo "[2/4] Running Knowledge Pipeline for Library..."
if [ -d "C:/Users/mmmad/Downloads/مدمج" ]; then
  node LLM_Wiki/scripts/knowledge-pipeline.cjs --source "C:/Users/mmmad/Downloads/مدمج" --force
else
  echo "Warning: Source folder for PDFs not found, skipping extraction."
fi

# 3. Validate Encyclopedia
echo "[3/4] Validating JSON schemas..."
node scripts/validate-encyclopedia.cjs

# 4. Build Frontend
echo "[4/4] Building Frontend application..."
cd artifacts/adhkar

# Clean dist folder if it exists
if [ -d "dist" ]; then
  rm -rf dist
fi

npx vite build

echo "================================================="
echo "  Deployment Complete! Dist folder is ready."
echo "================================================="
