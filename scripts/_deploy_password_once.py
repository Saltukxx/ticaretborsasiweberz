"""One-shot password-based deploy helper. Usage: set ETB_SSH_PASSWORD env var."""
import os
import secrets
import pathlib
import sys
import time

import paramiko

sys.stdout.reconfigure(encoding="utf-8", errors="replace")

HOST = os.environ.get("ETB_SERVER_IP", "5.180.186.186")
USER = os.environ.get("ETB_SSH_USER", "root")
PASSWORD = os.environ.get("ETB_SSH_PASSWORD", "")
ROOT = pathlib.Path(__file__).resolve().parents[1]
REMOTE = "/opt/etb"

if not PASSWORD:
    print("ETB_SSH_PASSWORD gerekli", file=sys.stderr)
    sys.exit(1)

postgres_pass = secrets.token_hex(16)
redis_pass = secrets.token_hex(16)
jwt_secret = secrets.token_hex(32)
admin_email = "admin@erzurumtb.org.tr"
admin_pass = secrets.token_hex(12)

env_text = f"""POSTGRES_PASSWORD={postgres_pass}
REDIS_PASSWORD={redis_pass}
DATABASE_URL=postgresql://etb:{postgres_pass}@db:5432/etb
REDIS_URL=redis://:{redis_pass}@cache:6379
JWT_SECRET={jwt_secret}
NODE_ENV=production
BASE_URL=http://{HOST}
UPLOADS_DIR=/app/uploads
COOKIE_SECURE=false
TRUST_PROXY=true
ALLOWED_ORIGINS=http://{HOST},http://{HOST}:8080
GEMINI_MODEL=gemini-2.5-flash
ADMIN_EMAIL={admin_email}
ADMIN_PASSWORD={admin_pass}
ADMIN_NAME=Super_Admin
PUBLIC_HOST={HOST}

# DataBank — saatlik ürün/fiyat senkronu
DATABANK_BASE_URL=https://borsa.erzurumtb.org.tr/web/data/
DATABANK_SYNC_ENABLED=true
DATABANK_HOURLY_SYNC=true
DATABANK_SYNC_CRON=5 * * * *
DATABANK_SYNC_SECTIONS=home,tescil
DATABANK_PRICE_SOURCE_PRIORITY=tescil,home
DATABANK_TESCIL_BACKFILL_DAYS=2
DATABANK_REQUEST_DELAY_MS=2000
TZ=Europe/Istanbul
"""

print("SSH baglaniyor...")
ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect(HOST, username=USER, password=PASSWORD, timeout=30, banner_timeout=30, auth_timeout=30)

ssh.exec_command(f"mkdir -p {REMOTE}/migrations {REMOTE}/videos")[1].channel.recv_exit_status()

sftp = ssh.open_sftp()


def put(local: pathlib.Path, remote: str) -> None:
    size = local.stat().st_size
    mb = size / (1024 * 1024)
    print(f"  yukleniyor {local.name} ({mb:.1f} MB)...", flush=True)
    t0 = time.time()
    sftp.put(str(local), remote)
    print(f"  OK {local.name} ({time.time() - t0:.0f}s)", flush=True)


uploads = [
    (ROOT / "etb-api.tar", f"{REMOTE}/etb-api.tar"),
    (ROOT / "etb-frontend.tar", f"{REMOTE}/etb-frontend.tar"),
    (ROOT / "etb-admin.tar", f"{REMOTE}/etb-admin.tar"),
    (ROOT / "docker-compose.server.yml", f"{REMOTE}/docker-compose.server.yml"),
    (ROOT / "scripts/server-fresh-install.sh", f"{REMOTE}/server-fresh-install.sh"),
]
for local, remote in uploads:
    put(local, remote)

env_path = ROOT / ".tmp-etb-server.env"
env_path.write_text(env_text.replace("\r\n", "\n"), encoding="utf-8", newline="\n")
try:
    put(env_path, f"{REMOTE}/.env")
finally:
    env_path.unlink(missing_ok=True)

mig_dir = ROOT / "backend/src/db/migrations"
for f in sorted(mig_dir.glob("*.sql")):
    put(f, f"{REMOTE}/migrations/{f.name}")

video = ROOT / "public/videos/kadayif-dolmasi-usta.mp4"
if video.exists():
    put(video, f"{REMOTE}/videos/kadayif-dolmasi-usta.mp4")
else:
    print("UYARI: video yok")

sftp.close()

print("Kurulum scripti calistiriliyor (5-10 dk)...", flush=True)
cmd = (
    f"cd {REMOTE} && sed -i 's/\\r$//' server-fresh-install.sh "
    f"&& chmod +x server-fresh-install.sh && bash server-fresh-install.sh"
)
stdin, stdout, stderr = ssh.exec_command(cmd, get_pty=True)
for line in iter(stdout.readline, ""):
    sys.stdout.buffer.write(line.encode("utf-8", errors="replace"))
    sys.stdout.buffer.flush()
err = stderr.read().decode()
if err.strip():
    print("STDERR:", err)
code = stdout.channel.recv_exit_status()
ssh.close()

print("\n========================================")
print("  KURULUM TAMAMLANDI" if code == 0 else f"  KURULUM HATA (exit {code})")
print("========================================")
print(f"  Site:   http://{HOST}/")
print(f"  Admin:  http://{HOST}:8080/")
print(f"  E-posta: {admin_email}")
print(f"  Sifre:  {admin_pass}")
print(f"  Kadayif: http://{HOST}/cografi-isaretler/kadayif-dolmasi")
print("========================================")
sys.exit(code)
