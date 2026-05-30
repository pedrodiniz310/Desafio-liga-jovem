import {
  ActivityIndicator,
  Alert,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import { colors } from "@/theme/colors";
import { useServico } from "@/lib/queries/use-servico";
import { telParaLink } from "@/utils/format";
import type { StatusConfirmacao } from "@/types/models";

export default function ServicoDetalhe() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const servicoId = Number(id);
  const { data: servico, isLoading, isError } = useServico(servicoId);

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.verde} />
      </View>
    );
  }

  if (isError || !servico) {
    return (
      <View style={styles.center}>
        <Ionicons name="alert-circle-outline" size={36} color={colors.inkFaint} />
        <Text style={styles.estadoTexto}>Não foi possível carregar o serviço.</Text>
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
    // TODO: gravar em `confirmacoes` (Edge Function) — fase de validação
    const msg: Record<StatusConfirmacao, string> = {
      funciona: "Obrigado! Você ajudou a próxima pessoa.",
      fechou: "Valeu pelo aviso. Vamos revisar este serviço.",
      mudou: "Obrigado! Vamos atualizar as informações.",
    };
    Alert.alert("Conecta SUS", msg[status]);
  }

  return (
    <ScrollView contentContainerStyle={styles.scroll}>
      <View style={styles.iconWrap}>
        <Ionicons name="medkit" size={28} color={colors.verde} />
      </View>
      <Text style={styles.nome}>{servico.nome}</Text>
      {servico.tipo ? <Text style={styles.tipo}>{servico.tipo}</Text> : null}

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
      <Text style={styles.secao}>Este serviço ainda funciona?</Text>
      <View style={styles.validacao}>
        <ValidaBotao
          icone="checkmark-circle-outline"
          rotulo="Funciona"
          cor={colors.verde}
          onPress={() => confirmar("funciona")}
        />
        <ValidaBotao
          icone="close-circle-outline"
          rotulo="Fechou"
          cor={colors.coral}
          onPress={() => confirmar("fechou")}
        />
        <ValidaBotao
          icone="swap-horizontal-outline"
          rotulo="Mudou"
          cor={colors.amber}
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
        color={destaque ? colors.paperSoft : colors.verde}
      />
      <Text style={[styles.acaoTexto, destaque && { color: colors.paperSoft }]}>
        {rotulo}
      </Text>
    </Pressable>
  );
}

function LinhaInfo({ icone, rotulo }: { icone: string; rotulo: string }) {
  return (
    <View style={styles.linha}>
      <Ionicons name={icone as never} size={20} color={colors.verde} />
      <Text style={styles.linhaTexto}>{rotulo}</Text>
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
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={rotulo}
      style={({ pressed }) => [styles.valida, pressed && { opacity: 0.8 }]}
    >
      <Ionicons name={icone as never} size={22} color={cor} />
      <Text style={styles.validaTexto}>{rotulo}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12, padding: 40 },
  estadoTexto: { fontSize: 15, color: colors.inkSoft, textAlign: "center" },
  scroll: { padding: 20, gap: 16 },
  iconWrap: {
    width: 60,
    height: 60,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.verdeWash,
  },
  nome: { fontSize: 24, fontWeight: "800", color: colors.ink },
  tipo: { fontSize: 15, color: colors.inkSoft, marginTop: -8 },
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
  acaoDestaque: { backgroundColor: colors.verde },
  acaoSecundaria: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.line,
  },
  acaoTexto: { fontSize: 15, fontWeight: "700", color: colors.verde },
  bloco: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.line,
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
    borderBottomColor: colors.line,
  },
  linhaTexto: { flex: 1, fontSize: 15, color: colors.ink },
  secao: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.inkSoft,
    textTransform: "uppercase",
    letterSpacing: 1,
    marginTop: 8,
  },
  validacao: { flexDirection: "row", gap: 10 },
  valida: {
    flex: 1,
    alignItems: "center",
    gap: 6,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 16,
    paddingVertical: 16,
  },
  validaTexto: { fontSize: 13, fontWeight: "600", color: colors.ink },
});
