# Yeni sunucuya sıfırdan ETB kurulumu (eski sunucu gerekmez).
#
# Kullanım (SSH anahtarı):
#   .\scripts\deploy-fresh-server.ps1 -ServerIp "203.0.113.50"
#
# Kullanım (root parola — anahtar yoksa):
#   $env:ETB_SSH_PASSWORD='parola'; python scripts/_deploy_password_once.py
#   .\scripts\deploy-fresh-server.ps1 -ServerIp "203.0.113.50" -AdminEmail "admin@example.com" -GeminiApiKey "AIza..."
#
# Gereksinimler: Docker Desktop, SSH anahtarı, yeni Ubuntu VPS (root SSH)

param(
  [Parameter(Mandatory = $true)]
  [string]$ServerIp,

  [string]$SshKey = "$env:USERPROFILE\.ssh\id_rsa_etb",
  [string]$RemoteUser = "root",
  [string]$RemoteDir = "/opt/etb",
  [string]$AdminEmail = "admin@erzurumtb.org.tr",
  [string]$AdminPassword = "",
  [string]$GeminiApiKey = ""
)

$ErrorActionPreference = "Stop"
$Root = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$Host_ = "${RemoteUser}@${ServerIp}"
$Video = Join-Path $Root "public\videos\kadayif-dolmasi-usta.mp4"

function New-RandomHex([int]$Bytes = 24) {
  $buf = New-Object byte[] $Bytes
  [System.Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($buf)
  return ([BitConverter]::ToString($buf) -replace "-", "").ToLower()
}

if (-not (Test-Path $SshKey)) {
  Write-Error "SSH anahtarı bulunamadı: $SshKey"
}

if (-not $AdminPassword -or $AdminPassword.Length -lt 12) {
  $AdminPassword = New-RandomHex 16
  Write-Host "Otomatik admin şifresi üretildi (kaydedin): $AdminPassword"
}

$PostgresPass = New-RandomHex 16
$RedisPass = New-RandomHex 16
$JwtSecret = New-RandomHex 32

Write-Host "Sunucu bağlantısı test ediliyor: $ServerIp ..."
$tcp = Test-NetConnection -ComputerName $ServerIp -Port 22 -WarningAction SilentlyContinue
if (-not $tcp.TcpTestSucceeded) {
  Write-Error "SSH (port 22) ulaşılamıyor. Droplet açık mı? Firewall SSH'ye izin veriyor mu?"
}

Write-Host "Docker imajları build ediliyor..."
Push-Location $Root
try {
  docker build -t etb-api:latest ./backend
  if ($LASTEXITCODE -ne 0) { throw "api build failed" }

  docker build -t etb-frontend:latest `
    --build-arg "VITE_API_URL=http://${ServerIp}" `
    --build-arg VITE_SAME_ORIGIN_API=true .
  if ($LASTEXITCODE -ne 0) { throw "frontend build failed" }

  docker build -t etb-admin:latest `
    --build-arg "VITE_API_URL=http://${ServerIp}:8080" `
    --build-arg VITE_SAME_ORIGIN_API=true `
    ./admin-panel
  if ($LASTEXITCODE -ne 0) { throw "admin build failed" }

  Write-Host "İmajlar export ediliyor..."
  docker save etb-api:latest -o etb-api.tar
  docker save etb-frontend:latest -o etb-frontend.tar
  docker save etb-admin:latest -o etb-admin.tar
} finally {
  Pop-Location
}

$envContent = @"
POSTGRES_PASSWORD=$PostgresPass
REDIS_PASSWORD=$RedisPass
DATABASE_URL=postgresql://etb:${PostgresPass}@db:5432/etb
REDIS_URL=redis://:${RedisPass}@cache:6379
JWT_SECRET=$JwtSecret
NODE_ENV=production
BASE_URL=http://${ServerIp}
UPLOADS_DIR=/app/uploads
COOKIE_SECURE=false
TRUST_PROXY=true
ALLOWED_ORIGINS=http://${ServerIp},http://${ServerIp}:8080
GEMINI_MODEL=gemini-2.5-flash
ADMIN_EMAIL=$AdminEmail
ADMIN_PASSWORD=$AdminPassword
ADMIN_NAME=Super_Admin
PUBLIC_HOST=$ServerIp

# DataBank — saatlik ürün/fiyat senkronu (borsa.erzurumtb.org.tr)
DATABANK_BASE_URL=https://borsa.erzurumtb.org.tr/web/data/
DATABANK_SYNC_ENABLED=true
DATABANK_HOURLY_SYNC=true
DATABANK_SYNC_CRON=5 * * * *
DATABANK_SYNC_SECTIONS=home,tescil
DATABANK_PRICE_SOURCE_PRIORITY=tescil,home
DATABANK_TESCIL_BACKFILL_DAYS=2
DATABANK_REQUEST_DELAY_MS=2000
TZ=Europe/Istanbul
"@

if ($GeminiApiKey) {
  $envContent += "`nGEMINI_API_KEY=$GeminiApiKey"
}

$envFile = Join-Path $env:TEMP "etb-server.env"
[System.IO.File]::WriteAllText($envFile, $envContent.Replace("`r`n", "`n"), [System.Text.UTF8Encoding]::new($false))

Write-Host "Sunucuda dizin oluşturuluyor..."
ssh -i $SshKey -o StrictHostKeyChecking=accept-new $Host_ "mkdir -p $RemoteDir/migrations $RemoteDir/videos"

Write-Host "Dosyalar yükleniyor (birkaç dakika)..."
$files = @(
  (Join-Path $Root "etb-api.tar"),
  (Join-Path $Root "etb-frontend.tar"),
  (Join-Path $Root "etb-admin.tar"),
  (Join-Path $Root "docker-compose.server.yml"),
  (Join-Path $Root "scripts\server-fresh-install.sh"),
  $envFile
)
scp -i $SshKey @files "${Host_}:${RemoteDir}/"

$migrations = Get-ChildItem (Join-Path $Root "backend\src\db\migrations\*.sql")
scp -i $SshKey $migrations.FullName "${Host_}:${RemoteDir}/migrations/"

if (Test-Path $Video) {
  Write-Host "Kadayıf videosu yükleniyor..."
  scp -i $SshKey $Video "${Host_}:${RemoteDir}/videos/kadayif-dolmasi-usta.mp4"
} else {
  Write-Warning "Video yok: $Video — sonra scripts/upload-kadayif-video.ps1 çalıştırın"
}

Write-Host "Sunucuda kurulum başlıyor..."
ssh -i $SshKey $Host_ @"
set -e
cd $RemoteDir
mv etb-server.env .env 2>/dev/null || cp etb-server.env .env
chmod +x server-fresh-install.sh
sed -i 's/\r$//' server-fresh-install.sh
bash server-fresh-install.sh
"@

Write-Host ""
Write-Host "=========================================="
Write-Host "  KURULUM TAMAMLANDI"
Write-Host "=========================================="
Write-Host "  Site:   http://${ServerIp}/"
Write-Host "  Admin:  http://${ServerIp}:8080/"
Write-Host "  E-posta: $AdminEmail"
Write-Host "  Şifre:  $AdminPassword"
Write-Host "  Kadayıf: http://${ServerIp}/cografi-isaretler/kadayif-dolmasi"
Write-Host "=========================================="
Write-Host ""
Write-Host "DNS varsa .env BASE_URL ve rebuild gerekir. GEMINI_API_KEY sunucuda /opt/etb/.env içine eklenebilir."
