# Verify backticked strings in A2-capabilities.md against the union of ALL 12 A2 transcripts.
# Also verifies each `[NNNN] 回放N HH:MM:SS` label lands in the right session+segment.
$ErrorActionPreference = 'Stop'
$base = 'D:\Users\pml\Desktop\ZK\zettaranc-skill\.scratch\wayfinder-vibe-distill\artifacts\distill'
$root = 'E:\Z哥逐字稿'
$map = [ordered]@{
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
  return ($s -replace '\s', '')
}
# per-session normalized pools and per-segment normalized pools
$pool = @{}; $segPool = @{}
foreach ($k in $map.Keys) {
  $all = ''
  for ($i = 0; $i -lt $map[$k].Count; $i++) {
    $n = Norm ([System.IO.File]::ReadAllText($map[$k][$i], [System.Text.Encoding]::UTF8))
    $all += $n
    $segPool["$k-$($i+1)"] = $n
  }
  $pool[$k] = $all
}
$f = Join-Path $base 'A2-capabilities.md'
$lines = Get-Content -LiteralPath $f -Encoding UTF8
$tick = [char]0x60
$re = [regex]('(' + $tick + ')([^' + $tick + ']+)(' + $tick + ')')
$labRe = [regex]('\[(?<sess>\d{4})\]\s*回放(?<seg>\d+)\s+(?<ts>\d{2}:\d{2}:\d{2})')
$n = 0; $ok = 0; $bad = @()
$lab = 0; $labOk = 0; $labBad = @()
for ($i = 0; $i -lt $lines.Count; $i++) {
  foreach ($m in $re.Matches($lines[$i])) {
    $q = Norm $m.Groups[2].Value
    if ($q.Length -lt 8) { continue }
    $n++
    $hit = $false
    foreach ($k in $pool.Keys) { if ($pool[$k].Contains($q)) { $hit = $true; break } }
    if ($hit) { $ok++; continue }
    $bad += ("{0,5} | {1}" -f ($i + 1), $m.Groups[2].Value)
  }
  foreach ($m in $labRe.Matches($lines[$i])) {
    $sess = $m.Groups['sess'].Value; $seg = [int]$m.Groups['seg'].Value; $ts = $m.Groups['ts'].Value
    $lab++
    if (-not $segPool.ContainsKey("$sess-$seg")) { $labBad += ("{0,5} | BAD SEG {1}" -f ($i + 1), $m.Value); continue }
    if ($segPool["$sess-$seg"].Contains("[$ts]")) { $labOk++ }
    else { $labBad += ("{0,5} | TS NOT IN SEG {1}" -f ($i + 1), $m.Value) }
  }
}
Write-Output ("FILE = A2-capabilities.md")
Write-Output ("backticked>=8chars = {0}   verbatim-in-some-A2-transcript = {1}   NOT-verbatim = {2}" -f $n, $ok, $bad.Count)
$bad | ForEach-Object { Write-Output ("   " + $_) }
Write-Output ''
Write-Output ("session-labels = {0}   timestamp-present-in-labelled-segment = {1}   MISMATCH = {2}" -f $lab, $labOk, $labBad.Count)
$labBad | ForEach-Object { Write-Output ("   " + $_) }
