"use client";

import { motion } from "motion/react";
import { ArrowDown, HeartPulse, ShieldCheck } from "lucide-react";
import { SearchDemo } from "./search-demo";
import { MorphingText } from "./ui/liquid-text";
import { CtaButton } from "./ui/cta-button";
import { Marquee } from "./ui/marquee";

const NEEDS = [
  "psicólogo",
  "dentista",
  "remédio de graça",
  "fono",
  "reabilitação",
] as const;

const CHIPS = [
  { label: "CAPS · saúde mental", top: "6%", left: "-7%", delay: 0 },
  { label: "Farmácia Popular", top: "30%", right: "-9%", delay: 0.6 },
  { label: "Banco de Leite", bottom: "16%", left: "-6%", delay: 1.1 },
  { label: "Reabilitação · CER", bottom: "-3%", right: "4%", delay: 1.6 },
] as const;

const LINHA_1 = [
  "CAPS · saúde mental",
  "Farmácia Popular",
  "CEO · dentista especialista",
  "Banco de Leite",
  "CER · reabilitação",
  "UPA 24h",
  "SAMU 192",
  "Academia da Saúde",
];

const LINHA_2 = [
  "CAPS AD · dependência química",
  "Saúde da Família",
  "Melhor em Casa",
  "Centro de Testagem",
  "Planejamento familiar",
  "Ambulatório de especialidades",
  "Vacinação",
  "Saúde bucal",
];

const CORES = ["bg-verde", "bg-coral", "bg-amber"];

function Pilula({ texto, i }: { texto: string; i: number }) {
  return (
    <span className="mx-1.5 inline-flex items-center gap-2.5 rounded-full border border-line bg-card px-5 py-2.5 text-sm font-medium whitespace-nowrap text-ink shadow-soft">
      <span
        className={`h-2 w-2 rounded-full ${CORES[i % CORES.length]}`}
        aria-hidden="true"
      />
      {texto}
    </span>
  );
}

export function Hero() {
  return (
    <section
      id="topo"
      className="grain relative pt-28 pb-14 sm:pt-32 sm:pb-20"
      style={{ overflowX: "clip" }}
    >
      {/* fundo vivo — manchas orgânicas que flutuam devagar */}
      <div
        aria-hidden="true"
        className="blob-drift-a pointer-events-none absolute -top-36 -right-28 h-[29rem] w-[29rem] rounded-full bg-verde-wash blur-3xl"
      />
      <div
        aria-hidden="true"
        className="blob-drift-b pointer-events-none absolute -left-40 h-[32rem] w-[32rem] rounded-full bg-coral-wash blur-3xl"
        style={{ bottom: "-6rem" }}
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

      {/* — hero grid — */}
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

          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.08 }}
            role="heading"
            aria-level={1}
            className="font-display mt-6 text-[2.7rem] leading-[1.05] font-semibold tracking-tight text-ink sm:text-6xl"
          >
            <span className="sr-only">
              Encontre os serviços gratuitos do SUS perto de você.
            </span>
            <span aria-hidden="true" className="block">Encontre</span>
            <MorphingText
              texts={[...NEEDS]}
              aria-hidden="true"
              className="mx-0 h-[2.9rem] max-w-none text-left font-display text-[2.7rem] leading-[1.05] font-semibold tracking-tight text-coral italic sm:h-[4rem] sm:text-6xl md:h-[4rem] lg:text-6xl"
            />
            <span aria-hidden="true" className="block">perto de você.</span>
          </motion.div>

          <motion.p
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.16 }}
            className="mt-9 max-w-md text-lg leading-relaxed text-ink-soft"
          >
            Tudo isso já existe no SUS, de graça. O Conecta SUS mostra onde
            fica, o horário e o que levar — em menos de um minuto.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.24 }}
            className="mt-9 flex flex-col items-start gap-4 sm:flex-row sm:items-center"
          >
            <CtaButton href="#baixar" className="h-[52px] px-7 text-base">
              Encontrar um serviço perto de mim
            </CtaButton>
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
              Preparado para CNES/DATASUS
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

      {/* — marquee de serviços — integrado para evitar corte do fundo — */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.5 }}
        className="relative mt-16 sm:mt-20"
        aria-label="Exemplos de serviços do SUS"
      >
        <p className="mx-auto mb-9 max-w-xl px-5 text-center text-lg text-ink-soft">
          Tudo isto já existe no SUS — e é{" "}
          <span className="font-semibold text-verde">de graça</span>. O problema
          nunca foi a falta de serviço. É achar.
        </p>

        <div className="relative">
          <Marquee pauseOnHover className="[--duration:38s]">
            {LINHA_1.map((s, i) => (
              <Pilula key={s} texto={s} i={i} />
            ))}
          </Marquee>
          <Marquee reverse pauseOnHover className="mt-3 [--duration:44s]">
            {LINHA_2.map((s, i) => (
              <Pilula key={s} texto={s} i={i + 1} />
            ))}
          </Marquee>

          <div className="pointer-events-none absolute inset-y-0 left-0 w-20 bg-gradient-to-r from-paper to-transparent sm:w-32" />
          <div className="pointer-events-none absolute inset-y-0 right-0 w-20 bg-gradient-to-l from-paper to-transparent sm:w-32" />
        </div>
      </motion.div>
    </section>
  );
}
