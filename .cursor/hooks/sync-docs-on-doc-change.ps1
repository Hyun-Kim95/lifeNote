#!/usr/bin/env pwsh
Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

function Get-AllStringValues {
    param([object]$Node)

    $values = New-Object System.Collections.Generic.List[string]
    if ($null -eq $Node) {
        return $values
    }

    if ($Node -is [string]) {
        $values.Add($Node)
        return $values
    }

    if ($Node -is [System.Collections.IDictionary]) {
        foreach ($key in $Node.Keys) {
            foreach ($item in (Get-AllStringValues -Node $Node[$key])) {
                $values.Add($item)
            }
        }
        return $values
    }

    if ($Node -is [System.Collections.IEnumerable] -and -not ($Node -is [string])) {
        foreach ($entry in $Node) {
            foreach ($item in (Get-AllStringValues -Node $entry)) {
                $values.Add($item)
            }
        }
        return $values
    }

    foreach ($prop in $Node.PSObject.Properties) {
        foreach ($item in (Get-AllStringValues -Node $prop.Value)) {
            $values.Add($item)
        }
    }

    return $values
}

try {
    $raw = [Console]::In.ReadToEnd()
    if ([string]::IsNullOrWhiteSpace($raw)) {
        exit 0
    }

    $payload = $raw | ConvertFrom-Json -Depth 20
    $allStrings = Get-AllStringValues -Node $payload
    $normalized = $allStrings | ForEach-Object { $_.ToLowerInvariant().Replace("/", "\") }

    $hasDocChange = $false
    foreach ($value in $normalized) {
        if ($value -match "(^|\\)docs(\\|$)" -or $value -match "\.md$") {
            $hasDocChange = $true
            break
        }
    }

    if (-not $hasDocChange) {
        exit 0
    }

    # Use script location, not Get-Location: hook cwd may differ from project root.
    $projectRoot = (Resolve-Path (Join-Path $PSScriptRoot "..\..")).Path
    $syncScript = Join-Path $projectRoot "scripts\obsidian\sync-docs.ps1"
    if (-not (Test-Path -LiteralPath $syncScript)) {
        exit 0
    }

    powershell -NoProfile -ExecutionPolicy Bypass -File $syncScript | Out-Null
    exit 0
}
catch {
    # Hook failures should never block normal editing.
    exit 0
}
