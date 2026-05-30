# Obsidian Claude Session Notes — Improvement Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use
> subagent-driven-development or executing-plans.

**Goal:** Rewrite `claude-obsidian-hook.ps1` so each Claude session produces
exactly one Obsidian note entry — updated in place — containing a meaningful
summary of what was accomplished.

**Architecture:** The existing Stop hook already fires on every response and
writes to `00 - Inbox/Claude Sessions/<date>.md` via the Obsidian Local REST
API (port 27124) with filesystem fallback. The rewrite keeps that pipeline but
adds (a) deduplication by `session_id`, (b) extraction of all user prompts plus
the last assistant response as a natural summary, and (c) a "useful" filter that
skips sessions that only read files without producing any output.

**Tech Stack:** PowerShell 7, Obsidian Local REST API (HTTPS, localhost:27124),
Claude Code JSONL transcript format, existing global hook in
`~/.claude/settings.json`.

---

## Current state (confirmed by reading the live notes)

File: `C:\Users\Pedro Diniz\Documents\Dev e Scripts\PowerShell\claude-obsidian-hook.ps1`

Problems:
1. Stop fires on every response → same `session_id` appears 3-6 times per session
2. `Pergunta` field is often empty — transcript parser looks only at `type=="user"` + `message.role=="user"` but skips lines where the outer `type` field differs
3. No summary of outcome — only tool names, no description of what was done
4. No filter — a session that just ran Read/Glob gets logged identically to one that shipped code

---

## Task 1: Understand the transcript JSONL schema

**File:** `C:\Users\Pedro Diniz\Documents\Dev e Scripts\PowerShell\claude-obsidian-hook.ps1`
*(read-only diagnostic — no code changes in this task)*

**What to do:**
Run the following snippet once interactively (outside the hook) against a real
transcript to confirm the exact JSON shape of user and assistant messages:

```powershell
$path = "C:\Users\Pedro Diniz\.claude\projects\<any-project>\<session-id>.jsonl"
Get-Content $path | ForEach-Object {
    try { $_ | ConvertFrom-Json } catch {}
} | Select-Object -First 30 | ForEach-Object {
    [PSCustomObject]@{
        outer_type   = $_.type
        role         = $_.message.role
        content_types = ($_.message.content | ForEach-Object { $_.type }) -join ","
    }
} | Format-Table -AutoSize
```

Expected output reveals whether user messages always have `type=="user"` at the
outer level, or if some appear with `type=="assistant"` inner turns.

**Verification:**
```
outer_type  role       content_types
----------  ----       -------------
user        user       text
assistant   assistant  text,tool_use
tool        tool       tool_result
user        user       text
```

**Commit:** `chore(hook): document transcript schema before rewrite`

---

## Task 2: Extract all user prompts and last assistant summary

**File:** `C:\Users\Pedro Diniz\Documents\Dev e Scripts\PowerShell\claude-obsidian-hook.ps1`

Replace the existing transcript-parsing block (lines ~18-34) with this function
that collects all user text messages and the final assistant text response:

```powershell
function Get-TranscriptContext {
    param([string]$TranscriptPath)

    $result = [PSCustomObject]@{
        UserPrompts    = [System.Collections.Generic.List[string]]::new()
        LastAssistant  = ""
        ToolsUsed      = [System.Collections.Generic.List[string]]::new()
    }

    if (-not $TranscriptPath -or -not (Test-Path $TranscriptPath)) { return $result }

    $lines = Get-Content $TranscriptPath -ErrorAction SilentlyContinue
    foreach ($line in $lines) {
        $msg = try { $line | ConvertFrom-Json -ErrorAction Stop } catch { continue }

        # User prompts — filter out system tags and skill invocations
        if ($msg.message.role -eq "user") {
            foreach ($part in $msg.message.content) {
                if ($part.type -eq "text") {
                    $txt = $part.text.Trim()
                    if ($txt.Length -gt 5 -and
                        -not $txt.StartsWith("<") -and
                        -not $txt.StartsWith("#") -and
                        -not $txt.StartsWith("/")) {
                        $short = $txt.Substring(0, [Math]::Min(180, $txt.Length)) -replace "`n", " "
                        $result.UserPrompts.Add($short)
                    }
                }
            }
        }

        # Tools used
        if ($msg.message.role -eq "assistant") {
            foreach ($part in $msg.message.content) {
                if ($part.type -eq "tool_use" -and $part.name) {
                    $result.ToolsUsed.Add($part.name)
                }
                # Capture last assistant text as natural summary
                if ($part.type -eq "text" -and $part.text.Trim().Length -gt 20) {
                    $result.LastAssistant = $part.text.Trim().Substring(0, [Math]::Min(300, $part.text.Trim().Length)) -replace "`n", " "
                }
            }
        }
    }

    $result.ToolsUsed = @($result.ToolsUsed | Sort-Object -Unique)
    return $result
}
```

**Verification:**
Run the function manually against a real transcript path and confirm:
- `UserPrompts` has 1+ entries (not empty)
- `LastAssistant` is the last thing Claude said (a meaningful sentence)
- `ToolsUsed` lists only distinct tool names

```powershell
$ctx = Get-TranscriptContext -TranscriptPath "C:\Users\Pedro Diniz\.claude\projects\...\session.jsonl"
$ctx.UserPrompts
$ctx.LastAssistant
$ctx.ToolsUsed
```

**Commit:** `feat(hook): extract all user prompts and last assistant text from transcript`

---

## Task 3: Add "useful session" filter

**File:** `C:\Users\Pedro Diniz\Documents\Dev e Scripts\PowerShell\claude-obsidian-hook.ps1`

Add this filter immediately after calling `Get-TranscriptContext`. Sessions that
only did read-only operations with fewer than 3 tool calls are skipped — they
don't represent useful work worth logging.

```powershell
# Define which tools indicate real work (not just exploration)
$workTools = @("Edit", "Write", "Bash", "PowerShell", "NotebookEdit",
               "Agent", "Skill", "mcp__obsidian__obsidian_patch_content",
               "mcp__obsidian__obsidian_append_content",
               "mcp__obsidian__obsidian_create_file",
               "mcp__overleaf__write_file", "mcp__overleaf__write_section")

