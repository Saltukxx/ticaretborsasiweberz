# Kadayıf tarif videosunu sunucuya yükler ve frontend volume'ünü etkinleştirir.
# Kullanım: .\scripts\upload-kadayif-video.ps1

$ErrorActionPreference = "Stop"
$Root = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$Video = Join-Path $Root "public\videos\kadayif-dolmasi-usta.mp4"
$Key = Join-Path $env:USERPROFILE ".ssh\id_rsa_etb"
$Host_ = "root@139.59.156.88"
$RemoteDir = "/opt/etb"

if (-not (Test-Path $Video)) {
    Write-Error "Video bulunamadı: $Video"
}

if (-not (Test-Path $Key)) {
    Write-Error "SSH anahtarı bulunamadı: $Key"
}

Write-Host "Sunucu bağlantısı test ediliyor..."
$tcp = Test-NetConnection -ComputerName 139.59.156.88 -Port 22 -WarningAction SilentlyContinue
if (-not $tcp.TcpTestSucceeded) {
    Write-Error "Sunucuya SSH (port 22) ulaşılamıyor. Droplet acik mi? DigitalOcean firewall SSH'ye izin veriyor mu?"
}

Write-Host "Video boyutu: $([math]::Round((Get-Item $Video).Length / 1MB, 2)) MB"

ssh -i $Key $Host_ "mkdir -p $RemoteDir/videos"
Write-Host "Video yukleniyor (birkac dakika surebilir)..."
scp -i $Key $Video "${Host_}:${RemoteDir}/videos/kadayif-dolmasi-usta.mp4"

$Compose = Join-Path $Root "docker-compose.server.yml"
if (Test-Path $Compose) {
    scp -i $Key $Compose "${Host_}:${RemoteDir}/docker-compose.server.yml"
}

ssh -i $Key $Host_ "cd $RemoteDir && ls -lh videos/kadayif-dolmasi-usta.mp4 && docker compose -f docker-compose.server.yml up -d frontend"

Write-Host ""
Write-Host "Tamam. Dogrulama:"
Write-Host "  http://139.59.156.88/videos/kadayif-dolmasi-usta.mp4"
Write-Host "  http://139.59.156.88/cografi-isaretler/kadayif-dolmasi"
