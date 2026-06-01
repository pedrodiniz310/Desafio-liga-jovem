import { useRef, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import { Texto } from "@/components/texto";
import { BadgeCelebracao } from "@/components/badge-celebracao";
import { useTema } from "@/theme/tema";
import type { Cores } from "@/theme/colors";
import { useServico } from "@/lib/queries/use-servico";
import { useConfirmar, type TempoEspera, type NovoBadge } from "@/lib/queries/use-confirmar";
import { useConfirmacoesEstab } from "@/lib/queries/use-confirmacoes-estab";
import { useFavoritos } from "@/stores/use-favoritos";
import { useAuth } from "@/stores/use-auth";
import { telParaLink } from "@/utils/format";
import type { StatusConfirmacao } from "@/types/models";

const STATUS_COR: Record<StatusConfirmacao, string> = {
  funciona: "#0d6a51",
  fechou:   "#d65a3c",
  mudou:    "#e0a23f",
};

const STATUS_LABEL: Record<StatusConfirmacao, string> = {
  funciona: "✓ Funcionando",
  fechou:   "✗ Fechado",
  mudou:    "⚠ Mudou",
};

export default function ServicoDetalhe() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const servicoId = Number(id);
  const { data: servico, isLoading, isError } = useServico(servicoId);

  const { itens: itensSalvos, alternar: alternarSalvo } = useFavoritos();
  const salvo = itensSalvos.some((i) => i.id === servicoId);

  const { session } = useAuth();
  const confirmarMutation = useConfirmar();
  const { data: stats } = useConfirmacoesEstab(servicoId);

  const { cores } = useTema();
  const styles = useMemo(() => makeStyles(cores), [cores]);

  const toastAnim = useRef(new Animated.Value(0)).current;
  const [toastVisivel, setToastVisivel] = useState(false);
  const [mostraPicker, setMostraPicker] = useState(false);
  const [tempoEsperaSelecionado, setTempoEsperaSelecionado] = useState<TempoEspera | null>(null);
  const [novoBadge, setNovoBadge] = useState<NovoBadge | null>(null);
  const [celebracaoGenerica, setCelebracaoGenerica] = useState(false);

  function mostrarToast() {
    setToastVisivel(true);
    toastAnim.setValue(0);
    Animated.sequence([
      Animated.timing(toastAnim, { toValue: 1, duration: 250, useNativeDriver: true }),
      Animated.delay(1600),
      Animated.timing(toastAnim, { toValue: 0, duration: 250, useNativeDriver: true }),
    ]).start(() => setToastVisivel(false));
  }

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={cores.verde} />
      </View>
    );
  }

  if (isError || !servico) {
    return (
      <View style={styles.center}>
        <Ionicons name="alert-circle-outline" size={36} color={cores.inkFaint} />
        <Texto style={styles.estadoTexto}>
          Não foi possível carregar o serviço.
        </Texto>
      </View>
    );
  }

  function ligar() {
    if (servico?.telefone) {
      Linking.openURL(`tel:${telParaLink(servico.telefone)}`);
    }
  }

  function comoChegar() {
    if (!servico) return;

    // Coordenadas só são confiáveis quando geocodificadas de verdade.
    // Seeds e importações CNES sem geocoding ficam com geocoding_status
    // 'coordenada_demo' ou 'sem_geocoding' — nesses casos a busca por
    // endereço completo é mais precisa que a coordenada aproximada.
    const coordenadasConfiaveis =
      servico.lat != null &&
      servico.lng != null &&
      servico.geocoding_status === "confirmado";

    let destino: string;
    if (coordenadasConfiaveis) {
      destino = `${servico.lat},${servico.lng}`;
    } else {
      const partes = [
        servico.nome,
        servico.endereco,
        servico.bairro,
        servico.municipios?.nome,
        servico.municipios?.uf ?? "SC",
      ].filter(Boolean);
      destino = encodeURIComponent(partes.join(", "));
    }

    Linking.openURL(
      `https://www.google.com/maps/search/?api=1&query=${destino}`
    );
  }

  function confirmar(status: StatusConfirmacao) {
    if (confirmarMutation.isPending) return;
    if (status === "funciona" && !mostraPicker) {
      setMostraPicker(true);
      return;
    }
    const msg: Record<StatusConfirmacao, string> = {
      funciona: "Obrigado! Você ajudou a próxima pessoa.",
      fechou:   "Valeu pelo aviso. Vamos revisar este serviço.",
      mudou:    "Obrigado! Vamos atualizar as informações.",
    };
    confirmarMutation.mutate(
      {
        estabelecimentoId: servicoId,
        status,
        tempoEsperaMinutos: status === "funciona" ? (tempoEsperaSelecionado ?? undefined) : undefined,
      },
      {
        onSuccess: (resultado) => {
          setMostraPicker(false);
          setTempoEsperaSelecionado(null);

          if (resultado) {
            // Ganhou um badge novo → modal de badge conquistado (+ toast de pontos)
            setNovoBadge(resultado);
            if (session?.user.id) mostrarToast();
          } else if (session?.user.id) {
            // Contribuição registrada sem badge novo → modal de agradecimento
            setCelebracaoGenerica(true);
          } else {
            // Anônimo (sem pontuação) → alerta simples
            Alert.alert("Tem no SUS!", msg[status]);
          }
        },
        onError: () =>
          Alert.alert(
            "Tem no SUS!",
            "Não foi possível registrar agora. Verifique a conexão e tente de novo."
          ),
      }
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.topo}>
          <View style={styles.iconWrap}>
            <Ionicons name="medkit" size={28} color={cores.verde} />
          </View>
          <Pressable
            onPress={async () =>
              await alternarSalvo({
                id: servicoId,
                nome: servico.nome,
                endereco: servico.endereco,
                horario: servico.horario,
              })
            }
            accessibilityRole="button"
            accessibilityLabel={salvo ? "Remover dos salvos" : "Salvar serviço"}
            hitSlop={10}
            style={({ pressed }) => [styles.bookmark, pressed && { opacity: 0.7 }]}
          >
            <Ionicons
              name={salvo ? "bookmark" : "bookmark-outline"}
              size={26}
              color={cores.verde}
            />
          </Pressable>
        </View>

        <Texto style={styles.nome}>{servico.nome}</Texto>
        {servico.tipo ? <Texto style={styles.tipo}>{servico.tipo}</Texto> : null}

        {/* ── Stats comunitárias ── */}
        {stats && stats.total > 0 && (
          <View style={[
            styles.statsBand,
            stats.status_dominante
              ? { borderLeftColor: STATUS_COR[stats.status_dominante], borderLeftWidth: 3 }
              : undefined,
          ]}>
            <Ionicons name="people" size={16} color={cores.inkSoft} />
            <View style={{ flex: 1, gap: 2 }}>
              <Texto style={styles.statsTexto}>
                <Texto style={{ fontWeight: "700" }}>{stats.total}</Texto>
                {" "}validaçõe{stats.total === 1 ? "o" : "s"} recente{stats.total === 1 ? "" : "s"}
                {stats.status_dominante
                  ? ` · ${STATUS_LABEL[stats.status_dominante]}`
                  : ""}
              </Texto>
              {stats.tempo_espera_recente !== null && (
                <Texto style={[styles.statsTexto, { color: tempoParaCor(stats.tempo_espera_recente) }]}>
                  {tempoParaLabel(stats.tempo_espera_recente)}
                </Texto>
              )}
            </View>
          </View>
        )}

        {/* ── Ações principais ── */}
        <View style={styles.acoes}>
          <AcaoBotao icone="navigate" rotulo="Como chegar" destaque onPress={comoChegar} />
          {servico.telefone ? (
            <AcaoBotao icone="call" rotulo="Ligar" onPress={ligar} />
          ) : null}
        </View>

        {/* ── Informações ── */}
        <View style={styles.bloco}>
          {servico.endereco ? (
            <LinhaInfo icone="location-outline" rotulo={servico.endereco} />
          ) : null}
          {servico.horario ? (
            <LinhaInfo icone="time-outline" rotulo={servico.horario} />
          ) : null}
          {servico.telefone ? (
            <LinhaInfo icone="call-outline" rotulo={servico.telefone} />
          ) : null}
          <LinhaInfo icone="shield-checkmark-outline" rotulo={formatarFonte(servico)} />
        </View>

        {/* ── Validação comunitária ── */}
        <View style={styles.gamificacaoCabecalho}>
          <Ionicons name="people-circle" size={24} color={cores.verde} />
          <View style={{ flex: 1 }}>
            <Texto style={styles.secao}>Ajude sua comunidade</Texto>
            <Texto style={styles.subSecao}>
              Você esteve aqui recentemente? Confirme se o serviço está funcionando e ajude outras
              pessoas.
            </Texto>
          </View>
        </View>
        <View style={styles.validacao}>
          <ValidaBotao
            icone="checkmark-circle-outline"
            rotulo="Funciona"
            cor={cores.verde}
            onPress={() => confirmar("funciona")}
          />
          <ValidaBotao
            icone="close-circle-outline"
            rotulo="Fechou"
            cor={cores.coral}
            onPress={() => confirmar("fechou")}
          />
          <ValidaBotao
            icone="swap-horizontal-outline"
            rotulo="Mudou"
            cor={cores.amber}
            onPress={() => confirmar("mudou")}
          />
        </View>

        {mostraPicker && (
          <View style={styles.pickerWrap}>
            <Texto style={styles.pickerTitulo}>Quanto tempo de espera?</Texto>
            <View style={styles.pickerOpcoes}>
              {([0, 30, 60, 120] as TempoEspera[]).map((t) => (
                <Pressable
                  key={t}
                  onPress={() => setTempoEsperaSelecionado(t)}
                  accessibilityRole="button"
                  accessibilityLabel={tempoParaLabel(t)}
                  style={({ pressed }) => [
                    styles.pickerBtn,
                    tempoEsperaSelecionado === t && styles.pickerBtnAtivo,
                    pressed && { opacity: 0.8 },
                  ]}
                >
                  <Texto style={[
                    styles.pickerBtnTexto,
                    tempoEsperaSelecionado === t && { color: cores.verdeDeep, fontWeight: "700" },
                  ]}>
                    {tempoParaLabel(t)}
                  </Texto>
                </Pressable>
              ))}
            </View>
            <Pressable
              onPress={() => confirmar("funciona")}
              accessibilityRole="button"
              accessibilityLabel="Confirmar funcionamento"
              style={({ pressed }) => [styles.pickerConfirmar, pressed && { opacity: 0.88 }]}
            >
              <Ionicons name="checkmark-circle" size={18} color="#ffffff" />
              <Texto style={styles.pickerConfirmarTexto}>Confirmar</Texto>
            </Pressable>
          </View>
        )}
      </ScrollView>

      <BadgeCelebracao
        visivel={novoBadge !== null}
        badgeNome={novoBadge?.nome ?? ""}
        badgeIcone={novoBadge?.icone ?? "ribbon"}
        badgeDescricao={novoBadge?.descricao ?? ""}
        onFechar={() => setNovoBadge(null)}
      />

      <BadgeCelebracao
        visivel={celebracaoGenerica}
        titulo="✨ Contribuição registrada!"
        badgeNome="Comunidade agradece"
        badgeIcone="people"
        badgeDescricao="Sua validação ajuda milhares de pessoas a encontrarem atendimento de qualidade."
        onFechar={() => setCelebracaoGenerica(false)}
      />

      {/* ── Toast de pontos ── */}
      {toastVisivel && (
        <Animated.View
          style={[
            styles.toast,
            {
              opacity: toastAnim,
              transform: [
                {
                  translateY: toastAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [16, 0],
                  }),
                },
              ],
            },
          ]}
          pointerEvents="none"
        >
          <Ionicons name="star" size={16} color={cores.amber} />
          <Texto style={styles.toastTexto}>+10 pontos ganhos!</Texto>
        </Animated.View>
      )}
    </View>
  );
}

