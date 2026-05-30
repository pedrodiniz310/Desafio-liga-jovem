import { StyleSheet, Text, type TextProps } from "react-native";

import { useTema } from "@/theme/tema";

/**
 * Wrapper de `Text` que respeita as preferências de acessibilidade:
 * aplica a escala de fonte e usa a cor de texto do tema por padrão.
 */
export function Texto({ style, ...props }: TextProps) {
  const { cores, escala } = useTema();
  const flat = StyleSheet.flatten(style) as { fontSize?: number } | undefined;
  const fontSize = (flat?.fontSize ?? 15) * escala;

  return <Text {...props} style={[{ color: cores.ink }, style, { fontSize }]} />;
}
