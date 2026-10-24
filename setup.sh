#!/usr/bin/env bash
#
# Initial project setup.
# Creates backend/.env and stores your VirusTotal API key in it.
#
# Usage:   ./setup.sh
# Non-interactive (for example in CI):   VT_API_KEY=<key> ./setup.sh
#
# Works on macOS and Linux. On Windows use WSL or Git Bash.

set -euo pipefail

cd "$(dirname "${BASH_SOURCE[0]}")"

ENV_FILE="backend/.env"
KEY_NAME="VT_API_KEY"
PLACEHOLDER="YOUR_VIRUS_TOTAL_API_KEY"

say()  { printf '%s\n' "$*"; }
warn() { printf 'Warning: %s\n' "$*" >&2; }
fail() { printf 'Error: %s\n' "$*" >&2; exit 1; }

# Asks a yes/no question; the default answer is "no". Reaching the end of
# the input (for example in a pipe) also counts as "no".
confirm() {
  local answer=""
  printf '%s [y/N] ' "$1"
  read -r answer || answer=""
  [[ "$answer" =~ ^[Yy]([Ee][Ss])?$ ]]
}

# Shows only the end of a key, so it never appears in full on screen.
mask() {
  if [ "${#1}" -ge 8 ]; then printf '...%s' "${1: -4}"; else printf '(hidden)'; fi
}

# Prints the current key from the .env file, if there is a usable one.
current_key() {
  [ -f "$ENV_FILE" ] || return 0
  local line value
  line="$(grep -E "^${KEY_NAME}=" "$ENV_FILE" | tail -n 1 || true)"
  value="${line#${KEY_NAME}=}"
  if [ -n "$value" ] && [ "$value" != "$PLACEHOLDER" ]; then
    printf '%s' "$value"
  fi
}

# Reads the key without echoing it on screen.
prompt_key() {
  local key=""
  printf 'Paste your VirusTotal API key (input is hidden): ' >&2
  read -r -s key || key=""
  printf '\n' >&2
  # Remove spaces, tabs and carriage returns that come with copy and paste.
  printf '%s' "$key" | tr -d '[:space:]'
}

[ -d backend ] || fail "Run this script from the project folder (the 'backend' folder was not found)."

say "Cyberthreat dashboard setup"
say "---------------------------"

# 1. Decide whether a key has to be asked for.
existing="$(current_key)"
if [ -n "$existing" ] && [ -z "${VT_API_KEY:-}" ]; then
  say "$ENV_FILE already contains a VirusTotal key ($(mask "$existing"))."
  if ! confirm "Replace it?"; then
    say "Keeping the current key."
    KEEP_KEY=1
  fi
fi

# 2. Get the key: from the environment, or by asking.
if [ -z "${KEEP_KEY:-}" ]; then
  key="${VT_API_KEY:-}"
  key="$(printf '%s' "$key" | tr -d '[:space:]')"

  attempts=0
  while :; do
    if [ -z "$key" ]; then
      attempts=$((attempts + 1))
      [ "$attempts" -le 3 ] || fail "No API key entered. Run ./setup.sh again when you have it."
      say "Get a free key at https://www.virustotal.com (profile menu, API key)."
      key="$(prompt_key)"
      [ -n "$key" ] || { warn "The key cannot be empty."; continue; }
    fi

    # VirusTotal keys are 64 hexadecimal characters.
    if [[ "$key" =~ ^[A-Fa-f0-9]{64}$ ]]; then
      break
    fi
    warn "That does not look like a VirusTotal key (expected 64 letters and digits, got ${#key} characters)."
    if confirm "Use it anyway?"; then
      break
    fi
    key=""
  done

  # 3. Write the file. Other variables already in it are kept.
  umask 077
  tmp="$(mktemp "${ENV_FILE}.XXXXXX")"
  trap 'rm -f "$tmp"' EXIT
  if [ -f "$ENV_FILE" ]; then
    # Keep every other line; the loop also fixes a missing final newline.
    { grep -v -E "^${KEY_NAME}=" "$ENV_FILE" || true; } |
      while IFS= read -r line || [ -n "$line" ]; do printf '%s\n' "$line"; done > "$tmp"
  fi
  printf '%s=%s\n' "$KEY_NAME" "$key" >> "$tmp"
  chmod 600 "$tmp"
  mv "$tmp" "$ENV_FILE"
  trap - EXIT

  say "Saved the key to $ENV_FILE ($(mask "$key"))."
fi

# 4. Check what is needed to run the project.
say ""
if command -v docker >/dev/null 2>&1 && docker compose version >/dev/null 2>&1; then
  say "Docker Compose found."
  if confirm "Build and start the dashboard now?"; then
    docker compose up -d --build
    say ""
    say "Done. Open http://localhost:3000 (the first start takes about 30 seconds)."
    say "Stop it with: docker compose down"
    exit 0
  fi
  say "Start it later with: docker compose up -d --build"
else
  warn "Docker with the Compose plugin was not found."
  say "Install Docker Desktop (https://www.docker.com/products/docker-desktop/), then run:"
  say "  docker compose up -d --build"
fi
say "Then open http://localhost:3000"
