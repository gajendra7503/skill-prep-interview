"use client";

import { useEffect, useRef, useState } from "react";

const DURATION_MS = 1200;

/**
 * Counts up from 0 to `value` once it scrolls into view. Non-numeric values (e.g. "100%", "—") count up their
 * leading number and keep the rest; values with no number are shown as is. Instant when motion is reduced.
 */
export function CountUp({ value, className = "" }: { value: string | number; className?: string }) {
  const text = String(value);
  const match = text.match(/^(\d+)(.*)$/);
  const target = match ? Number(match[1]) : 0;
  const suffix = match ? match[2] : "";
  const ref = useRef<HTMLSpanElement>(null);
  const [shown, setShown] = useState<number | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || !match) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let frame = 0;
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      observer.disconnect();
      const start = performance.now();
      const tick = (now: number) => {
        const t = Math.min(1, (now - start) / DURATION_MS);
        const eased = 1 - Math.pow(1 - t, 3);
        setShown(Math.round(target * eased));
        if (t < 1) frame = requestAnimationFrame(tick);
      };
      setShown(0);
      frame = requestAnimationFrame(tick);
    });
    observer.observe(el);
    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- runs once per value
  }, [text]);

  return (
    <span ref={ref} className={`tabular-nums ${className}`}>
      {!match || shown === null ? text : `${shown.toLocaleString("en-IN")}${suffix}`}
    </span>
  );
}
