"use client";

import { motion, useReducedMotion, type Variants } from "motion/react";

interface SplitTextProps {
  text: string;
  className?: string;
  /** Quantas palavras finais recebem o acento (cor de destaque da marca). */
  accentTailWords?: number;
  accentClassName?: string;
  /** Atraso (s) antes da primeira palavra entrar. */
  delay?: number;
  /** Omite o span sr-only interno — use quando o pai já provê o texto para AT. */
  noSrOnly?: boolean;
}

const container: Variants = {
  hidden: {},
  visible: (delay: number) => ({
    transition: { staggerChildren: 0.055, delayChildren: delay },
  }),
};

const word: Variants = {
  hidden: { y: "0.4em", opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] },
  },
};

/**
 * Título que "monta" palavra a palavra ao entrar na viewport (estilo SplitText),
 * feito com motion/react — sem GSAP, sem dependência nova.
 *
 * Acessível: o texto real fica no `sr-only`; a animação visual é `aria-hidden`,
 * então leitores de tela leem a frase uma única vez. Respeita reduced-motion
 * (aparece instantâneo, sem deslocamento). Reutilizável em qualquer heading.
 */
export function SplitText({
  text,
  className,
  accentTailWords = 0,
  accentClassName = "",
  delay = 0,
  noSrOnly = false,
}: SplitTextProps) {
  const reduce = useReducedMotion();
  const words = text.split(" ");
  const accentStart = words.length - accentTailWords;
  const isAccent = (i: number) => accentTailWords > 0 && i >= accentStart;

  if (reduce) {
    return (
      <span className={className}>
        {words.map((w, i) => (
          <span key={i} className={isAccent(i) ? accentClassName : undefined}>
            {w}
            {i < words.length - 1 ? " " : ""}
          </span>
        ))}
      </span>
    );
  }

  return (
    <span className={className}>
      {!noSrOnly && <span className="sr-only">{text}</span>}
      <motion.span
        aria-hidden="true"
        initial="hidden"
        whileInView="visible"
        custom={delay}
        viewport={{ once: true, margin: "0px 0px -12% 0px" }}
        variants={container}
      >
        {words.map((w, i) => (
          <span key={i} className="inline-block whitespace-nowrap">
            <motion.span
              variants={word}
              className={`inline-block ${isAccent(i) ? accentClassName : ""}`}
            >
              {w}
            </motion.span>
            {i < words.length - 1 ? " " : ""}
          </span>
        ))}
      </motion.span>
    </span>
  );
}
