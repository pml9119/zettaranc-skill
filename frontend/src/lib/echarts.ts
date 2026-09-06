import * as echarts from 'echarts/core';
import {
  BarChart,
  CandlestickChart,
  LineChart,
  RadarChart,
  ScatterChart,
} from 'echarts/charts';
import {
  AxisPointerComponent,
  DataZoomComponent,
  GraphicComponent,
  GridComponent,
  LegendComponent,
  MarkAreaComponent,
  MarkPointComponent,
  RadarComponent,
  TooltipComponent,
} from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';

echarts.use([
  BarChart,
  CandlestickChart,
  LineChart,
  RadarChart,
  ScatterChart,
  AxisPointerComponent,
  DataZoomComponent,
  GraphicComponent,
  GridComponent,
  LegendComponent,
  MarkAreaComponent,
  MarkPointComponent,
  RadarComponent,
  TooltipComponent,
  CanvasRenderer,
]);

export default echarts;
