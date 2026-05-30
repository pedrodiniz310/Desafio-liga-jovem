import { StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { Screen } from "@/components/screen";
import { colors } from "@/theme/colors";

export default function SalvosScreen() {
  return (
    <Screen>
      <View style={styles.header}>
        <Text style={styles.titulo}>Salvos</Text>
      </View>
      <View style={styles.empty}>
        <View style={styles.iconWrap}>
          <Ionicons name="bookmark-outline" size={32} color={colors.verde} />
        </View>
        <Text style={styles.emptyTitulo}>Nada salvo ainda</Text>
        <Text style={styles.emptyTexto}>
          Toque no marcador de um serviço para guardá-lo aqui e encontrar rápido
          depois.
        </Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 8 },
  titulo: { fontSize: 26, fontWeight: "800", color: colors.ink },
  empty: { flex: 1, alignItems: "center", justifyContent: "center", padding: 40, gap: 12 },
  iconWrap: {
    width: 72,
    height: 72,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.verdeWash,
  },
  emptyTitulo: { fontSize: 18, fontWeight: "700", color: colors.ink },
  emptyTexto: { fontSize: 15, color: colors.inkSoft, textAlign: "center", lineHeight: 22 },
});
