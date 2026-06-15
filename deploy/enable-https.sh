#!/usr/bin/env bash
# Run on VPS after DNS A records point to this server.
# Usage: sudo ./enable-https.sh example.com [admin.example.com] [email@example.com]
set -euo pipefail

DOMAIN="${1:-}"
ADMIN_DOMAIN="${2:-}"
EMAIL="${3:-${ETB_LETSENCRYPT_EMAIL:-}}"

if [[ -z "$DOMAIN" ]]; then
  echo "Usage: $0 <site-domain> [admin-domain] [letsencrypt-email]"
  echo "Example: $0 etb.org.tr admin.etb.org.tr info@etb.org.tr"
  exit 1
fi

ADMIN_DOMAIN="${ADMIN_DOMAIN:-admin.$DOMAIN}"
ETB_DIR="${ETB_DIR:-/opt/etb}"
DEPLOY_DIR="$ETB_DIR/deploy"

if [[ ! -f "$ETB_DIR/docker-compose.server.yml" ]]; then
  echo "Missing $ETB_DIR/docker-compose.server.yml"
  exit 1
fi

if [[ $EUID -ne 0 ]]; then
  echo "Run as root: sudo $0 ..."
  exit 1
fi

command -v certbot >/dev/null || { echo "Install certbot first (see DEPLOY.md HTTPS prep)."; exit 1; }
command -v nginx >/dev/null || { echo "Install nginx first."; exit 1; }

SERVER_IP="$(curl -sf4 --max-time 5 ifconfig.me 2>/dev/null || hostname -I | awk '{print $1}')"
echo "Server public IP: $SERVER_IP"

check_dns() {
  local host="$1"
  local resolved
  resolved="$(dig +short "$host" A @8.8.8.8 2>/dev/null | grep -E '^[0-9.]+$' | tail -1 || true)"
  if [[ -z "$resolved" ]]; then
    echo "DNS: no A record for $host (yet)."
    return 1
  fi
  if [[ "$resolved" != "$SERVER_IP" ]]; then
    echo "DNS: $host -> $resolved (expected $SERVER_IP)"
    return 1
  fi
  echo "DNS OK: $host -> $resolved"
  return 0
}

if ! check_dns "$DOMAIN"; then
  echo "Point an A record for $DOMAIN to $SERVER_IP, then re-run."
  exit 1
fi
if ! check_dns "$ADMIN_DOMAIN"; then
  echo "Point an A record for $ADMIN_DOMAIN to $SERVER_IP, then re-run."
  exit 1
fi

if [[ -z "$EMAIL" ]]; then
  read -r -p "Let's Encrypt email: " EMAIL
fi
if [[ -z "$EMAIL" ]]; then
  echo "Email required for Let's Encrypt."
  exit 1
fi

mkdir -p /var/www/certbot
export COMPOSE_FILE="$ETB_DIR/docker-compose.server.yml:$ETB_DIR/deploy/docker-compose.server.https.yml"

echo "Switching Docker to localhost ports (9080 public, 9081 admin)..."
cd "$ETB_DIR"
docker compose up -d

render() {
  local template="$1"
  local out="$2"
  sed -e "s/__DOMAIN__/$DOMAIN/g" -e "s/__ADMIN_DOMAIN__/$ADMIN_DOMAIN/g" "$template" >"$out"
}

echo "Installing temporary HTTP nginx vhosts for ACME..."
render "$DEPLOY_DIR/nginx/etb-public-http-only.conf.template" /etc/nginx/sites-available/etb-public.conf
render "$DEPLOY_DIR/nginx/etb-admin-http-only.conf.template" /etc/nginx/sites-available/etb-admin.conf
ln -sf /etc/nginx/sites-available/etb-public.conf /etc/nginx/sites-enabled/etb-public.conf
ln -sf /etc/nginx/sites-available/etb-admin.conf /etc/nginx/sites-enabled/etb-admin.conf
rm -f /etc/nginx/sites-enabled/default 2>/dev/null || true
nginx -t
systemctl enable nginx
systemctl restart nginx

echo "Requesting certificates..."
PUBLIC_CERT_ARGS=(-d "$DOMAIN")
if check_dns "www.$DOMAIN" 2>/dev/null; then
  PUBLIC_CERT_ARGS+=(-d "www.$DOMAIN")
else
  echo "Skipping www.$DOMAIN (no A record or wrong IP)."
fi
certbot certonly --webroot -w /var/www/certbot \
  "${PUBLIC_CERT_ARGS[@]}" \
  --email "$EMAIL" --agree-tos --non-interactive --no-eff-email || {
  echo "Certbot failed for $DOMAIN"
  exit 1
}

certbot certonly --webroot -w /var/www/certbot \
  -d "$ADMIN_DOMAIN" \
  --email "$EMAIL" --agree-tos --non-interactive --no-eff-email || {
  echo "Certbot failed for $ADMIN_DOMAIN"
  exit 1
}

echo "Installing HTTPS nginx vhosts..."
render "$DEPLOY_DIR/nginx/etb-public.conf.template" /etc/nginx/sites-available/etb-public.conf
render "$DEPLOY_DIR/nginx/etb-admin.conf.template" /etc/nginx/sites-available/etb-admin.conf
nginx -t
systemctl reload nginx

echo "Updating $ETB_DIR/.env ..."
ENV_FILE="$ETB_DIR/.env"
touch "$ENV_FILE"
set_env() {
  local key="$1"
  local val="$2"
  if grep -q "^${key}=" "$ENV_FILE"; then
    sed -i "s|^${key}=.*|${key}=${val}|" "$ENV_FILE"
  else
    echo "${key}=${val}" >>"$ENV_FILE"
  fi
}
set_env BASE_URL "https://$DOMAIN"
set_env COOKIE_SECURE "true"
set_env ALLOWED_ORIGINS "https://$DOMAIN,https://$ADMIN_DOMAIN"

docker compose restart api

echo ""
echo "=== HTTPS enabled ==="
echo "Site:  https://$DOMAIN"
echo "Admin: https://$ADMIN_DOMAIN"
echo ""
echo "Rebuild frontend/admin images with HTTPS URLs, then redeploy:"
echo "  docker build -t etb-frontend:latest --build-arg VITE_API_URL=https://$DOMAIN --build-arg VITE_SAME_ORIGIN_API=true ."
echo "  docker build -t etb-admin:latest --build-arg VITE_API_URL=https://$ADMIN_DOMAIN --build-arg VITE_SAME_ORIGIN_API=true ./admin-panel"
echo ""
echo "Renewal: certbot renew (cron: /etc/cron.d/certbot)"
