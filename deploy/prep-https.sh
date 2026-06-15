#!/usr/bin/env bash
# One-time VPS prep (no domain required). Safe to re-run.
set -euo pipefail

if [[ $EUID -ne 0 ]]; then
  echo "Run as root: sudo $0"
  exit 1
fi

export DEBIAN_FRONTEND=noninteractive
apt-get update -qq
apt-get install -y -qq nginx certbot python3-certbot-nginx dnsutils curl

mkdir -p /var/www/certbot
chmod 755 /var/www/certbot

# Do not bind port 80 until enable-https.sh runs (Docker still serves HTTP).
systemctl stop nginx 2>/dev/null || true
systemctl disable nginx 2>/dev/null || true

if ! systemctl is-enabled --quiet docker 2>/dev/null; then
  systemctl enable docker 2>/dev/null || true
fi

echo "HTTPS prep complete."
echo "  - certbot + nginx installed"
echo "  - /var/www/certbot ready"
echo "  - host nginx stopped (Docker keeps ports 80 / 8080)"
echo ""
echo "When DNS is ready, copy deploy/ to /opt/etb/deploy and run:"
echo "  chmod +x /opt/etb/deploy/enable-https.sh"
echo "  /opt/etb/deploy/enable-https.sh your-domain.com admin.your-domain.com you@email.com"
