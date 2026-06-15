"""Apply 0018 chat logs migration on server."""
import os
import pathlib
import sys

import paramiko

sys.stdout.reconfigure(encoding="utf-8", errors="replace")

PASSWORD = os.environ.get("ETB_SSH_PASSWORD", "")
if not PASSWORD:
    sys.exit("ETB_SSH_PASSWORD required")

ROOT = pathlib.Path(__file__).resolve().parents[1]
SQL = (ROOT / "backend/src/db/migrations/0018_chat_conversation_logs.sql").read_text(
    encoding="utf-8",
)

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect(
    "5.180.186.186",
    username="root",
    password=PASSWORD,
    look_for_keys=False,
    allow_agent=False,
)

cmd = (
    "cd /opt/etb && docker compose -f docker-compose.server.yml exec -T db "
    "psql -U etb -d etb"
)
stdin, stdout, stderr = ssh.exec_command(cmd)
stdin.write(SQL)
stdin.channel.shutdown_write()
print(stdout.read().decode())
err = stderr.read().decode()
if err.strip():
    print("STDERR:", err)
print("exit", stdout.channel.recv_exit_status())
ssh.close()
