"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Brain, MapPin, Pill, Stethoscope, Clock } from "lucide-react";
import type { LucideIcon } from "lucide-react";

type Resultado = {
  nome: string;
  servico: string;
  distancia: string;
  horario: string;
  icon: LucideIcon;
};

type Busca = {
  query: string;
  resultados: Resultado[];
};

const BUSCAS: Busca[] = [
  {
    query: "preciso de psicólogo",
    resultados: [
      {
        nome: "CAPS II — Centro de Joaçaba",
        servico: "Saúde mental · gratuito",
        distancia: "1,2 km",
        horario: "Seg a sex, 7h–17h",
        icon: Brain,
      },
      {
        nome: "Ambulatório de Psicologia · UBS Centro",
        servico: "Atendimento individual",
        distancia: "2,0 km",
        horario: "Ter e qui, 13h–17h",
        icon: Stethoscope,
      },
    ],
  },
  {
    query: "remédio de graça",
    resultados: [
      {
        nome: "Farmácia Popular — Drogaria São José",
        servico: "Remédios gratuitos e com desconto",
        distancia: "850 m",
        horario: "Seg a sáb, 8h–20h",
        icon: Pill,
      },
    ],
  },
  {
    query: "dentista especialista",
    resultados: [
      {
        nome: "CEO — Centro de Especialidades Odontológicas",
        servico: "Canal, cirurgia e prótese · SUS",
        distancia: "3,4 km",
        horario: "Seg a sex, 8h–17h",
        icon: Stethoscope,
      },
    ],
  },
];

const TYPE_MS = 55;
const HOLD_MS = 2600;
const CLEAR_MS = 28;

export function SearchDemo() {
  const [buscaIdx, setBuscaIdx] = useState(0);
  const [texto, setTexto] = useState("");
  const [fase, setFase] = useState<"digitando" | "mostrando" | "limpando">(
    "digitando",
  );

  const buscaAtual = BUSCAS[buscaIdx];
  const alvo = buscaAtual.query;

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;

    if (fase === "digitando") {
      if (texto.length < alvo.length) {
        timer = setTimeout(
          () => setTexto(alvo.slice(0, texto.length + 1)),
          TYPE_MS,
        );
      } else {
        timer = setTimeout(() => setFase("mostrando"), 450);
      }
    } else if (fase === "mostrando") {
      timer = setTimeout(() => setFase("limpando"), HOLD_MS);
    } else {
      if (texto.length > 0) {
        timer = setTimeout(
          () => setTexto(alvo.slice(0, texto.length - 1)),
          CLEAR_MS,
        );
      } else {
        timer = setTimeout(() => {
          setBuscaIdx((i) => (i + 1) % BUSCAS.length);
          setFase("digitando");
        }, 320);
      }
    }

    return () => clearTimeout(timer);
  }, [texto, fase, alvo]);

  const mostrarResultados = fase === "mostrando";

  return (
    <div className="w-full rounded-[26px] border border-line bg-card p-3 shadow-lift sm:p-4">
      {/* barra superior do "app" */}
      <div className="mb-3 flex items-center justify-between px-1">
        <div className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-coral/70" />
          <span className="h-2.5 w-2.5 rounded-full bg-amber/70" />
          <span className="h-2.5 w-2.5 rounded-full bg-verde-bright/70" />
        </div>
        <span className="text-[0.7rem] font-medium tracking-wide text-ink-faint">
          conecta sus
        </span>
        <span className="relative inline-flex h-2.5 w-2.5">
          <span className="pulse-ring absolute inline-flex h-full w-full rounded-full" />
          <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-coral" />
        </span>
      </div>

      {/* campo de busca */}
      <div className="flex items-center gap-3 rounded-2xl border border-line bg-paper-soft px-4 py-3.5">
        <MapPin className="h-5 w-5 shrink-0 text-verde" aria-hidden="true" />
        <p className="text-[0.95rem] text-ink sm:text-base">
          {texto}
          <span className="caret ml-0.5 inline-block w-[2px] -translate-y-0.5 align-middle text-verde">
            |
          </span>
        </p>
      </div>

      {/* localidade detectada */}
      <p className="mt-2 px-1 text-[0.72rem] text-ink-faint">
        Mostrando serviços em{" "}
        <span className="font-medium text-ink-soft">Joaçaba · SC</span>
      </p>

      {/* resultados */}
      <div className="mt-3 min-h-[188px]">
        <AnimatePresence mode="wait">
          {mostrarResultados && (
            <motion.ul
              key={buscaAtual.query}
              className="space-y-2.5"
              initial="hidden"
              animate="visible"
              exit={{ opacity: 0, transition: { duration: 0.2 } }}
              variants={{
                visible: { transition: { staggerChildren: 0.12 } },
              }}
            >
              {buscaAtual.resultados.map((r) => {
                const Icon = r.icon;
                return (
                  <motion.li
                    key={r.nome}
                    variants={{
                      hidden: { opacity: 0, y: 14 },
                      visible: { opacity: 1, y: 0 },
                    }}
                    transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                    className="flex gap-3 rounded-2xl border border-line bg-paper-soft p-3.5"
                  >
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-verde-wash text-verde">
                      <Icon className="h-5 w-5" aria-hidden="true" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-ink">
                        {r.nome}
                      </p>
                      <p className="truncate text-[0.78rem] text-ink-soft">
                        {r.servico}
                      </p>
                      <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[0.72rem] text-ink-faint">
                        <span className="inline-flex items-center gap-1">
                          <MapPin className="h-3 w-3" aria-hidden="true" />
                          {r.distancia}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <Clock className="h-3 w-3" aria-hidden="true" />
                          {r.horario}
                        </span>
                      </div>
                    </div>
                  </motion.li>
                );
              })}
            </motion.ul>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
