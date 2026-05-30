import type { ReactNode } from "react";
import { StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { colors } from "@/theme/colors";

type ScreenProps = {
  children: ReactNode;
  /** Aplica o padding-top da safe area (útil em telas sem header). */
  topInset?: boolean;
};

/** Container base das telas — fundo creme + safe area. */
export function Screen({ children, topInset = true }: ScreenProps) {
  const insets = useSafeAreaInsets();
  return (
    <View
      style={[
        styles.container,
        topInset && { paddingTop: insets.top },
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.paper,
  },
});
