param(
    [string]$RepoRoot,
    [string]$VaultRoot = "D:\Obsidian\projects"
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

# Git stdout + Korean Windows: PowerShell 5.x defaults can mangle UTF-8 commit messages.
$script:Utf8NoBom = [System.Text.UTF8Encoding]::new($false)
if ($PSVersionTable.PSVersion.Major -lt 6) {
    [Console]::OutputEncoding = $script:Utf8NoBom
    $OutputEncoding = $script:Utf8NoBom
}

function Ensure-Directory {
    param([string]$Path)
    if (-not (Test-Path -LiteralPath $Path)) {
        New-Item -ItemType Directory -Path $Path -Force | Out-Null
    }
}

function Run-Git {
    param(
        [string]$RepoPath,
        [string[]]$GitArguments
    )

    $output = & git -C $RepoPath @GitArguments
    if ($LASTEXITCODE -ne 0) {
        throw "git command failed: git -C $RepoPath $($GitArguments -join ' ')"
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

$shaFull = Run-Git -RepoPath $RepoRoot -GitArguments @("rev-parse", "HEAD")
$shaShort = Run-Git -RepoPath $RepoRoot -GitArguments @("rev-parse", "--short", "HEAD")
# --encoding=UTF-8: log pretty fields (subject, author, etc.) recode for this process.
$subject = Run-Git -RepoPath $RepoRoot -GitArguments @("log", "-1", "--encoding=UTF-8", "--pretty=%s")
$author = Run-Git -RepoPath $RepoRoot -GitArguments @("log", "-1", "--encoding=UTF-8", "--pretty=%an")
$committedAt = Run-Git -RepoPath $RepoRoot -GitArguments @("log", "-1", "--encoding=UTF-8", "--date=iso", "--pretty=%cd")
$changedFilesRaw = Run-Git -RepoPath $RepoRoot -GitArguments @("diff-tree", "--no-commit-id", "--name-only", "-r", "HEAD")
$changedFiles = @()
if (-not [string]::IsNullOrWhiteSpace($changedFilesRaw)) {
    $changedFiles = @(
        $changedFilesRaw -split "`r?`n" | Where-Object { -not [string]::IsNullOrWhiteSpace($_) }
    )
}

$journalRoot = Join-Path (Join-Path $VaultRoot $slug) "journal"
Ensure-Directory -Path $journalRoot

$timestamp = Get-Date -Format "yyyy-MM-ddTHHmmss"
$updatedAt = (Get-Date).ToString("s")
$notePath = Join-Path $journalRoot "$timestamp-$shaShort.md"
$safeRepoRoot = $RepoRoot.Replace("\", "\\")
$safeSourceRepo = $sourceRepo.Replace("\", "\\")

# Avoid `[[` / `#` inside double-quoted array literals (hook-invoked Windows PowerShell parses them as operators/types).
$frontmatter = New-Object System.Collections.Generic.List[string]
$null = $frontmatter.Add('---')
$null = $frontmatter.Add('type: commit-journal')
$null = $frontmatter.Add("project: $slug")
$null = $frontmatter.Add("source_repo: $safeSourceRepo")
$null = $frontmatter.Add("repo_name: $repoName")
$null = $frontmatter.Add("repo_root: $safeRepoRoot")
$null = $frontmatter.Add("updated_at: $updatedAt")
$null = $frontmatter.Add("commit: $shaFull")
$null = $frontmatter.Add("commit_short: $shaShort")
$null = $frontmatter.Add("author: $author")
$null = $frontmatter.Add("committed_at: $committedAt")
$null = $frontmatter.Add('tags: [tech, commit, journal]')
$null = $frontmatter.Add('links:')
$null = $frontmatter.Add('    - ''[[' + $slug + '/docs/_project-doc-index]]''')
$null = $frontmatter.Add('    - ''[[' + $slug + '/docs/obsidian/dashboards/commit-journal-overview]]''')
$null = $frontmatter.Add('---')
$null = $frontmatter.Add('')

$body = New-Object System.Collections.Generic.List[string]
$null = $body.Add('# ' + $subject)
$null = $body.Add('')
$null = $body.Add('## Metadata')
$null = $body.Add('- Repo: ' + $repoName)
$null = $body.Add('- Slug: ' + $slug)
$null = $body.Add('- Commit: ' + $shaShort)
$null = $body.Add('- Author: ' + $author)
$null = $body.Add('- CommittedAt: ' + $committedAt)
$null = $body.Add('- UpdatedAt: ' + $updatedAt)
$null = $body.Add('')
$null = $body.Add('## Changed Files')

if ($changedFiles.Count -eq 0) {
    $null = $body.Add('- (none)')
} else {
    foreach ($file in $changedFiles) {
        $null = $body.Add('- ' + $file)
    }
}

$null = $body.Add('')
$null = $body.Add('## Related Links')
$null = $body.Add('- [[' + $slug + '/docs/_project-doc-index]]')
$null = $body.Add('- [[' + $slug + '/docs/obsidian/dashboards/commit-journal-overview|Commit journal (Dataview)]]')

$content = ($frontmatter + $body) -join "`r`n"
if (-not $content.EndsWith("`n")) {
    $content += "`r`n"
}
[System.IO.File]::WriteAllText($notePath, $content, $script:Utf8NoBom)

Write-Host "Commit journal written: $notePath"
