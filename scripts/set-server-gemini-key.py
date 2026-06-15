"""Set GEMINI_API_KEY on production server without logging the secret.

Usage (PowerShell):
  $env:ETB_SSH_PASSWORD='...'
  $env:GEMINI_API_KEY='AIza...'   # optional if backend/.env or .env.local has it
  python scripts/set-server-gemini-key.py

Optional:
  ETB_SERVER_IP (default 5.180.186.186)
  GEMINI_MODEL (default gemini-2.5-flash)
"""
from __future__ import annotations

import os
import pathlib
import re
import sys

import paramiko

sys.stdout.reconfigure(encoding="utf-8", errors="replace")

HOST = os.environ.get("ETB_SERVER_IP", "5.180.186.186")
USER = os.environ.get("ETB_SSH_USER", "root")
PASSWORD = os.environ.get("ETB_SSH_PASSWORD", "")
MODEL = os.environ.get("GEMINI_MODEL", "gemini-2.5-flash").strip()
ENV_PATH = "/opt/etb/.env"
COMPOSE = "docker compose -f /opt/etb/docker-compose.server.yml"
ROOT = pathlib.Path(__file__).resolve().parents[1]


def read_local_gemini_key() -> str:
    env_key = os.environ.get("GEMINI_API_KEY", "").strip()
    if env_key:
        return env_key
    for rel in ("backend/.env", ".env.local"):
        path = ROOT / rel
        if not path.exists():
            continue
        text = path.read_text(encoding="utf-8", errors="replace")
        for name in ("GEMINI_API_KEY", "VITE_GEMINI_API_KEY"):
            m = re.search(rf"^{re.escape(name)}=(.*)$", text, re.M)
            if m and m.group(1).strip():
                return m.group(1).strip()
    return ""


def upsert_env_line(text: str, key: str, value: str) -> str:
    line = f"{key}={value}"
    pattern = re.compile(rf"^{re.escape(key)}=.*$", re.M)
    if pattern.search(text):
        return pattern.sub(line, text, count=1)
    if text and not text.endswith("\n"):
        text += "\n"
    return text + line + "\n"


def main() -> int:
    if not PASSWORD:
        print("ETB_SSH_PASSWORD gerekli", file=sys.stderr)
        return 1

    api_key = read_local_gemini_key()
    if not api_key or len(api_key) < 20:
        print(
            "GEMINI_API_KEY bulunamadi (ortam, backend/.env veya .env.local)",
            file=sys.stderr,
        )
        return 1

    if not re.fullmatch(r"AIza[0-9A-Za-z_-]{20,}", api_key):
        print("GEMINI_API_KEY formati gecersiz gorunuyor", file=sys.stderr)
        return 1

    print(f"==> SSH {USER}@{HOST}")
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    ssh.connect(
        HOST,
        username=USER,
        password=PASSWORD,
        timeout=30,
        banner_timeout=30,
        auth_timeout=30,
        look_for_keys=False,
        allow_agent=False,
    )

    sftp = ssh.open_sftp()
    try:
        with sftp.open(ENV_PATH, "r") as f:
            current = f.read().decode("utf-8", errors="replace")
    except FileNotFoundError:
        print(f"HATA: {ENV_PATH} bulunamadi", file=sys.stderr)
        ssh.close()
        return 1

    updated = upsert_env_line(current, "GEMINI_API_KEY", api_key)
    updated = upsert_env_line(updated, "GEMINI_MODEL", MODEL)

    tmp = f"{ENV_PATH}.tmp"
    with sftp.open(tmp, "w") as f:
        f.write(updated.encode("utf-8"))
    sftp.close()

    cmd = (
        f"mv {tmp} {ENV_PATH} && chmod 600 {ENV_PATH} && "
        f"grep -E '^GEMINI_' {ENV_PATH} | sed 's/=.*$/=***/' && "
        f"cd /opt/etb && {COMPOSE} up -d api --force-recreate"
    )
    _, stdout, stderr = ssh.exec_command(cmd, get_pty=True)
    for line in iter(stdout.readline, ""):
        sys.stdout.write(line)
        sys.stdout.flush()
    err = stderr.read().decode("utf-8", errors="replace")
    if err.strip():
        print(err, file=sys.stderr)
    code = stdout.channel.recv_exit_status()
    ssh.close()

    if code == 0:
        print("\nGemini anahtari sunucuya eklendi (deger loglanmadi).")
        print("Test: POST /api/v1/recipe-chat")
    return code


if __name__ == "__main__":
    raise SystemExit(main())
