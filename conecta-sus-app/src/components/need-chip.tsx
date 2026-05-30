import { useRef, useMemo } from "react";
import { Animated, Pressable, StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { Texto } from "@/components/texto";
import { useTema } from "@/theme/tema";
import type { Cores } from "@/theme/colors";

type NeedChipProps = {
  rotulo: string;
  icone: string;
  cor: string;
  onPress: () => void;
};

export function NeedChip({ rotulo, icone, cor, onPress }: NeedChipProps) {
  const { cores } = useTema();
  const styles = useMemo(() => makeStyles(cores), [cores]);
  const scale = useRef(new Animated.Value(1)).current;

  const onPressIn = () =>
    Animated.spring(scale, { toValue: 0.93, useNativeDriver: true, speed: 40, bounciness: 0 }).start();
  const onPressOut = () =>
    Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 18, bounciness: 10 }).start();

  // ícone bg = cor com 15% opacidade (hex + "26")
  const iconBg = cor + "26";

  return (
    <Animated.View style={[styles.wrap, { transform: [{ scale }] }]}>
      <Pressable
        onPress={onPress}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        accessibilityRole="button"
        accessibilityLabel={rotulo}
        style={styles.chip}
      >
        <View style={[styles.iconWrap, { backgroundColor: iconBg }]}>
          <Ionicons name={icone as never} size={22} color={cor} />
        </View>
        <Texto style={styles.label} numberOfLines={2}>{rotulo}</Texto>
      </Pressable>
    </Animated.View>
  );
}

const makeStyles = (cores: Cores) =>
  StyleSheet.create({
    wrap: { width: "47%" },
    chip: {
      flexDirection: "row",
      alignItems: "center",
      minHeight: 70,
      gap: 12,
      backgroundColor: cores.card,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: cores.line,
      paddingVertical: 14,
      paddingHorizontal: 14,
    },
    iconWrap: {
      width: 42,
      height: 42,
      borderRadius: 13,
      alignItems: "center",
      justifyContent: "center",
      flexShrink: 0,
    },
    label: {
      flex: 1,
      fontSize: 14,
      fontWeight: "600",
      color: cores.ink,
      lineHeight: 19,
    },
  });
