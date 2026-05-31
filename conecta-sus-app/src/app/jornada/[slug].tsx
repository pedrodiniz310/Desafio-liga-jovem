import { useMemo } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { Texto } from "@/components/texto";
import { useTema } from "@/theme/tema";
import type { Cores } from "@/theme/colors";
import { useJornada } from "@/lib/queries/use-jornada";
import { useJornadaProgresso } from "@/stores/use-jornada-progresso";
import type { JornadaPasso } from "@/types/models";

// Mapeia servico_codigo → termo de busca legível
const BUSCA_MAP: Record<string, string> = {
  prenatal:      "pré-natal",
  vacina:        "vacina",
  atencao_basica:"atendimento básico",
  farmacia:      "farmácia popular",
  saude_mental:  "psicólogo",
  reabilitacao:  "fisioterapia",
  odonto_esp:    "dentista",
  fono:          "fonoaudiólogo",
  dependencia:   "dependência química",
};

export default function JornadaScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const { data: jornada, isLoading, isError } = useJornada(slug);
  const { passosConcluidos, togglePasso } = useJornadaProgresso(slug);
  const router = useRouter();
  const { cores } = useTema();
  const styles = useMemo(() => makeStyles(cores), [cores]);

  async function buscarServico(servico_codigo: string) {
    const termo = BUSCA_MAP[servico_codigo] ?? servico_codigo;
    await AsyncStorage.setItem("@tem_no_sus_busca_pendente", termo);
    router.push("/(tabs)");
  }

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={cores.verde} />
      </View>
    );
  }

  if (isError || !jornada) {
    return (
      <View style={styles.center}>
        <Ionicons name="alert-circle-outline" size={36} color={cores.inkFaint} />
        <Texto style={styles.errTexto}>Jornada não encontrada.</Texto>
      </View>
    );
  }

  const concluidos = passosConcluidos.length;
  const total = jornada.passos.length;
  const progresso = total > 0 ? concluidos / total : 0;

  return (
    <ScrollView contentContainerStyle={styles.scroll}>
      {/* Cabeçalho colorido */}
      <View style={[styles.header, { backgroundColor: jornada.cor }]}>
        <View style={styles.headerIconWrap}>
          <Ionicons name={jornada.icone as never} size={28} color={cores.verdeDeep} />
        </View>
        <View style={{ flex: 1 }}>
          <Texto style={styles.headerTitulo}>{jornada.titulo}</Texto>
          <Texto style={styles.headerDesc}>{jornada.descricao}</Texto>
        </View>
      </View>

      {/* Barra de progresso */}
      <View style={styles.progressoWrap}>
        <View style={styles.progressoBar}>
          <View style={[styles.progressoFill, { width: `${progresso * 100}%` }]} />
        </View>
        <Texto style={styles.progressoTexto}>
          {concluidos}/{total} passos concluídos
        </Texto>
      </View>

      {/* Passos */}
      <View style={styles.passos}>
        {[...jornada.passos]
          .sort((a, b) => a.ordem - b.ordem)
          .map((passo) => (
            <PassoCard
              key={passo.ordem}
              passo={passo}
              concluido={passosConcluidos.includes(passo.ordem)}
              onToggle={() => togglePasso(passo.ordem)}
              onBuscar={() => buscarServico(passo.servico_codigo)}
            />
          ))}
      </View>
    </ScrollView>
  );
}

function PassoCard({
  passo,
  concluido,
  onToggle,
  onBuscar,
}: {
  passo: JornadaPasso;
  concluido: boolean;
  onToggle: () => void;
  onBuscar: () => void;
}) {
  const { cores } = useTema();
  const styles = useMemo(() => makeStyles(cores), [cores]);

  return (
    <View style={[styles.passo, concluido && styles.passoConcluido]}>
      <View style={styles.passoHeader}>
        <Pressable
          onPress={onToggle}
          style={[styles.ordemCircle, concluido && { backgroundColor: cores.verde }]}
          accessibilityRole="checkbox"
          accessibilityState={{ checked: concluido }}
          accessibilityLabel={concluido ? "Marcar como não feito" : "Marcar como feito"}
        >
          {concluido ? (
            <Ionicons name="checkmark" size={16} color="#ffffff" />
          ) : (
            <Texto style={styles.ordemNum}>{passo.ordem}</Texto>
          )}
        </Pressable>
        <View style={styles.passoTextos}>
          <Texto
            style={[
              styles.passoTitulo,
              concluido && { color: cores.inkSoft, textDecorationLine: "line-through" },
            ]}
          >
            {passo.titulo_passo}
          </Texto>
          <Texto style={styles.passoMotivo}>{passo.por_que_importa}</Texto>
        </View>
      </View>

      <View style={styles.passoBotoes}>
        <Pressable
          onPress={onBuscar}
          style={({ pressed }) => [styles.btnBuscar, pressed && { opacity: 0.8 }]}
          accessibilityRole="button"
          accessibilityLabel="Buscar este serviço na aba Buscar"
        >
          <Ionicons name="search-outline" size={13} color={cores.verde} />
          <Texto style={styles.btnBuscarTexto}>Buscar este serviço</Texto>
        </Pressable>
      </View>
    </View>
  );
}

const makeStyles = (cores: Cores) =>
  StyleSheet.create({
    center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12, padding: 40 },
    errTexto: { fontSize: 15, color: cores.inkSoft, textAlign: "center" },
    scroll: { gap: 16, paddingBottom: 40 },
    header: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: 14,
      padding: 20,
    },
    headerIconWrap: {
      width: 52,
      height: 52,
      borderRadius: 16,
      backgroundColor: "rgba(255,255,255,0.55)",
      alignItems: "center",
      justifyContent: "center",
    },
    headerTitulo: { fontSize: 20, fontWeight: "800", color: cores.verdeDeep, marginBottom: 4 },
    headerDesc: { fontSize: 13, color: cores.inkSoft, lineHeight: 18 },
    progressoWrap: {
      paddingHorizontal: 20,
      gap: 6,
    },
    progressoBar: {
      height: 6,
      backgroundColor: cores.line,
      borderRadius: 3,
      overflow: "hidden",
    },
    progressoFill: {
      height: "100%",
      backgroundColor: cores.verde,
      borderRadius: 3,
    },
    progressoTexto: { fontSize: 12, color: cores.inkFaint, fontWeight: "600" },
    passos: { paddingHorizontal: 16, gap: 12 },
    passo: {
      backgroundColor: cores.card,
      borderWidth: 1,
      borderColor: cores.line,
      borderRadius: 18,
      padding: 16,
      gap: 12,
    },
    passoConcluido: { opacity: 0.7 },
    passoHeader: { flexDirection: "row", gap: 12, alignItems: "flex-start" },
    ordemCircle: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: cores.verdeWash,
      alignItems: "center",
      justifyContent: "center",
      flexShrink: 0,
    },
    ordemNum: { fontSize: 14, fontWeight: "800", color: cores.verde },
    passoTextos: { flex: 1, gap: 4 },
    passoTitulo: { fontSize: 15, fontWeight: "700", color: cores.ink },
    passoMotivo: { fontSize: 13, color: cores.inkSoft, lineHeight: 18 },
    passoBotoes: { flexDirection: "row", gap: 8 },
    btnBuscar: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      backgroundColor: cores.verdeWash,
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 12,
    },
    btnBuscarTexto: { fontSize: 12, fontWeight: "600", color: cores.verde },
  });
