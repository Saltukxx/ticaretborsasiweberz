"""Quick security verification on production server."""
import json
import os
import sys

import paramiko

sys.stdout.reconfigure(encoding="utf-8", errors="replace")

HOST = os.environ.get("ETB_SERVER_IP", "5.180.186.186")
PASSWORD = os.environ.get("ETB_SSH_PASSWORD", "")

if not PASSWORD:
    print("ETB_SSH_PASSWORD gerekli", file=sys.stderr)
    sys.exit(1)

checks = r"""
set -euo pipefail

echo "=== 1) Login with spoofed X-Forwarded-For (5 attempts, same fake IP) ==="
for i in 1 2 3 4 5; do
  code=$(curl -s -o /dev/null -w "%{http_code}" -X POST http://localhost:8080/api/v1/admin/auth/login \
    -H "Content-Type: application/json" \
    -H "X-Forwarded-For: 203.0.113.99" \
    -d '{"email":"security-check@example.com","password":"wrong-password"}')
  echo "  attempt $i: HTTP $code"
done

echo "=== 2) 6th attempt should be 429 (locked) ==="
code=$(curl -s -o /dev/null -w "%{http_code}" -X POST http://localhost:8080/api/v1/admin/auth/login \
  -H "Content-Type: application/json" \
  -H "X-Forwarded-For: 203.0.113.99" \
  -d '{"email":"security-check@example.com","password":"wrong-password"}')
echo "  attempt 6: HTTP $code (expect 429)"

echo "=== 3) Chat logs without auth ==="
code=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8080/api/v1/admin/chat-logs)
echo "  unauthenticated: HTTP $code (expect 401)"

echo "=== 4) Nginx config uses remote_addr ==="
docker exec etb-frontend-1 grep -n "X-Forwarded-For" /etc/nginx/conf.d/default.conf || true
docker exec etb-admin-1 grep -n "X-Forwarded-For" /etc/nginx/conf.d/default.conf || true
"""

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect(HOST, username="root", password=PASSWORD, timeout=30, look_for_keys=False, allow_agent=False)
_, stdout, stderr = ssh.exec_command(checks, get_pty=True)
for line in iter(stdout.readline, ""):
    sys.stdout.write(line)
err = stderr.read().decode("utf-8", errors="replace")
if err.strip():
    print(err, file=sys.stderr)
code = stdout.channel.recv_exit_status()
ssh.close()
sys.exit(code)
