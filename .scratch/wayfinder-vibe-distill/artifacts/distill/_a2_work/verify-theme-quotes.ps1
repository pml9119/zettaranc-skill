# Verify that quotes in the A2 theme files are verbatim substrings of the source transcripts.
# A theme file spans several segments, so a quote may come from any of them.
$base = "D:\Users\pml\Desktop\ZK\zettaranc-skill\.scratch\wayfinder-vibe-distill\artifacts\distill"
$root = "E:\Z哥逐字稿"

$themes = [ordered]@{
  "A2-双线战法.md" = @(
    "$root\20251004双线战法的核心逻辑（10.4晚八开）\直播回放_2025-10-04_20-00-33_summary\transcript.txt",
    "$root\20251004双线战法的核心逻辑（10.4晚八开）\直播回放_2025-10-04_22-00-37_summary\transcript.txt",
    "$root\20251004双线战法的核心逻辑（10.4晚八开）\直播回放_2025-10-05_00-00-41_summary\transcript.txt",
    "$root\20251004双线战法的核心逻辑（10.4晚八开）\直播回放_2025-10-05_02-00-45_summary\transcript.txt"
  )
  "A2-每日5步工作流.md" = @(
    "$root\20251126Z家军之每日5步极简工作流精讲（三晚8）\zettaranc充电直播回放1_summary\transcript.txt",
    "$root\20251126Z家军之每日5步极简工作流精讲（三晚8）\zettaranc充电直播回放2_summary\transcript.txt",
    "$root\20251126Z家军之每日5步极简工作流精讲（三晚8）\zettaranc充电直播回放3_summary\transcript.txt"
  )
  "A2-仓位管理.md" = @(
    "$root\20251112仓位管理如何大幅提升赚钱效率（周三晚8）\直播回放_2025-11-12_20-01-23_summary\transcript.txt",
    "$root\20251112仓位管理如何大幅提升赚钱效率（周三晚8）\直播回放_2025-11-12_22-01-27_summary\transcript.txt",
    "$root\20251112仓位管理如何大幅提升赚钱效率（周三晚8）\直播回放_2025-11-13_00-01-31_summary\transcript.txt"
  )
  "A2-先破坏再建设.md" = @(
    "$root\20260316 先破坏，再建设。（周日晚八）\zettaranc b站充电直播回放1_summary\transcript.txt",
    "$root\20260316 先破坏，再建设。（周日晚八）\zettaranc b站充电直播回放2_summary\transcript.txt"
  )
}

$tsRegex = '\[\d{2}:\d{2}:\d{2}\]'
$trimChars = @([char]0x2026, [char]0x002E, [char]0x3002, [char]0x0060)
$gN=0; $gOk=0; $gPre=0; $gMiss=0
foreach ($k in $themes.Keys) {
  $f = Join-Path $base $k
  if (-not (Test-Path $f)) { Write-Output ("== {0} : FILE-MISSING" -f $k); continue }
  $pool = @()
  foreach ($tp in $themes[$k]) {
    if (Test-Path $tp) {
      $x = ((Get-Content $tp -Raw -Encoding UTF8) -replace '\s','')
      $pool += ($x -replace $tsRegex,'')
    }
  }
  if ($pool.Count -eq 0) { Write-Output ("== {0} : NO-TRANSCRIPTS" -f $k); continue }
  $lines = Get-Content $f -Encoding UTF8
  $n=0;$ok=0;$pre=0;$miss=0; $missList=@()
  $quoteRegex = '(?:原话|原文逐字)\*\*：\s*`(.+?)`'
  foreach ($ln in $lines) {
    if ($ln -match $quoteRegex) {
      $q = $Matches[1]
      $qn = (($q -replace '\s','') -replace $tsRegex,'').Trim($trimChars)
      if ($qn.Length -lt 4) { continue }
      $n++
      $hit=$false
      foreach ($p in $pool) { if ($p.Contains($qn)) { $hit=$true; break } }
      if ($hit) { $ok++; continue }
      $pr = $qn.Substring(0,[Math]::Min(12,$qn.Length))
      $hit2=$false
      foreach ($p in $pool) { if ($p.Contains($pr)) { $hit2=$true; break } }
      if ($hit2) { $pre++ } else { $miss++; $missList += $q }
    }
  }
  $gN+=$n;$gOk+=$ok;$gPre+=$pre;$gMiss+=$miss
  Write-Output ("== {0} : quotes={1} exact={2} prefix-only={3} miss={4}" -f $k,$n,$ok,$pre,$miss)
  if ($missList.Count -gt 0) {
    Write-Output "   -- MISSING:"
    $i=0
    foreach ($m in $missList) { $i++; if ($i -le 12) { $s=$m; if($s.Length -gt 80){$s=$s.Substring(0,80)}; Write-Output ("      [{0}] {1}" -f $i,$s) } }
  }
}
Write-Output ""
$rate=0; if($gN -gt 0){ $rate=[Math]::Round(100.0*$gOk/$gN,1) }
Write-Output ("==== THEME TOTAL quotes={0} exact={1} prefix-only={2} miss={3} exact-rate={4}%" -f $gN,$gOk,$gPre,$gMiss,$rate)
