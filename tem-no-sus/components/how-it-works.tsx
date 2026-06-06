import { MessagesSquare, ListChecks, RefreshCw } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Reveal } from "./reveal";
import { SplitText } from "./ui/split-text";

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
      'Nada de “CAPS tipo II” ou “atenção secundária”. Você escreve “preciso de psicólogo” ou “remédio de graça” — do jeito que a gente fala de verdade.',
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
      'Achou tudo certo? Um toque em "ainda funciona?" mantém os dados vivos para a próxima pessoa. A comunidade cuida da informação junto.',
    tag: "Dados que não envelhecem",
  },
];

export function HowItWorks() {
  return (
    <section id="como-funciona" className="overflow-hidden py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <Reveal>
          <div className="max-w-2xl">
            <p className="text-sm font-semibold tracking-[0.2em] text-verde uppercase">
              Como funciona
            </p>
            <h2 className="font-display mt-4 text-3xl leading-[1.1] font-semibold tracking-tight text-ink sm:text-5xl">
              <SplitText text="Três passos. Menos de um minuto." delay={0.05} />
            </h2>
          </div>
        </Reveal>

        <div className="mt-14 space-y-6">
          {PASSOS.map((passo, i) => {
            const Icon = passo.icon;
            return (
              <Reveal key={passo.n} delay={i * 0.1}>
                <article className="group relative overflow-hidden rounded-3xl border border-line bg-card px-8 py-10 transition-shadow hover:shadow-lift sm:px-12">
                  {/* número gigante no fundo */}
                  <span
                    aria-hidden="true"
                    className="pointer-events-none absolute right-6 top-1/2 -translate-y-1/2 select-none font-display font-semibold leading-none text-ink/[0.04] transition-colors group-hover:text-verde/[0.07]"
                    style={{ fontSize: "clamp(7rem, 20vw, 14rem)" }}
                  >
                    {passo.n}
                  </span>

                  <div className="relative grid items-center gap-6 sm:grid-cols-[auto_1fr_auto]">
                    {/* ícone */}
                    <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-line bg-paper-soft text-verde transition-colors group-hover:border-verde group-hover:bg-verde group-hover:text-paper-soft">
                      <Icon className="h-6 w-6" aria-hidden="true" />
                    </span>

                    {/* texto */}
                    <div className="max-w-xl">
                      <h3 className="font-display text-2xl font-semibold text-ink sm:text-3xl">
                        {passo.titulo}
                      </h3>
                      <p className="mt-3 text-base leading-relaxed text-ink-soft sm:text-lg">
                        {passo.texto}
                      </p>
                    </div>

                    {/* tag */}
                    <span className="hidden shrink-0 items-center gap-2 rounded-full bg-verde-wash px-4 py-2 text-sm font-semibold text-verde sm:inline-flex">
                      {passo.tag}
                    </span>
                  </div>
                </article>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
