"""Upload prebuilt frontend dist and restart frontend container. Requires ETB_SSH_PASSWORD."""
from __future__ import annotations

import os
import pathlib
import subprocess
import sys
import tarfile
import time

import paramiko

sys.stdout.reconfigure(encoding="utf-8", errors="replace")

HOST = os.environ.get("ETB_SERVER_IP", "5.180.186.186")
USER = os.environ.get("ETB_SSH_USER", "root")
PASSWORD = os.environ.get("ETB_SSH_PASSWORD", "")
ROOT = pathlib.Path(__file__).resolve().parents[1]
REMOTE = "/opt/etb"
ARCHIVE = ROOT / "etb-frontend-prebuilt.tgz"

if not PASSWORD:
    print("ETB_SSH_PASSWORD gerekli", file=sys.stderr)
    sys.exit(1)


def build_frontend() -> None:
    npm = "npm.cmd" if os.name == "nt" else "npm"
    env = os.environ.copy()
    env.setdefault("VITE_SAME_ORIGIN_API", "true")
    env.setdefault("VITE_API_URL", f"http://{HOST}")

    print("==> npm run build (frontend)")
    subprocess.run([npm, "run", "build"], cwd=ROOT, check=True, shell=os.name == "nt", env=env)

    dist = ROOT / "dist"
    if not dist.exists():
        print("HATA: dist/ bulunamadi", file=sys.stderr)
        sys.exit(1)

    legal = dist / "legal"
    if not legal.exists() or not any(legal.glob("*.pdf")):
        print("UYARI: dist/legal/*.pdf bulunamadi", file=sys.stderr)

    print("==> etb-frontend-prebuilt.tgz olusturuluyor")
    if ARCHIVE.exists():
        ARCHIVE.unlink()

    with tarfile.open(ARCHIVE, "w:gz") as tar:
        tar.add(dist, arcname="dist")
        tar.add(ROOT / "Dockerfile.frontend.prebuilt", arcname="Dockerfile.prebuilt")
        tar.add(ROOT / "nginx.conf", arcname="nginx.conf")

    mb = ARCHIVE.stat().st_size / (1024 * 1024)
    print(f"    {ARCHIVE.name} ({mb:.1f} MB)")


def ssh_exec(ssh: paramiko.SSHClient, cmd: str) -> int:
    print(f"\n$ {cmd}", flush=True)
    _, stdout, stderr = ssh.exec_command(cmd, get_pty=True)
    for line in iter(stdout.readline, ""):
        sys.stdout.write(line)
        sys.stdout.flush()
    err = stderr.read().decode("utf-8", errors="replace")
    if err.strip():
        print(err, file=sys.stderr)
    return stdout.channel.recv_exit_status()


def main() -> int:
    build_frontend()

    print(f"\n==> SSH {USER}@{HOST}")
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
    remote_archive = f"{REMOTE}/etb-frontend-prebuilt.tgz"
    print(f"==> Yukleniyor {ARCHIVE.name}")
    t0 = time.time()
    sftp.put(str(ARCHIVE), remote_archive)
    sftp.close()
    print(f"    OK ({time.time() - t0:.0f}s)")

    script = rf"""
set -euo pipefail
cd {REMOTE}
rm -rf frontend-build
mkdir -p frontend-build
tar -xzf etb-frontend-prebuilt.tgz -C frontend-build
cd frontend-build
docker build -f Dockerfile.prebuilt -t etb-frontend:latest .
cd {REMOTE}
docker compose -f docker-compose.server.yml up -d frontend --force-recreate
sleep 3
curl -sI http://localhost/kvkk | head -5
curl -sI http://localhost/legal/kvkk-politikasi.pdf | head -5
docker compose -f docker-compose.server.yml logs frontend --tail 10
"""
    code = ssh_exec(ssh, script.strip())
    ssh.close()

    if code == 0:
        print("\n========================================")
        print("  FRONTEND DEPLOY TAMAMLANDI")
        print(f"  http://{HOST}/kvkk")
        print("========================================")
    else:
        print(f"\nDeploy hata (exit {code})", file=sys.stderr)

    return code


if __name__ == "__main__":
    raise SystemExit(main())
