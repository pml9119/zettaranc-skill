# Dump transcript windows around given timestamps for A2 verification.
# Usage: pwsh -File a2win.ps1 -Seg 2 -At 00:25:12 -Span 3   (Seg = 回放N, 1-based)
param(
  [Parameter(Mandatory = $true)][string]$Session,
  [Parameter(Mandatory = $true)][int]$Seg,
  [Parameter(Mandatory = $true)][string[]]$At,
  [int]$Span = 2
)
$ErrorActionPreference = 'Stop'
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
$p = $map[$Session][$Seg - 1]
$rows = @(Get-Content -LiteralPath $p -Encoding UTF8)
$ts = @()
foreach ($r in $rows) {
  $m = [regex]::Match($r, '^\[(\d{2}:\d{2}:\d{2})\]')
  if ($m.Success) { $ts += $m.Groups[1].Value } else { $ts += '' }
}
foreach ($a in $At) {
  $idx = -1
  for ($j = 0; $j -lt $ts.Count; $j++) { if ($ts[$j] -eq $a) { $idx = $j; break } }
  Write-Output ("########## $Session 回放$Seg  @ $a  (rowIdx=$idx)")
  if ($idx -lt 0) { Write-Output '   <timestamp not found>'; continue }
  $lo = [Math]::Max(0, $idx - $Span); $hi = [Math]::Min($rows.Count - 1, $idx + $Span)
  for ($j = $lo; $j -le $hi; $j++) { Write-Output ("{0,6} | {1}" -f $j, $rows[$j]) }
}
