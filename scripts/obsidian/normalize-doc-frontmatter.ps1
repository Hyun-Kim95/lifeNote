#!/usr/bin/env pwsh
<#
.SYNOPSIS
  docs/ 하위( obsidian 제외 )의 .md에 공통 YAML frontmatter와 Vault 링크 섹션을 추가한다.
  이미 --- 로 시작하는 파일은 건너뛴다.
#>
param(
    [string]$RepoRoot = ""
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

. (Join-Path $PSScriptRoot "Resolve-HubIndexStem.ps1")

if ([string]::IsNullOrWhiteSpace($RepoRoot)) {
    $RepoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..\..")).Path
}

$slug = Split-Path -Path $RepoRoot -Leaf
$displayName = ""
$hubFileStem = ""
$ingestPath = Join-Path $RepoRoot ".obsidian-ingest.json"
if (Test-Path -LiteralPath $ingestPath) {
    try {
        $ingest = Get-Content -LiteralPath $ingestPath -Raw -Encoding UTF8 | ConvertFrom-Json
        if ($ingest.slug) {
            $slug = [string]$ingest.slug
        }
        $dnProp = $ingest.PSObject.Properties['displayName']
        if ($null -ne $dnProp -and -not [string]::IsNullOrWhiteSpace([string]$dnProp.Value)) {
            $displayName = [string]$dnProp.Value
        }
        $hfProp = $ingest.PSObject.Properties['hubFileStem']
        if ($null -ne $hfProp -and -not [string]::IsNullOrWhiteSpace([string]$hfProp.Value)) {
            $hubFileStem = [string]$hfProp.Value
        }
    } catch {
        # keep folder slug
    }
}

$hubStem = Get-HubIndexStem -Slug $slug -DisplayName $displayName -HubFileStem $hubFileStem

function Escape-YamlDoubleQuotedValue {
    param([string]$Text)
    if ($null -eq $Text) {
        return ''
    }
    $clean = ($Text -replace "`r`n", ' ' -replace "`r", ' ' -replace "`n", ' ')
    return (($clean -replace '\\', '\\\\') -replace '"', '\"')
}

$lanes = @("requirements", "qa", "design", "decisions", "changelog")

function Test-HasYamlFrontmatter {
    param([string]$Text)
    return ($Text.TrimStart().StartsWith("---"))
}

function Test-HasVaultSection {
    param([string]$Text)
    return [regex]::IsMatch($Text, '(?m)^##\s+Vault\s*$')
}

foreach ($lane in $lanes) {
    $laneRoot = Join-Path $RepoRoot (Join-Path "docs" $lane)
    if (-not (Test-Path -LiteralPath $laneRoot)) {
        continue
    }

    Get-ChildItem -LiteralPath $laneRoot -Filter "*.md" -Recurse -File | ForEach-Object {
        $full = $_.FullName
        $raw = Get-Content -LiteralPath $full -Raw -Encoding UTF8
        if ($null -eq $raw) {
            $raw = ""
        }

        if (Test-HasYamlFrontmatter -Text $raw) {
            Write-Host "skip (frontmatter): $full"
            return
        }

        $updatedAt = $_.LastWriteTime.ToString("s")
        $headerLines = New-Object System.Collections.Generic.List[string]
        $null = $headerLines.Add('---')
        $null = $headerLines.Add('type: doc')
        $null = $headerLines.Add("project: $slug")
        if (-not [string]::IsNullOrWhiteSpace($displayName)) {
            $dq = Escape-YamlDoubleQuotedValue -Text $displayName
            $null = $headerLines.Add('display_name: "' + $dq + '"')
        }
        $null = $headerLines.Add("doc_lane: $lane")
        $null = $headerLines.Add("updated_at: $updatedAt")
        $null = $headerLines.Add('tags: [docs, vault-sync]')
        $null = $headerLines.Add('---')
        $null = $headerLines.Add('')
        $header = ($headerLines -join "`n") + "`n"

        $body = $raw.TrimEnd()
        # ASCII-only display text (Windows PowerShell 5.1 script encoding + Set-Content can mangle Korean).
        $vaultBlock = @"

## Vault

- [[$slug/docs/$hubStem|Hub]]
- [[$slug/docs/obsidian/dashboards/projects-overview|Dashboards]]
- [[$slug/docs/obsidian/dashboards/commit-journal-overview|Commit journals (Dataview)]]
"@

        if (-not (Test-HasVaultSection -Text $raw)) {
            $body = $body + $vaultBlock
        }

        $out = $header + $body
        if (-not $out.EndsWith("`n")) {
            $out += "`n"
        }
        Set-Content -LiteralPath $full -Value $out -Encoding utf8
        Write-Host "updated: $full"
    }
}

Write-Host "Done. Slug/project: $slug"
