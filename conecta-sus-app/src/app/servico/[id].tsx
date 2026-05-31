import { useMemo } from "react";
import {
  ActivityIndicator,
  Alert,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import { Texto } from "@/components/texto";
import { useTema } from "@/theme/tema";
import type { Cores } from "@/theme/colors";
import { useServico } from "@/lib/queries/use-servico";
import { useConfirmar } from "@/lib/queries/use-confirmar";
import { useFavoritos } from "@/stores/use-favoritos";
import { telParaLink } from "@/utils/format";
import type { StatusConfirmacao } from "@/types/models";

export default function ServicoDetalhe() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const servicoId = Number(id);
  const { data: servico, isLoading, isError } = useServico(servicoId);

  const { itens: itensSalvos, alternar: alternarSalvo } = useFavoritos();
  const salvo = itensSalvos.some((i) => i.id === servicoId);

  const confirmarMutation = useConfirmar();

  const { cores } = useTema();
  const styles = useMemo(() => makeStyles(cores), [cores]);

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
    const destino =
      servico.lat != null && servico.lng != null
        ? `${servico.lat},${servico.lng}`
        : encodeURIComponent(servico.endereco ?? servico.nome);
    Linking.openURL(
      `https://www.google.com/maps/search/?api=1&query=${destino}`,
    );
  }

  function confirmar(status: StatusConfirmacao) {
    if (confirmarMutation.isPending) return;
    const msg: Record<StatusConfirmacao, string> = {
      funciona: "Obrigado! Você ajudou a próxima pessoa.",
      fechou: "Valeu pelo aviso. Vamos revisar este serviço.",
      mudou: "Obrigado! Vamos atualizar as informações.",
    };
    confirmarMutation.mutate(
      { estabelecimentoId: servicoId, status },
      {
        onSuccess: () => Alert.alert("Conecta SUS", msg[status]),
        onError: () =>
          Alert.alert(
            "Conecta SUS",
            "Não foi possível registrar agora. Verifique a conexão e tente de novo.",
          ),
      },
    );
  }

  return (
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

      {/* ações principais */}
      <View style={styles.acoes}>
        <AcaoBotao
          icone="navigate"
          rotulo="Como chegar"
          destaque
          onPress={comoChegar}
        />
        {servico.telefone ? (
          <AcaoBotao icone="call" rotulo="Ligar" onPress={ligar} />
        ) : null}
      </View>

      {/* informações */}
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
      </View>

      {/* validação comunitária */}
      <View style={styles.gamificacaoCabecalho}>
        <Ionicons name="people-circle" size={24} color={cores.verde} />
        <View style={{ flex: 1 }}>
          <Texto style={styles.secao}>Ajude sua comunidade</Texto>
          <Texto style={styles.subSecao}>
            Você esteve aqui recentemente? Confirme se o serviço está funcionando e ajude outras pessoas.
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
    </ScrollView>
  );
}

function AcaoBotao({
  icone,
  rotulo,
  onPress,
  destaque,
}: {
  icone: string;
  rotulo: string;
  onPress: () => void;
  destaque?: boolean;
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
      <Ionicons
        name={icone as never}
        size={20}
        color={destaque ? cores.paperSoft : cores.verde}
      />
      <Texto style={[styles.acaoTexto, destaque && { color: cores.paperSoft }]}>
        {rotulo}
      </Texto>
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
  icone,
  rotulo,
  cor,
  onPress,
}: {
  icone: string;
  rotulo: string;
  cor: string;
  onPress: () => void;
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
    topo: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    iconWrap: {
      width: 60,
      height: 60,
      borderRadius: 20,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: cores.verdeWash,
    },
    bookmark: {
      width: 44,
      height: 44,
      borderRadius: 14,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: cores.card,
      borderWidth: 1,
      borderColor: cores.line,
    },
    nome: { fontSize: 24, fontWeight: "800", color: cores.ink },
    tipo: { fontSize: 15, color: cores.inkSoft, marginTop: -8 },
    acoes: { flexDirection: "row", gap: 12 },
    acao: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      borderRadius: 16,
      paddingVertical: 14,
    },
    acaoDestaque: { backgroundColor: cores.verde },
    acaoSecundaria: {
      backgroundColor: cores.card,
      borderWidth: 1,
      borderColor: cores.line,
    },
    acaoTexto: { fontSize: 15, fontWeight: "700", color: cores.verde },
    bloco: {
      backgroundColor: cores.card,
      borderWidth: 1,
      borderColor: cores.line,
      borderRadius: 18,
      overflow: "hidden",
    },
    linha: {
      flexDirection: "row",
      alignItems: "center",
      gap: 14,
      paddingHorizontal: 16,
      paddingVertical: 16,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: cores.line,
    },
    linhaTexto: { flex: 1, fontSize: 15, color: cores.ink },
    gamificacaoCabecalho: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      marginTop: 8,
      backgroundColor: cores.verdeWash,
      padding: 16,
      borderRadius: 16,
    },
    secao: {
      fontSize: 14,
      fontWeight: "800",
      color: cores.verdeDeep,
      letterSpacing: 0.5,
    },
    subSecao: {
      fontSize: 13,
      color: cores.inkSoft,
      marginTop: 2,
      lineHeight: 18,
    },
    validacao: { flexDirection: "row", gap: 10 },
    valida: {
      flex: 1,
      alignItems: "center",
      gap: 6,
      backgroundColor: cores.card,
      borderWidth: 1,
      borderColor: cores.line,
      borderRadius: 16,
      paddingVertical: 16,
    },
    validaTexto: { fontSize: 13, fontWeight: "600", color: cores.ink },
  });
