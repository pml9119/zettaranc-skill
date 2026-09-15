$ErrorActionPreference = 'Stop'
$rep = 'D:\Users\pml\Desktop\ZK\zettaranc-skill\.scratch\wayfinder-vibe-distill\artifacts\distill\_a2_work\S05-20251126-r1.md'
$tr  = 'E:\Z哥逐字稿\20251126Z家军之每日5步极简工作流精讲（三晚8）\zettaranc充电直播回放1_summary\transcript.txt'
$out = 'D:\Users\pml\Desktop\ZK\zettaranc-skill\.scratch\wayfinder-vibe-distill\artifacts\distill\_a2_work\_verify_report_S05.txt'
$r = Get-Content -LiteralPath $rep -Raw -Encoding UTF8
$lines = Get-Content -LiteralPath $tr -Encoding UTF8
$t = ($lines -join "`n")
$rx = [regex]'`([^`]+)`'
$ms = $rx.Matches($r)
$res = New-Object System.Collections.Generic.List[string]
$res.Add("quotes_found=$($ms.Count)")
$res.Add("lines=$($lines.Count)")
$i = 0
foreach ($m in $ms) {
  $i++
  $q = $m.Groups[1].Value
  if ($t.Contains($q)) {
    $hit = ''
    for ($k = 0; $k -lt $lines.Count; $k++) {
      if ($lines[$k].Contains($q)) { $hit = ($lines[$k].Substring(0,10)); break }
    }
    $res.Add("OK   $i  line_ts=$hit  len=$($q.Length)")
  } else {
    $res.Add("FAIL $i  len=$($q.Length)  :: $q")
  }
}
Set-Content -LiteralPath $out -Value $res -Encoding UTF8
Get-Content -LiteralPath $out -Encoding UTF8 | Where-Object { $_ -like 'FAIL*' -or $_ -like 'quotes_*' -or $_ -like 'lines=*' }
"done"

