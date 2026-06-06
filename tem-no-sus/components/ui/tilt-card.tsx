"use client";

import {
  motion,
  useMotionValue,
  useSpring,
  useTransform,
  useReducedMotion,
} from "motion/react";
import { useRef, type ReactNode } from "react";

interface TiltCardProps {
  children: ReactNode;
  className?: string;
  maxTilt?: number;
  /** Inclinação de repouso (graus). O mouse inclina a partir daqui. */
  baseRotateX?: number;
  baseRotateY?: number;
}

export function TiltCard({
  children,
  className = "",
  maxTilt = 9,
  baseRotateX = 0,
  baseRotateY = 0,
}: TiltCardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();

  const mx = useMotionValue(0);
  const my = useMotionValue(0);

  const rotX = useSpring(
    useTransform(my, [-0.5, 0.5], [baseRotateX + maxTilt, baseRotateX - maxTilt]),
    { stiffness: 220, damping: 18 },
  );
  const rotY = useSpring(
    useTransform(mx, [-0.5, 0.5], [baseRotateY - maxTilt, baseRotateY + maxTilt]),
    { stiffness: 220, damping: 18 },
  );

  if (reduce) {
    // sem reação ao mouse, mas mantém a inclinação de repouso
    return (
      <div
        className={className}
        style={{
          transform: `rotateX(${baseRotateX}deg) rotateY(${baseRotateY}deg)`,
          transformStyle: "preserve-3d",
        }}
      >
        {children}
      </div>
    );
  }

  const onMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    mx.set((e.clientX - rect.left) / rect.width - 0.5);
    my.set((e.clientY - rect.top) / rect.height - 0.5);
  };

  const onMouseLeave = () => {
    mx.set(0);
    my.set(0);
  };

  return (
    <motion.div
      ref={ref}
      className={className}
      style={{ rotateX: rotX, rotateY: rotY, transformStyle: "preserve-3d" }}
      onMouseMove={onMouseMove}
      onMouseLeave={onMouseLeave}
    >
      {children}
    </motion.div>
  );
}
