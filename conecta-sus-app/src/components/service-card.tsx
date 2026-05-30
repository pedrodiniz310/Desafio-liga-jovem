import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { colors } from "@/theme/colors";
import { formatarDistancia } from "@/utils/format";
import type { ResultadoBusca } from "@/types/models";

type ServiceCardProps = {
  servico: ResultadoBusca;
  onPress: () => void;
};

/** Card de resultado de busca de serviço. */
export function ServiceCard({ servico, onPress }: ServiceCardProps) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${servico.nome}, a ${formatarDistancia(servico.distancia_metros)}`}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      <View style={styles.iconWrap}>
        <Ionicons name="medkit-outline" size={22} color={colors.verde} />
      </View>
      <View style={styles.body}>
        <Text style={styles.nome} numberOfLines={1}>
          {servico.nome}
        </Text>
        {servico.endereco ? (
          <Text style={styles.endereco} numberOfLines={1}>
            {servico.endereco}
          </Text>
        ) : null}
        <View style={styles.metaRow}>
          <View style={styles.metaItem}>
            <Ionicons name="location-outline" size={13} color={colors.inkFaint} />
            <Text style={styles.metaText}>
              {formatarDistancia(servico.distancia_metros)}
            </Text>
          </View>
          {servico.horario ? (
            <View style={styles.metaItem}>
              <Ionicons name="time-outline" size={13} color={colors.inkFaint} />
              <Text style={styles.metaText} numberOfLines={1}>
                {servico.horario}
              </Text>
            </View>
          ) : null}
        </View>
      </View>
      <Ionicons name="chevron-forward" size={20} color={colors.inkFaint} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 18,
    padding: 14,
  },
  pressed: { opacity: 0.7 },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.verdeWash,
  },
  body: { flex: 1, gap: 2 },
  nome: { fontSize: 15, fontWeight: "700", color: colors.ink },
  endereco: { fontSize: 13, color: colors.inkSoft },
  metaRow: { flexDirection: "row", gap: 14, marginTop: 4 },
  metaItem: { flexDirection: "row", alignItems: "center", gap: 4, flexShrink: 1 },
  metaText: { fontSize: 12, color: colors.inkFaint },
});
