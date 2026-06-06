import { Marquee } from "./ui/marquee";

const ITEMS = [
  "CAPS",
  "CEO · Dentista especialista",
  "Farmácia Popular",
  "CER · Reabilitação",
  "NASF",
  "Banco de Leite",
  "UPA 24h",
  "SAMU 192",
  "Academia da Saúde",
  "Melhor em Casa",
  "CAPS AD",
  "Saúde da Família",
  "Centro de Testagem",
  "Vacinação",
  "Saúde Bucal",
];

function Item({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center gap-4 whitespace-nowrap">
      <span className="text-[0.7rem] font-bold tracking-[0.22em] text-paper-soft/85 uppercase">
        {label}
      </span>
      <span className="h-1 w-1 rounded-full bg-verde-bright/50" aria-hidden="true" />
    </span>
  );
}

export function ServiceStrip() {
  return (
    <div
      className="relative overflow-hidden border-y border-verde/20 bg-verde py-3.5"
      aria-hidden="true"
    >
      <Marquee className="[--duration:32s] [--gap:2rem]" pauseOnHover={false} repeat={3}>
        {ITEMS.map((item) => (
          <Item key={item} label={item} />
        ))}
      </Marquee>

      <div className="pointer-events-none absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-verde to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-verde to-transparent" />
    </div>
  );
}
