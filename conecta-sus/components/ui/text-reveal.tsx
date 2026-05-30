"use client";

import { FC, ReactNode, useRef } from "react";
import { motion, MotionValue, useScroll, useTransform } from "motion/react";

import { cn } from "@/lib/utils";

interface TextRevealByWordProps {
  text: string;
  className?: string;
}

/**
 * Manifesto: a frase acende palavra a palavra conforme o scroll.
 * Versão escura (verde profundo) — as últimas palavras recebem o acento
 * terracota da marca.
 */
const TextRevealByWord: FC<TextRevealByWordProps> = ({ text, className }) => {
  const targetRef = useRef<HTMLDivElement | null>(null);

  const { scrollYProgress } = useScroll({ target: targetRef });
  const words = text.split(" ");

  return (
    <div
      ref={targetRef}
      className={cn("relative z-0 h-[200vh] bg-verde-deep", className)}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-1/2 left-1/2 h-[46rem] w-[46rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-verde/30 blur-3xl"
      />
      <div className="sticky top-0 mx-auto flex h-screen max-w-5xl items-center bg-transparent px-6">
        <p className="font-display flex flex-wrap text-3xl leading-snug font-semibold tracking-tight md:text-4xl lg:text-5xl">
          {words.map((word, i) => {
            const start = i / words.length;
            const end = start + 1 / words.length;
            // acentua o fecho da frase ("onde fica.")
            const accent = i >= words.length - 2;
            return (
              <Word
                key={i}
                progress={scrollYProgress}
                range={[start, end]}
                accent={accent}
              >
                {word}
              </Word>
            );
          })}
        </p>
      </div>
    </div>
  );
};

interface WordProps {
  children: ReactNode;
  progress: MotionValue<number>;
  range: [number, number];
  accent?: boolean;
}

const Word: FC<WordProps> = ({ children, progress, range, accent }) => {
  const opacity = useTransform(progress, range, [0, 1]);
  return (
    <span className="relative mx-1 lg:mx-2.5">
      <span className="absolute text-paper-soft/15">{children}</span>
      <motion.span
        style={{ opacity }}
        className={accent ? "text-coral-bright" : "text-paper-soft"}
      >
        {children}
      </motion.span>
    </span>
  );
};

export { TextRevealByWord };
