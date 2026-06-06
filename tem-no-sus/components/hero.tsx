"use client";

import { motion } from "motion/react";
import { ArrowDown, HeartPulse, ShieldCheck } from "lucide-react";
import { SearchDemo } from "./search-demo";
import { MorphingText } from "./ui/liquid-text";
import { CtaButton } from "./ui/cta-button";
import { Marquee } from "./ui/marquee";
import { PhoneMockup } from "./ui/phone-mockup";
import { TiltCard } from "./ui/tilt-card";
import { HeroField } from "./ui/hero-field";

const NEEDS = [
  "psicólogo",
  "dentista",
  "remédio",
  "fono",
  "reabilitação",
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
      {/* fundo do hero — partículas verdes subindo + linhas-guia que se
          desenham no mount (adaptado do "minimal hero" do 21st.dev) */}
      <HeroField />

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
            className="font-display mt-6 text-[3.4rem] leading-[1.0] font-semibold tracking-tight text-ink sm:text-7xl lg:text-[5.5rem]"
          >
            <span className="sr-only">
              Encontre os serviços gratuitos do SUS perto de você.
            </span>
            <span aria-hidden="true" className="block">Encontre</span>
            <MorphingText
              texts={[...NEEDS]}
              aria-hidden="true"
              className="mx-0 h-[3.4rem] max-w-none text-left font-display text-[3.4rem] leading-[1.0] font-semibold tracking-tight text-coral italic sm:h-[4.5rem] sm:text-7xl lg:h-[5.5rem] lg:text-[5.5rem]"
            />
            <span aria-hidden="true" className="block">perto de você.</span>
          </motion.div>

          <motion.p
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.16 }}
            className="mt-9 max-w-md text-lg leading-relaxed text-ink-soft"
          >
            Tudo isso já existe no SUS, de graça. O Tem no SUS! mostra onde
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

        {/* coluna da demo — telefone com tilt reativo ao cursor */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
          className="relative mx-auto flex w-full justify-center"
          style={{ perspective: 1200 }}
        >
          <TiltCard maxTilt={10} baseRotateX={6} baseRotateY={-13}>
            <PhoneMockup>
              <SearchDemo />
            </PhoneMockup>
          </TiltCard>
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
