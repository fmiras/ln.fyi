"use client";

import { useEffect, useState } from "react";

/**
 * Animated display numeral — counts from ~90% up to target on mount.
 */
export function HeroNumber({
  value,
  duration = 1400,
  fractionDigits = 0,
}: {
  value: number;
  duration?: number;
  fractionDigits?: number;
}) {
  const [displayed, setDisplayed] = useState(value * 0.9);

  useEffect(() => {
    const start = performance.now();
    const from = value * 0.9;
    const diff = value - from;
    let raf = 0;
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / duration);
      const eased = 1 - Math.pow(1 - p, 4);
      setDisplayed(from + diff * eased);
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, duration]);

  return (
    <span className="tabular">
      {displayed.toLocaleString("en-US", {
        maximumFractionDigits: fractionDigits,
        minimumFractionDigits: fractionDigits,
      })}
    </span>
  );
}
