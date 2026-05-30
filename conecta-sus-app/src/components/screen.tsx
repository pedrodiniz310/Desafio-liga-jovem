import type { ReactNode } from "react";
import { useMemo } from "react";
import { StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useTema } from "@/theme/tema";
import type { Cores } from "@/theme/colors";

type ScreenProps = {
  children: ReactNode;
  /** Aplica o padding-top da safe area (útil em telas sem header). */
  topInset?: boolean;
};

/** Container base das telas — fundo creme + safe area. */
export function Screen({ children, topInset = true }: ScreenProps) {
  const insets = useSafeAreaInsets();
  const { cores } = useTema();
  const styles = useMemo(() => makeStyles(cores), [cores]);
  return (
    <View style={[styles.container, topInset && { paddingTop: insets.top }]}>
      {children}
    </View>
  );
}

const makeStyles = (cores: Cores) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: cores.paper,
    },
  });
