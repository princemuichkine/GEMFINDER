#!/bin/bash
# run-collector.sh

if [ -z "$GITHUB_TOKEN" ]; then
  echo "Error: GITHUB_TOKEN is not set."
  echo "Usage: export GITHUB_TOKEN=... && ./run-collector.sh [lang]"
  exit 1
fi

LANG_FLAG=""
if [ ! -z "$1" ]; then
  LANG_FLAG="--lang $1"
fi

if [ -f "web/.env.local" ]; then
  export SUPABASE_URL=$(grep NEXT_PUBLIC_SUPABASE_URL web/.env.local | cut -d '=' -f2)
fi

echo "Running Gem Hunter Collector..."
go run ./cmd/gemhunter fetch $LANG_FLAG
