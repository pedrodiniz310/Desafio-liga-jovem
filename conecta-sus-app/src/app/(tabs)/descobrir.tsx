import { useMemo } from "react";
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Pressable,
  StyleSheet,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import { Texto } from "@/components/texto";
import { Screen } from "@/components/screen";
import { useTema } from "@/theme/tema";
import type { Cores } from "@/theme/colors";
import { useDescoberta } from "@/lib/queries/use-descoberta";
import { JOACABA, useLocalizacao } from "@/stores/use-localizacao";
import { formatarDistancia } from "@/utils/format";
import type { ResultadoDescoberta } from "@/types/models";

// Altura aproximada da tab bar + safe area bottom
const TAB_BAR_HEIGHT = 84;

export default function DescobrirScreen() {
  const { coordenada } = useLocalizacao();
  const coord = coordenada ?? JOACABA;
  const { data: descobertas, isLoading } = useDescoberta(coord);
  const router = useRouter();
  const { cores } = useTema();
  const styles = useMemo(() => makeStyles(cores), [cores]);

  const windowHeight = Dimensions.get("window").height;
  const cardHeight = windowHeight - TAB_BAR_HEIGHT;

  if (isLoading) {
    return (
      <Screen>
        <View style={styles.loading}>
          <ActivityIndicator color={cores.verde} size="large" />
          <Texto style={styles.loadingTexto}>
            Encontrando serviços que você não conhecia…
          </Texto>
        </View>
      </Screen>
    );
  }

  if (!descobertas || descobertas.length === 0) {
    return (
      <Screen>
        <View style={styles.loading}>
          <Ionicons name="compass-outline" size={52} color={cores.inkFaint} />
          <Texto style={styles.loadingTexto}>
            Nenhuma descoberta disponível perto de você agora.
          </Texto>
        </View>
      </Screen>
    );
  }

  return (
    <Screen topInset={false}>
      <FlatList
        data={descobertas}
        keyExtractor={(item) => String(item.necessidade_id)}
        snapToInterval={cardHeight}
        decelerationRate="fast"
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <DiscoveryCard
            item={item}
            height={cardHeight}
            onVer={
              item.estabelecimento_id != null
                ? () =>
                    router.push({
                      pathname: "/servico/[id]",
                      params: { id: String(item.estabelecimento_id) },
                    })
                : undefined
            }
          />
        )}
      />
    </Screen>
  );
}

function DiscoveryCard({
  item,
  height,
  onVer,
}: {
  item: ResultadoDescoberta;
  height: number;
  onVer?: () => void;
}) {
  const { cores } = useTema();
  const styles = useMemo(() => makeStyles(cores), [cores]);

  return (
    <View style={[styles.card, { height }]}>
      <View style={styles.inner}>
        <View style={styles.topBadge}>
          <Ionicons name="sparkles" size={13} color={cores.verdeBright} />
          <Texto style={styles.badgeTexto}>Você sabia?</Texto>
        </View>

        {item.icone ? (
          <View style={styles.iconCircle}>
            <Ionicons name={item.icone as never} size={38} color="#ffffff" />
          </View>
        ) : null}

        <Texto style={styles.descobertaTexto}>{item.descoberta_texto}</Texto>

        {item.universal ? (
          <View style={styles.universalBadge}>
            <Ionicons name="globe-outline" size={15} color={cores.verdeBright} />
            <Texto style={styles.universalTexto}>
              Vale em qualquer cidade do Brasil
            </Texto>
          </View>
        ) : (
          <>
            <View style={styles.meta}>
              <Texto style={styles.nomeEstab} numberOfLines={2}>
                {item.nome_estabelecimento}
              </Texto>
              <View style={styles.distRow}>
                <Ionicons name="location" size={14} color={cores.verdeBright} />
                <Texto style={styles.dist}>
                  {item.distancia_metros != null
                    ? formatarDistancia(item.distancia_metros)
                    : ""}
                </Texto>
              </View>
            </View>

            <Pressable
              onPress={onVer}
              style={({ pressed }) => [styles.ctaBtn, pressed && { opacity: 0.8 }]}
              accessibilityRole="button"
              accessibilityLabel="Ver como chegar"
            >
              <Texto style={styles.ctaTexto}>Ver como chegar</Texto>
              <Ionicons name="arrow-forward" size={18} color={cores.verdeDeep} />
            </Pressable>
          </>
        )}

        <Texto style={styles.hint}>▲ Deslize para descobrir mais</Texto>
      </View>
    </View>
  );
}

const makeStyles = (cores: Cores) =>
  StyleSheet.create({
    loading: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      gap: 16,
      padding: 40,
    },
    loadingTexto: { fontSize: 15, color: cores.inkSoft, textAlign: "center" },
    card: { backgroundColor: cores.verdeDeep, justifyContent: "center" },
    inner: { padding: 32, gap: 22, alignItems: "center" },
    topBadge: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      backgroundColor: "rgba(255,255,255,0.15)",
      paddingHorizontal: 14,
      paddingVertical: 7,
      borderRadius: 20,
    },
    badgeTexto: { fontSize: 13, fontWeight: "700", color: "#ffffff" },
    iconCircle: {
      width: 88,
      height: 88,
      borderRadius: 44,
      backgroundColor: "rgba(255,255,255,0.18)",
      alignItems: "center",
      justifyContent: "center",
    },
    descobertaTexto: {
      fontSize: 26,
      fontWeight: "900",
      color: "#ffffff",
      textAlign: "center",
      lineHeight: 34,
    },
    universalBadge: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      backgroundColor: "rgba(255,255,255,0.15)",
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderRadius: 18,
    },
    universalTexto: {
      fontSize: 14,
      fontWeight: "700",
      color: "#ffffff",
      textAlign: "center",
    },
    meta: { alignItems: "center", gap: 6 },
    nomeEstab: {
      fontSize: 15,
      fontWeight: "600",
      color: "rgba(255,255,255,0.82)",
      textAlign: "center",
    },
    distRow: { flexDirection: "row", alignItems: "center", gap: 4 },
    dist: { fontSize: 14, fontWeight: "700", color: cores.verdeBright },
    ctaBtn: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      backgroundColor: "#ffffff",
      paddingHorizontal: 28,
      paddingVertical: 15,
      borderRadius: 18,
      marginTop: 8,
    },
    ctaTexto: { fontSize: 16, fontWeight: "800", color: cores.verdeDeep },
    hint: {
      fontSize: 12,
      color: "rgba(255,255,255,0.4)",
      marginTop: 8,
    },
  });
