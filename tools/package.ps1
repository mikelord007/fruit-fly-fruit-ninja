$ErrorActionPreference = 'Stop'
$taskRoot = Split-Path -Parent $PSScriptRoot
$taskZip = Join-Path (Split-Path -Parent $taskRoot) 'fruit-fly-fruit-ninja.zip'
$taskItems = Get-ChildItem -LiteralPath $taskRoot -Force | Where-Object { $_.Name -notin @('node_modules', 'work', '.git', '.vercel', 'package-lock.json') -and $_.Name -notlike '.env*' }
Compress-Archive -LiteralPath $taskItems.FullName -DestinationPath $taskZip -Force
Write-Output $taskZip
