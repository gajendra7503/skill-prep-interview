"use client";

import { useEffect, useRef } from "react";

const COLOURS = ["#7e22ce", "#9333ea", "#c026d3", "#e879f9", "#eab308", "#facc15", "#fde047"];

type Piece = { x: number; y: number; vx: number; vy: number; size: number; rot: number; vr: number; colour: string; shape: 0 | 1 };

/**
 * A short confetti burst drawn on a full-screen canvas (no library). Fires once on mount; pass `onceKey` to fire
 * only the first time for that key in this browser (e.g. once per certificate). Skipped when motion is reduced.
 */
export function Confetti({ onceKey, pieces = 160 }: { onceKey?: string; pieces?: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (onceKey) {
      try {
        const key = `skillprep-confetti:${onceKey}`;
        if (window.localStorage.getItem(key)) return;
        window.localStorage.setItem(key, "1");
      } catch {
        // Storage unavailable (private mode): just celebrate.
      }
    }
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const resize = () => {
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize);

    const w = window.innerWidth;
    const h = window.innerHeight;
    // Two cannons, bottom-left and bottom-right, firing up and inwards.
    const bits: Piece[] = Array.from({ length: pieces }, (_, i) => {
      const left = i % 2 === 0;
      const angle = (left ? -60 : -120) * (Math.PI / 180) + (Math.random() - 0.5) * 0.7;
      const speed = 9 + Math.random() * 9;
      return {
        x: left ? w * 0.08 : w * 0.92,
        y: h * 0.95,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 6 + Math.random() * 6,
        rot: Math.random() * Math.PI,
        vr: (Math.random() - 0.5) * 0.3,
        colour: COLOURS[i % COLOURS.length],
        shape: Math.random() < 0.6 ? 0 : 1,
      };
    });

    let frame = 0;
    const started = performance.now();
    const draw = (now: number) => {
      const elapsed = now - started;
      ctx.clearRect(0, 0, w, h);
      ctx.globalAlpha = Math.max(0, 1 - Math.max(0, elapsed - 2200) / 1000);
      for (const p of bits) {
        p.vy += 0.28;
        p.vx *= 0.99;
        p.x += p.vx;
        p.y += p.vy;
        p.rot += p.vr;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.fillStyle = p.colour;
        if (p.shape === 0) ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
        else {
          ctx.beginPath();
          ctx.arc(0, 0, p.size / 3, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      }
      if (elapsed < 3300) frame = requestAnimationFrame(draw);
      else ctx.clearRect(0, 0, w, h);
    };
    frame = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", resize);
    };
  }, [onceKey, pieces]);

  return <canvas ref={canvasRef} aria-hidden="true" className="pointer-events-none fixed inset-0 z-[60] h-full w-full print:hidden" />;
}
