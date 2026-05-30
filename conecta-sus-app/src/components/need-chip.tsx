import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { colors } from "@/theme/colors";

type NeedChipProps = {
  rotulo: string;
  icone: string;
  onPress: () => void;
};

/** Atalho de necessidade comum exibido na home. */
export function NeedChip({ rotulo, icone, onPress }: NeedChipProps) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={rotulo}
      style={({ pressed }) => [styles.chip, pressed && styles.pressed]}
    >
      <View style={styles.iconWrap}>
        <Ionicons name={icone as never} size={22} color={colors.verde} />
      </View>
      <Text style={styles.label}>{rotulo}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    width: "47%",
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.line,
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
    backgroundColor: colors.verdeWash,
  },
  label: {
    flex: 1,
    fontSize: 15,
    fontWeight: "600",
    color: colors.ink,
  },
});
