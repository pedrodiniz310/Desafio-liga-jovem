import { useRef, useMemo } from "react";
import { Animated, Pressable, StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { Texto } from "@/components/texto";
import { useTema } from "@/theme/tema";
import type { Cores } from "@/theme/colors";

type NeedChipProps = {
  rotulo: string;
  icone: string;
  onPress: () => void;
};

export function NeedChip({ rotulo, icone, onPress }: NeedChipProps) {
  const { cores } = useTema();
  const styles = useMemo(() => makeStyles(cores), [cores]);
  const scale = useRef(new Animated.Value(1)).current;

  const onPressIn = () =>
    Animated.spring(scale, { toValue: 0.94, useNativeDriver: true, speed: 40, bounciness: 0 }).start();
  const onPressOut = () =>
    Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 18, bounciness: 10 }).start();

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
        <View style={styles.iconWrap}>
          <Ionicons name={icone as never} size={22} color={cores.verde} />
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
      borderRadius: 20,
      paddingVertical: 14,
      paddingHorizontal: 14,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.07,
      shadowRadius: 8,
      elevation: 2,
    },
    iconWrap: {
      width: 42,
      height: 42,
      borderRadius: 13,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: cores.verdeWash,
      flexShrink: 0,
    },
    label: {
      flex: 1,
      fontSize: 14,
      fontWeight: "600",
      color: cores.ink,
    },
  });
