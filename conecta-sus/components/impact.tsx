import { Timer, Frown, Smile, Users2, MapPinned, Languages } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Reveal } from "./reveal";
import { NumberTicker } from "./ui/number-ticker";

type Metrica = {
  icon: LucideIcon;
  value: number;
  suffix?: string;
  label: string;
};

const METRICAS: Metrica[] = [
  {
    icon: Users2,
    value: 215,
    suffix: " mi",
    label: "de brasileiros dependem do SUS no dia a dia",
  },
  {
    icon: MapPinned,
    value: 5570,
    label: "municípios na base CNES, fonte prevista para a ingestão",
  },
  {
    icon: Languages,
    value: 0,
    label: "siglas técnicas para o cidadão decorar",
  },
];

export function Impact() {
  return (
    <section id="impacto" className="py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <Reveal>
          <div className="max-w-2xl">
            <p className="text-sm font-semibold tracking-[0.2em] text-verde uppercase">
              Por que muda tudo
            </p>
            <h2 className="font-display mt-4 text-3xl leading-[1.1] font-semibold tracking-tight text-ink sm:text-5xl">
              De uma maratona de ligações a 45 segundos na tela.
            </h2>
            <p className="mt-5 text-lg leading-relaxed text-ink-soft">
              Hoje, achar um serviço gratuito do SUS pode virar uma sequência de
              ligações e becos sem saída. O Tem no SUS! foi desenhado para
              resolver logo na primeira busca.
            </p>
          </div>
        </Reveal>

        <div className="mt-12 grid gap-4 lg:grid-cols-5">
          {/* antes */}
          <Reveal className="lg:col-span-2">
            <div className="flex h-full flex-col justify-between rounded-3xl border border-line bg-paper-soft p-8">
              <div className="flex items-center gap-2 text-ink-faint">
                <Frown className="h-5 w-5" aria-hidden="true" />
                <span className="text-sm font-semibold tracking-wide uppercase">
                  Do jeito de hoje
                </span>
              </div>
              <div className="mt-10">
                <p className="font-display text-6xl font-semibold text-ink-soft sm:text-7xl">
                  <NumberTicker value={8} />
                  &nbsp;min
                </p>
                <p className="mt-3 max-w-xs text-ink-soft">
                  perdidos no telefone — e muita gente desiste antes de achar.
                </p>
              </div>
            </div>
          </Reveal>

          {/* depois — destaque */}
          <Reveal className="lg:col-span-3" delay={0.1}>
            <div className="relative flex h-full flex-col justify-between overflow-hidden rounded-3xl bg-verde p-8 text-paper-soft">
              <div
                aria-hidden="true"
                className="pointer-events-none absolute -top-16 -right-16 h-56 w-56 rounded-full bg-verde-bright/30 blur-2xl"
              />
              <div className="relative flex items-center gap-2 text-paper-soft/80">
                <Smile className="h-5 w-5" aria-hidden="true" />
                <span className="text-sm font-semibold tracking-wide uppercase">
                  Com o Tem no SUS!
                </span>
              </div>
              <div className="relative mt-10 flex flex-wrap items-end gap-x-8 gap-y-4">
                <div>
                  <p className="font-display text-6xl font-semibold sm:text-8xl">
                    <NumberTicker value={45} />
                    &nbsp;seg
                  </p>
                  <p className="mt-3 max-w-xs text-paper-soft/80">
                    para encontrar o serviço, com endereço e horário na tela.
                  </p>
                </div>
                <div className="flex items-center gap-2 rounded-full bg-paper-soft/15 px-4 py-2">
                  <Timer className="h-5 w-5" aria-hidden="true" />
                  <span className="text-sm font-medium">
                    <NumberTicker value={10} />× mais rápido
                  </span>
                </div>
              </div>
            </div>
          </Reveal>
        </div>

        {/* métricas de contexto */}
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          {METRICAS.map((m, i) => {
            const Icon = m.icon;
            return (
              <Reveal key={m.label} delay={i * 0.08}>
                <div className="flex h-full items-center gap-4 rounded-3xl border border-line bg-card p-6">
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-verde-wash text-verde">
                    <Icon className="h-6 w-6" aria-hidden="true" />
                  </span>
                  <div>
                    <p className="font-display text-2xl font-semibold text-ink">
                      <NumberTicker value={m.value} />
                      {m.suffix}
                    </p>
                    <p className="text-sm leading-snug text-ink-soft">
                      {m.label}
                    </p>
                  </div>
                </div>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