function tempoParaLabel(minutos: number): string {
  if (minutos === 0) return "🟢 Sem fila";
  if (minutos === 30) return "🟡 ~30 minutos";
  if (minutos === 60) return "🟠 ~1 hora";
  return "🔴 +2 horas";
}

function tempoParaCor(minutos: number): string {
  if (minutos === 0) return "#0d6a51";
  if (minutos === 30) return "#e0a23f";
  if (minutos === 60) return "#e07d3f";
  return "#d65a3c";
}

function formatarFonte(servico: {
  fonte_dados?: string | null;
  competencia_cnes?: string | null;
}) {
  if (servico.fonte_dados?.includes("CNES")) {
    const competencia = servico.competencia_cnes
      ? new Intl.DateTimeFormat("pt-BR", {
          month: "2-digit",
          year: "numeric",
          timeZone: "UTC",
        }).format(new Date(servico.competencia_cnes))
      : null;
    return competencia
      ? `Fonte: CNES/DATASUS - atualizado em ${competencia}`
      : "Fonte: CNES/DATASUS";
  }

  return "Dados do piloto; validar antes de usar em produção";
}

function AcaoBotao({
  icone, rotulo, onPress, destaque,
}: {
  icone: string; rotulo: string; onPress: () => void; destaque?: boolean;
}) {
  const { cores } = useTema();
  const styles = useMemo(() => makeStyles(cores), [cores]);
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={rotulo}
      style={({ pressed }) => [
        styles.acao,
        destaque ? styles.acaoDestaque : styles.acaoSecundaria,
        pressed && { opacity: 0.8 },
      ]}
    >
      <Ionicons name={icone as never} size={20} color={destaque ? cores.paperSoft : cores.verde} />
      <Texto style={[styles.acaoTexto, destaque && { color: cores.paperSoft }]}>{rotulo}</Texto>
    </Pressable>
  );
}

