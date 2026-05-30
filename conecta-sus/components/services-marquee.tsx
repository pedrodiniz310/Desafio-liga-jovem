import { Marquee } from "./ui/marquee";

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

export function ServicesMarquee() {
  return (
    <section className="overflow-hidden py-14 sm:py-20" aria-label="Exemplos de serviços do SUS">
      <p className="mx-auto mb-9 max-w-xl px-5 text-center text-lg text-ink-soft">
        Tudo isto já existe no SUS — e é{" "}
        <span className="font-semibold text-verde">de graça</span>. O Conecta SUS
        só te mostra onde.
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

        {/* fades nas bordas */}
        <div className="pointer-events-none absolute inset-y-0 left-0 w-20 bg-gradient-to-r from-paper to-transparent sm:w-32" />
        <div className="pointer-events-none absolute inset-y-0 right-0 w-20 bg-gradient-to-l from-paper to-transparent sm:w-32" />
      </div>
    </section>
  );
}
