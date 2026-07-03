#!/bin/bash
# SessionStart hook: install DNS + SSL diagnostic CLI tools for Claude Code on the web.
#
# The web execution environment is ephemeral, so tools installed manually vanish
# when the container is reclaimed. This hook reinstalls them on session start.
# It is idempotent (skips instantly when the tools are already present) and
# best-effort (never blocks a session if apt or the egress proxy is unavailable).
set -uo pipefail

# Only run in the remote (Claude Code on the web) environment.
if [ "${CLAUDE_CODE_REMOTE:-}" != "true" ]; then
  exit 0
fi

# Nothing to do if the tools are already installed (warm container / resume).
if command -v dig >/dev/null 2>&1 && command -v sslscan >/dev/null 2>&1; then
  echo "DNS/SSL tools already present (dig, sslscan)."
  exit 0
fi

# apt needs root; if we can't use it, skip quietly rather than fail the session.
if [ "$(id -u)" != "0" ] || ! command -v apt-get >/dev/null 2>&1; then
  echo "session-start: apt-get unavailable or not root; skipping DNS/SSL tool install." >&2
  exit 0
fi

export DEBIAN_FRONTEND=noninteractive

# Route apt through the egress proxy if one is configured in the environment.
PROXY="${HTTPS_PROXY:-${https_proxy:-}}"
if [ -n "$PROXY" ]; then
  cat > /etc/apt/apt.conf.d/99ccr-proxy <<EOF
Acquire::http::Proxy "$PROXY";
Acquire::https::Proxy "$PROXY";
EOF
fi

# The egress proxy tunnels HTTPS (CONNECT) cleanly, so prefer https mirrors.
for f in /etc/apt/sources.list.d/ubuntu.sources /etc/apt/sources.list; do
  [ -f "$f" ] && sed -i \
    -e 's#http://archive.ubuntu.com#https://archive.ubuntu.com#g' \
    -e 's#http://security.ubuntu.com#https://security.ubuntu.com#g' "$f" 2>/dev/null || true
done

# Best-effort install; tolerate blocked third-party PPAs and transient errors.
apt-get update -o Acquire::Retries=3 >/dev/null 2>&1 || true
if apt-get install -y --no-install-recommends dnsutils sslscan >/dev/null 2>&1; then
  echo "Installed DNS/SSL tools: $(command -v dig), $(command -v nslookup), $(command -v host), $(command -v sslscan)."
else
  echo "session-start: DNS/SSL tool install did not complete (non-fatal)." >&2
fi

exit 0
