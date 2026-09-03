#!/usr/bin/env bash
set -euo pipefail

# Idempotent Cloud Agent install: pin Bun 1.3.9 and refresh workspace deps.
BUN_VERSION="1.3.9"
export BUN_INSTALL="${BUN_INSTALL:-$HOME/.bun}"
export PATH="$BUN_INSTALL/bin:$PATH"

if ! command -v bun >/dev/null 2>&1 || [[ "$(bun --version 2>/dev/null || true)" != "$BUN_VERSION" ]]; then
  curl -fsSL https://bun.sh/install | bash -s "bun-v${BUN_VERSION}"
  export PATH="$BUN_INSTALL/bin:$PATH"
fi

bun install --frozen-lockfile
