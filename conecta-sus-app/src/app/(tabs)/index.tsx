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
import type { ResultadoBusca } from "@/types/models";

const SUGESTOES_VAZIAS = [
  { rotulo: "psicólogo",        icone: "happy-outline"   as const },
  { rotulo: "dentista",         icone: "medical-outline" as const },
  { rotulo: "remédio de graça", icone: "bandage-outline" as const },
  { rotulo: "fisioterapia",     icone: "fitness-outline" as const },
];

export default function BuscaScreen() {
  const router = useRouter();
  const [texto, setTexto] = useState("");
  const [termo, setTermo] = useState("");

  const { cores, escala } = useTema();
  const styles = useMemo(() => makeStyles(cores), [cores]);

  const { coordenada, municipioNome, setCoordenada, setPermissaoNegada } =
    useLocalizacao();
  const coord = coordenada ?? JOACABA;

  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") { setPermissaoNegada(true); return; }
        const pos = await Location.getCurrentPositionAsync({});
        setCoordenada({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      } catch {
        setPermissaoNegada(true);
      }
    })();
  }, [setCoordenada, setPermissaoNegada]);

  const busca = useBuscaServicos({ termo, coordenada: coord });
  const buscando = termo.trim().length > 1;
  const necessidadeTexto = busca.data?.[0]?.necessidade_texto ?? null;

  function pesquisar(valor: string) {
    setTexto(valor);
    setTermo(valor);
  }

  return (
    <Screen>
      {/* ── HERO BAND ── */}
      <View style={styles.heroBand}>
        <View style={styles.localRow}>
          <Ionicons name="location" size={13} color="#a8d5c4" />
          <Texto style={styles.local}>{municipioNome}</Texto>
        </View>
        <Texto style={styles.titulo}>O que você{"\n"}precisa?</Texto>
        <Texto style={styles.subtitulo}>Serviços de saúde gratuitos perto de você.</Texto>

        <View style={styles.searchBox}>
          <Ionicons name="search" size={18} color={cores.verde} />
          <TextInput
            value={texto}
            onChangeText={setTexto}
            onSubmitEditing={(e) => setTermo(e.nativeEvent.text)}
            placeholder="Ex.: meu filho chora muito"
            placeholderTextColor={cores.inkFaint}
            returnKeyType="search"
            style={[styles.input, { fontSize: 15 * escala }]}
            accessibilityLabel="Buscar serviço de saúde"
          />
          {texto.length > 0 && (
            <Pressable onPress={() => pesquisar("")} accessibilityLabel="Limpar busca" hitSlop={8}>
              <Ionicons name="close-circle" size={18} color={cores.inkFaint} />
            </Pressable>
          )}
        </View>
      </View>

      {buscando ? (
        <Resultados
          loading={busca.isLoading}
          error={busca.isError}
          dados={busca.data ?? []}
          necessidadeTexto={necessidadeTexto}
          termoBuscado={termo}
          onAbrir={(id) => router.push({ pathname: "/servico/[id]", params: { id: String(id) } })}
          onSugerir={pesquisar}
        />
      ) : (
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Texto style={styles.secao}>O que mais pedem por aqui</Texto>
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

          <Pressable
            style={styles.explorarCard}
            onPress={() => pesquisar("saúde")}
            accessibilityRole="button"
            accessibilityLabel="Explorar todos os serviços"
          >
            <View style={styles.explorarTextos}>
              <Texto style={styles.explorarTitulo}>Não encontrou o que precisa?</Texto>
              <Texto style={styles.explorarSub}>
                Digite qualquer sintoma ou condição na busca acima
              </Texto>
            </View>
            <Ionicons name="arrow-forward-circle-outline" size={28} color={cores.verde} />
          </Pressable>

          <Texto style={styles.dica}>Tudo o que aparece aqui é gratuito pelo SUS.</Texto>
        </ScrollView>
      )}
    </Screen>
  );
}

