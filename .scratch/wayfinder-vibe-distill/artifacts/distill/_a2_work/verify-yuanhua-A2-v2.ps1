$ErrorActionPreference = 'Stop'
$base = 'D:\Users\pml\Desktop\ZK\zettaranc-skill\.scratch\wayfinder-vibe-distill\artifacts\distill'
$card = (Get-Content -LiteralPath (Join-Path $base '_a2_work\_card_path.txt') -Encoding UTF8 | Select-Object -First 1).Trim()
$src = @(
  (Join-Path $base '_a2_work\S01-20251004-r1.md'),
  (Join-Path $base '_a2_work\S02-20251004-r2.md'),
  (Join-Path $base '_a2_work\S03-20251004-r3.md'),
  (Join-Path $base '_a2_work\S04-20251004-r4.md')
)
$corpus = ($src | ForEach-Object { Get-Content -LiteralPath $_ -Raw -Encoding UTF8 }) -join "`n"
$corpusN = $corpus -replace '\s', ''

$tick = [char]0x60
$pattern = $tick + '([^' + $tick + ']+)' + $tick
$tag = [string][char]0x539F + [string][char]0x8BDD   # "yuan hua"
$lines = Get-Content -LiteralPath $card -Encoding UTF8
$ok = 0
$fail = New-Object System.Collections.ArrayList
$n = 0
foreach ($ln in $lines) {
  if ($ln.IndexOf($tag) -lt 0) { continue }
  $n++
  $m = [regex]::Match($ln, $pattern)
  if (-not $m.Success) { [void]$fail.Add('(no backtick) ' + $ln); continue }
  $q = $m.Groups[1].Value
  $qN = $q -replace '\s', ''
  if ($corpusN.Contains($qN)) { $ok++ } else { [void]$fail.Add($q) }
}
Write-Output ('YUANHUA_LINES = ' + $n)
Write-Output ('EXACT_HIT      = ' + $ok)
Write-Output ('FAIL           = ' + $fail.Count)
foreach ($f in $fail) { Write-Output ('  [FAIL] ' + $f) }
