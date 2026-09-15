# A1 v2 assembly (ASCII-only code; all Chinese lives in the UTF-8 data files)
$ErrorActionPreference = "Stop"
$base = "D:\Users\pml\Desktop\ZK\zettaranc-skill\.scratch\wayfinder-vibe-distill\artifacts\distill"
$sec  = Join-Path $base "_a1_sections"
$enc  = New-Object System.Text.UTF8Encoding($false)

function Convert-Section([string]$path) {
  $out = New-Object System.Collections.Generic.List[string]
  foreach ($l in (Get-Content $path -Encoding UTF8)) {
    if ($l -match '^(#{1,5})(\s+.*)$') { $out.Add('#' + $l) } else { $out.Add($l) }
  }
  return $out
}

foreach ($row in (Get-Content (Join-Path $sec "_assemble-map.tsv") -Encoding UTF8)) {
  if ([string]::IsNullOrWhiteSpace($row)) { continue }
  $f = $row -split "`t"
  if ($f.Count -lt 3) { continue }
  $headerFile = Join-Path $sec $f[0]
  $outFile    = Join-Path $base $f[1]
  $sectionFiles = $f[2] -split ","
  $buf = New-Object System.Collections.Generic.List[string]
  foreach ($h in (Get-Content $headerFile -Encoding UTF8)) { $buf.Add($h) }
  foreach ($sf in $sectionFiles) {
    $p = Join-Path $sec $sf
    if (-not (Test-Path $p)) { Write-Output ("MISSING: " + $sf); continue }
    $buf.Add(""); $buf.Add("---"); $buf.Add("")
    foreach ($l in (Convert-Section $p)) { $buf.Add($l) }
  }
  [System.IO.File]::WriteAllLines($outFile, $buf, $enc)
  Write-Output ("WROTE " + $f[1] + " : " + $buf.Count + " lines")
}