function LinhaInfo({ icone, rotulo }: { icone: string; rotulo: string }) {
  const { cores } = useTema();
  const styles = useMemo(() => makeStyles(cores), [cores]);
  return (
    <View style={styles.linha}>
      <Ionicons name={icone as never} size={20} color={cores.verde} />
      <Texto style={styles.linhaTexto}>{rotulo}</Texto>
    </View>
  );
}

function ValidaBotao({
  icone, rotulo, cor, onPress,
}: {
  icone: string; rotulo: string; cor: string; onPress: () => void;
}) {
  const { cores } = useTema();
  const styles = useMemo(() => makeStyles(cores), [cores]);
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={rotulo}
      style={({ pressed }) => [styles.valida, pressed && { opacity: 0.8 }]}
    >
      <Ionicons name={icone as never} size={22} color={cor} />
      <Texto style={styles.validaTexto}>{rotulo}</Texto>
    </Pressable>
  );
}

const makeStyles = (cores: Cores) =>
  StyleSheet.create({
    center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12, padding: 40 },
    estadoTexto: { fontSize: 15, color: cores.inkSoft, textAlign: "center" },
    scroll: { padding: 20, gap: 16 },
    topo: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
    iconWrap: {
      width: 60, height: 60, borderRadius: 20,
      alignItems: "center", justifyContent: "center",
      backgroundColor: cores.verdeWash,
    },
    bookmark: {
      width: 44, height: 44, borderRadius: 14,
      alignItems: "center", justifyContent: "center",
      backgroundColor: cores.card, borderWidth: 1, borderColor: cores.line,
    },
    nome: { fontSize: 24, fontWeight: "800", color: cores.ink },
    tipo: { fontSize: 15, color: cores.inkSoft, marginTop: -8 },
    statsBand: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      backgroundColor: cores.card,
      borderWidth: 1,
      borderColor: cores.line,
      borderRadius: 12,
      paddingHorizontal: 14,
      paddingVertical: 10,
    },
    statsTexto: { fontSize: 13, color: cores.inkSoft, flex: 1 },
    acoes: { flexDirection: "row", gap: 12 },
    acao: {
      flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center",
      gap: 8, borderRadius: 16, paddingVertical: 14,
    },
    acaoDestaque: { backgroundColor: cores.verde },
    acaoSecundaria: { backgroundColor: cores.card, borderWidth: 1, borderColor: cores.line },
    acaoTexto: { fontSize: 15, fontWeight: "700", color: cores.verde },
    bloco: {
      backgroundColor: cores.card, borderWidth: 1, borderColor: cores.line,
      borderRadius: 18, overflow: "hidden",
    },
    linha: {
      flexDirection: "row", alignItems: "center", gap: 14,
      paddingHorizontal: 16, paddingVertical: 16,
      borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: cores.line,
    },
    linhaTexto: { flex: 1, fontSize: 15, color: cores.ink },
    gamificacaoCabecalho: {
      flexDirection: "row", alignItems: "center", gap: 12, marginTop: 8,
      backgroundColor: cores.verdeWash, padding: 16, borderRadius: 16,
    },
    secao: { fontSize: 14, fontWeight: "800", color: cores.verdeDeep, letterSpacing: 0.5 },
    subSecao: { fontSize: 13, color: cores.inkSoft, marginTop: 2, lineHeight: 18 },
    validacao: { flexDirection: "row", gap: 10 },
    valida: {
      flex: 1, alignItems: "center", gap: 6,
      backgroundColor: cores.card, borderWidth: 1, borderColor: cores.line,
      borderRadius: 16, paddingVertical: 16,
    },
    validaTexto: { fontSize: 13, fontWeight: "600", color: cores.ink },
    toast: {
      position: "absolute",
      bottom: 32,
      alignSelf: "center",
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      backgroundColor: cores.ink,
      paddingHorizontal: 18,
      paddingVertical: 12,
      borderRadius: 24,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.2,
      shadowRadius: 8,
      elevation: 8,
    },
    toastTexto: { fontSize: 14, fontWeight: "700", color: "#ffffff" },
    pickerWrap: {
      backgroundColor: cores.card, borderWidth: 1, borderColor: cores.line,
      borderRadius: 18, padding: 16, gap: 12,
    },
    pickerTitulo: { fontSize: 14, fontWeight: "700", color: cores.ink },
    pickerOpcoes: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
    pickerBtn: {
      paddingHorizontal: 14, paddingVertical: 10,
      backgroundColor: cores.paper, borderWidth: 1.5, borderColor: cores.line,
      borderRadius: 20,
    },
    pickerBtnAtivo: { borderColor: cores.verde, backgroundColor: cores.verdeWash },
    pickerBtnTexto: { fontSize: 13, color: cores.inkSoft },
    pickerConfirmar: {
      flexDirection: "row", alignItems: "center", justifyContent: "center",
      gap: 8, backgroundColor: cores.verde, borderRadius: 16, paddingVertical: 14,
    },
    pickerConfirmarTexto: { fontSize: 15, fontWeight: "700", color: "#ffffff" },
  });
