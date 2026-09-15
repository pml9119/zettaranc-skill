# STRICT verification of A2 v2 theme cards.
# For every quote that carries a `回放N HH:MM:SS` label, check THREE things:
#   (1) EXISTS  : the quote (whitespace-stripped) is a substring of transcript N  <-- right segment
#   (2) LOCATED : the quote's occurrence in transcript N starts within +/- 2 lines of the line
#                 whose row timestamp equals the stated HH:MM:SS
#   (3) LEN     : quote length <= 150 chars
# Usage: pwsh -File verify-A2-strict.ps1
$ErrorActionPreference = 'Stop'
$base = 'D:\Users\pml\Desktop\ZK\zettaranc-skill\.scratch\wayfinder-vibe-distill\artifacts\distill'
$root = 'E:\Z哥逐字稿'

$themes = [ordered]@{
  'A2-双线战法.md' = @(
    "$root\20251004双线战法的核心逻辑（10.4晚八开）\直播回放_2025-10-04_20-00-33_summary\transcript.txt",
    "$root\20251004双线战法的核心逻辑（10.4晚八开）\直播回放_2025-10-04_22-00-37_summary\transcript.txt",
    "$root\20251004双线战法的核心逻辑（10.4晚八开）\直播回放_2025-10-05_00-00-41_summary\transcript.txt",
    "$root\20251004双线战法的核心逻辑（10.4晚八开）\直播回放_2025-10-05_02-00-45_summary\transcript.txt"
  )
  'A2-每日5步工作流.md' = @(
    "$root\20251126Z家军之每日5步极简工作流精讲（三晚8）\zettaranc充电直播回放1_summary\transcript.txt",
    "$root\20251126Z家军之每日5步极简工作流精讲（三晚8）\zettaranc充电直播回放2_summary\transcript.txt",
    "$root\20251126Z家军之每日5步极简工作流精讲（三晚8）\zettaranc充电直播回放3_summary\transcript.txt"
  )
  'A2-仓位管理.md' = @(
    "$root\20251112仓位管理如何大幅提升赚钱效率（周三晚8）\直播回放_2025-11-12_20-01-23_summary\transcript.txt",
    "$root\20251112仓位管理如何大幅提升赚钱效率（周三晚8）\直播回放_2025-11-12_22-01-27_summary\transcript.txt",
    "$root\20251112仓位管理如何大幅提升赚钱效率（周三晚8）\直播回放_2025-11-13_00-01-31_summary\transcript.txt"
  )
  'A2-先破坏再建设.md' = @(
    "$root\20260316 先破坏，再建设。（周日晚八）\zettaranc b站充电直播回放1_summary\transcript.txt",
    "$root\20260316 先破坏，再建设。（周日晚八）\zettaranc b站充电直播回放2_summary\transcript.txt"
  )
}

function Normalize([string]$s) {
  if ($null -eq $s) { return '' }
  $s = $s -replace '\s', ''
  $s = $s.Trim([char]0x0060, [char]0x3002, [char]0x2026, [char]0x002E, [char]0x3001, [char]0xFF1B, [char]0x003B)
  return $s
}

# ---- load transcripts, build normalized text + per-line index ----
$T = @{}
foreach ($k in $themes.Keys) {
  $segs = @()
  foreach ($tp in $themes[$k]) {
    if (-not (Test-Path -LiteralPath $tp)) { throw "transcript missing: $tp" }
    $rows = @(Get-Content -LiteralPath $tp -Encoding UTF8)
    $norm = @(); $ts = @()
    foreach ($r in $rows) {
      $m = [regex]::Match($r, '^\[(\d{2}:\d{2}:\d{2})\]\s*(.*)$')
      if ($m.Success) { $ts += $m.Groups[1].Value; $norm += (Normalize $m.Groups[2].Value) }
      else { $ts += ''; $norm += (Normalize $r) }
    }
    $segs += ,@{ Path = $tp; Norm = ($norm -join ''); RowTs = $ts; RowNorm = $norm }
  }
  $T[$k] = $segs
}

$quoteRe = [regex]('(?<q>' + [char]0x0060 + ')(?<text>[^' + [char]0x0060 + ']+)(?<e>' + [char]0x0060 + ')(?<tail>[^' + [char]0x0060 + ']{0,24}?回放(?<seg>\d+)\s+(?<ts>\d{2}:\d{2}:\d{2}))')

