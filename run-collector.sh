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

# Load DATABASE_URL from web/.env
if [ -f "web/.env" ]; then
  # Use grep and cut to extract the variable, handling potential quotes
  DB_URL=$(grep "^DATABASE_URL=" web/.env | cut -d '=' -f2-)
  if [ ! -z "$DB_URL" ]; then
    export SUPABASE_URL="$DB_URL"
  fi
fi

# Fallback to .env.local if needed (though .env is preferred for this setup now)
if [ -z "$SUPABASE_URL" ] && [ -f "web/.env.local" ]; then
  export SUPABASE_URL=$(grep NEXT_PUBLIC_SUPABASE_URL web/.env.local | cut -d '=' -f2)
fi

echo "Running Gem Hunter Collector..."
go run ./cmd/gemhunter fetch $LANG_FLAG
