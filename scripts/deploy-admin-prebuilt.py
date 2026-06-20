"""Upload prebuilt admin-panel dist and restart admin container. Requires ETB_SSH_PASSWORD."""
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
ADMIN = ROOT / "admin-panel"
REMOTE = "/opt/etb"
ARCHIVE = ROOT / "etb-admin-prebuilt.tgz"

if not PASSWORD:
    print("ETB_SSH_PASSWORD gerekli", file=sys.stderr)
    sys.exit(1)


def build_admin() -> None:
    npm = "npm.cmd" if os.name == "nt" else "npm"
    env = os.environ.copy()
    env.setdefault("VITE_SAME_ORIGIN_API", "true")
    env.setdefault("VITE_API_URL", f"http://{HOST}:8080")

    print("==> npm run build (admin-panel)")
    subprocess.run([npm, "run", "build"], cwd=ADMIN, check=True, shell=os.name == "nt", env=env)

    dist = ADMIN / "dist"
    if not dist.exists():
        print("HATA: admin-panel/dist bulunamadi", file=sys.stderr)
        sys.exit(1)

    print("==> etb-admin-prebuilt.tgz olusturuluyor")
    if ARCHIVE.exists():
        ARCHIVE.unlink()

    with tarfile.open(ARCHIVE, "w:gz") as tar:
        tar.add(dist, arcname="dist")
        tar.add(ADMIN / "Dockerfile.prebuilt", arcname="Dockerfile.prebuilt")
        tar.add(ADMIN / "nginx.conf", arcname="nginx.conf")

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
    build_admin()

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
    remote_archive = f"{REMOTE}/etb-admin-prebuilt.tgz"
    print(f"==> Yukleniyor {ARCHIVE.name}")
    t0 = time.time()
    sftp.put(str(ARCHIVE), remote_archive)
    sftp.close()
    print(f"    OK ({time.time() - t0:.0f}s)")

    script = rf"""
set -euo pipefail
cd {REMOTE}
rm -rf admin-build
mkdir -p admin-build
tar -xzf etb-admin-prebuilt.tgz -C admin-build
cd admin-build
docker build -f Dockerfile.prebuilt -t etb-admin:latest .
cd {REMOTE}
docker compose -f docker-compose.server.yml up -d admin --force-recreate
sleep 3
curl -sI http://localhost:8080/ | head -5
docker compose -f docker-compose.server.yml logs admin --tail 10
"""
    code = ssh_exec(ssh, script.strip())
    ssh.close()

    if code == 0:
        print("\n========================================")
        print("  ADMIN DEPLOY TAMAMLANDI")
        print(f"  http://{HOST}:8080/")
        print("========================================")
    else:
        print(f"\nDeploy hata (exit {code})", file=sys.stderr)

    return code


if __name__ == "__main__":
    raise SystemExit(main())