function Resultados({
  loading,
  error,
  dados,
  necessidadeTexto,
  termoBuscado,
  onAbrir,
  onSugerir,
}: {
  loading: boolean;
  error: boolean;
  dados: ResultadoBusca[];
  necessidadeTexto: string | null;
  termoBuscado: string;
  onAbrir: (id: number) => void;
  onSugerir: (termo: string) => void;
}) {
  const { cores } = useTema();
  const styles = useMemo(() => makeStyles(cores), [cores]);

  if (loading) return (
    <View style={styles.estado}>
      <ActivityIndicator color={cores.verde} />
      <Texto style={styles.estadoTexto}>Procurando perto de você…</Texto>
    </View>
  );

  if (error) return (
    <View style={styles.estado}>
      <Ionicons name="cloud-offline-outline" size={36} color={cores.inkFaint} />
      <Texto style={styles.estadoTexto}>Não foi possível buscar. Verifique a conexão.</Texto>
    </View>
  );

  if (dados.length === 0) return (
    <View style={styles.estado}>
      <Ionicons name="search-outline" size={36} color={cores.inkFaint} />
      <Texto style={styles.estadoTexto}>
        Nenhum resultado para "{termoBuscado}".
      </Texto>
      <Texto style={[styles.estadoTexto, { fontSize: 13, marginTop: -4 }]}>
        Experimente uma dessas buscas:
      </Texto>
      <View style={styles.sugestoes}>
        {SUGESTOES_VAZIAS.map((s) => (
          <Pressable
            key={s.rotulo}
            style={styles.sugestaoBtn}
            onPress={() => onSugerir(s.rotulo)}
            accessibilityRole="button"
            accessibilityLabel={`Buscar por ${s.rotulo}`}
          >
            <Ionicons name={s.icone} size={15} color={cores.verde} />
            <Texto style={styles.sugestaoTexto}>{s.rotulo}</Texto>
          </Pressable>
        ))}
      </View>
    </View>
  );

  return (
    <FlatList
      data={dados}
      keyExtractor={(item) => String(item.estabelecimento_id)}
      contentContainerStyle={styles.lista}
      ListHeaderComponent={
        necessidadeTexto ? (
          <View style={styles.matchBadge}>
            <Ionicons name="sparkles-outline" size={13} color={cores.verdeDeep} />
            <Texto style={styles.matchTexto}>
              Mostrando por:{" "}
              <Texto style={styles.matchDestaque}>{necessidadeTexto}</Texto>
            </Texto>
          </View>
        ) : null
      }
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
    heroBand: {
      backgroundColor: cores.verdeDeep,
      paddingHorizontal: 20,
      paddingTop: 18,
      paddingBottom: 28,
      borderBottomLeftRadius: 28,
      borderBottomRightRadius: 28,
    },
    localRow: { flexDirection: "row", alignItems: "center", gap: 5, marginBottom: 12 },
    local: { fontSize: 13, color: "#a8d5c4", fontWeight: "600" },
    titulo: { fontSize: 30, fontWeight: "800", color: "#ffffff", lineHeight: 36, marginBottom: 6 },
    subtitulo: { fontSize: 14, color: "#a8d5c4", marginBottom: 18 },
    searchBox: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      backgroundColor: "#ffffff",
      borderRadius: 16,
      paddingHorizontal: 14,
      paddingVertical: 13,
    },
    input: { flex: 1, fontSize: 15, color: "#16241f" },
    scroll: { padding: 20, paddingTop: 22, gap: 14 },
    secao: {
      fontSize: 12,
      fontWeight: "700",
      color: cores.inkFaint,
      textTransform: "uppercase",
      letterSpacing: 1.2,
    },
    chips: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
    explorarCard: {
      flexDirection: "row",
      alignItems: "center",
      gap: 14,
      backgroundColor: cores.verdeWash,
      borderRadius: 18,
      paddingVertical: 16,
      paddingHorizontal: 18,
      marginTop: 4,
    },
    explorarTextos: { flex: 1, gap: 2 },
    explorarTitulo: { fontSize: 14, fontWeight: "700", color: cores.verdeDeep },
    explorarSub: { fontSize: 12, color: cores.inkSoft, lineHeight: 17 },
    dica: { fontSize: 12, color: cores.inkFaint, marginTop: 4 },
    lista: { padding: 20, gap: 12, paddingTop: 12 },
    estado: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      padding: 40,
      gap: 12,
    },
    estadoTexto: { fontSize: 15, color: cores.inkSoft, textAlign: "center" },
    sugestoes: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 8,
      justifyContent: "center",
      marginTop: 4,
    },
    sugestaoBtn: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      backgroundColor: cores.verdeWash,
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 20,
    },
    sugestaoTexto: { fontSize: 13, color: cores.verdeDeep, fontWeight: "600" },
    matchBadge: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      backgroundColor: cores.verdeWash,
      paddingHorizontal: 12,
      paddingVertical: 7,
      borderRadius: 20,
      alignSelf: "flex-start",
      marginBottom: 8,
    },
    matchTexto: { fontSize: 12, color: cores.inkSoft },
    matchDestaque: { fontSize: 12, fontWeight: "700", color: cores.verdeDeep },
  });
