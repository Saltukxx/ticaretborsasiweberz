"""Upload prebuilt API dist and restart api container. Requires ETB_SSH_PASSWORD."""
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
BACKEND = ROOT / "backend"
REMOTE = "/opt/etb"
ARCHIVE = ROOT / "etb-api-prebuilt.tgz"

if not PASSWORD:
    print("ETB_SSH_PASSWORD gerekli", file=sys.stderr)
    sys.exit(1)


def build_archive() -> None:
    npm = "npm.cmd" if os.name == "nt" else "npm"
    print("==> npm run build (backend)")
    subprocess.run([npm, "run", "build"], cwd=BACKEND, check=True, shell=os.name == "nt")

    print("==> etb-api-prebuilt.tgz olusturuluyor")
    if ARCHIVE.exists():
        ARCHIVE.unlink()

    with tarfile.open(ARCHIVE, "w:gz") as tar:
        for name in ("dist", "package.json", "package-lock.json", "Dockerfile.prebuilt"):
            path = BACKEND / name
            tar.add(path, arcname=name)
        seed = BACKEND / "src" / "seed-data"
        if seed.exists():
            tar.add(seed, arcname="src/seed-data")

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
    build_archive()

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
    remote_archive = f"{REMOTE}/etb-api-prebuilt.tgz"
    print(f"==> Yukleniyor {ARCHIVE.name}")
    t0 = time.time()
    sftp.put(str(ARCHIVE), remote_archive)
    sftp.close()
    print(f"    OK ({time.time() - t0:.0f}s)")

    script = rf"""
set -euo pipefail
cd {REMOTE}
rm -rf api-build
mkdir -p api-build
tar -xzf etb-api-prebuilt.tgz -C api-build
cd api-build
docker build -f Dockerfile.prebuilt -t etb-api:latest .
cd {REMOTE}
docker compose -f docker-compose.server.yml up -d api --force-recreate
sleep 6
docker compose -f docker-compose.server.yml exec -T api npm run sync:databank
docker compose -f docker-compose.server.yml logs api --tail 20
"""
    code = ssh_exec(ssh, script.strip())
    ssh.close()

    if code == 0:
        print("\n========================================")
        print("  API DEPLOY TAMAMLANDI")
        print(f"  http://{HOST}/api/v1/prices/bulletin")
        print("========================================")
    else:
        print(f"\nDeploy hata (exit {code})", file=sys.stderr)

    return code


if __name__ == "__main__":
    raise SystemExit(main())
