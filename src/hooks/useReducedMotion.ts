import { useEffect, useState } from 'react';
import { AccessibilityInfo } from 'react-native';

/** 跟随系统「减少动态效果」，开启时调用方应把动画时长降为 0。 */
export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    let active = true;

    // 部分测试环境只提供同步桩，Promise.resolve 保证两种返回值都能安全处理。
    void Promise.resolve(AccessibilityInfo.isReduceMotionEnabled())
      .then((value) => {
        if (active) setReduced(value === true);
      })
      .catch(() => {});

    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', (value) => {
      if (active) setReduced(value);
    });

    return () => {
      active = false;
      subscription?.remove();
    };
  }, []);

  return reduced;
}
