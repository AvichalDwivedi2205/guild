#!/usr/bin/env bash
set -euo pipefail

# Materialize .env.local from Cloud Agent secrets when the file is missing.
# Never prints secret values. Does not overwrite an existing local file.
if [[ -f .env.local ]]; then
  exit 0
fi

umask 077

if [[ -n "${NEXT_PUBLIC_CONVEX_URL:-}" || -n "${WORKOS_CLIENT_ID:-}" ]]; then
  {
    [[ -n "${CONVEX_DEPLOYMENT:-}" ]] && printf 'CONVEX_DEPLOYMENT=%s\n' "$CONVEX_DEPLOYMENT"
    [[ -n "${NEXT_PUBLIC_CONVEX_URL:-}" ]] && printf 'NEXT_PUBLIC_CONVEX_URL=%s\n' "$NEXT_PUBLIC_CONVEX_URL"
    [[ -n "${NEXT_PUBLIC_CONVEX_SITE_URL:-}" ]] && printf 'NEXT_PUBLIC_CONVEX_SITE_URL=%s\n' "$NEXT_PUBLIC_CONVEX_SITE_URL"
    [[ -n "${WORKOS_CLIENT_ID:-}" ]] && printf 'WORKOS_CLIENT_ID=%s\n' "$WORKOS_CLIENT_ID"
    [[ -n "${WORKOS_API_KEY:-}" ]] && printf 'WORKOS_API_KEY=%s\n' "$WORKOS_API_KEY"
    [[ -n "${WORKOS_COOKIE_PASSWORD:-}" ]] && printf 'WORKOS_COOKIE_PASSWORD=%s\n' "$WORKOS_COOKIE_PASSWORD"
    printf 'NEXT_PUBLIC_WORKOS_REDIRECT_URI=%s\n' "${NEXT_PUBLIC_WORKOS_REDIRECT_URI:-http://localhost:3000/callback}"
    [[ -n "${WORKOS_JWT_ISSUER:-}" ]] && printf 'WORKOS_JWT_ISSUER=%s\n' "$WORKOS_JWT_ISSUER"
  } >.env.local
else
  cp .env.example .env.local
fi
