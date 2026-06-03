import { useMemo } from "react";
import { Platform, View } from "react-native";
import { SvgXml } from "react-native-svg";

import { PINGO_ART, PINGO_RATIO, type PingoSvgPose } from "./pingo-art";

// Lottie só no nativo (no RN-web a animação é instável e pode quebrar o bundle).
// No web cai no SVG estático (mesma identidade), o que mantém Playwright/Vercel ok.
// eslint-disable-next-line @typescript-eslint/no-require-imports
const LottieView = Platform.OS === "web" ? null : require("lottie-react-native").default;

export type PingoPose =
  | "acenando"
  | "apontando"
  | "checklist"
  | "icone"
  | "chegando"
  | "flutuando";

// Animações Lottie (400×480, 60fps) por pose.
const LOTTIE: Record<PingoPose, unknown> = {
  acenando: require("./mascote/lottie/pingo-acenando.json"),
  apontando: require("./mascote/lottie/pingo-por-aqui.json"),
  checklist: require("./mascote/lottie/pingo-checklist.json"),
  icone: require("./mascote/lottie/pingo-flutuando.json"),
  flutuando: require("./mascote/lottie/pingo-flutuando.json"),
  chegando: require("./mascote/lottie/pingo-chegando.json"),
};

// Fallback estático (web) → arte SVG mais próxima de cada pose.
const SVG_FALLBACK: Record<PingoPose, PingoSvgPose> = {
  acenando: "acenando",
  apontando: "apontando",
  checklist: "checklist",
  icone: "icone",
  flutuando: "icone",
  chegando: "acenando",
};

const ROTULO: Record<PingoPose, string> = {
  acenando: "Pingo, o mascote do Tem no SUS, acenando",
  apontando: "Pingo apontando o caminho",
  checklist: "Pingo segurando uma lista do que levar",
  icone: "Pingo",
  chegando: "Pingo chegando",
  flutuando: "Pingo",
};

const LOTTIE_RATIO = 480 / 400; // altura/largura das animações

interface PingoProps {
  pose?: PingoPose;
  /** Largura em px; a altura é derivada mantendo a proporção. */
  size?: number;
  /** Repetir a animação (só nativo). Default true. */
  loop?: boolean;
  accessibilityLabel?: string;
}

/**
 * Mascote Pingo. No celular renderiza a animação Lottie; no web, o SVG estático.
 */
export function Pingo({ pose = "acenando", size = 96, loop = true, accessibilityLabel }: PingoProps) {
  const a11y = {
    accessible: true,
    accessibilityRole: "image" as const,
    accessibilityLabel: accessibilityLabel ?? ROTULO[pose],
  };

  // Web: SVG estático.
  if (Platform.OS === "web" || !LottieView) {
    const svgPose = SVG_FALLBACK[pose];
    return (
      <PingoBox {...a11y} size={size} ratio={PINGO_RATIO[svgPose]}>
        <SvgXml xml={PINGO_ART[svgPose]} width="100%" height="100%" />
      </PingoBox>
    );
  }

  // Nativo: animação Lottie.
  return (
    <PingoBox {...a11y} size={size} ratio={LOTTIE_RATIO}>
      <LottieView source={LOTTIE[pose]} autoPlay loop={loop} style={{ width: "100%", height: "100%" }} />
    </PingoBox>
  );
}

function PingoBox({
  size,
  ratio,
  children,
  ...a11y
}: {
  size: number;
  ratio: number;
  children: React.ReactNode;
  accessible?: boolean;
  accessibilityRole?: "image";
  accessibilityLabel?: string;
}) {
  const height = useMemo(() => Math.round(size * ratio), [size, ratio]);
  return (
    <View {...a11y} style={{ width: size, height }}>
      {children}
    </View>
  );
}
