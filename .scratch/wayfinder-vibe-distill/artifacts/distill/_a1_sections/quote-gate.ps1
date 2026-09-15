# A1 v2 段文件质量门（quote gate）
# 检查每个 sNN-*.md：
#   1) 每条「原话：」是否带 `回放N HH:MM:SS` 形态的时间戳
#   2) 引文长度是否 <=150 字
#   3) 是否含 { } 或「未核实」标注（允许）
$ErrorActionPreference = "Stop"
$dir = "D:\Users\pml\Desktop\ZK\zettaranc-skill\.scratch\wayfinder-vibe-distill\artifacts\distill\_a1_sections"

Get-ChildItem $dir -Filter "s*.md" | Sort-Object Name | ForEach-Object {
  $lines = Get-Content $_.FullName -Encoding UTF8
  $q = 0; $noStamp = 0; $tooLong = 0; $maxLen = 0
  foreach ($l in $lines) {
    # 只统计 bullet 形式的引文行（以 - 或 数字. 或 空格+原话 开头）
    if ($l -match '^\s*[-*\d]' -and $l -match '[「『"]') {
      $q++
      if ($l -notmatch '回放\s*\d\s*\d{2}:\d{2}:\d{2}') { $noStamp++ }
      # 取「」内文本长度
      $ms = [regex]::Matches($l, '[「『"]([^」』"]{20,})[」』"]')
      foreach ($m in $ms) {
        $len = $m.Groups[1].Value.Length
        if ($len -gt $maxLen) { $maxLen = $len }
        if ($len -gt 150) { $tooLong++ }
      }
    }
  }
  Write-Output ("{0,-26} 行={1,-5} 引文行={2,-4} 缺时间戳={3,-4} 超150字={4,-4} 最长={5}" -f $_.Name, $lines.Count, $q, $noStamp, $tooLong, $maxLen)
}
