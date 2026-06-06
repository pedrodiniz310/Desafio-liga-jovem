"use client";

import * as React from "react";
import { Database, Users, HeartHandshake, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { Reveal } from "./reveal";
import { DotPattern } from "./ui/dot-pattern";
import { SplitText } from "./ui/split-text";
import { CardStack, type CardStackItem } from "./ui/card-stack";

const NECESSIDADES = [
  "preciso de psicólogo",
  "dentista de graça",
  "remédio popular",
  "fono pro meu filho",
  "tratamento pra dependência",
];

type Tone = "verde" | "coral" | "card";
type IconType = React.ComponentType<React.SVGProps<SVGSVGElement>>;

type DiffCard = CardStackItem & {
  num: number;
  kicker: string;
  Icon: IconType;
  tone: Tone;
  chip: "paper" | "verde" | "coral" | "amber";
  pills?: string[];
  footer?: string;
};

const CARDS: DiffCard[] = [
  {
    id: "busca",
    num: 1,
    kicker: "Busca humana",
    title: "Busca pelo que você sente, não pela sigla",
    description:
      "Ninguém acorda precisando de um “estabelecimento de atenção psicossocial”. A pessoa precisa de ajuda — e o app traduz a necessidade no serviço certo.",
    Icon: Search,
    tone: "verde",
    chip: "paper",
    pills: NECESSIDADES,
  },
  {
    id: "dados",
    num: 2,
    kicker: "Dados oficiais",
    title: "Pronto para dados oficiais",
    description:
      "A base pode ser alimentada pelo CNES/DATASUS, o cadastro público do Ministério da Saúde. O piloto deixa de depender de lista manual.",
    Icon: Database,
    tone: "card",
    chip: "verde",
    footer: "Fonte: CNES · DATASUS",
  },
  {
    id: "comunidade",
    num: 3,
    kicker: "Sempre fresco",
    title: "A comunidade confirma",
    description:
      "Fechou, mudou de horário? Quem usou avisa — e o dado se corrige sozinho, sempre fresco.",
    Icon: Users,
    tone: "coral",
    chip: "paper",
    footer: "Atualizado por quem usa",
  },
  {
    id: "gratuito",
    num: 4,
    kicker: "Custo zero",
    title: "De graça pra quem usa",
    description:
      "Pro cidadão, sempre gratuito. Quem paga é a prefeitura, pelo painel de gestão.",
    Icon: HeartHandshake,
    tone: "card",
    chip: "amber",
    footer: "Para o cidadão, sempre",
  },
];

const TONE_BG: Record<Tone, string> = {
  verde: "bg-verde text-paper-soft",
  coral: "bg-coral text-paper-soft",
  card: "bg-card text-ink",
};

const CHIP: Record<DiffCard["chip"], string> = {
  paper: "bg-paper-soft/15 text-paper-soft ring-paper-soft/25",
  verde: "bg-verde-wash text-verde ring-verde/15",
  coral: "bg-coral-wash text-coral ring-coral/15",
  amber: "bg-amber/15 text-amber ring-amber/25",
};

// brilho/profundidade interno — sólido recebe luz no topo-esquerdo + sombra no
// pé; card branco recebe um tint verde bem leve no canto.
const SHEEN_SOLID =
  "radial-gradient(120% 80% at 0% 0%, rgba(255,255,255,0.18), transparent 55%), linear-gradient(to top, rgba(0,0,0,0.14), transparent 45%)";
const SHEEN_CARD =
  "radial-gradient(120% 80% at 100% 0%, rgba(13,106,81,0.07), transparent 55%)";

function DiffPanel({ item }: { item: DiffCard }) {
  const solid = item.tone !== "card";
  const { Icon } = item;
  const muted = solid ? "text-paper-soft/80" : "text-ink-soft";
  const hairline = solid ? "bg-paper-soft/20" : "bg-line";

  return (
    <div
      className={cn(
        "relative flex h-full w-full flex-col overflow-hidden p-7",
        TONE_BG[item.tone],
      )}
    >
      {/* brilho/profundidade */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{ background: solid ? SHEEN_SOLID : SHEEN_CARD }}
      />
      {/* ícone marca d'água ao fundo */}
      <Icon
        aria-hidden="true"
        strokeWidth={1.25}
        className={cn(
          "pointer-events-none absolute -right-6 -bottom-8 h-44 w-44",
          solid ? "text-paper-soft/10" : "text-verde/[0.06]",
        )}
      />

      {/* topo: chip + índice */}
      <div className="relative flex items-start justify-between">
        <span
          className={cn(
            "flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ring-1",
            CHIP[item.chip],
          )}
        >
          <Icon className="h-6 w-6" aria-hidden="true" />
        </span>
        <span
          className={cn(
            "font-display text-4xl leading-none font-semibold tabular-nums",
            solid ? "text-paper-soft/30" : "text-ink/15",
          )}
        >
          {String(item.num).padStart(2, "0")}
        </span>
      </div>

      {/* texto */}
      <p
        className={cn(
          "relative mt-5 text-[0.7rem] font-semibold tracking-[0.18em] uppercase",
          solid ? "text-paper-soft/70" : "text-verde",
        )}
      >
        {item.kicker}
      </p>
      <h3 className="font-display relative mt-1.5 text-xl leading-tight font-semibold sm:text-2xl">
        {item.title}
      </h3>
      <p
        className={cn(
          "relative mt-2 line-clamp-3 text-[0.95rem] leading-relaxed",
          muted,
        )}
      >
        {item.description}
      </p>

      {/* rodapé */}
      <div className="relative mt-auto pt-4">
        <div className={cn("h-px w-full", hairline)} />
        {item.pills ? (
          <ul className="mt-3 flex flex-wrap gap-1.5">
            {item.pills.slice(0, 3).map((p) => (
              <li
                key={p}
                className="rounded-full border border-paper-soft/25 bg-paper-soft/10 px-3 py-1 text-xs text-paper-soft/90"
              >
                {p}
              </li>
            ))}
            {item.pills.length > 3 ? (
              <li className="rounded-full border border-paper-soft/25 bg-paper-soft/10 px-3 py-1 text-xs font-medium text-paper-soft/90">
                +{item.pills.length - 3}
              </li>
            ) : null}
          </ul>
        ) : (
          <span
            className={cn(
              "mt-3 inline-flex items-center gap-2 text-xs font-medium",
              muted,
            )}
          >
            <span
              className={cn(
                "h-1.5 w-1.5 rounded-full",
                solid ? "bg-paper-soft/60" : "bg-verde",
              )}
            />
            {item.footer}
          </span>
        )}
      </div>
    </div>
  );
}

export function Differentiators() {
  // largura do card responsiva (o leque é em px); altura fixa
  const [cardWidth, setCardWidth] = React.useState(360);
  React.useEffect(() => {
    const calc = () =>
      setCardWidth(Math.min(380, Math.max(264, window.innerWidth - 56)));
    calc();
    window.addEventListener("resize", calc);
    return () => window.removeEventListener("resize", calc);
  }, []);

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
              <SplitText
                text="Mapa não basta. Lista de posto não resolve."
                delay={0.05}
              />
            </h2>
            <p className="mt-4 text-base text-ink-soft sm:text-lg">
              Arraste os cards — ou deixe rolar. Quatro coisas que mudam o jogo.
            </p>
          </div>
        </Reveal>

        <Reveal delay={0.1}>
          <div className="mt-10 sm:mt-12">
            <CardStack<DiffCard>
              items={CARDS}
              initialIndex={0}
              cardWidth={cardWidth}
              cardHeight={410}
              autoAdvance
              intervalMs={3800}
              pauseOnHover
              loop
              showDots
              renderCard={(item) => <DiffPanel item={item} />}
            />
          </div>
        </Reveal>
      </div>
    </section>
  );
}
