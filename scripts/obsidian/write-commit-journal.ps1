param(
    [string]$RepoRoot,
    [string]$VaultRoot = "D:\Obsidian\projects"
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

function Ensure-Directory {
    param([string]$Path)
    if (-not (Test-Path -LiteralPath $Path)) {
        New-Item -ItemType Directory -Path $Path -Force | Out-Null
    }
}

function Run-Git {
    param(
        [string]$RepoPath,
        [string[]]$Args
    )

    $output = & git -C $RepoPath @Args
    if ($LASTEXITCODE -ne 0) {
        throw "git command failed: git -C $RepoPath $($Args -join ' ')"
    }

    if ($null -eq $output) {
        return ""
    }

    return ($output -join "`n").Trim()
}

if ([string]::IsNullOrWhiteSpace($RepoRoot)) {
    $RepoRoot = Get-Location | Select-Object -ExpandProperty Path
}

if (-not (Test-Path -LiteralPath $RepoRoot)) {
    throw "RepoRoot not found: $RepoRoot"
}

$repoName = Split-Path -Path $RepoRoot -Leaf
$ingestConfigPath = Join-Path $RepoRoot ".obsidian-ingest.json"
$slug = $repoName

if (Test-Path -LiteralPath $ingestConfigPath) {
    $repoConfig = Get-Content -LiteralPath $ingestConfigPath -Raw | ConvertFrom-Json
    if ($repoConfig.slug) {
        $slug = [string]$repoConfig.slug
    }
    if ($repoConfig.vaultRoot) {
        $VaultRoot = [string]$repoConfig.vaultRoot
    }
}

$sourceRepo = $repoName
$remoteOrigin = & git -C $RepoRoot config --get remote.origin.url 2>$null
if ($LASTEXITCODE -eq 0 -and -not [string]::IsNullOrWhiteSpace($remoteOrigin)) {
    $sourceRepo = ($remoteOrigin -join "`n").Trim()
}

$shaFull = Run-Git -RepoPath $RepoRoot -Args @("rev-parse", "HEAD")
$shaShort = Run-Git -RepoPath $RepoRoot -Args @("rev-parse", "--short", "HEAD")
$subject = Run-Git -RepoPath $RepoRoot -Args @("log", "-1", "--pretty=%s")
$author = Run-Git -RepoPath $RepoRoot -Args @("log", "-1", "--pretty=%an")
$committedAt = Run-Git -RepoPath $RepoRoot -Args @("log", "-1", "--date=iso", "--pretty=%cd")
$changedFilesRaw = Run-Git -RepoPath $RepoRoot -Args @("diff-tree", "--no-commit-id", "--name-only", "-r", "HEAD")
$changedFiles = @()
if (-not [string]::IsNullOrWhiteSpace($changedFilesRaw)) {
    $changedFiles = $changedFilesRaw -split "`r?`n" | Where-Object { -not [string]::IsNullOrWhiteSpace($_) }
}

$journalRoot = Join-Path (Join-Path $VaultRoot $slug) "journal"
Ensure-Directory -Path $journalRoot

$timestamp = Get-Date -Format "yyyy-MM-ddTHHmmss"
$updatedAt = (Get-Date).ToString("s")
$notePath = Join-Path $journalRoot "$timestamp-$shaShort.md"
$safeRepoRoot = $RepoRoot.Replace("\", "\\")
$safeSourceRepo = $sourceRepo.Replace("\", "\\")

$frontmatter = @(
    "---"
    "type: commit-journal"
    "project: $slug"
    "source_repo: $safeSourceRepo"
    "repo_name: $repoName"
    "repo_root: $safeRepoRoot"
    "updated_at: $updatedAt"
    "commit: $shaFull"
    "commit_short: $shaShort"
    "author: $author"
    "committed_at: $committedAt"
    "tags: [tech, commit, journal]"
    "links:"
    "- '[[$slug/docs/_project-doc-index]]'"
    "- '[[$slug/journal]]'"
    "---"
    ""
)

$body = @(
    "# $subject"
    ""
    "## Metadata"
    "- Repo: `$repoName`"
    "- Slug: `$slug`"
    "- Commit: `$shaShort`"
    "- Author: `$author`"
    "- CommittedAt: `$committedAt`"
    "- UpdatedAt: `$updatedAt`"
    ""
    "## Changed Files"
)

if ($changedFiles.Count -eq 0) {
    $body += "- (none)"
} else {
    foreach ($file in $changedFiles) {
        $body += "- `$file`"
    }
}

$body += @(
    ""
    "## Related Links"
    "- [[$slug/docs/_project-doc-index]]"
    "- [[$slug/journal]]"
)

$content = ($frontmatter + $body) -join "`r`n"
Set-Content -LiteralPath $notePath -Value $content -Encoding UTF8

Write-Host "Commit journal written: $notePath"
