import { Component, type ReactNode } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}
interface State {
  hasError: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  reset = () => this.setState({ hasError: false });

  render() {
    if (!this.state.hasError) return this.props.children;
    if (this.props.fallback) return this.props.fallback;
    return <FallbackTela onReset={this.reset} />;
  }
}

export function FallbackTela({ onReset }: { onReset: () => void }) {
  return (
    <View style={styles.container}>
      <Ionicons name="alert-circle-outline" size={52} color="#d65a3c" />
      <Text style={styles.titulo}>Algo deu errado</Text>
      <Text style={styles.sub}>
        O app encontrou um problema inesperado. Suas informações estão salvas.
      </Text>
      <Pressable
        style={styles.btn}
        onPress={onReset}
        accessibilityRole="button"
        accessibilityLabel="Tentar novamente"
      >
        <Ionicons name="refresh-outline" size={18} color="#ffffff" />
        <Text style={styles.btnTexto}>Tentar novamente</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 40,
    gap: 16,
    backgroundColor: "#f5f5f0",
  },
  titulo: {
    fontSize: 22,
    fontWeight: "800",
    color: "#16241f",
    textAlign: "center",
  },
  sub: {
    fontSize: 15,
    color: "#6b7c76",
    textAlign: "center",
    lineHeight: 22,
  },
  btn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#0d6a51",
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 16,
    marginTop: 8,
  },
  btnTexto: { fontSize: 15, fontWeight: "700", color: "#ffffff" },
});
