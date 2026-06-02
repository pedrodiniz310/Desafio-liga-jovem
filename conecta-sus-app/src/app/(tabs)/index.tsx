import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from "react-native";
import { useRouter, useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as Location from "expo-location";

import { Screen } from "@/components/screen";
import { LogoMarca } from "@/components/logo-marca";
import { MapaResultados } from "@/components/mapa-resultados";
import { Pingo } from "@/components/pingo";
import { NeedChip } from "@/components/need-chip";
import { ServiceCard } from "@/components/service-card";
import { Texto } from "@/components/texto";
import { NECESSIDADES_COMUNS } from "@/lib/queries/necessidades-comuns";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { SituacaoCard } from "@/components/situacao-card";
import { useBuscaServicos } from "@/lib/queries/use-busca-servicos";
import { JOACABA, useLocalizacao } from "@/stores/use-localizacao";
import { usePersona } from "@/stores/use-persona";
import { useJornadas } from "@/lib/queries/use-jornadas";
import { useMunicipioAtivo } from "@/lib/queries/use-municipio-ativo";
import { useTema } from "@/theme/tema";
import type { Cores } from "@/theme/colors";
import type { Coordenada, ResultadoBusca } from "@/types/models";

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
  const { carregandoCidade, importando } = useMunicipioAtivo(coord);

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

  // Raio de busca: começa em 15 km; o estado vazio permite ampliar para 50 km.
  const [raioMetros, setRaioMetros] = useState(15000);
  useEffect(() => setRaioMetros(15000), [termo]); // novo termo volta ao raio padrão

  const busca = useBuscaServicos({ termo, coordenada: coord, raioMetros });
  const buscando = termo.trim().length > 1;
  const necessidadeTexto = busca.data?.[0]?.necessidade_texto ?? null;

  const { personaConfig } = usePersona();
  const { data: jornadas = [] } = useJornadas();

  // Aplica busca pendente definida pela tela de jornada
  useFocusEffect(
    useCallback(() => {
      (async () => {
        const pendente = await AsyncStorage.getItem("@tem_no_sus_busca_pendente");
        if (pendente) {
          setTexto(pendente);
          setTermo(pendente);
          await AsyncStorage.removeItem("@tem_no_sus_busca_pendente");
        }
      })();
    }, [])
  );

  function pesquisar(valor: string) {
    setTexto(valor);
    setTermo(valor);
  }

  return (
    <Screen>
      {/* ── HERO BAND (colapsa quando há busca ativa) ── */}
      <View style={[styles.heroBand, buscando && styles.heroBandCompacto]}>
        <View style={styles.localRow}>
          <View style={styles.localLeft}>
            <Ionicons name="location" size={13} color="#a8d5c4" />
            <Texto style={styles.local}>{municipioNome}</Texto>
          </View>
          <LogoMarca size={32} />
        </View>
        {carregandoCidade && (
          <View style={styles.cidadeBanner}>
            <ActivityIndicator size="small" color="#a8d5c4" />
            <Texto style={styles.cidadeBannerTexto}>
              {importando ? "Carregando serviços da sua cidade…" : "Localizando você…"}
            </Texto>
          </View>
        )}
        {!buscando && (
          <>
            <Texto style={styles.titulo}>{personaConfig.tituloBusca}</Texto>
            <Texto style={styles.subtitulo}>Serviços de saúde gratuitos perto de você.</Texto>
          </>
        )}

        <View style={styles.searchBox}>
          <Ionicons name="search" size={18} color={cores.verde} />
          <TextInput
            value={texto}
            onChangeText={setTexto}
            onSubmitEditing={(e) => setTermo(e.nativeEvent.text)}
            placeholder={personaConfig.placeholder}
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
          coordUsuario={coord}
          raioMetros={raioMetros}
          onAmpliar={() => setRaioMetros(50000)}
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

          {jornadas.length > 0 && (
            <>
              <Texto style={styles.secao}>Está passando por isso?</Texto>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.jornadasScroll}
              >
                {jornadas.map((j) => (
                  <SituacaoCard
                    key={j.slug}
                    jornada={j}
                    onPress={() =>
                      router.push({
                        pathname: "/jornada/[slug]",
                        params: { slug: j.slug },
                      })
                    }
                  />
                ))}
              </ScrollView>
            </>
          )}

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
  coordUsuario,
  raioMetros,
  onAmpliar,
  onAbrir,
  onSugerir,
}: {
  loading: boolean;
  error: boolean;
  dados: ResultadoBusca[];
  necessidadeTexto: string | null;
  termoBuscado: string;
  coordUsuario: Coordenada;
  raioMetros: number;
  onAmpliar: () => void;
  onAbrir: (id: number) => void;
  onSugerir: (termo: string) => void;
}) {
  const { cores } = useTema();
  const styles = useMemo(() => makeStyles(cores), [cores]);
  const [modo, setModo] = useState<"lista" | "mapa">("lista");
  const raioKm = Math.round(raioMetros / 1000);

  const badgeAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (necessidadeTexto) {
      badgeAnim.setValue(0);
      Animated.spring(badgeAnim, {
        toValue: 1,
        useNativeDriver: true,
        tension: 80,
        friction: 8,
      }).start();
    }
  }, [necessidadeTexto, badgeAnim]);

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

  if (dados.length === 0) {
    // Nunca sugerir o termo que acabou de falhar (evita loop).
    const sugestoes = SUGESTOES_VAZIAS.filter(
      (s) => s.rotulo.toLowerCase() !== termoBuscado.trim().toLowerCase()
    );
    return (
      <View style={styles.estado}>
        <Pingo pose="apontando" size={92} />
        <Texto style={styles.estadoTexto}>
          Nenhum serviço encontrado num raio de {raioKm} km.
        </Texto>

        {raioMetros < 50000 && (
          <Pressable
            onPress={onAmpliar}
            style={({ pressed }) => [styles.ampliarBtn, pressed && { opacity: 0.85 }]}
            accessibilityRole="button"
            accessibilityLabel="Ampliar a busca para 50 km"
          >
            <Ionicons name="resize-outline" size={16} color="#ffffff" />
            <Texto style={styles.ampliarTexto}>Procurar num raio maior (50 km)</Texto>
          </Pressable>
        )}

        <Texto style={[styles.estadoTexto, { fontSize: 13, marginTop: 8 }]}>
          Ou experimente uma dessas buscas:
        </Texto>
        <View style={styles.sugestoes}>
          {sugestoes.map((s) => (
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
  }

  const temCoordenadas = dados.some((d) => d.lat != null && d.lng != null);

  // Cabeçalho da lista: badge "entendemos que você busca" + contagem de resultados.
  const cabecalhoLista = (
    <View style={styles.cabecalho}>
      {necessidadeTexto ? (
        <Animated.View
          style={[
            styles.matchBadge,
            {
              opacity: badgeAnim,
              transform: [
                {
                  scale: badgeAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.85, 1],
                  }),
                },
              ],
            },
          ]}
        >
          <Ionicons name="sparkles" size={15} color="#a8d5c4" />
          <Texto style={styles.matchTexto}>
            Entendemos que você busca:{" "}
            <Texto style={styles.matchDestaque}>{necessidadeTexto}</Texto>
          </Texto>
        </Animated.View>
      ) : null}
      <Texto style={styles.contagem}>
        {dados.length}{" "}
        {dados.length === 1 ? "serviço encontrado" : "serviços encontrados"} num raio de {raioKm} km
      </Texto>
    </View>
  );

  // Rodapé: preenche a tela com algo útil em vez de vazio — buscas relacionadas.
  const relacionadas = NECESSIDADES_COMUNS.filter(
    (n) => n.rotulo.toLowerCase() !== termoBuscado.trim().toLowerCase()
  ).slice(0, 6);
  const rodapeLista = (
    <View style={styles.rodapeLista}>
      <Texto style={styles.rodapeLabel}>Buscar outra coisa</Texto>
      <View style={styles.rodapeChips}>
        {relacionadas.map((n) => (
          <Pressable
            key={n.slug}
            style={styles.sugestaoBtn}
            onPress={() => onSugerir(n.rotulo)}
            accessibilityRole="button"
            accessibilityLabel={`Buscar por ${n.rotulo}`}
          >
            <Ionicons name={n.icone as never} size={15} color={cores.verde} />
            <Texto style={styles.sugestaoTexto}>{n.rotulo}</Texto>
          </Pressable>
        ))}
      </View>
      <Texto style={styles.rodapeDica}>Tudo o que aparece aqui é gratuito pelo SUS.</Texto>
    </View>
  );

  return (
    <View style={{ flex: 1 }}>
      {temCoordenadas && (
        <View style={styles.toggle}>
          <Pressable
            style={[styles.toggleBtn, modo === "lista" && styles.toggleBtnAtivo]}
            onPress={() => setModo("lista")}
            accessibilityRole="button"
            accessibilityLabel="Ver em lista"
          >
            <Ionicons
              name="list"
              size={15}
              color={modo === "lista" ? "#ffffff" : cores.verdeDeep}
            />
            <Texto style={[styles.toggleTexto, modo === "lista" && styles.toggleTextoAtivo]}>
              Lista
            </Texto>
          </Pressable>
          <Pressable
            style={[styles.toggleBtn, modo === "mapa" && styles.toggleBtnAtivo]}
            onPress={() => setModo("mapa")}
            accessibilityRole="button"
            accessibilityLabel="Ver no mapa"
          >
            <Ionicons
              name="map"
              size={15}
              color={modo === "mapa" ? "#ffffff" : cores.verdeDeep}
            />
            <Texto style={[styles.toggleTexto, modo === "mapa" && styles.toggleTextoAtivo]}>
              Mapa
            </Texto>
          </Pressable>
        </View>
      )}

      {modo === "mapa" && temCoordenadas ? (
        <MapaResultados
          dados={dados}
          coordUsuario={coordUsuario}
          onAbrir={onAbrir}
        />
      ) : (
        <FlatList
          data={dados}
          keyExtractor={(item) => String(item.estabelecimento_id)}
          contentContainerStyle={styles.lista}
          ListHeaderComponent={cabecalhoLista}
          ListFooterComponent={rodapeLista}
          renderItem={({ item }) => (
            <ServiceCard
              servico={item}
              onPress={() => onAbrir(item.estabelecimento_id)}
            />
          )}
        />
      )}
    </View>
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
    heroBandCompacto: { paddingTop: 14, paddingBottom: 16 },
    localRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12 },
    localLeft: { flexDirection: "row", alignItems: "center", gap: 5 },
    cidadeBanner: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      backgroundColor: "rgba(255,255,255,0.12)",
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 12,
      marginBottom: 12,
    },
    cidadeBannerTexto: { fontSize: 13, color: "#a8d5c4", fontWeight: "600" },
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
    jornadasScroll: { gap: 10, paddingRight: 4 },
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
      gap: 8,
      backgroundColor: cores.verdeDeep,
      paddingHorizontal: 16,
      paddingVertical: 10,
      borderRadius: 20,
      alignSelf: "flex-start",
      marginBottom: 12,
    },
    matchTexto: { fontSize: 13, color: "#a8d5c4" },
    matchDestaque: { fontSize: 13, fontWeight: "800", color: "#ffffff" },
    cabecalho: { gap: 8, marginBottom: 4 },
    contagem: {
      fontSize: 13,
      fontWeight: "600",
      color: cores.inkFaint,
    },
    ampliarBtn: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      backgroundColor: cores.verde,
      paddingHorizontal: 20,
      paddingVertical: 13,
      borderRadius: 16,
      marginTop: 4,
    },
    ampliarTexto: { fontSize: 14, fontWeight: "700", color: "#ffffff" },
    rodapeLista: {
      marginTop: 20,
      paddingTop: 20,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: cores.line,
      gap: 12,
    },
    rodapeLabel: {
      fontSize: 12,
      fontWeight: "700",
      color: cores.inkFaint,
      textTransform: "uppercase",
      letterSpacing: 1.2,
    },
    rodapeChips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
    rodapeDica: { fontSize: 12, color: cores.inkFaint, marginTop: 4 },
    toggle: {
      flexDirection: "row",
      gap: 8,
      paddingHorizontal: 20,
      paddingTop: 12,
      paddingBottom: 4,
    },
    toggleBtn: {
      flexDirection: "row",
      alignItems: "center",
      gap: 5,
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 20,
      borderWidth: 1.5,
      borderColor: cores.verdeDeep,
    },
    toggleBtnAtivo: {
      backgroundColor: cores.verdeDeep,
    },
    toggleTexto: {
      fontSize: 13,
      fontWeight: "700",
      color: cores.verdeDeep,
    },
    toggleTextoAtivo: {
      color: "#ffffff",
    },
  });
