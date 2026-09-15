$ErrorActionPreference = 'Stop'
$inv = 'D:\Users\pml\Desktop\ZK\zettaranc-skill\.scratch\wayfinder-vibe-distill\artifacts\inventory.json'
$j = Get-Content $inv -Raw -Encoding UTF8 | ConvertFrom-Json
$real = @($j | Where-Object { $_.tsize -gt 0 })
$keyMap = @{
  '选股战法' = @('B1','B2','B3','买点','选股','对称','双线','完美图形','战法','强势K','底部暴力','难看图形','图形','擒大牛','B一','B二','买入','标的','斜率','黄线','白线','N型','砖','突破')
  '卖出纪律' = @('卖出','卖点','逃顶','出货','止损','止盈','卖飞','S1','S2','S3','摸顶','防卖飞','离场','减仓','抛','出货方式','持仓应对')
  '砖型图' = @('砖型图','砖型','砖形','砖图','四块红砖','数砖')
  '筹码理论' = @('筹码','洗盘','换手','筹码结构','筹码交换','双峰','筹码集中','筹码沉淀','锁仓','吸筹')
  '市场宏观' = @('宏观','大盘','指数','牛熊','行情','周期','地缘','川普','特朗普','中美','美联储','美元','A股','美股','资金','活跃市值','政策','汇率','降息')
  '产业视角' = @('产业','赛道','板块','主线','创新药','半导体','机器人','消费','比亚迪','新能源','AI','白酒','低波红利','资源','军工','能源','主线与支线','产业资本','中国消费')
  '心态心理' = @('心态','心理','心法','魔咒','散户','斗牛士','知行合一','情绪','人性','恐慌','贪婪','纪律性','心智','认知','钝感','人性考验')
  '职业人生' = @('人生','职业','房产','买房','相亲','职业建议','婚恋','城市','全职炒股','生活','职场')
  '人设表达' = @('闲聊','扯淡','茶人','茶','唱歌','扯会儿','聊会儿','喝茶','开场','讲故事','兴趣爱好','玩笑','生日','球','曼联','国安','酒','威士忌')
  '交易体系总论' = @('交易体系','交易系统','工作流','仓位管理','组合','配置','节奏','三大','五大','模块','体系','铁律','框架','五日','五步','知行交易','纪律','手紧手松','仓位')
  '公式指标' = @('MACD','指标','KDJ','BBI','均线','公式','成交量','量价','地量','缩量','放量','DMI','金叉','死叉','主图','副图')
}
$clusters = @('选股战法','卖出纪律','砖型图','筹码理论','市场宏观','产业视角','心态心理','职业人生','人设表达','交易体系总论','公式指标','其他')
$assign = New-Object System.Collections.Generic.List[object]
foreach ($seg in $real) {
  $txt = $seg.note40
  $best = '其他'; $bestScore = 0
  foreach ($c in $clusters) {
    $score = 0
    if ($keyMap.ContainsKey($c)) {
      foreach ($kw in $keyMap[$c]) {
        if ($txt -match [regex]::Escape($kw)) { $score++ }
      }
    }
    if ($score -gt $bestScore) { $bestScore = $score; $best = $c }
  }
  $assign.Add([PSCustomObject]@{ session=$seg.session; seg=$seg.seg; tsize=$seg.tsize; cluster=$best; score=$bestScore })
}
$assign | ConvertTo-Json -Depth 2 | Out-File -Path 'D:\Users\pml\Desktop\ZK\zettaranc-skill\.scratch\wayfinder-vibe-distill\artifacts\assign.json' -Encoding UTF8
$grouped = $assign | Group-Object cluster | Sort-Object Name
foreach ($g in $grouped) { Write-Output ($g.Name + [char]9 + $g.Count) }

