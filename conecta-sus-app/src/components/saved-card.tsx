import { useMemo } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { Texto } from "@/components/texto";
import { useTema } from "@/theme/tema";
import type { Cores } from "@/theme/colors";
import type { ServicoSalvo } from "@/stores/use-favoritos";

type SavedCardProps = {
  servico: ServicoSalvo;
  onPress: () => void;
  onRemover: () => void;
};

/**
 * Card da aba Salvos — sem distância (que depende da localização atual).
 * A área principal (toque abre o serviço) e o botão de remover são IRMÃOS,
 * nunca aninhados — senão o RN Web gera `<button>` dentro de `<button>`.
 */
export function SavedCard({ servico, onPress, onRemover }: SavedCardProps) {
  const { cores } = useTema();
  const styles = useMemo(() => makeStyles(cores), [cores]);
  return (
    <View style={styles.card}>
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={servico.nome}
        style={({ pressed }) => [styles.main, pressed && styles.pressed]}
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
          {servico.horario ? (
            <View style={styles.metaItem}>
              <Ionicons name="time-outline" size={13} color={cores.inkFaint} />
              <Texto style={styles.metaText} numberOfLines={1}>
                {servico.horario}
              </Texto>
            </View>
          ) : null}
        </View>
      </Pressable>
      <Pressable
        onPress={onRemover}
        accessibilityRole="button"
        accessibilityLabel={`Remover ${servico.nome} dos salvos`}
        hitSlop={10}
        style={({ pressed }) => [styles.remover, pressed && { opacity: 0.6 }]}
      >
        <Ionicons name="bookmark" size={22} color={cores.verde} />
      </Pressable>
    </View>
  );
}

const makeStyles = (cores: Cores) =>
  StyleSheet.create({
    card: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      backgroundColor: cores.card,
      borderWidth: 1,
      borderColor: cores.line,
      borderRadius: 18,
      paddingHorizontal: 14,
      paddingVertical: 10,
    },
    main: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      paddingVertical: 4,
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
    metaItem: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 4 },
    metaText: { fontSize: 12, color: cores.inkFaint },
    remover: {
      width: 40,
      height: 40,
      alignItems: "center",
      justifyContent: "center",
    },
  });
