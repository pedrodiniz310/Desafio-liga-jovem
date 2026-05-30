import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as Location from "expo-location";

import { Screen } from "@/components/screen";
import { NeedChip } from "@/components/need-chip";
import { ServiceCard } from "@/components/service-card";
import { Texto } from "@/components/texto";
import { NECESSIDADES_COMUNS } from "@/lib/queries/necessidades-comuns";
import { useBuscaServicos } from "@/lib/queries/use-busca-servicos";
import { JOACABA, useLocalizacao } from "@/stores/use-localizacao";
import { useTema } from "@/theme/tema";
import type { Cores } from "@/theme/colors";

export default function BuscaScreen() {
  const router = useRouter();
  const [texto, setTexto] = useState("");
  const [termo, setTermo] = useState("");

  const { cores, escala } = useTema();
  const styles = useMemo(() => makeStyles(cores), [cores]);

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
        <View style={styles.localRow}>
          <View style={styles.localDot} />
          <Texto style={styles.local}>{municipioNome}</Texto>
        </View>
        <Texto style={styles.titulo}>O que você{"\n"}precisa?</Texto>
      </View>

      {/* campo de busca */}
      <View style={styles.searchBox}>
        <Ionicons name="search" size={20} color={cores.verde} />
        <TextInput
          value={texto}
          onChangeText={setTexto}
          onSubmitEditing={(e) => setTermo(e.nativeEvent.text)}
          placeholder="Ex.: preciso de psicólogo"
          placeholderTextColor={cores.inkFaint}
          returnKeyType="search"
          style={[styles.input, { fontSize: 16 * escala }]}
          accessibilityLabel="Buscar serviço de saúde"
        />
        {texto.length > 0 && (
          <Pressable
            onPress={() => pesquisar("")}
            accessibilityLabel="Limpar busca"
            hitSlop={8}
          >
            <Ionicons name="close-circle" size={20} color={cores.inkFaint} />
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
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Texto style={styles.secao}>Buscas mais comuns</Texto>
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
          <Texto style={styles.dica}>
            Tudo o que aparece aqui é gratuito pelo SUS.
          </Texto>
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
  const { cores } = useTema();
  const styles = useMemo(() => makeStyles(cores), [cores]);

  if (loading) {
    return (
      <View style={styles.estado}>
        <ActivityIndicator color={cores.verde} />
        <Texto style={styles.estadoTexto}>Procurando perto de você…</Texto>
      </View>
    );
  }
  if (error) {
    return (
      <View style={styles.estado}>
        <Ionicons name="cloud-offline-outline" size={36} color={cores.inkFaint} />
        <Texto style={styles.estadoTexto}>
          Não foi possível buscar agora. Verifique a conexão.
        </Texto>
      </View>
    );
  }
  if (dados.length === 0) {
    return (
      <View style={styles.estado}>
        <Ionicons name="search-outline" size={36} color={cores.inkFaint} />
        <Texto style={styles.estadoTexto}>
          Nenhum serviço encontrado por perto. Tente outras palavras.
        </Texto>
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

const makeStyles = (cores: Cores) =>
  StyleSheet.create({
    header: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12 },
    localRow: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 8 },
    localDot: {
      width: 7,
      height: 7,
      borderRadius: 4,
      backgroundColor: cores.verde,
    },
    local: { fontSize: 13, color: cores.verde, fontWeight: "600" },
    titulo: { fontSize: 30, fontWeight: "800", color: cores.ink, lineHeight: 36 },
    searchBox: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      marginHorizontal: 20,
      marginTop: 4,
      marginBottom: 4,
      backgroundColor: cores.card,
      borderRadius: 18,
      paddingHorizontal: 16,
      paddingVertical: 14,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.08,
      shadowRadius: 10,
      elevation: 3,
    },
    input: { flex: 1, fontSize: 16, color: cores.ink },
    scroll: { padding: 20, gap: 14 },
    secao: {
      fontSize: 12,
      fontWeight: "700",
      color: cores.inkFaint,
      textTransform: "uppercase",
      letterSpacing: 1.2,
    },
    chips: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 12,
      justifyContent: "space-between",
    },
    dica: { fontSize: 13, color: cores.inkFaint, marginTop: 4 },
    lista: { padding: 20, gap: 12 },
    estado: { alignItems: "center", justifyContent: "center", padding: 40, gap: 12, flex: 1 },
    estadoTexto: { fontSize: 15, color: cores.inkSoft, textAlign: "center" },
  });
