$ErrorActionPreference = 'Stop'
$taskRoot = Split-Path -Parent $PSScriptRoot
$taskZip = Join-Path (Split-Path -Parent $taskRoot) 'fly-swarm-kitchen.zip'
$taskItems = Get-ChildItem -LiteralPath $taskRoot -Force | Where-Object { $_.Name -notin @('node_modules', 'work', '.git', 'package-lock.json') }
Compress-Archive -LiteralPath $taskItems.FullName -DestinationPath $taskZip -Force
Write-Output $taskZip
