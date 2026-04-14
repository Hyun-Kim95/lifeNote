param(
    [Parameter(Mandatory = $true)]
    [string]$TargetRepo,
    [string]$ScriptPath = ""
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

if ([string]::IsNullOrWhiteSpace($ScriptPath)) {
    $ScriptPath = Join-Path $PSScriptRoot "write-commit-journal.ps1"
}

$hookDir = Join-Path $TargetRepo ".git\hooks"
if (-not (Test-Path -LiteralPath $hookDir)) {
    throw "Git hooks directory not found: $hookDir"
}

if (-not (Test-Path -LiteralPath $ScriptPath)) {
    throw "Journal script not found: $ScriptPath"
}

$normalizedScriptPath = $ScriptPath.Replace("\", "/")
$hookFile = Join-Path $hookDir "post-commit"

$hookContent = @(
    "#!/bin/sh"
    "set -eu"
    'REPO_ROOT="$(git rev-parse --show-toplevel)"'
    "powershell -NoProfile -ExecutionPolicy Bypass -File `"$normalizedScriptPath`" -RepoRoot `"$REPO_ROOT`""
)

Set-Content -LiteralPath $hookFile -Value ($hookContent -join "`n") -Encoding ASCII
Write-Host "Hook installed: $hookFile"
Write-Host "It will append commit journals into D:\Obsidian\projects\<slug>\journal"