$didRealWork = ($ctx.ToolsUsed | Where-Object { $workTools -contains $_ }).Count -gt 0
$hasEnoughActivity = $ctx.ToolsUsed.Count -ge 2

if (-not $didRealWork -and -not $hasEnoughActivity) {
    exit 0  # Silent skip — nothing worth noting
}
```

**Verification:**
Confirm a session that only ran `Read` + `Glob` produces no new note entry, while
a session that ran `Edit` does produce one. Test by checking note line count before
and after running the script with mock inputs.

**Commit:** `feat(hook): skip read-only sessions with fewer than 2 tool calls`

---

## Task 4: Deduplicate entries by session_id

**File:** `C:\Users\Pedro Diniz\Documents\Dev e Scripts\PowerShell\claude-obsidian-hook.ps1`

Replace the current "always append" logic with a read-then-update-or-append
strategy. The Obsidian REST API returns the full note content; we parse it in
memory, replace or append the session block, then PUT the whole file back.

```powershell
function Update-OrAppendSessionBlock {
    param(
        [string]$NoteContent,
        [string]$SessionId,
        [string]$NewBlock   # the full "### HH:MM - project\n..." string
    )

    # Marker we embed so we can find and replace the block later
    $marker = "session:$SessionId"

    if ($NoteContent -match [regex]::Escape($marker)) {
        # Replace existing block: find from marker line to next "### " or end-of-string
        $pattern = "(?ms)(### [^\n]+ \[$marker\][^\n]*\n)(.*?)(?=\n### |\Z)"
        $updated = $NoteContent -replace $pattern, ($NewBlock + "`n")
        return $updated
    } else {
        # Append new block
        return $NoteContent.TrimEnd() + "`n`n" + $NewBlock
    }
}
```

The `$NewBlock` must embed the session marker in the heading line so future runs
can locate and replace it:

```powershell
$entryBlock = @"
### $timeStr - $projectName [session:$sessionId]

- **Resumo:** $($ctx.LastAssistant)
- **Prompts:** $(($ctx.UserPrompts | Select-Object -First 3 | ForEach-Object { "`n  - $_" }) -join "")
- **Ferramentas:** ``$(($ctx.ToolsUsed -join '`, `'))``
- $gitLine
"@
```

**Verification:**
1. Trigger the hook twice with the same `session_id` (via `echo '{"session_id":"TEST-123","transcript_path":""}' | pwsh -File hook.ps1`)
2. Open the note — should have exactly one entry for `TEST-123`, not two
3. Trigger again — entry updates in place

```powershell
# Quick manual test
$json = '{"session_id":"TEST-DEDUP","transcript_path":""}'
echo $json | pwsh -NonInteractive -File "C:\Users\Pedro Diniz\Documents\Dev e Scripts\PowerShell\claude-obsidian-hook.ps1"
# Run twice, check note has one entry, not two
```

**Commit:** `feat(hook): deduplicate session entries — update in place on repeated Stop events`

---

## Task 5: Assemble and ship the full rewritten script

**File:** `C:\Users\Pedro Diniz\Documents\Dev e Scripts\PowerShell\claude-obsidian-hook.ps1`

Full replacement of the script incorporating Tasks 2-4. The complete rewrite:

```powershell
#Requires -Version 7.0
[CmdletBinding()]
param()

