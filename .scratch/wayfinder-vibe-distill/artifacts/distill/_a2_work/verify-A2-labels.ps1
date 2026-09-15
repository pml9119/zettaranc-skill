# Audit EVERY `回放N HH:MM:SS` style label in an A2 theme card.
# A label is valid only if the stated timestamp literally exists as a row timestamp in the stated segment.
# This catches cross-session citation drift (e.g. citing a 0316 quote under 1126 回放2).
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
# Build, for every session, the set of timestamps per segment
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
$f = Join-Path $base $Card
$lines = Get-Content -LiteralPath $f -Encoding UTF8
$re = [regex]('回放(?<seg>\d+)\s+(?<ts>\d{2}:\d{2}:\d{2})')
$n = 0; $ok = 0; $bad = @()
for ($i = 0; $i -lt $lines.Count; $i++) {
  foreach ($m in $re.Matches($lines[$i])) {
    $seg = [int]$m.Groups['seg'].Value; $ts = $m.Groups['ts'].Value
    $n++
    $key = "$Session-$seg"
    if (-not $tsSets.ContainsKey($key)) { $bad += ("{0,5} | NO SUCH SEG: 回放{1} {2}" -f ($i + 1), $seg, $ts); continue }
    if ($tsSets[$key].Contains($ts)) { $ok++ }
    else { $bad += ("{0,5} | 回放{1} {2}  <-- timestamp absent from this segment" -f ($i + 1), $seg, $ts) }
  }
}
Write-Output ("CARD={0} (session {1})   labels={2}  valid={3}  INVALID={4}" -f $Card, $Session, $n, $ok, $bad.Count)
$bad | ForEach-Object { Write-Output ("   " + $_) }
