import { useMemo } from "react";
import { Pressable, StyleSheet, View } from "react-native";
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

/** Card de resultado de busca de serviço. */
export function ServiceCard({ servico, onPress }: ServiceCardProps) {
  const { cores } = useTema();
  const styles = useMemo(() => makeStyles(cores), [cores]);
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${servico.nome}, a ${formatarDistancia(servico.distancia_metros)}`}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
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
          <View style={styles.metaItem}>
            <Ionicons name="location-outline" size={13} color={cores.inkFaint} />
            <Texto style={styles.metaText}>
              {formatarDistancia(servico.distancia_metros)}
            </Texto>
          </View>
          {servico.horario ? (
            <View style={styles.metaItem}>
              <Ionicons name="time-outline" size={13} color={cores.inkFaint} />
              <Texto style={styles.metaText} numberOfLines={1}>
                {servico.horario}
              </Texto>
            </View>
          ) : null}
        </View>
      </View>
      <Ionicons name="chevron-forward" size={20} color={cores.inkFaint} />
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
      borderWidth: 1,
      borderColor: cores.line,
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
      backgroundColor: cores.verdeWash,
    },
    body: { flex: 1, gap: 2 },
    nome: { fontSize: 15, fontWeight: "700", color: cores.ink },
    endereco: { fontSize: 13, color: cores.inkSoft },
    metaRow: { flexDirection: "row", gap: 14, marginTop: 4 },
    metaItem: { flexDirection: "row", alignItems: "center", gap: 4, flexShrink: 1 },
    metaText: { fontSize: 12, color: cores.inkFaint },
  });