$VAULT_PATH   = "C:\Users\Pedro Diniz\Documents\Obsidian Vault"
$API_BASE     = "https://127.0.0.1:27124"
$API_KEY      = "9572cf3251f1e5249470bdb00bf4820b927651c199ac9f72050ea888dd1b8625"
$NOTE_SUBPATH = "00 - Inbox/Claude Sessions"
$GIT_EXE      = "C:\Program Files\Git\cmd\git.exe"

# ── Read hook input ──────────────────────────────────────────────────────────
try {
    if (-not [Console]::IsInputRedirected) { exit 0 }
    $raw = [Console]::In.ReadToEnd()
    if ([string]::IsNullOrWhiteSpace($raw)) { exit 0 }
    $hook = $raw | ConvertFrom-Json -ErrorAction Stop
} catch { exit 0 }

$sessionId      = $hook.session_id
$transcriptPath = $hook.transcript_path
$projectCwd     = $PWD.Path
$now            = Get-Date
$dateStr        = $now.ToString("yyyy-MM-dd")
$timeStr        = $now.ToString("HH:mm")
$projectName    = Split-Path -Leaf $projectCwd
$noteVaultPath  = "$NOTE_SUBPATH/$dateStr.md"
$noteFilePath   = Join-Path $VAULT_PATH "$NOTE_SUBPATH\$dateStr.md"
$headers        = @{ "Authorization" = "Bearer $API_KEY"; "Content-Type" = "text/markdown" }

# ── Parse transcript ─────────────────────────────────────────────────────────
$userPrompts   = [System.Collections.Generic.List[string]]::new()
$lastAssistant = ""
$toolsUsed     = [System.Collections.Generic.List[string]]::new()

if ($transcriptPath -and (Test-Path $transcriptPath)) {
    foreach ($line in (Get-Content $transcriptPath -ErrorAction SilentlyContinue)) {
        $msg = try { $line | ConvertFrom-Json -ErrorAction Stop } catch { continue }

        if ($msg.message.role -eq "user") {
            foreach ($part in $msg.message.content) {
                if ($part.type -eq "text") {
                    $txt = $part.text.Trim()
                    if ($txt.Length -gt 5 -and -not $txt.StartsWith("<") -and
                        -not $txt.StartsWith("#") -and -not $txt.StartsWith("/")) {
                        $userPrompts.Add($txt.Substring(0, [Math]::Min(180, $txt.Length)) -replace "`n", " ")
                    }
                }
            }
        }

        if ($msg.message.role -eq "assistant") {
            foreach ($part in $msg.message.content) {
                if ($part.type -eq "tool_use" -and $part.name) { $toolsUsed.Add($part.name) }
                if ($part.type -eq "text" -and $part.text.Trim().Length -gt 20) {
                    $lastAssistant = $part.text.Trim().Substring(0, [Math]::Min(300, $part.text.Trim().Length)) -replace "`n", " "
                }
            }
        }
    }
}
$toolsUsed = @($toolsUsed | Sort-Object -Unique)

# ── Useful-session filter ────────────────────────────────────────────────────
$workTools     = @("Edit","Write","Bash","PowerShell","NotebookEdit","Agent","Skill",
                   "mcp__obsidian__obsidian_patch_content","mcp__obsidian__obsidian_append_content",
                   "mcp__obsidian__obsidian_create_file","mcp__overleaf__write_file","mcp__overleaf__write_section")
$didRealWork   = ($toolsUsed | Where-Object { $workTools -contains $_ }).Count -gt 0
$hasActivity   = $toolsUsed.Count -ge 2
if (-not $didRealWork -and -not $hasActivity) { exit 0 }

# ── Git status ───────────────────────────────────────────────────────────────
$gitLine = "- **Git:** não é repositório"
try {
    if ((& $GIT_EXE -C $projectCwd rev-parse --is-inside-work-tree 2>$null) -eq "true") {
        $changed = @(& $GIT_EXE -C $projectCwd diff --cached --name-only 2>$null) +
                   @(& $GIT_EXE -C $projectCwd diff --name-only 2>$null) |
                   Where-Object { $_ } | Sort-Object -Unique
        $gitLine = if ($changed.Count -gt 0) { "- **Arquivos:** $($changed -join ', ')" }
                   else { "- **Git:** sem mudanças" }
    }
} catch {}

# ── Build note block ─────────────────────────────────────────────────────────
$marker      = "session:$sessionId"
$resumoLine  = if ($lastAssistant) { "- **Resumo:** $lastAssistant" } else { "" }
$promptLines = ($userPrompts | Select-Object -First 3 | ForEach-Object { "  - $_" }) -join "`n"
$promptBlock = if ($userPrompts.Count -gt 0) { "- **Prompts:**`n$promptLines" } else { "" }
$toolLine    = if ($toolsUsed.Count -gt 0) { "- **Ferramentas:** ``$($toolsUsed -join '`, `')``" } else { "" }

