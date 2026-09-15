$ErrorActionPreference = 'Stop'
$base = 'D:\Users\pml\Desktop\ZK\zettaranc-skill\.scratch\wayfinder-vibe-distill\artifacts\distill'
$card = (Get-Content -LiteralPath (Join-Path $base '_a2_work\_card_path.txt') -Encoding UTF8 | Select-Object -First 1).Trim()
if (-not (Test-Path -LiteralPath $card)) { throw ('card not found: ' + $card) }
$src = @(
  (Join-Path $base '_a2_work\S01-20251004-r1.md'),
  (Join-Path $base '_a2_work\S02-20251004-r2.md'),
  (Join-Path $base '_a2_work\S03-20251004-r3.md'),
  (Join-Path $base '_a2_work\S04-20251004-r4.md')
)
$corpus = ($src | ForEach-Object { Get-Content -LiteralPath $_ -Raw -Encoding UTF8 }) -join "`n"
$corpusN = $corpus -replace '\s', ''

$lines = Get-Content -LiteralPath $card -Encoding UTF8
$ok = 0
$fail = New-Object System.Collections.ArrayList
$tick = [char]0x60
$pattern = $tick + '([^' + $tick + ']+)' + $tick
foreach ($ln in $lines) {
  foreach ($m in [regex]::Matches($ln, $pattern)) {
    $q = $m.Groups[1].Value
    $qN = $q -replace '\s', ''
    if ($qN.Length -lt 12) { continue }
    if ($qN.Length -gt 200) { continue }
    if ($corpusN.Contains($qN)) { $ok++ } else { [void]$fail.Add($q) }
  }
}
Write-Output ("CARD  = " + $card)
Write-Output ("LINES = " + $lines.Count)
Write-Output ("CORPUS_CHARS = " + $corpusN.Length)
$total = 0
foreach ($ln in $lines) { $total += [regex]::Matches($ln, $pattern).Count }
Write-Output ("TICKETS = " + $total)
Write-Output ("HIT   = " + $ok)
Write-Output ("MISS  = " + $fail.Count)
foreach ($f in $fail) { Write-Output ("  [MISS] " + $f) }
