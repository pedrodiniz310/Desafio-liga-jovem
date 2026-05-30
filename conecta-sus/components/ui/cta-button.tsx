"use client";

import { motion } from "motion/react";

type CtaButtonProps = {
  href: string;
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
};

export function CtaButton({ href, children, className = "", onClick }: CtaButtonProps) {
  return (
    <motion.a
      href={href}
      onClick={onClick}
      className={`cta-shiny inline-flex items-center justify-center rounded-full font-semibold shadow-lift ${className}`}
      whileHover={{ y: -2 }}
      whileTap={{ y: 1, scale: 0.98 }}
      transition={{ type: "spring", stiffness: 400, damping: 20 }}
    >
      <span className="inline-flex items-center gap-2">{children}</span>
    </motion.a>
  );
}
