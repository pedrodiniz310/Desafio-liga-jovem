import { Database, Users, HeartHandshake, Search } from "lucide-react";
import { Reveal } from "./reveal";
import { DotPattern } from "./ui/dot-pattern";

const NECESSIDADES = [
  "preciso de psicólogo",
  "dentista de graça",
  "remédio popular",
  "fono pro meu filho",
  "tratamento pra dependência",
];

export function Differentiators() {
  return (
    <section
      id="diferenciais"
      className="relative overflow-hidden bg-paper-soft py-20 sm:py-28"
    >
      <DotPattern
        width={26}
        height={26}
        cr={1.1}
        className="text-verde/15 [mask-image:radial-gradient(680px_circle_at_50%_0%,white,transparent)]"
      />
      <div className="relative mx-auto max-w-6xl px-5 sm:px-8">
        <Reveal>
          <div className="max-w-2xl">
            <p className="text-sm font-semibold tracking-[0.2em] text-verde uppercase">
              Por que é diferente
            </p>
            <h2 className="font-display mt-4 text-3xl leading-[1.1] font-semibold tracking-tight text-ink sm:text-5xl">
              Mapa não basta. Lista de posto não resolve.
            </h2>
          </div>
        </Reveal>

        <div className="mt-12 grid auto-rows-[minmax(0,1fr)] grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {/* card destaque */}
          <Reveal className="lg:col-span-2 lg:row-span-2">
            <div className="flex h-full flex-col justify-between rounded-3xl bg-verde p-8 text-paper-soft">
              <div>
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-paper-soft/15">
                  <Search className="h-6 w-6" aria-hidden="true" />
                </span>
                <h3 className="font-display mt-6 text-2xl font-semibold sm:text-3xl">
                  Busca pelo que você sente, não pela sigla
                </h3>
                <p className="mt-3 max-w-md leading-relaxed text-paper-soft/75">
                  Ninguém acorda precisando de um “estabelecimento de atenção
                  psicossocial”. A pessoa precisa de ajuda. O Conecta SUS traduz
                  a necessidade real no serviço certo.
                </p>
              </div>

              <ul className="mt-8 flex flex-wrap gap-2">
                {NECESSIDADES.map((n) => (
                  <li
                    key={n}
                    className="rounded-full border border-paper-soft/20 bg-paper-soft/10 px-3.5 py-1.5 text-sm text-paper-soft/90"
                  >
                    {n}
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>

          {/* CNES — largo */}
          <Reveal className="sm:col-span-2" delay={0.06}>
            <div className="flex h-full flex-col rounded-3xl border border-line bg-card p-7">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-verde-wash text-verde">
                <Database className="h-6 w-6" aria-hidden="true" />
              </span>
              <h3 className="font-display mt-5 text-xl font-semibold text-ink sm:text-2xl">
                Dados oficiais, não achismo
              </h3>
              <p className="mt-2 leading-relaxed text-ink-soft">
                Tudo vem do CNES, o cadastro do Ministério da Saúde com todos os
                estabelecimentos do país. Informação de fonte pública, não
                rumor de grupo de WhatsApp.
              </p>
            </div>
          </Reveal>

          {/* comunidade */}
          <Reveal delay={0.12}>
            <div className="flex h-full flex-col rounded-3xl border border-line bg-card p-7">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-coral-wash text-coral">
                <Users className="h-6 w-6" aria-hidden="true" />
              </span>
              <h3 className="font-display mt-5 text-xl font-semibold text-ink">
                A comunidade confirma
              </h3>
              <p className="mt-2 leading-relaxed text-ink-soft">
                Fechou, mudou de horário? Quem usou avisa — e o dado se corrige
                sozinho.
              </p>
            </div>
          </Reveal>

          {/* gratuito */}
          <Reveal delay={0.18}>
            <div className="flex h-full flex-col rounded-3xl border border-line bg-card p-7">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-verde-wash text-verde">
                <HeartHandshake className="h-6 w-6" aria-hidden="true" />
              </span>
              <h3 className="font-display mt-5 text-xl font-semibold text-ink">
                De graça pra quem usa
              </h3>
              <p className="mt-2 leading-relaxed text-ink-soft">
                Pro cidadão, sempre gratuito. Quem paga é a prefeitura, pelo
                painel de gestão.
              </p>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
