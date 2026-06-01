import { MessagesSquare, ListChecks, RefreshCw } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Reveal } from "./reveal";

type Passo = {
  n: string;
  icon: LucideIcon;
  titulo: string;
  texto: string;
  tag: string;
};

const PASSOS: Passo[] = [
  {
    n: "01",
    icon: MessagesSquare,
    titulo: "Diga com as suas palavras",
    texto:
      "Nada de “CAPS tipo II” ou “atenção secundária”. Você escreve “preciso de psicólogo” ou “remédio de graça” — do jeito que a gente fala de verdade.",
    tag: "Linguagem de gente",
  },
  {
    n: "02",
    icon: ListChecks,
    titulo: "Veja o que existe pertinho",
    texto:
      "A lista aparece com endereço, telefone, horário e o que levar na primeira vez. Com mapa e botão pra ligar na hora. Sem decifrar sigla nenhuma.",
    tag: "Informação completa",
  },
  {
    n: "03",
    icon: RefreshCw,
    titulo: "Confirme e ajude o próximo",
    texto:
      "Achou tudo certo? Um toque em “ainda funciona?” mantém os dados vivos para a próxima pessoa. A comunidade cuida da informação junto.",
    tag: "Dados que não envelhecem",
  },
];

export function HowItWorks() {
  return (
    <section id="como-funciona" className="py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <Reveal>
          <div className="max-w-2xl">
            <p className="text-sm font-semibold tracking-[0.2em] text-verde uppercase">
              Como funciona
            </p>
            <h2 className="font-display mt-4 text-3xl leading-[1.1] font-semibold tracking-tight text-ink sm:text-5xl">
              Três passos. Menos de um minuto.
            </h2>
          </div>
        </Reveal>

        <div className="mt-14 divide-y divide-line border-t border-line">
          {PASSOS.map((passo, i) => {
            const Icon = passo.icon;
            return (
              <Reveal key={passo.n} delay={i * 0.08}>
                <article className="group grid items-start gap-6 py-10 sm:grid-cols-[auto_1fr_auto] sm:gap-10">
                  <span className="font-display text-5xl leading-none font-semibold text-verde/25 sm:text-7xl">
                    {passo.n}
                  </span>

                  <div className="max-w-xl">
                    <h3 className="font-display text-2xl font-semibold text-ink sm:text-3xl">
                      {passo.titulo}
                    </h3>
                    <p className="mt-3 text-lg leading-relaxed text-ink-soft">
                      {passo.texto}
                    </p>
                    <span className="mt-4 inline-flex items-center gap-2 rounded-full bg-verde-wash px-3 py-1 text-sm font-medium text-verde">
                      {passo.tag}
                    </span>
                  </div>

                  <span className="hidden h-14 w-14 items-center justify-center rounded-2xl border border-line bg-paper-soft text-verde transition-colors group-hover:border-verde group-hover:bg-verde group-hover:text-paper-soft sm:flex">
                    <Icon className="h-6 w-6" aria-hidden="true" />
                  </span>
                </article>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
