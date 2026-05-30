import { useMemo } from "react";
import { FlatList, StyleSheet, View } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import { Screen } from "@/components/screen";
import { SavedCard } from "@/components/saved-card";
import { Texto } from "@/components/texto";
import { useFavoritos } from "@/stores/use-favoritos";
import { useTema } from "@/theme/tema";
import type { Cores } from "@/theme/colors";

export default function SalvosScreen() {
  const router = useRouter();
  const { itens, remover } = useFavoritos();
  const { cores } = useTema();
  const styles = useMemo(() => makeStyles(cores), [cores]);

  return (
    <Screen>
      <View style={styles.header}>
        <Texto style={styles.titulo}>Salvos</Texto>
      </View>

      {itens.length === 0 ? (
        <View style={styles.empty}>
          <View style={styles.iconWrap}>
            <Ionicons name="bookmark-outline" size={32} color={cores.verde} />
          </View>
          <Texto style={styles.emptyTitulo}>Nada salvo ainda</Texto>
          <Texto style={styles.emptyTexto}>
            Toque no marcador de um serviço para guardá-lo aqui e encontrar
            rápido depois.
          </Texto>
        </View>
      ) : (
        <FlatList
          data={itens}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.lista}
          renderItem={({ item }) => (
            <SavedCard
              servico={item}
              onPress={() =>
                router.push({
                  pathname: "/servico/[id]",
                  params: { id: String(item.id) },
                })
              }
              onRemover={async () => await remover(item.id)}
            />
          )}
        />
      )}
    </Screen>
  );
}

const makeStyles = (cores: Cores) =>
  StyleSheet.create({
    header: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 8 },
    titulo: { fontSize: 26, fontWeight: "800", color: cores.ink },
    lista: { padding: 20, gap: 12 },
    empty: { flex: 1, alignItems: "center", justifyContent: "center", padding: 40, gap: 12 },
    iconWrap: {
      width: 72,
      height: 72,
      borderRadius: 24,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: cores.verdeWash,
    },
    emptyTitulo: { fontSize: 18, fontWeight: "700", color: cores.ink },
    emptyTexto: { fontSize: 15, color: cores.inkSoft, textAlign: "center", lineHeight: 22 },
  });
