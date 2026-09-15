# Check EVERY backticked string (len>=8) in an A2 theme card against the union of its source transcripts.
# Purpose: find backticked text that is NOT verbatim transcript (paraphrase / reformatted number list / identifier).
param(
  [Parameter(Mandatory = $true)][string]$Card,
  [Parameter(Mandatory = $true)][string]$Session,
  [int]$MinLen = 8
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
function Norm([string]$s) {
  if ($null -eq $s) { return '' }
  return (($s -replace '\s', '') -replace '\[\d{2}:\d{2}:\d{2}\]', '')
}
$pool = ''
foreach ($tp in $map[$Session]) {
  if (-not (Test-Path -LiteralPath $tp)) { throw "missing $tp" }
  $pool += (Norm ([System.IO.File]::ReadAllText($tp, [System.Text.Encoding]::UTF8)))
}
$f = Join-Path $base $Card
$lines = Get-Content -LiteralPath $f -Encoding UTF8
$tick = [char]0x60
$re = [regex]('(' + $tick + ')([^' + $tick + ']+)(' + $tick + ')')
$n = 0; $ok = 0; $bad = @()
for ($i = 0; $i -lt $lines.Count; $i++) {
  foreach ($m in $re.Matches($lines[$i])) {
    $q = Norm $m.Groups[2].Value
    if ($q.Length -lt $MinLen) { continue }
    $n++
    if ($pool.Contains($q)) { $ok++; continue }
    $bad += ("{0,5} | {1}" -f ($i + 1), $m.Groups[2].Value)
  }
}
Write-Output ("CARD={0}  backticked>=${MinLen}chars={1}  verbatim={2}  NOT-verbatim={3}" -f $Card, $n, $ok, $bad.Count)
$bad | ForEach-Object { Write-Output ("   " + $_) }
