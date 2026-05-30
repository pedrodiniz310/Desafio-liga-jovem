import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as Location from "expo-location";

import { Screen } from "@/components/screen";
import { NeedChip } from "@/components/need-chip";
import { ServiceCard } from "@/components/service-card";
import { NECESSIDADES_COMUNS } from "@/lib/queries/necessidades-comuns";
import { useBuscaServicos } from "@/lib/queries/use-busca-servicos";
import { JOACABA, useLocalizacao } from "@/stores/use-localizacao";
import { colors } from "@/theme/colors";

export default function BuscaScreen() {
  const router = useRouter();
  const [texto, setTexto] = useState("");
  const [termo, setTermo] = useState("");

  const { coordenada, municipioNome, setCoordenada, setPermissaoNegada } =
    useLocalizacao();
  const coord = coordenada ?? JOACABA;

  // pede localização ao abrir; usa Joaçaba como fallback
  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") {
          setPermissaoNegada(true);
          return;
        }
        const pos = await Location.getCurrentPositionAsync({});
        setCoordenada({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      } catch {
        setPermissaoNegada(true);
      }
    })();
  }, [setCoordenada, setPermissaoNegada]);

  const busca = useBuscaServicos({ termo, coordenada: coord });
  const buscando = termo.trim().length > 1;

  function pesquisar(valor: string) {
    setTexto(valor);
    setTermo(valor);
  }

  return (
    <Screen>
      {/* cabeçalho */}
      <View style={styles.header}>
        <Text style={styles.titulo}>O que você precisa?</Text>
        <View style={styles.localRow}>
          <Ionicons name="location" size={14} color={colors.verde} />
          <Text style={styles.local}>{municipioNome}</Text>
        </View>
      </View>

      {/* campo de busca */}
      <View style={styles.searchBox}>
        <Ionicons name="search" size={20} color={colors.verde} />
        <TextInput
          value={texto}
          onChangeText={setTexto}
          onSubmitEditing={(e) => setTermo(e.nativeEvent.text)}
          placeholder="Ex.: preciso de psicólogo"
          placeholderTextColor={colors.inkFaint}
          returnKeyType="search"
          style={styles.input}
          accessibilityLabel="Buscar serviço de saúde"
        />
        {texto.length > 0 && (
          <Pressable
            onPress={() => pesquisar("")}
            accessibilityLabel="Limpar busca"
            hitSlop={8}
          >
            <Ionicons name="close-circle" size={20} color={colors.inkFaint} />
          </Pressable>
        )}
      </View>

      {buscando ? (
        <Resultados
          loading={busca.isLoading}
          error={busca.isError}
          dados={busca.data ?? []}
          onAbrir={(id) =>
            router.push({
              pathname: "/servico/[id]",
              params: { id: String(id) },
            })
          }
        />
      ) : (
        <ScrollView contentContainerStyle={styles.scroll}>
          <Text style={styles.secao}>Buscas mais comuns</Text>
          <View style={styles.chips}>
            {NECESSIDADES_COMUNS.map((n) => (
              <NeedChip
                key={n.slug}
                rotulo={n.rotulo}
                icone={n.icone}
                onPress={() => pesquisar(n.rotulo)}
              />
            ))}
          </View>
          <Text style={styles.dica}>
            Tudo o que aparece aqui é gratuito pelo SUS.
          </Text>
        </ScrollView>
      )}
    </Screen>
  );
}

function Resultados({
  loading,
  error,
  dados,
  onAbrir,
}: {
  loading: boolean;
  error: boolean;
  dados: import("@/types/models").ResultadoBusca[];
  onAbrir: (id: number) => void;
}) {
  if (loading) {
    return (
      <View style={styles.estado}>
        <ActivityIndicator color={colors.verde} />
        <Text style={styles.estadoTexto}>Procurando perto de você…</Text>
      </View>
    );
  }
  if (error) {
    return (
      <View style={styles.estado}>
        <Ionicons name="cloud-offline-outline" size={36} color={colors.inkFaint} />
        <Text style={styles.estadoTexto}>
          Não foi possível buscar agora. Verifique a conexão.
        </Text>
      </View>
    );
  }
  if (dados.length === 0) {
    return (
      <View style={styles.estado}>
        <Ionicons name="search-outline" size={36} color={colors.inkFaint} />
        <Text style={styles.estadoTexto}>
          Nenhum serviço encontrado por perto. Tente outras palavras.
        </Text>
      </View>
    );
  }
  return (
    <FlatList
      data={dados}
      keyExtractor={(item) => String(item.estabelecimento_id)}
      contentContainerStyle={styles.lista}
      renderItem={({ item }) => (
        <ServiceCard
          servico={item}
          onPress={() => onAbrir(item.estabelecimento_id)}
        />
      )}
    />
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 8 },
  titulo: { fontSize: 26, fontWeight: "800", color: colors.ink },
  localRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 4 },
  local: { fontSize: 13, color: colors.inkSoft, fontWeight: "500" },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginHorizontal: 20,
    marginTop: 8,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  input: { flex: 1, fontSize: 16, color: colors.ink },
  scroll: { padding: 20, gap: 14 },
  secao: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.inkSoft,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  chips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    justifyContent: "space-between",
  },
  dica: { fontSize: 13, color: colors.inkFaint, marginTop: 4 },
  lista: { padding: 20, gap: 12 },
  estado: { alignItems: "center", justifyContent: "center", padding: 40, gap: 12, flex: 1 },
  estadoTexto: { fontSize: 15, color: colors.inkSoft, textAlign: "center" },
});
