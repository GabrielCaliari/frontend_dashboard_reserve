# Sobe a API local (3015) e o painel (3002) como processos independentes do
# Claude/terminal: fecham so se voce matar (ou reiniciar o Windows).
#
# Uso:   powershell -ExecutionPolicy Bypass -File scripts\demo-sempre-ligado.ps1
# Parar: powershell -ExecutionPolicy Bypass -File scripts\demo-sempre-ligado.ps1 -Parar
# Logs:  %LOCALAPPDATA%\reserve-demo\api.log e painel.log
param([switch]$Parar)

$front = Split-Path -Parent $PSScriptRoot
$back  = Join-Path (Split-Path -Parent $front) 'backend_reserve'
$logs  = Join-Path $env:LOCALAPPDATA 'reserve-demo'
New-Item -ItemType Directory -Force $logs | Out-Null
$pidFile = Join-Path $logs 'pids.txt'

function Ocupada($porta) {
  $null -ne (Get-NetTCPConnection -State Listen -LocalPort $porta -ErrorAction SilentlyContinue)
}

if ($Parar) {
  if (Test-Path $pidFile) {
    Get-Content $pidFile | ForEach-Object { try { Stop-Process -Id ([int]$_) -Force -ErrorAction Stop; Write-Host "parado PID $_" } catch {} }
    Remove-Item $pidFile
  }
  exit 0
}

# Containers do banco e do redis da demo (nao mexe nos do bot).
docker start reserve-test-pg reserve-test-redis 2>$null | Out-Null

$pids = @()
if (Ocupada 3015) { Write-Host 'API ja esta na 3015' } else {
  $p = Start-Process -FilePath 'node' -ArgumentList 'scripts/demo/start-local.cjs', '--port', '3015' `
        -WorkingDirectory $back -WindowStyle Hidden -PassThru `
        -RedirectStandardOutput (Join-Path $logs 'api.log') -RedirectStandardError (Join-Path $logs 'api.err.log')
  $pids += $p.Id; Write-Host "API subindo (PID $($p.Id)) - compila antes de ouvir na 3015"
}
if (Ocupada 3002) { Write-Host 'Painel ja esta na 3002' } else {
  $p = Start-Process -FilePath 'node' -ArgumentList 'scripts/dev-local-api.cjs', '--api', 'http://localhost:3015/api', '--port', '3002' `
        -WorkingDirectory $front -WindowStyle Hidden -PassThru `
        -RedirectStandardOutput (Join-Path $logs 'painel.log') -RedirectStandardError (Join-Path $logs 'painel.err.log')
  $pids += $p.Id; Write-Host "Painel subindo (PID $($p.Id)) em http://localhost:3002"
}
if ($pids.Count) { $pids | Out-File $pidFile -Append -Encoding ascii }