$G = @{ n = 0; exists = 0; located = 0; lenBad = 0; segBad = @(); posBad = @(); tooLong = @(); absent = @() }

foreach ($k in $themes.Keys) {
  $file = Join-Path $base $k
  $lines = Get-Content -LiteralPath $file -Encoding UTF8
  $n = 0; $okEx = 0; $okLoc = 0; $badLen = 0
  for ($i = 0; $i -lt $lines.Count; $i++) {
    foreach ($m in $quoteRe.Matches($lines[$i])) {
      $q = Normalize $m.Groups['text'].Value
      if ($q.Length -lt 8) { continue }
      $seg = [int]$m.Groups['seg'].Value - 1
      $stamp = $m.Groups['ts'].Value
      $n++
      if ($q.Length -gt 150) { $badLen++; $G.tooLong += ("{0}:{1} len={2}" -f $k, ($i + 1), $q.Length) }
      if ($seg -lt 0 -or $seg -ge $T[$k].Count) { $G.segBad += ("{0}:{1} seg={2}" -f $k, ($i + 1), ($seg + 1)); continue }
      $S = $T[$k][$seg]
      if (-not $S.Norm.Contains($q)) {
        $G.absent += ("{0}:{1} 回放{2} {3} :: {4}" -f $k, ($i + 1), ($seg + 1), $stamp, $m.Groups['text'].Value)
        continue
      }
      $okEx++
      # locate: find row index whose timestamp == stamp
      $rowIdx = -1
      for ($j = 0; $j -lt $S.RowTs.Count; $j++) { if ($S.RowTs[$j] -eq $stamp) { $rowIdx = $j; break } }
      if ($rowIdx -lt 0) { $G.posBad += ("{0}:{1} 回放{2} {3} :: STAMP-NOT-FOUND" -f $k, ($i + 1), ($seg + 1), $stamp); continue }
      # build char offset of each row start
      $off = 0; $starts = @()
      for ($j = 0; $j -lt $S.RowNorm.Count; $j++) { $starts += $off; $off += $S.RowNorm[$j].Length }
      $idx = $S.Norm.IndexOf($q)
      $rowOfQuote = 0
      for ($j = $S.RowNorm.Count - 1; $j -ge 0; $j--) { if ($starts[$j] -le $idx) { $rowOfQuote = $j; break } }
      if ([Math]::Abs($rowOfQuote - $rowIdx) -le 2) { $okLoc++ }
      else { $G.posBad += ("{0}:{1} 回放{2} label={3} actual-row={4} delta={5} :: {6}" -f $k, ($i + 1), ($seg + 1), $stamp, $S.RowTs[$rowOfQuote], ($rowOfQuote - $rowIdx), $m.Groups['text'].Value.Substring(0, [Math]::Min(40, $m.Groups['text'].Value.Length))) }
    }
  }
  $G.n += $n; $G.exists += $okEx; $G.located += $okLoc; $G.lenBad += $badLen
  Write-Output ("== {0}" -f $k)
  Write-Output ("   labelled-quotes={0}  exists-in-labelled-segment={1}  position-within-2-lines={2}  over-150={3}" -f $n, $okEx, $okLoc, $badLen)
}

Write-Output ''
Write-Output ("==== TOTAL labelled-quotes={0} exists={1} located={2} over-150={3}" -f $G.n, $G.exists, $G.located, $G.lenBad)
Write-Output ("---- ABSENT (quote not in the labelled segment) : {0}" -f $G.absent.Count)
$G.absent | ForEach-Object { Write-Output ("   " + $_) }
Write-Output ("---- POSITION MISMATCH (label timestamp != quote row) : {0}" -f $G.posBad.Count)
$G.posBad | ForEach-Object { Write-Output ("   " + $_) }
Write-Output ("---- SEGMENT OUT OF RANGE : {0}" -f $G.segBad.Count)
$G.segBad | ForEach-Object { Write-Output ("   " + $_) }
Write-Output ("---- QUOTES OVER 150 CHARS : {0}" -f $G.tooLong.Count)
$G.tooLong | ForEach-Object { Write-Output ("   " + $_) }
