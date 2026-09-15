# A2 quote verification: check every verbatim quote is a substring of the source transcript.
# ASCII-only messages on purpose (Windows PowerShell 5.1 reads .ps1 as ANSI without BOM).
$work = "D:\Users\pml\Desktop\ZK\zettaranc-skill\.scratch\wayfinder-vibe-distill\artifacts\distill\_a2_work"

$map = [ordered]@{
  "S01-20251004-r1.md" = "E:\Z哥逐字稿\20251004双线战法的核心逻辑（10.4晚八开）\直播回放_2025-10-04_20-00-33_summary\transcript.txt"
  "S02-20251004-r2.md" = "E:\Z哥逐字稿\20251004双线战法的核心逻辑（10.4晚八开）\直播回放_2025-10-04_22-00-37_summary\transcript.txt"
  "S03-20251004-r3.md" = "E:\Z哥逐字稿\20251004双线战法的核心逻辑（10.4晚八开）\直播回放_2025-10-05_00-00-41_summary\transcript.txt"
  "S04-20251004-r4.md" = "E:\Z哥逐字稿\20251004双线战法的核心逻辑（10.4晚八开）\直播回放_2025-10-05_02-00-45_summary\transcript.txt"
  "S05-20251126-r1.md" = "E:\Z哥逐字稿\20251126Z家军之每日5步极简工作流精讲（三晚8）\zettaranc充电直播回放1_summary\transcript.txt"
  "S06-20251126-r2.md" = "E:\Z哥逐字稿\20251126Z家军之每日5步极简工作流精讲（三晚8）\zettaranc充电直播回放2_summary\transcript.txt"
  "S07-20251126-r3.md" = "E:\Z哥逐字稿\20251126Z家军之每日5步极简工作流精讲（三晚8）\zettaranc充电直播回放3_summary\transcript.txt"
  "S08-20251112-r1.md" = "E:\Z哥逐字稿\20251112仓位管理如何大幅提升赚钱效率（周三晚8）\直播回放_2025-11-12_20-01-23_summary\transcript.txt"
  "S09-20251112-r2.md" = "E:\Z哥逐字稿\20251112仓位管理如何大幅提升赚钱效率（周三晚8）\直播回放_2025-11-12_22-01-27_summary\transcript.txt"
  "S10-20251112-r3.md" = "E:\Z哥逐字稿\20251112仓位管理如何大幅提升赚钱效率（周三晚8）\直播回放_2025-11-13_00-01-31_summary\transcript.txt"
  "S11-20260316-r1.md" = "E:\Z哥逐字稿\20260316 先破坏，再建设。（周日晚八）\zettaranc b站充电直播回放1_summary\transcript.txt"
  "S12-20260316-r2.md" = "E:\Z哥逐字稿\20260316 先破坏，再建设。（周日晚八）\zettaranc b站充电直播回放2_summary\transcript.txt"
}

$tsRegex = '\[\d{2}:\d{2}:\d{2}\]'
$trimChars = @([char]0x2026, [char]0x002E, [char]0x3002)

$grand = 0; $grandFull = 0; $grandPrefix = 0; $grandFail = 0
foreach ($k in $map.Keys) {
  $wf = Join-Path $work $k
  if (-not (Test-Path $wf)) { Write-Output ("== {0} : FILE-MISSING (skip)" -f $k); continue }
  $tp = $map[$k]
  if (-not (Test-Path $tp)) { Write-Output ("== {0} : TRANSCRIPT-MISSING" -f $k); continue }
  $ttn = ((Get-Content $tp -Raw -Encoding UTF8) -replace '\s', '')
  $ttn = $ttn -replace $tsRegex, ''
  $lines = Get-Content $wf -Encoding UTF8
  $n = 0; $full = 0; $prefix = 0; $fail = 0
  $failList = @()
  foreach ($ln in $lines) {
    if ($ln -match '原文逐字\*\*：\s*`(.+?)`') {
      $q = $Matches[1]
      $qn = ($q -replace '\s', '') -replace $tsRegex, ''
      $qn = $qn.Trim($trimChars)
      if ($qn.Length -lt 4) { continue }
      $n++
      if ($ttn.Contains($qn)) { $full++ }
      else {
        $pre = $qn.Substring(0, [Math]::Min(12, $qn.Length))
        if ($ttn.Contains($pre)) { $prefix++ }
        else { $fail++; $failList += $q }
      }
    }
  }
  $grand += $n; $grandFull += $full; $grandPrefix += $prefix; $grandFail += $fail
  Write-Output ("== {0} : quotes={1} exact={2} prefix-only={3} miss={4}" -f $k, $n, $full, $prefix, $fail)
  if ($failList.Count -gt 0) {
    Write-Output "   -- MISSING quotes:"
    $i = 0
    foreach ($f in $failList) {
      $i++
      if ($i -le 15) {
        $s = $f
        if ($s.Length -gt 90) { $s = $s.Substring(0, 90) }
        Write-Output ("      [{0}] {1}" -f $i, $s)
      }
    }
  }
}
Write-Output ""
$rate = 0
if ($grand -gt 0) { $rate = [Math]::Round(100.0 * $grandFull / $grand, 1) }
Write-Output ("==== TOTAL quotes={0} exact={1} prefix-only={2} miss={3} exact-rate={4}%" -f $grand, $grandFull, $grandPrefix, $grandFail, $rate)
