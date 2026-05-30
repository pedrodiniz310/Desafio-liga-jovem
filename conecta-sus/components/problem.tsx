import { PhoneOff, Map, FileQuestion } from "lucide-react";
import { Reveal } from "./reveal";
import { NumberTicker } from "./ui/number-ticker";
import { DotPattern } from "./ui/dot-pattern";

export function Problem() {
  return (
    <section
      id="problema"
      className="relative overflow-hidden bg-verde-deep py-20 text-paper-soft sm:py-28"
    >
      <DotPattern
        width={24}
        height={24}
        cr={1}
        className="text-paper-soft/15 [mask-image:radial-gradient(520px_circle_at_85%_15%,white,transparent)]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-1/2 left-1/2 h-[40rem] w-[40rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-verde/30 blur-3xl"
      />

      <div className="relative mx-auto max-w-6xl px-5 sm:px-8">
        <Reveal>
          <p className="text-sm font-semibold tracking-[0.2em] text-verde-bright uppercase">
            O problema
          </p>
          <h2 className="font-display mt-4 max-w-3xl text-3xl leading-[1.1] font-semibold tracking-tight sm:text-5xl">
            Todo dia, alguém desiste de um direito que{" "}
            <span className="text-coral-bright">já é seu</span>.
          </h2>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-paper-soft/75">
            O SUS é a maior rede pública de saúde do mundo. Mas conhecer a UBS do
            bairro é só a ponta — CAPS, CEO, Farmácia Popular, reabilitação,
            banco de leite. Serviços de graça que pouca gente sabe que existem.
          </p>
        </Reveal>

        {/* a cena, contada como história */}
        <Reveal delay={0.1}>
          <figure className="mt-12 max-w-2xl border-l-2 border-coral pl-6">
            <blockquote className="font-display text-xl leading-relaxed text-paper-soft/90 italic sm:text-2xl">
              “Liguei pro postinho atrás de psicólogo. Esperei vinte minutos pra
              ouvir que ali não tinha. Desisti. Nunca soube que existia um CAPS a
              dez minutos de casa, de graça.”
            </blockquote>
            <figcaption className="mt-4 text-sm text-paper-soft/60">
              — relato recorrente em qualquer fila de UBS do interior
            </figcaption>
          </figure>
        </Reveal>

        {/* blocos assimétricos */}
        <div className="mt-14 grid gap-4 sm:grid-cols-6">
          <Reveal className="sm:col-span-3" delay={0.05}>
            <div className="flex h-full flex-col justify-between rounded-3xl border border-paper-soft/10 bg-paper-soft/5 p-7">
              <PhoneOff className="h-7 w-7 text-coral-bright" aria-hidden />
              <div className="mt-10">
                <p className="font-display text-5xl font-semibold sm:text-6xl">
                  <NumberTicker value={20} />
                  &nbsp;min
                </p>
                <p className="mt-2 text-paper-soft/70">
                  no telefone do posto, muitas vezes só pra ouvir “aqui não
                  tem”.
                </p>
              </div>
            </div>
          </Reveal>

          <Reveal className="sm:col-span-3" delay={0.12}>
            <div className="flex h-full flex-col justify-between rounded-3xl border border-paper-soft/10 bg-paper-soft/5 p-7">
              <FileQuestion className="h-7 w-7 text-coral-bright" aria-hidden />
              <div className="mt-10">
                <p className="font-display text-5xl font-semibold sm:text-6xl">
                  +<NumberTicker value={100} />
                </p>
                <p className="mt-2 text-paper-soft/70">
                  tipos de serviço gratuito que a maioria nunca ouviu falar.
                </p>
              </div>
            </div>
          </Reveal>

          <Reveal className="sm:col-span-6" delay={0.18}>
            <div className="flex flex-col items-start gap-5 rounded-3xl border border-paper-soft/10 bg-paper-soft/5 p-7 sm:flex-row sm:items-center sm:gap-8">
              <Map
                className="h-7 w-7 shrink-0 text-coral-bright"
                aria-hidden
              />
              <p className="text-lg leading-relaxed text-paper-soft/85">
                O encaminhamento vem num papel que ninguém entende. O endereço
                mudou. A unidade fechou. E não existe um lugar só que diga, em
                português de gente,{" "}
                <span className="font-semibold text-paper-soft">
                  onde ir e o que levar
                </span>
                .
              </p>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
