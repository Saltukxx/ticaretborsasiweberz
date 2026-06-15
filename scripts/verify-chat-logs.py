import os
import paramiko

PASSWORD = os.environ.get("ETB_SSH_PASSWORD", "")
if not PASSWORD:
    raise SystemExit("ETB_SSH_PASSWORD required")

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
    "psql -U etb -d etb -c "
    "'SELECT channel, user_message, ip_address, outcome FROM chat_conversation_logs "
    "ORDER BY created_at DESC LIMIT 3;'"
)
_, stdout, stderr = ssh.exec_command(cmd)
print(stdout.read().decode())
err = stderr.read().decode()
if err.strip():
    print("STDERR:", err)
ssh.close()
