#!/bin/sh
set -eu

attempt=1
max_attempts="${NPM_CI_ATTEMPTS:-6}"

while [ "$attempt" -le "$max_attempts" ]; do
  echo "npm ci attempt $attempt/$max_attempts"

  if npm ci "$@"; then
    exit 0
  fi

  if [ "$attempt" -eq "$max_attempts" ]; then
    break
  fi

  npm cache verify || true
  attempt=$((attempt + 1))
  sleep 5
done

echo "npm ci failed after $max_attempts attempts" >&2
exit 1
