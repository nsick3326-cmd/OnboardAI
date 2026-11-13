import { useState, useEffect } from 'react';

/**
 * Smoothly animates a number from 0 to target value on mount/value change.
 */
export function useCountUp(target: number, duration: number = 800): number {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (target === undefined || target === null || isNaN(target)) {
      setCount(0);
      return;
    }

    if (target === 0) {
      setCount(0);
      return;
    }

    let start = 0;
    const startTime = performance.now();

    const updateCounter = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Ease-out cubic curve for natural snappy deceleration
      const easeOut = 1 - Math.pow(1 - progress, 3);
      const current = Math.floor(easeOut * target);

      setCount(current);

      if (progress < 1) {
        requestAnimationFrame(updateCounter);
      } else {
        setCount(target);
      }
    };

    const animFrame = requestAnimationFrame(updateCounter);

    return () => cancelAnimationFrame(animFrame);
  }, [target, duration]);

  return count;
}

