# Audit EVERY timestamp in an A2 theme card, attributing each to the nearest preceding `回放N` context.
# Catches both `回放2 00:30:48` and bare `、00:30:48` forms.
param(
  [Parameter(Mandatory = $true)][string]$Card,
  [Parameter(Mandatory = $true)][string]$Session
)
$ErrorActionPreference = 'Stop'
$base = 'D:\Users\pml\Desktop\ZK\zettaranc-skill\.scratch\wayfinder-vibe-distill\artifacts\distill'
$root = 'E:\Z哥逐字稿'
$map = @{
  '1004' = @(
    "$root\20251004双线战法的核心逻辑（10.4晚八开）\直播回放_2025-10-04_20-00-33_summary\transcript.txt",
    "$root\20251004双线战法的核心逻辑（10.4晚八开）\直播回放_2025-10-04_22-00-37_summary\transcript.txt",
    "$root\20251004双线战法的核心逻辑（10.4晚八开）\直播回放_2025-10-05_00-00-41_summary\transcript.txt",
    "$root\20251004双线战法的核心逻辑（10.4晚八开）\直播回放_2025-10-05_02-00-45_summary\transcript.txt"
  )
  '1126' = @(
    "$root\20251126Z家军之每日5步极简工作流精讲（三晚8）\zettaranc充电直播回放1_summary\transcript.txt",
    "$root\20251126Z家军之每日5步极简工作流精讲（三晚8）\zettaranc充电直播回放2_summary\transcript.txt",
    "$root\20251126Z家军之每日5步极简工作流精讲（三晚8）\zettaranc充电直播回放3_summary\transcript.txt"
  )
  '1112' = @(
    "$root\20251112仓位管理如何大幅提升赚钱效率（周三晚8）\直播回放_2025-11-12_20-01-23_summary\transcript.txt",
    "$root\20251112仓位管理如何大幅提升赚钱效率（周三晚8）\直播回放_2025-11-12_22-01-27_summary\transcript.txt",
    "$root\20251112仓位管理如何大幅提升赚钱效率（周三晚8）\直播回放_2025-11-13_00-01-31_summary\transcript.txt"
  )
  '0316' = @(
    "$root\20260316 先破坏，再建设。（周日晚八）\zettaranc b站充电直播回放1_summary\transcript.txt",
    "$root\20260316 先破坏，再建设。（周日晚八）\zettaranc b站充电直播回放2_summary\transcript.txt"
  )
}
$tsSets = @{}
foreach ($k in $map.Keys) {
  for ($i = 0; $i -lt $map[$k].Count; $i++) {
    $set = New-Object 'System.Collections.Generic.HashSet[string]'
    foreach ($r in (Get-Content -LiteralPath $map[$k][$i] -Encoding UTF8)) {
      $m = [regex]::Match($r, '^\[(\d{2}:\d{2}:\d{2})\]')
      if ($m.Success) { [void]$set.Add($m.Groups[1].Value) }
    }
    $tsSets["$k-$($i+1)"] = $set
  }
}
$segRe = [regex]'回放(?<seg>\d+)'
$tsRe = [regex]'(?<!\d:)\b(?<ts>\d{2}:\d{2}:\d{2})\b'
$f = Join-Path $base $Card
$lines = Get-Content -LiteralPath $f -Encoding UTF8
$n = 0; $ok = 0; $bad = @(); $unattributed = 0
for ($i = 0; $i -lt $lines.Count; $i++) {
  $line = $lines[$i]
  $segs = $segRe.Matches($line)
  if ($segs.Count -eq 0) { continue }
  # walk timestamps; each belongs to the last 回放N seen before it
  foreach ($tm in $tsRe.Matches($line)) {
    $pos = $tm.Index
    $cur = -1
    foreach ($s in $segs) { if ($s.Index -lt $pos) { $cur = [int]$s.Groups['seg'].Value } }
    if ($cur -lt 0) { $unattributed++; continue }
    $ts = $tm.Groups['ts'].Value
    # skip timestamps that are part of a session-date-ish or file path (rare); all ours are HH:MM:SS
    $n++
    $key = "$Session-$cur"
    if ($tsSets.ContainsKey($key) -and $tsSets[$key].Contains($ts)) { $ok++ }
    else { $bad += ("{0,5} | 回放{1} {2}  <-- absent" -f ($i + 1), $cur, $ts) }
  }
}
Write-Output ("CARD={0} ({1})  attributed-ts={2}  valid={3}  INVALID={4}  unattributed={5}" -f $Card, $Session, $n, $ok, $bad.Count, $unattributed)
$bad | ForEach-Object { Write-Output ("   " + $_) }
