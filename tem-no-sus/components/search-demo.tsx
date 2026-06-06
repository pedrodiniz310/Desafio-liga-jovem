"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  Brain,
  MapPin,
  Pill,
  Stethoscope,
  Clock,
  Search,
  Map,
  Heart,
  User,
} from "lucide-react";
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

const NAV = [
  { icon: Search, label: "Buscar", active: true },
  { icon: Map, label: "Mapa", active: false },
  { icon: Heart, label: "Salvos", active: false },
  { icon: User, label: "Perfil", active: false },
] as const;

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
    <div className="flex h-full flex-col bg-paper-soft px-4 pt-5">
      {/* header do app */}
      <div className="flex items-center justify-between">
        {/* lockup oficial (ícone + wordmark com a tipografia e o "!" coral
            corretos). eslint-disable: SVG estático dimensionado por altura. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo-wordmark.svg" alt="Tem no SUS!" className="h-[26px] w-auto" />
        <span className="inline-flex items-center gap-1 text-[0.7rem] font-medium text-ink-soft">
          <MapPin className="h-3.5 w-3.5 text-verde" aria-hidden="true" />
          Joaçaba · SC
        </span>
      </div>

      {/* campo de busca */}
      <div className="mt-4 flex items-center gap-2.5 rounded-2xl border border-line bg-card px-4 py-3.5 shadow-soft">
        <Search className="h-5 w-5 shrink-0 text-verde" aria-hidden="true" />
        <p className="text-[0.95rem] text-ink">
          {texto}
          <span className="caret ml-0.5 inline-block w-[2px] -translate-y-0.5 align-middle text-verde">
            |
          </span>
        </p>
      </div>

      {/* resultados */}
      <div className="mt-3 min-h-[200px] flex-1">
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
                    className="flex gap-3 rounded-2xl border border-line bg-card p-3.5 shadow-soft"
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

      {/* bottom nav do app — ancora o rodapé e vende o "isto é um app" */}
      <nav className="-mx-4 flex items-center justify-around border-t border-line bg-card/70 px-2 py-2.5">
        {NAV.map(({ icon: Icon, label, active }) => (
          <span
            key={label}
            className={`flex flex-col items-center gap-1 text-[0.6rem] font-medium ${
              active ? "text-verde" : "text-ink-faint"
            }`}
          >
            <Icon className="h-[18px] w-[18px]" aria-hidden="true" />
            {label}
          </span>
        ))}
      </nav>
    </div>
  );
}
