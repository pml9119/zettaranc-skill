import { useEffect, useState } from 'react';

/**
 * 响应式窗口宽度（resize 监听）。
 * 用于 K 线图高度等需要像素值且随窗口变化的布局计算。
 */
export function useWindowWidth(): number {
  const [width, setWidth] = useState<number>(() =>
    typeof window !== 'undefined' ? window.innerWidth : 0
  );

  useEffect(() => {
    const onResize = () => setWidth(window.innerWidth);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  return width;
}
