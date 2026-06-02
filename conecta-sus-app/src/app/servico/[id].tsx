import { useRef, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Linking,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import { Texto } from "@/components/texto";
import { BadgeCelebracao } from "@/components/badge-celebracao";
import { Pingo } from "@/components/pingo";
import { preparoParaServico } from "@/lib/preparo-servico";
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
  const [sheetAberto, setSheetAberto] = useState(false);
  const [acaoEmCurso, setAcaoEmCurso] = useState<StatusConfirmacao | null>(null);
  const [novoBadge, setNovoBadge] = useState<NovoBadge | null>(null);
  const [celebracaoGenerica, setCelebracaoGenerica] = useState(false);
  const [itensFeitos, setItensFeitos] = useState<number[]>([]);

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
    // "Funciona" abre o bottom sheet pra escolher o tempo de espera (1 toque).
    if (status === "funciona") {
      setAcaoEmCurso("funciona");
      setSheetAberto(true);
      return;
    }
    setAcaoEmCurso(status);
    enviar(status, undefined);
  }

  function enviar(status: StatusConfirmacao, tempo: TempoEspera | undefined) {
    if (confirmarMutation.isPending) return;
    const msg: Record<StatusConfirmacao, string> = {
      funciona: "Obrigado! Você ajudou a próxima pessoa.",
      fechou:   "Valeu pelo aviso. Vamos revisar este serviço.",
      mudou:    "Obrigado! Vamos atualizar as informações.",
    };
    confirmarMutation.mutate(
      {
        estabelecimentoId: servicoId,
        status,
        tempoEsperaMinutos: status === "funciona" ? tempo : undefined,
      },
      {
        onSuccess: (resultado) => {
          setSheetAberto(false);
          setAcaoEmCurso(null);

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
        onError: () => {
          setAcaoEmCurso(null);
          Alert.alert(
            "Tem no SUS!",
            "Não foi possível registrar agora. Verifique a conexão e tente de novo."
          );
        },
      }
    );
  }

  const preparo = preparoParaServico(servico.tipo, servico.nome);

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

        {/* ── O que levar e como se preparar (Pingo) ── */}
        <View style={styles.preparoCard}>
          <View style={styles.preparoTopo}>
            <Pingo pose="checklist" size={64} />
            <View style={styles.preparoFalaWrap}>
              <Texto style={styles.preparoTitulo}>O que levar e como se preparar</Texto>
              <Texto style={styles.preparoFala}>{preparo.fala}</Texto>
            </View>
          </View>

          <View style={styles.preparoLista}>
            {preparo.itens.map((item, i) => {
              const feito = itensFeitos.includes(i);
              return (
                <Pressable
                  key={i}
                  onPress={() =>
                    setItensFeitos((prev) =>
                      prev.includes(i) ? prev.filter((x) => x !== i) : [...prev, i]
                    )
                  }
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: feito }}
                  accessibilityLabel={item.texto}
                  style={({ pressed }) => [styles.preparoItem, pressed && { opacity: 0.7 }]}
                >
                  <View style={[styles.preparoCheck, feito && styles.preparoCheckOn]}>
                    {feito && <Ionicons name="checkmark" size={15} color="#ffffff" />}
                  </View>
                  <Texto
                    style={[styles.preparoItemTexto, feito && styles.preparoItemFeito]}
                  >
                    {item.texto}
                    {item.opcional ? <Texto style={styles.preparoOpcional}>  · se tiver</Texto> : null}
                  </Texto>
                </Pressable>
              );
            })}
          </View>

          {preparo.dica ? (
            <View style={styles.preparoDica}>
              <Ionicons name="bulb-outline" size={15} color={cores.verdeDeep} />
              <Texto style={styles.preparoDicaTexto}>{preparo.dica}</Texto>
            </View>
          ) : null}
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
            icone="checkmark-circle"
            rotulo="Funciona"
            cor={cores.verde}
            ativo={acaoEmCurso === "funciona"}
            carregando={confirmarMutation.isPending && acaoEmCurso === "funciona" && !sheetAberto}
            onPress={() => confirmar("funciona")}
          />
          <ValidaBotao
            icone="close-circle"
            rotulo="Fechou"
            cor={cores.coral}
            ativo={acaoEmCurso === "fechou"}
            carregando={confirmarMutation.isPending && acaoEmCurso === "fechou"}
            onPress={() => confirmar("fechou")}
          />
          <ValidaBotao
            icone="swap-horizontal"
            rotulo="Mudou"
            cor={cores.amber}
            ativo={acaoEmCurso === "mudou"}
            carregando={confirmarMutation.isPending && acaoEmCurso === "mudou"}
            onPress={() => confirmar("mudou")}
          />
        </View>
      </ScrollView>

      {/* Bottom sheet: tempo de espera (sobe na frente; 1 toque confirma) */}
      <Modal
        visible={sheetAberto}
        transparent
        animationType="slide"
        onRequestClose={() => {
          setSheetAberto(false);
          setAcaoEmCurso(null);
        }}
      >
        <View style={styles.sheetRoot}>
          <Pressable
            style={styles.sheetBackdrop}
            onPress={() => {
              setSheetAberto(false);
              setAcaoEmCurso(null);
            }}
            accessibilityLabel="Fechar"
          />
          <View style={styles.sheet}>
            <View style={styles.sheetHandle} />
            <Texto style={styles.sheetTitulo}>Como está a fila agora?</Texto>
            <Texto style={styles.sheetSub}>Seu aviso ajuda quem chega depois de você.</Texto>
            {([0, 30, 60, 120] as TempoEspera[]).map((t) => (
              <Pressable
                key={t}
                onPress={() => enviar("funciona", t)}
                disabled={confirmarMutation.isPending}
                accessibilityRole="button"
                accessibilityLabel={tempoParaLabel(t)}
                style={({ pressed }) => [styles.sheetOpcao, pressed && { backgroundColor: cores.verdeWash }]}
              >
                <Texto style={styles.sheetOpcaoTexto}>{tempoParaLabel(t)}</Texto>
                <Ionicons name="chevron-forward" size={18} color={cores.inkFaint} />
              </Pressable>
            ))}
            <Pressable
              onPress={() => enviar("funciona", undefined)}
              disabled={confirmarMutation.isPending}
              accessibilityRole="button"
              accessibilityLabel="Não sei dizer o tempo"
              style={({ pressed }) => [styles.sheetPular, pressed && { opacity: 0.7 }]}
            >
              <Texto style={styles.sheetPularTexto}>Não sei dizer</Texto>
            </Pressable>
          </View>
        </View>
      </Modal>

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
  icone, rotulo, cor, ativo, carregando, onPress,
}: {
  icone: string; rotulo: string; cor: string;
  ativo?: boolean; carregando?: boolean; onPress: () => void;
}) {
  const { cores } = useTema();
  const styles = useMemo(() => makeStyles(cores), [cores]);
  return (
    <Pressable
      onPress={onPress}
      disabled={carregando}
      accessibilityRole="button"
      accessibilityState={{ selected: ativo, disabled: carregando }}
      accessibilityLabel={rotulo}
      style={({ pressed }) => [
        styles.valida,
        ativo && { backgroundColor: cor, borderColor: cor },
        pressed && { transform: [{ scale: 0.96 }] },
      ]}
    >
      <View
        style={[
          styles.validaIcone,
          { backgroundColor: ativo ? "rgba(255,255,255,0.22)" : cor + "18" },
        ]}
      >
        {carregando ? (
          <ActivityIndicator size="small" color={ativo ? "#ffffff" : cor} />
        ) : (
          <Ionicons name={icone as never} size={22} color={ativo ? "#ffffff" : cor} />
        )}
      </View>
      <Texto style={[styles.validaTexto, ativo && { color: "#ffffff" }]}>{rotulo}</Texto>
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
    preparoCard: {
      backgroundColor: cores.verdeWash,
      borderRadius: 18,
      padding: 16,
      gap: 14,
    },
    preparoTopo: { flexDirection: "row", alignItems: "center", gap: 12 },
    preparoFalaWrap: { flex: 1, gap: 3 },
    preparoTitulo: { fontSize: 15, fontWeight: "800", color: cores.verdeDeep },
    preparoFala: { fontSize: 13, color: cores.inkSoft, lineHeight: 18 },
    preparoLista: { gap: 4 },
    preparoItem: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      paddingVertical: 9,
    },
    preparoCheck: {
      width: 24,
      height: 24,
      borderRadius: 8,
      borderWidth: 2,
      borderColor: cores.verde,
      backgroundColor: cores.card,
      alignItems: "center",
      justifyContent: "center",
    },
    preparoCheckOn: { backgroundColor: cores.verde, borderColor: cores.verde },
    preparoItemTexto: { flex: 1, fontSize: 15, color: cores.ink },
    preparoItemFeito: { color: cores.inkFaint, textDecorationLine: "line-through" },
    preparoOpcional: { fontSize: 12, color: cores.inkFaint, fontWeight: "400" },
    preparoDica: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: 8,
      backgroundColor: cores.card,
      borderRadius: 12,
      padding: 12,
    },
    preparoDicaTexto: { flex: 1, fontSize: 13, color: cores.inkSoft, lineHeight: 18 },
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
      flex: 1, alignItems: "center", gap: 8,
      backgroundColor: cores.card, borderWidth: 1.5, borderColor: cores.line,
      borderRadius: 18, paddingVertical: 14,
    },
    validaIcone: {
      width: 40, height: 40, borderRadius: 20,
      alignItems: "center", justifyContent: "center",
    },
    validaTexto: { fontSize: 13, fontWeight: "700", color: cores.ink },
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
    sheetRoot: { flex: 1, justifyContent: "flex-end" },
    sheetBackdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.45)" },
    sheet: {
      backgroundColor: cores.card,
      borderTopLeftRadius: 24, borderTopRightRadius: 24,
      paddingHorizontal: 20, paddingTop: 12, paddingBottom: 32,
    },
    sheetHandle: {
      width: 40, height: 5, borderRadius: 3, backgroundColor: cores.line,
      alignSelf: "center", marginBottom: 14,
    },
    sheetTitulo: { fontSize: 19, fontWeight: "800", color: cores.ink },
    sheetSub: { fontSize: 13, color: cores.inkSoft, marginTop: 2, marginBottom: 6 },
    sheetOpcao: {
      flexDirection: "row", alignItems: "center", justifyContent: "space-between",
      paddingVertical: 16, paddingHorizontal: 16,
      borderRadius: 14, borderWidth: 1, borderColor: cores.line,
      marginTop: 8,
    },
    sheetOpcaoTexto: { fontSize: 16, fontWeight: "600", color: cores.ink },
    sheetPular: { alignItems: "center", paddingVertical: 16, marginTop: 4 },
    sheetPularTexto: { fontSize: 14, color: cores.inkFaint, fontWeight: "600" },
  });
