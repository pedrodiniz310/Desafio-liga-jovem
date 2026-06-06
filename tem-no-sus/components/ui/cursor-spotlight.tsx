"use client";

import { useEffect, useRef } from "react";

interface CursorSpotlightProps {
  colorRgb?: string;
  radius?: number;
  opacity?: number;
  className?: string;
}

export function CursorSpotlight({
  colorRgb = "24, 168, 120",
  radius = 560,
  opacity = 0.13,
  className = "",
}: CursorSpotlightProps) {
  const spotRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const spot = spotRef.current;
    if (!spot) return;
    const parent = spot.parentElement;
    if (!parent) return;

    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (mediaQuery.matches) return;

    const onMove = (e: MouseEvent) => {
      const rect = parent.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      spot.style.background = `radial-gradient(${radius}px circle at ${x}px ${y}px, rgba(${colorRgb}, ${opacity}), transparent 60%)`;
    };

    parent.addEventListener("mousemove", onMove);
    return () => parent.removeEventListener("mousemove", onMove);
  }, [colorRgb, radius, opacity]);

  return (
    <div
      ref={spotRef}
      aria-hidden="true"
      className={`pointer-events-none absolute inset-0 z-[2] ${className}`}
    />
  );
}
