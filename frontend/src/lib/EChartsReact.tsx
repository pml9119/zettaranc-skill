import { Component, createRef } from 'react';
import type { CSSProperties, RefObject } from 'react';
import type { EChartsType } from 'echarts/core';
import echarts from './echarts';

/**
 * 轻量 ECharts React 包装组件。
 *
 * 替代 echarts-for-react：
 * 1. echarts-for-react 是 CJS 模块（exports.default 形式），
 *    rolldown/esbuild 的互操作行为不一致，实测会出现
 *    "Element type is invalid ... got: object" 运行时错误；
 * 2. 这里直接使用 src/lib/echarts.ts 的按需注册实例（tree-shaking），
 *    仅保留本项目用到的 init/setOption/resize/dispose 能力。
 */
interface EChartsReactProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- EChartsCoreOption 是巨型 union，项目内 option 均为普通对象字面量
  option: any;
  style?: CSSProperties;
  className?: string;
  notMerge?: boolean;
  /** ECharts 事件绑定（挂载时注册，卸载时自动随 dispose 清理） */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onEvents?: Record<string, (params: any, instance: EChartsType) => void>;
  /** 图表实例就绪回调（右键拖拽等需要直接 dispatchAction 的场景） */
  onInstance?: (instance: EChartsType) => void;
}

export default class EChartsReact extends Component<EChartsReactProps> {
  private containerRef: RefObject<HTMLDivElement | null> = createRef();
  private instance: EChartsType | null = null;
  private resizeObserver: ResizeObserver | null = null;

  componentDidMount() {
    const el = this.containerRef.current;
    if (!el) return;
    this.instance = echarts.init(el);
    this.applyOption();
    this.bindEvents();
    this.props.onInstance?.(this.instance);
    if (typeof ResizeObserver !== 'undefined') {
      this.resizeObserver = new ResizeObserver(() => this.instance?.resize());
      this.resizeObserver.observe(el);
    }
  }

  componentDidUpdate(prevProps: EChartsReactProps) {
    if (this.instance && prevProps.option !== this.props.option) {
      this.applyOption();
    }
    if (this.instance && prevProps.onEvents !== this.props.onEvents) {
      this.bindEvents();
    }
  }

  componentWillUnmount() {
    this.resizeObserver?.disconnect();
    this.resizeObserver = null;
    if (this.instance) {
      this.instance.dispose();
      this.instance = null;
    }
  }

  private applyOption() {
    if (!this.instance) return;
    this.instance.setOption(this.props.option, {
      notMerge: this.props.notMerge ?? false,
    });
  }

  private bindEvents() {
    if (!this.instance) return;
    const { onEvents } = this.props;
    if (!onEvents) return;
    // onEvents 每次渲染都是新对象字面量（含闭包），先解绑旧 handler 再重绑，
    // 避免悬停等高频重渲染时叠加重复绑定
    Object.keys(onEvents).forEach((eventName) => {
      this.instance?.off(eventName);
    });
    Object.entries(onEvents).forEach(([eventName, handler]) => {
      this.instance?.on(eventName, (params) => {
        if (this.instance) handler(params, this.instance);
      });
    });
  }

  render() {
    return (
      <div
        ref={this.containerRef}
        style={{ height: 300, ...this.props.style }}
        className={this.props.className}
      />
    );
  }
}
