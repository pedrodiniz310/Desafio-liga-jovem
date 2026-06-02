import { useEffect } from "react";
import { Modal, Pressable, StyleSheet, View } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withSequence,
  withDelay,
} from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import { Texto } from "@/components/texto";
import { Pingo } from "@/components/pingo";

interface Props {
  visivel: boolean;
  titulo?: string;
  badgeNome: string;
  badgeIcone: string;
  badgeDescricao: string;
  onFechar: () => void;
}

// Componente isolado para cada partícula — hooks usados no nível correto
function Estrela({ index, visivel }: { index: number; visivel: boolean }) {
  const angulo = (index / 6) * Math.PI * 2;
  const raio = 90;
  const tx = Math.cos(angulo) * raio;
  const ty = Math.sin(angulo) * raio;

  const op = useSharedValue(0);
  const tr = useSharedValue(0);

  useEffect(() => {
    if (visivel) {
      op.value = withDelay(
        index * 60,
        withSequence(
          withTiming(1, { duration: 200 }),
          withDelay(500, withTiming(0, { duration: 300 }))
        )
      );
      tr.value = withDelay(index * 60, withSpring(1, { damping: 10, stiffness: 120 }));
    } else {
      op.value = 0;
      tr.value = 0;
    }
  }, [visivel, index, op, tr]);

  const estilo = useAnimatedStyle(() => ({
    opacity: op.value,
    transform: [
      { translateX: tx * tr.value },
      { translateY: ty * tr.value },
    ],
  }));

  return (
    <Animated.View style={[StyleSheet.absoluteFill, { alignItems: "center", justifyContent: "center" }, estilo]}>
      <Ionicons name="star" size={14} color="#e0a23f" />
    </Animated.View>
  );
}

export function BadgeCelebracao({
  visivel,
  titulo = "🏆 Badge conquistado!",
  badgeNome,
  badgeDescricao,
  onFechar,
}: Props) {
  const escala = useSharedValue(0);
  const opacidadeFundo = useSharedValue(0);

  useEffect(() => {
    if (visivel) {
      opacidadeFundo.value = withTiming(1, { duration: 200 });
      escala.value = withSequence(
        withSpring(1.1, { damping: 7, stiffness: 180 }),
        withSpring(1.0, { damping: 14, stiffness: 200 })
      );
    } else {
      escala.value = withTiming(0, { duration: 150 });
      opacidadeFundo.value = withTiming(0, { duration: 200 });
    }
  }, [visivel, escala, opacidadeFundo]);

  const estiloCard = useAnimatedStyle(() => ({
    transform: [{ scale: escala.value }],
  }));

  const estiloFundo = useAnimatedStyle(() => ({
    opacity: opacidadeFundo.value,
  }));

  return (
    <Modal visible={visivel} transparent animationType="none" onRequestClose={onFechar}>
      <Animated.View style={[styles.fundo, estiloFundo]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onFechar} />

        {/* Partículas de estrela */}
        <View style={styles.estrelaContainer} pointerEvents="none">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <Estrela key={i} index={i} visivel={visivel} />
          ))}
        </View>

        <Animated.View style={[styles.card, estiloCard]}>
          <Pingo pose="acenando" size={112} />
          <Texto style={styles.conquista}>{titulo}</Texto>
          <Texto style={styles.nome}>{badgeNome}</Texto>
          <Texto style={styles.descricao}>{badgeDescricao}</Texto>
          <Pressable
            onPress={onFechar}
            accessibilityRole="button"
            accessibilityLabel="Fechar celebração"
            style={({ pressed }) => [styles.btn, pressed && { opacity: 0.88 }]}
          >
            <Texto style={styles.btnTexto}>Incrível! 🎉</Texto>
          </Pressable>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  fundo: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.55)",
    alignItems: "center",
    justifyContent: "center",
  },
  estrelaContainer: {
    position: "absolute",
    width: 1,
    height: 1,
    alignSelf: "center",
  },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 28,
    padding: 32,
    marginHorizontal: 40,
    alignItems: "center",
    gap: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 12,
  },
  conquista: { fontSize: 13, color: "#6b7c76", fontWeight: "600", letterSpacing: 0.5 },
  nome: { fontSize: 22, fontWeight: "800", color: "#16241f", textAlign: "center" },
  descricao: { fontSize: 14, color: "#6b7c76", textAlign: "center", lineHeight: 20 },
  btn: {
    backgroundColor: "#0d6a51",
    paddingHorizontal: 36, paddingVertical: 14,
    borderRadius: 20, marginTop: 8,
  },
  btnTexto: { fontSize: 16, fontWeight: "800", color: "#ffffff" },
});
