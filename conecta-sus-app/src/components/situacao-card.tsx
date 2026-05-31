import { useMemo } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { Texto } from "@/components/texto";
import { useTema } from "@/theme/tema";
import type { Cores } from "@/theme/colors";
import type { Jornada } from "@/types/models";

type Props = {
  jornada: Jornada;
  onPress: () => void;
};

export function SituacaoCard({ jornada, onPress }: Props) {
  const { cores } = useTema();
  const styles = useMemo(() => makeStyles(cores), [cores]);

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={jornada.titulo}
      style={({ pressed }) => [
        styles.card,
        { backgroundColor: jornada.cor },
        pressed && { opacity: 0.82 },
      ]}
    >
      <View style={styles.iconWrap}>
        <Ionicons name={jornada.icone as never} size={20} color={cores.verdeDeep} />
      </View>
      <Texto style={styles.titulo} numberOfLines={2}>
        {jornada.titulo}
      </Texto>
      <Texto style={styles.passos}>{jornada.passos.length} passos</Texto>
    </Pressable>
  );
}

const makeStyles = (cores: Cores) =>
  StyleSheet.create({
    card: {
      width: 136,
      padding: 14,
      borderRadius: 18,
      gap: 8,
    },
    iconWrap: {
      width: 40,
      height: 40,
      borderRadius: 12,
      backgroundColor: "rgba(255,255,255,0.55)",
      alignItems: "center",
      justifyContent: "center",
    },
    titulo: {
      fontSize: 13,
      fontWeight: "700",
      color: cores.verdeDeep,
      lineHeight: 18,
    },
    passos: {
      fontSize: 11,
      color: cores.inkSoft,
      fontWeight: "500",
    },
  });
