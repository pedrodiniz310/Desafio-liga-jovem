import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  TextInput,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { Screen } from "@/components/screen";
import { Texto } from "@/components/texto";
import { usePreferencias } from "@/stores/use-preferencias";
import { useAuth } from "@/stores/use-auth";
import { usePerfil } from "@/lib/queries/use-perfil";
import { useAlertasDireitos } from "@/lib/queries/use-alertas-direitos";
import { useNotificacoesAlertas } from "@/lib/use-notificacoes-alertas";
import { useGamificacao } from "@/lib/queries/use-gamificacao";
import { useTema } from "@/theme/tema";
import type { Cores } from "@/theme/colors";

const CONDICOES_OPCOES = [
  { slug: "diabetes",    rotulo: "Diabetes",     icone: "medical-outline"  as const },
  { slug: "hipertensao", rotulo: "Hipertensão",  icone: "heart-outline"    as const },
  { slug: "saude_mental",rotulo: "Saúde Mental", icone: "happy-outline"    as const },
  { slug: "avc",         rotulo: "AVC",          icone: "fitness-outline"  as const },
];

export default function PerfilScreen() {
  const { fonteGrande, altoContraste, setFonteGrande, setAltoContraste } = usePreferencias();
  const { sair, session } = useAuth();
  const { perfil, salvar, salvando } = usePerfil();
  const { alertasAplicaveis } = useAlertasDireitos(perfil);
  const { data: gamificacao } = useGamificacao();

  useNotificacoesAlertas(perfil, alertasAplicaveis);

  const { cores } = useTema();
  const styles = useMemo(() => makeStyles(cores), [cores]);

  const [anoNasc, setAnoNasc] = useState("");
  const [condicoesSel, setCondicoesSel] = useState<string[]>([]);

  useEffect(() => {
    if (!perfil) return;
    if (perfil.data_nascimento) {
      setAnoNasc(perfil.data_nascimento.split("-")[0]);
    }
    setCondicoesSel(perfil.condicoes);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [perfil?.id]);

  function toggleCondicao(slug: string) {
    setCondicoesSel((prev) =>
      prev.includes(slug) ? prev.filter((c) => c !== slug) : [...prev, slug]
    );
  }

  function salvarPerfil() {
    const ano = parseInt(anoNasc, 10);
    const dataValida =
      anoNasc.length === 4 && !isNaN(ano) && ano >= 1900 && ano <= new Date().getFullYear()
        ? `${anoNasc}-01-01`
        : null;

    salvar(
      { data_nascimento: dataValida, condicoes: condicoesSel },
      {
        onSuccess: () =>
          Alert.alert("Tem no SUS!", "Perfil salvo! Alertas de direitos personalizados ativados."),
        onError: () =>
          Alert.alert("Erro", "Não foi possível salvar. Verifique a conexão."),
      }
    );
  }

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Texto style={styles.titulo}>Perfil</Texto>

        {/* ── Perfil de Saúde ── */}
        {session && (
          <>
            <Texto style={styles.secao}>Meu Perfil de Saúde</Texto>
            <View style={styles.grupo}>
              <View style={[styles.linha, { flexDirection: "column", alignItems: "flex-start", gap: 8 }]}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                  <Ionicons name="calendar-outline" size={20} color={cores.verde} />
                  <Texto style={styles.linhaTexto}>Ano de nascimento</Texto>
                </View>
                <TextInput
                  value={anoNasc}
                  onChangeText={setAnoNasc}
                  placeholder="Ex.: 1965"
                  placeholderTextColor={cores.inkFaint}
                  keyboardType="number-pad"
                  maxLength={4}
                  style={styles.anoInput}
                  accessibilityLabel="Ano de nascimento"
                />
              </View>

              <View style={[styles.linha, { flexDirection: "column", alignItems: "flex-start", gap: 10, borderBottomWidth: 0 }]}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                  <Ionicons name="medical-outline" size={20} color={cores.verde} />
                  <Texto style={styles.linhaTexto}>Condições de saúde</Texto>
                </View>
                <View style={styles.condicoesGrid}>
                  {CONDICOES_OPCOES.map((op) => {
                    const ativo = condicoesSel.includes(op.slug);
                    return (
                      <Pressable
                        key={op.slug}
                        onPress={() => toggleCondicao(op.slug)}
                        accessibilityRole="checkbox"
                        accessibilityState={{ checked: ativo }}
                        accessibilityLabel={op.rotulo}
                        style={[
                          styles.condicaoChip,
                          ativo && { backgroundColor: cores.verde, borderColor: cores.verde },
                        ]}
                      >
                        <Ionicons
                          name={op.icone}
                          size={14}
                          color={ativo ? "#ffffff" : cores.verde}
                        />
                        <Texto style={[styles.condicaoTexto, ativo && { color: "#ffffff" }]}>
                          {op.rotulo}
                        </Texto>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            </View>

            {alertasAplicaveis.length > 0 && (
              <View style={styles.alertaBox}>
                <Ionicons name="notifications-outline" size={16} color={cores.verdeDeep} />
                <Texto style={styles.alertaTexto}>
                  {alertasAplicaveis.length} alerta{alertasAplicaveis.length > 1 ? "s" : ""} de
                  direito{alertasAplicaveis.length > 1 ? "s" : ""} ativo{alertasAplicaveis.length > 1 ? "s" : ""} para seu perfil
                </Texto>
              </View>
            )}

            <Pressable
              onPress={salvarPerfil}
              disabled={salvando}
              style={[styles.btnSalvar, salvando && { opacity: 0.6 }]}
              accessibilityRole="button"
              accessibilityLabel="Salvar perfil de saúde"
            >
              <Ionicons name="checkmark-circle-outline" size={20} color="#ffffff" />
              <Texto style={styles.btnSalvarTexto}>
                {salvando ? "Salvando…" : "Salvar perfil"}
              </Texto>
            </Pressable>
          </>
        )}

        {/* ── Minhas Contribuições ── */}
        {session && gamificacao && (
          <>
            <Texto style={styles.secao}>Minhas Contribuições</Texto>
            <View style={styles.grupo}>
              <View style={[styles.linha, { justifyContent: "space-between", borderBottomWidth: 0 }]}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                  <Ionicons name="star" size={20} color={cores.amber} />
                  <Texto style={styles.linhaTexto}>{gamificacao.pontos} pontos</Texto>
                </View>
                <Texto style={[styles.linhaTexto, { color: cores.inkSoft }]}>
                  {gamificacao.total_confirmacoes} confirmações
                </Texto>
              </View>
            </View>

            <View style={styles.badgesGrid}>
              {gamificacao.badges.map((badge) => (
                <View
                  key={badge.slug}
                  style={[styles.badgeCard, !badge.conquistado && { opacity: 0.4 }]}
                >
                  <View style={[
                    styles.badgeIconWrap,
                    badge.conquistado && { backgroundColor: cores.amber + "22" },
                  ]}>
                    <Ionicons
                      name={badge.icone as never}
                      size={22}
                      color={badge.conquistado ? cores.amber : cores.inkFaint}
                    />
                    {badge.conquistado && (
                      <View style={styles.badgeCheck}>
                        <Ionicons name="checkmark" size={10} color="#ffffff" />
                      </View>
                    )}
                  </View>
                  <Texto style={styles.badgeNome} numberOfLines={2}>{badge.nome}</Texto>
                </View>
              ))}
            </View>
          </>
        )}

        {/* ── Acessibilidade ── */}
        <Texto style={styles.secao}>Acessibilidade</Texto>
        <View style={styles.grupo}>
          <LinhaToggle icone="text-outline" rotulo="Fonte ampliada" valor={fonteGrande} onChange={setFonteGrande} />
          <LinhaToggle icone="contrast-outline" rotulo="Alto contraste" valor={altoContraste} onChange={setAltoContraste} />
          <LinhaToggle icone="mic-outline" rotulo="Busca por voz" valor={false} onChange={() => {}} emBreve />
        </View>

        {/* ── Sobre ── */}
        <Texto style={styles.secao}>Sobre</Texto>
        <View style={styles.grupo}>
          <LinhaInfo icone="shield-checkmark-outline" rotulo="Fonte CNES/DATASUS após importação" />
          <LinhaInfo icone="heart-outline" rotulo="Gratuito para sempre" />
          <LinhaInfo icone="information-circle-outline" rotulo="Tem no SUS! · versão 0.1" />
        </View>

        {/* ── Conta ── */}
        <Texto style={styles.secao}>Conta</Texto>
        <Pressable
          style={[styles.btnSair, { backgroundColor: cores.coralWash }]}
          onPress={sair}
          accessibilityRole="button"
          accessibilityLabel="Sair da conta"
        >
          <Ionicons name="log-out-outline" size={20} color={cores.coral} />
          <Texto style={[styles.btnSairTexto, { color: cores.coral }]}>Sair da conta</Texto>
        </Pressable>
      </ScrollView>
    </Screen>
  );
}

function LinhaToggle({
  icone, rotulo, valor, onChange, emBreve,
}: {
  icone: string; rotulo: string; valor: boolean; onChange: (v: boolean) => void; emBreve?: boolean;
}) {
  const { cores } = useTema();
  const styles = useMemo(() => makeStyles(cores), [cores]);
  return (
    <View style={[styles.linha, emBreve && styles.linhaDesabilitada]}>
      <Ionicons name={icone as never} size={20} color={cores.verde} />
      <View style={styles.linhaTextoWrap}>
        <Texto style={styles.linhaTexto}>{rotulo}</Texto>
        {emBreve ? <Texto style={styles.emBreve}>Em breve</Texto> : null}
      </View>
      <Switch
        value={valor}
        onValueChange={onChange}
        disabled={emBreve}
        trackColor={{ true: cores.verde, false: cores.line }}
        thumbColor={cores.card}
      />
    </View>
  );
}

function LinhaInfo({ icone, rotulo }: { icone: string; rotulo: string }) {
  const { cores } = useTema();
  const styles = useMemo(() => makeStyles(cores), [cores]);
  return (
    <View style={styles.linha}>
      <Ionicons name={icone as never} size={20} color={cores.inkSoft} />
      <Texto style={styles.linhaTexto}>{rotulo}</Texto>
    </View>
  );
}

const makeStyles = (cores: Cores) =>
  StyleSheet.create({
    scroll: { padding: 20, gap: 12 },
    titulo: { fontSize: 26, fontWeight: "800", color: cores.ink, marginBottom: 4 },
    secao: {
      fontSize: 13,
      fontWeight: "700",
      color: cores.inkSoft,
      textTransform: "uppercase",
      letterSpacing: 1,
      marginTop: 12,
    },
    grupo: {
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
    linhaDesabilitada: { opacity: 0.6 },
    linhaTextoWrap: { flex: 1 },
    linhaTexto: { fontSize: 15, color: cores.ink, fontWeight: "500" },
    emBreve: { fontSize: 12, color: cores.inkFaint, marginTop: 2 },
    anoInput: {
      borderWidth: 1,
      borderColor: cores.line,
      borderRadius: 12,
      paddingHorizontal: 14,
      paddingVertical: 10,
      fontSize: 16,
      color: cores.ink,
      width: "100%",
      backgroundColor: cores.paper,
    },
    condicoesGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8, width: "100%" },
    condicaoChip: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      borderWidth: 1.5,
      borderColor: cores.verde,
      borderRadius: 20,
      paddingHorizontal: 12,
      paddingVertical: 7,
    },
    condicaoTexto: { fontSize: 13, fontWeight: "600", color: cores.verde },
    alertaBox: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      backgroundColor: cores.verdeWash,
      borderRadius: 14,
      paddingHorizontal: 14,
      paddingVertical: 10,
    },
    alertaTexto: { fontSize: 13, color: cores.verdeDeep, flex: 1 },
    btnSalvar: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      backgroundColor: cores.verde,
      borderRadius: 16,
      paddingHorizontal: 20,
      paddingVertical: 14,
      justifyContent: "center",
    },
    btnSalvarTexto: { fontSize: 15, fontWeight: "700", color: "#ffffff" },
    badgesGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
    badgeCard: {
      width: "30%",
      alignItems: "center",
      gap: 6,
      padding: 12,
      backgroundColor: cores.card,
      borderWidth: 1,
      borderColor: cores.line,
      borderRadius: 16,
    },
    badgeIconWrap: {
      width: 48,
      height: 48,
      borderRadius: 14,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: cores.paper,
      position: "relative",
    },
    badgeCheck: {
      position: "absolute",
      bottom: -2,
      right: -2,
      width: 16,
      height: 16,
      borderRadius: 8,
      backgroundColor: cores.verde,
      alignItems: "center",
      justifyContent: "center",
    },
    badgeNome: {
      fontSize: 11,
      fontWeight: "600",
      color: cores.ink,
      textAlign: "center",
      lineHeight: 15,
    },
    btnSair: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      paddingHorizontal: 16,
      paddingVertical: 14,
      borderRadius: 18,
    },
    btnSairTexto: { fontSize: 15, fontWeight: "600" },
  });
