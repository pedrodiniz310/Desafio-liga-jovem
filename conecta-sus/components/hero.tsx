"use client";

import { motion } from "motion/react";
import { ArrowDown, HeartPulse, ShieldCheck } from "lucide-react";
import { SearchDemo } from "./search-demo";

const CHIPS = [
  { label: "CAPS · saúde mental", top: "6%", left: "-7%", delay: 0 },
  { label: "Farmácia Popular", top: "30%", right: "-9%", delay: 0.6 },
  { label: "Banco de Leite", bottom: "16%", left: "-6%", delay: 1.1 },
  { label: "Reabilitação · CER", bottom: "-3%", right: "4%", delay: 1.6 },
] as const;

export function Hero() {
  return (
    <section
      id="topo"
      className="grain relative overflow-hidden pt-28 pb-16 sm:pt-32 lg:pb-24"
    >
      {/* fundo vivo — manchas orgânicas que flutuam devagar */}
      <div
        aria-hidden="true"
        className="blob-drift-a pointer-events-none absolute -top-36 -right-28 h-[29rem] w-[29rem] rounded-full bg-verde-wash blur-3xl"
      />
      <div
        aria-hidden="true"
        className="blob-drift-b pointer-events-none absolute -bottom-48 -left-40 h-[26rem] w-[26rem] rounded-full bg-coral-wash blur-3xl"
      />
      <div
        aria-hidden="true"
        className="blob-drift-c pointer-events-none absolute top-[38%] left-[46%] h-[21rem] w-[21rem] rounded-full bg-verde-bright/25 opacity-50 blur-3xl"
      />

      {/* malha de pontos sutil */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 [background-image:radial-gradient(rgba(13,106,81,0.1)_1px,transparent_1.4px)] [background-size:26px_26px] [mask-image:radial-gradient(640px_460px_at_80%_6%,#000,transparent_75%)]"
      />

      <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-5 sm:px-8 lg:grid-cols-[1.04fr_0.96fr] lg:gap-8">
        {/* coluna de texto */}
        <div>
          <motion.span
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 rounded-full border border-line bg-paper-soft px-3.5 py-1.5 text-[0.78rem] font-medium text-ink-soft"
          >
            <span className="relative inline-flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-verde-bright opacity-75" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-verde" />
            </span>
            Mais de 100 serviços gratuitos no SUS
          </motion.span>

          <motion.h1
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.08 }}
            className="font-display mt-6 text-[2.7rem] leading-[1.05] font-semibold tracking-tight text-ink sm:text-6xl"
          >
            Encontre os serviços{" "}
            <span className="text-coral italic">gratuitos</span> do SUS perto de
            você.
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.16 }}
            className="mt-9 max-w-md text-lg leading-relaxed text-ink-soft"
          >
            Psicólogo, dentista especialista, remédio de graça — tudo já existe
            perto de você. O Conecta SUS mostra onde fica, o horário e o que
            levar. Em menos de um minuto.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.24 }}
            className="mt-9 flex flex-col items-start gap-4 sm:flex-row sm:items-center"
          >
            <a
              href="#baixar"
              className="inline-flex h-[52px] items-center justify-center rounded-full bg-verde px-7 text-base font-semibold text-paper-soft shadow-lift transition-transform hover:-translate-y-0.5 active:translate-y-0"
            >
              Encontrar um serviço perto de mim
            </a>
            <a
              href="#como-funciona"
              className="group inline-flex items-center gap-2 px-1 py-2 text-base font-medium text-ink-soft transition-colors hover:text-verde"
            >
              Ver como funciona
              <ArrowDown className="h-4 w-4 transition-transform group-hover:translate-y-0.5" />
            </a>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.36 }}
            className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-ink-faint"
          >
            <span className="inline-flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-verde" />
              Dados oficiais do CNES
            </span>
            <span className="inline-flex items-center gap-2">
              <HeartPulse className="h-4 w-4 text-coral" />
              Gratuito para sempre
            </span>
          </motion.div>
        </div>

        {/* coluna da demo */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
          className="relative mx-auto w-full max-w-md lg:max-w-none"
        >
          <SearchDemo />

          {/* chips flutuantes — só no desktop */}
          {CHIPS.map((chip) => (
            <motion.span
              key={chip.label}
              aria-hidden="true"
              className="absolute hidden rounded-full border border-line bg-card px-3.5 py-2 text-xs font-medium text-ink-soft shadow-soft lg:inline-flex"
              style={{
                top: "top" in chip ? chip.top : undefined,
                bottom: "bottom" in chip ? chip.bottom : undefined,
                left: "left" in chip ? chip.left : undefined,
                right: "right" in chip ? chip.right : undefined,
              }}
              animate={{ y: [0, -9, 0] }}
              transition={{
                duration: 4.5,
                delay: chip.delay,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            >
              {chip.label}
            </motion.span>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
