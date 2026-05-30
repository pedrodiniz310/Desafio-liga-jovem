import { useMemo } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { Texto } from "@/components/texto";
import { useTema } from "@/theme/tema";
import type { Cores } from "@/theme/colors";

type NeedChipProps = {
  rotulo: string;
  icone: string;
  onPress: () => void;
};

/** Atalho de necessidade comum exibido na home. */
export function NeedChip({ rotulo, icone, onPress }: NeedChipProps) {
  const { cores } = useTema();
  const styles = useMemo(() => makeStyles(cores), [cores]);
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={rotulo}
      style={({ pressed }) => [styles.chip, pressed && styles.pressed]}
    >
      <View style={styles.iconWrap}>
        <Ionicons name={icone as never} size={22} color={cores.verde} />
      </View>
      <Texto style={styles.label}>{rotulo}</Texto>
    </Pressable>
  );
}

const makeStyles = (cores: Cores) =>
  StyleSheet.create({
    chip: {
      width: "47%",
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      backgroundColor: cores.card,
      borderWidth: 1,
      borderColor: cores.line,
      borderRadius: 18,
      paddingVertical: 14,
      paddingHorizontal: 14,
    },
    pressed: {
      opacity: 0.7,
      transform: [{ scale: 0.98 }],
    },
    iconWrap: {
      width: 40,
      height: 40,
      borderRadius: 12,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: cores.verdeWash,
    },
    label: {
      flex: 1,
      fontSize: 15,
      fontWeight: "600",
      color: cores.ink,
    },
  });