$newBlock = (@("### $timeStr - $projectName [$marker]", "",
    $resumoLine, $promptBlock, $toolLine, $gitLine, "") |
    Where-Object { $_ -ne $null -and $_ -ne "" }) -join "`n"

$frontmatter = "---`ntags:`n  - claude-code`n  - sessao-dev`ncreated: $dateStr`n---`n`n# Sessões Claude - $dateStr`n`n"

# ── Deduplicate: read existing note, replace or append ───────────────────────
function Merge-SessionBlock([string]$content, [string]$id, [string]$block) {
    $esc = [regex]::Escape("[$id]")
    if ($content -match $esc) {
        # Replace block from its heading to the next heading or end-of-string
        return ($content -replace "(?s)### [^\n]+\[$esc\][^\n]*\n.*?(?=\n### |\z)", ($block + "`n"))
    }
    return $content.TrimEnd() + "`n`n" + $block
}

# ── Write to Obsidian (API first, filesystem fallback) ───────────────────────
$existing = ""
$noteExists = $false
try {
    $resp = Invoke-WebRequest -Uri "$API_BASE/vault/$noteVaultPath" `
        -Headers @{ "Authorization" = "Bearer $API_KEY" } `
        -Method GET -SkipCertificateCheck -ErrorAction Stop -TimeoutSec 5
    $existing   = $resp.Content
    $noteExists = $true
} catch {
    if ($_.Exception.Response.StatusCode -ne "NotFound") { $noteExists = $false }
}

if ($noteExists) {
    $merged = Merge-SessionBlock -content $existing -id $marker -block $newBlock
    try {
        Invoke-WebRequest -Uri "$API_BASE/vault/$noteVaultPath" -Headers $headers `
            -Method PUT -Body $merged -SkipCertificateCheck -ErrorAction Stop -TimeoutSec 5 | Out-Null
        exit 0
    } catch {}
} else {
    try {
        Invoke-WebRequest -Uri "$API_BASE/vault/$noteVaultPath" -Headers $headers `
            -Method PUT -Body ($frontmatter + $newBlock) -SkipCertificateCheck -ErrorAction Stop -TimeoutSec 5 | Out-Null
        exit 0
    } catch {}
}

# Filesystem fallback
try {
    $dir = Join-Path $VAULT_PATH "00 - Inbox\Claude Sessions"
    if (-not (Test-Path $dir)) { New-Item -ItemType Directory -Path $dir -Force | Out-Null }
    if (Test-Path $noteFilePath) {
        $existing = Get-Content $noteFilePath -Raw -Encoding UTF8
        $merged   = Merge-SessionBlock -content $existing -id $marker -block $newBlock
        Set-Content -Path $noteFilePath -Value $merged -Encoding UTF8
    } else {
        Set-Content -Path $noteFilePath -Value ($frontmatter + $newBlock) -Encoding UTF8
    }
} catch {}

exit 0
```

**Verification:**
```powershell
# 1. Simulate two Stop events for the same session
$json = '{"session_id":"PLAN-TEST-001","transcript_path":""}'
echo $json | pwsh -NonInteractive -File "C:\Users\Pedro Diniz\Documents\Dev e Scripts\PowerShell\claude-obsidian-hook.ps1"
echo $json | pwsh -NonInteractive -File "C:\Users\Pedro Diniz\Documents\Dev e Scripts\PowerShell\claude-obsidian-hook.ps1"

# 2. Check today's note — should have exactly ONE entry for PLAN-TEST-001
#    (not two)
$note = Get-Content "C:\Users\Pedro Diniz\Documents\Obsidian Vault\00 - Inbox\Claude Sessions\$(Get-Date -Format 'yyyy-MM-dd').md" -Raw
($note | Select-String "PLAN-TEST-001").Count  # Expected: 1
```

**Commit:** `feat(hook): full rewrite — dedup by session, rich summary, useful-session filter`

---

## Execution options

**Option A — Subagent-Driven (recommended)**
Run `/subagent-driven-development` — a fresh subagent handles each task, keeping
the main context clean.

**Option B — Inline**
Run `/executing-plans` to batch the tasks in this session.

---

## Post-implementation smoke test

After shipping Task 5, open a normal Claude Code session, do some work (Edit a
file), then close it. Within 10 seconds the Stop hook fires. Open Obsidian and
confirm `00 - Inbox/Claude Sessions/<today>.md` has:

- Exactly one entry for the session (not two or three)
- A `Resumo` line with the last thing Claude said
- At least one `Prompts` bullet with your actual question
- `Ferramentas` listing the tools used
- Git status reflecting what changed
