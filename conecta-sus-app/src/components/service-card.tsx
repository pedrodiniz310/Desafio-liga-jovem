import { useRef, useMemo } from "react";
import { Animated, Pressable, StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { Texto } from "@/components/texto";
import { useTema } from "@/theme/tema";
import type { Cores } from "@/theme/colors";
import { formatarDistancia } from "@/utils/format";
import type { ResultadoBusca } from "@/types/models";

type ServiceCardProps = {
  servico: ResultadoBusca;
  onPress: () => void;
};

export function ServiceCard({ servico, onPress }: ServiceCardProps) {
  const { cores } = useTema();
  const styles = useMemo(() => makeStyles(cores), [cores]);
  const scale = useRef(new Animated.Value(1)).current;

  const onPressIn = () =>
    Animated.spring(scale, { toValue: 0.97, useNativeDriver: true, speed: 40, bounciness: 0 }).start();
  const onPressOut = () =>
    Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 18, bounciness: 8 }).start();

  return (
    <Pressable
      onPress={onPress}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      accessibilityRole="button"
      accessibilityLabel={`${servico.nome}, a ${formatarDistancia(servico.distancia_metros)}`}
    >
      <Animated.View style={[styles.card, { transform: [{ scale }] }]}>
        <View style={styles.iconWrap}>
          <Ionicons name="medkit-outline" size={22} color={cores.verde} />
        </View>
        <View style={styles.body}>
          <Texto style={styles.nome} numberOfLines={1}>
            {servico.nome}
          </Texto>
          {servico.endereco ? (
            <Texto style={styles.endereco} numberOfLines={1}>
              {servico.endereco}
            </Texto>
          ) : null}
          <View style={styles.metaRow}>
            <View style={styles.distBadge}>
              <Ionicons name="location" size={11} color={cores.verde} />
              <Texto style={styles.distText}>
                {formatarDistancia(servico.distancia_metros)}
              </Texto>
            </View>
            {servico.horario ? (
              <View style={styles.metaItem}>
                <Ionicons name="time-outline" size={12} color={cores.inkFaint} />
                <Texto style={styles.metaText} numberOfLines={1}>
                  {servico.horario}
                </Texto>
              </View>
            ) : null}
          </View>
        </View>
        <Ionicons name="chevron-forward" size={18} color={cores.line} />
      </Animated.View>
    </Pressable>
  );
}

const makeStyles = (cores: Cores) =>
  StyleSheet.create({
    card: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      backgroundColor: cores.card,
      borderRadius: 20,
      padding: 14,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.07,
      shadowRadius: 8,
      elevation: 2,
    },
    iconWrap: {
      width: 46,
      height: 46,
      borderRadius: 15,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: cores.verdeWash,
    },
    body: { flex: 1, gap: 3 },
    nome: { fontSize: 15, fontWeight: "700", color: cores.ink },
    endereco: { fontSize: 13, color: cores.inkSoft },
    metaRow: { flexDirection: "row", alignItems: "center", gap: 10, marginTop: 4 },
    distBadge: {
      flexDirection: "row",
      alignItems: "center",
      gap: 3,
      backgroundColor: cores.verdeWash,
      paddingHorizontal: 7,
      paddingVertical: 3,
      borderRadius: 8,
    },
    distText: { fontSize: 11, fontWeight: "700", color: cores.verde },
    metaItem: { flexDirection: "row", alignItems: "center", gap: 3, flexShrink: 1 },
    metaText: { fontSize: 12, color: cores.inkFaint },
  });
