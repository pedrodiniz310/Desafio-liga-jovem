import { useMemo } from "react";
import { View } from "react-native";
import { SvgXml } from "react-native-svg";

import { PINGO_ART, PINGO_RATIO, type PingoPose } from "./pingo-art";

interface PingoProps {
  /** Pose do mascote. */
  pose?: PingoPose;
  /** Largura em px; a altura é derivada do viewBox da pose (sem distorcer). */
  size?: number;
  accessibilityLabel?: string;
}

const ROTULO: Record<PingoPose, string> = {
  acenando: "Pingo, o mascote do Tem no SUS, acenando",
  apontando: "Pingo apontando o caminho",
  checklist: "Pingo segurando uma lista do que levar",
  icone: "Pingo",
};

/**
 * Mascote Pingo — o pin de localização do app personificado.
 * Renderiza SVG vetorial (react-native-svg), nítido em qualquer tamanho.
 */
export function Pingo({ pose = "acenando", size = 96, accessibilityLabel }: PingoProps) {
  const xml = PINGO_ART[pose];
  const height = useMemo(() => Math.round(size * PINGO_RATIO[pose]), [size, pose]);

  return (
    <View
      accessible
      accessibilityRole="image"
      accessibilityLabel={accessibilityLabel ?? ROTULO[pose]}
      style={{ width: size, height }}
    >
      <SvgXml xml={xml} width="100%" height="100%" />
    </View>
  );
}
