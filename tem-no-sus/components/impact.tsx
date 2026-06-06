import { Timer, Users2, MapPinned, Languages } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Reveal } from "./reveal";
import { NumberTicker } from "./ui/number-ticker";
import { SplitText } from "./ui/split-text";

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
              <SplitText
                text="De uma maratona de ligações a 45 segundos na tela."
                accentTailWords={4}
                accentClassName="text-verde"
                delay={0.05}
              />
            </h2>
          </div>
        </Reveal>

        {/* antes/depois — números gigantes */}
        <Reveal delay={0.08}>
          <div className="mt-14 grid gap-0 overflow-hidden rounded-3xl border border-line lg:grid-cols-2">
            {/* antes */}
            <div className="relative flex flex-col justify-between border-b border-line bg-paper-soft p-10 lg:border-b-0 lg:border-r">
              <p className="text-xs font-bold tracking-[0.2em] text-ink-faint uppercase">
                Do jeito de hoje
              </p>
              <div className="mt-6">
                <p
                  className="font-display leading-none font-semibold text-ink/20 select-none"
                  style={{ fontSize: "clamp(6rem, 18vw, 11rem)" }}
                  aria-hidden="true"
                >
                  8
                </p>
                <p className="font-display -mt-4 text-5xl font-semibold text-ink-soft sm:text-6xl">
                  <NumberTicker value={8} />&nbsp;
                  <span className="text-3xl sm:text-4xl">min</span>
                </p>
                <p className="mt-4 max-w-xs text-base leading-relaxed text-ink-soft">
                  perdidos no telefone — e muita gente desiste antes de achar o serviço certo.
                </p>
              </div>
            </div>

            {/* depois */}
            <div className="relative flex flex-col justify-between overflow-hidden bg-verde p-10 text-paper-soft">
              <div
                aria-hidden="true"
                className="pointer-events-none absolute -top-20 -right-20 h-64 w-64 rounded-full bg-verde-bright/25 blur-3xl"
              />
              <p className="relative text-xs font-bold tracking-[0.2em] text-paper-soft/60 uppercase">
                Com o Tem no SUS!
              </p>
              <div className="relative mt-6">
                <p
                  className="font-display leading-none font-semibold text-paper-soft/15 select-none"
                  style={{ fontSize: "clamp(6rem, 18vw, 11rem)" }}
                  aria-hidden="true"
                >
                  45
                </p>
                <p className="font-display -mt-4 text-5xl font-semibold sm:text-6xl">
                  <NumberTicker value={45} />&nbsp;
                  <span className="text-3xl sm:text-4xl">seg</span>
                </p>
                <p className="mt-4 max-w-xs text-base leading-relaxed text-paper-soft/75">
                  para encontrar o serviço, com endereço e horário na tela.
                </p>
                <span className="mt-6 inline-flex items-center gap-2 rounded-full bg-paper-soft/15 px-4 py-2 text-sm font-semibold">
                  <Timer className="h-4 w-4" aria-hidden="true" />
                  <NumberTicker value={10} />× mais rápido
                </span>
              </div>
            </div>
          </div>
        </Reveal>

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
