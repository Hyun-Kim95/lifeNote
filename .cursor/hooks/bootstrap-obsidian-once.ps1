#!/usr/bin/env pwsh
Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

function Ensure-Directory {
    param([string]$Path)
    if (-not (Test-Path -LiteralPath $Path)) {
        New-Item -ItemType Directory -Path $Path -Force | Out-Null
    }
}

try {
    $projectRoot = (Resolve-Path (Join-Path $PSScriptRoot "..\..")).Path
    $stateDir = Join-Path $projectRoot ".cursor\state"
    $stateFile = Join-Path $stateDir "obsidian-bootstrap.done"

    # Run only once per project clone/copy.
    if (Test-Path -LiteralPath $stateFile) {
        exit 0
    }

    Ensure-Directory -Path $stateDir

    $ingestConfigPath = Join-Path $projectRoot ".obsidian-ingest.json"
    if (-not (Test-Path -LiteralPath $ingestConfigPath)) {
        $slug = Split-Path -Path $projectRoot -Leaf
        $config = @(
            "{"
            "  `"slug`": `"$slug`","
            "  `"vaultRoot`": `"D:\\Obsidian\\projects`","
            "  `"docsPaths`": [`"docs`"]"
            "}"
        ) -join "`r`n"
        Set-Content -LiteralPath $ingestConfigPath -Value $config -Encoding UTF8
    }

    $syncScript = Join-Path $projectRoot "scripts\obsidian\sync-docs.ps1"
    if (Test-Path -LiteralPath $syncScript) {
        powershell -NoProfile -ExecutionPolicy Bypass -File $syncScript | Out-Null
    }

    $installHookScript = Join-Path $projectRoot "scripts\obsidian\install-hook.ps1"
    $gitDir = Join-Path $projectRoot ".git"
    if ((Test-Path -LiteralPath $gitDir) -and (Test-Path -LiteralPath $installHookScript)) {
        powershell -NoProfile -ExecutionPolicy Bypass -File $installHookScript -TargetRepo $projectRoot | Out-Null
    }

    $timestamp = (Get-Date).ToString("s")
    Set-Content -LiteralPath $stateFile -Value "bootstrapped_at=$timestamp" -Encoding ASCII
    exit 0
}
catch {
    # Never block session startup because of bootstrap failures.
    exit 0
}
