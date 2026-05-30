import { useRef, useMemo } from "react";
import { Animated, Pressable, StyleSheet, Text } from "react-native";

import { Texto } from "@/components/texto";
import { useTema } from "@/theme/tema";
import type { Cores } from "@/theme/colors";

type NeedChipProps = {
  rotulo: string;
  emoji: string;
  onPress: () => void;
};

export function NeedChip({ rotulo, emoji, onPress }: NeedChipProps) {
  const { cores } = useTema();
  const styles = useMemo(() => makeStyles(cores), [cores]);
  const scale = useRef(new Animated.Value(1)).current;

  const onPressIn = () =>
    Animated.spring(scale, { toValue: 0.93, useNativeDriver: true, speed: 40, bounciness: 0 }).start();
  const onPressOut = () =>
    Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 18, bounciness: 10 }).start();

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <Pressable
        onPress={onPress}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        accessibilityRole="button"
        accessibilityLabel={rotulo}
        style={styles.chip}
      >
        <Text style={styles.emoji}>{emoji}</Text>
        <Texto style={styles.label}>{rotulo}</Texto>
      </Pressable>
    </Animated.View>
  );
}

const makeStyles = (cores: Cores) =>
  StyleSheet.create({
    chip: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      backgroundColor: cores.card,
      borderRadius: 24,
      borderWidth: 1,
      borderColor: cores.line,
      paddingVertical: 10,
      paddingHorizontal: 14,
    },
    emoji: { fontSize: 16 },
    label: {
      fontSize: 14,
      fontWeight: "500",
      color: cores.ink,
    },
  });
