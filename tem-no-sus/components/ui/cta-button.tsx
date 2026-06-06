"use client";

import {
  motion,
  useMotionValue,
  useSpring,
  useReducedMotion,
} from "motion/react";
import { useRef } from "react";

type CtaButtonProps = {
  href: string;
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
};

export function CtaButton({ href, children, className = "", onClick }: CtaButtonProps) {
  const ref = useRef<HTMLAnchorElement>(null);
  const reduce = useReducedMotion();

  const rawX = useMotionValue(0);
  const rawY = useMotionValue(0);
  const x = useSpring(rawX, { stiffness: 260, damping: 22 });
  const y = useSpring(rawY, { stiffness: 260, damping: 22 });

  const handleMouseMove = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (reduce) return;
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    rawX.set((e.clientX - cx) * 0.28);
    rawY.set((e.clientY - cy) * 0.28);
  };

  const handleMouseLeave = () => {
    rawX.set(0);
    rawY.set(0);
  };

  return (
    <motion.a
      ref={ref}
      href={href}
      onClick={onClick}
      className={`cta-shiny inline-flex items-center justify-center rounded-full font-semibold shadow-lift ${className}`}
      style={reduce ? undefined : { x, y }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      whileTap={{ scale: 0.97 }}
    >
      <span className="inline-flex items-center gap-2">{children}</span>
    </motion.a>
  );
}
