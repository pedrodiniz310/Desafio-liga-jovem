import { useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import { Screen } from "@/components/screen";
import { LogoMarca } from "@/components/logo-marca";
import { LogoCompleta } from "@/components/logo-completa";
import { Texto } from "@/components/texto";
import { PERSONAS, usePersona, type PersonaSlug } from "@/stores/use-persona";
import { usePerfilSaude, type FaixaEtaria } from "@/stores/use-perfil-saude";
import { useTema } from "@/theme/tema";
import type { Cores } from "@/theme/colors";

type Etapa = 1 | 2;

interface OpcaoFaixa {
  slug: FaixaEtaria;
  rotulo: string;
  emoji: string;
  dica: string;
}

const FAIXAS: OpcaoFaixa[] = [
  { slug: "crianca", rotulo: "Criança",  emoji: "👶", dica: "0 a 12 anos" },
  { slug: "jovem",   rotulo: "Jovem",    emoji: "🧑", dica: "13 a 29 anos" },
  { slug: "adulto",  rotulo: "Adulto",   emoji: "🙋", dica: "30 a 59 anos" },
  { slug: "idoso",   rotulo: "Idoso",    emoji: "👴", dica: "60 anos ou mais" },
];

const CONDICOES_OPCOES = [
  { slug: "gestante",    rotulo: "Gestante",                  icone: "heart-outline"   as const },
  { slug: "diabetes",    rotulo: "Diabetes",                  icone: "medical-outline" as const },
  { slug: "hipertensao", rotulo: "Hipertensão",               icone: "pulse-outline"   as const },
  { slug: "cancer_mama", rotulo: "Histórico de câncer de mama", icone: "ribbon-outline" as const },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const { setPersona } = usePersona();
  const { setPerfil } = usePerfilSaude();
  const { cores } = useTema();
  const styles = useMemo(() => makeStyles(cores), [cores]);

  const [etapa, setEtapa] = useState<Etapa>(1);
  const [personaPendente, setPersonaPendente] = useState<PersonaSlug>("eu_mesmo");
  const [faixaSelecionada, setFaixaSelecionada] = useState<FaixaEtaria | null>(null);
  const [condicoesSelecionadas, setCondicoesSelecionadas] = useState<string[]>([]);

  function escolherPersona(slug: PersonaSlug) {
    setPersonaPendente(slug);
    setEtapa(2);
  }

  function toggleCondicao(slug: string) {
    setCondicoesSelecionadas((prev) =>
      prev.includes(slug) ? prev.filter((c) => c !== slug) : [...prev, slug]
    );
  }

  async function concluir() {
    await setPerfil({ faixaEtaria: faixaSelecionada, condicoes: condicoesSelecionadas });
    await setPersona(personaPendente);
    router.replace("/(tabs)");
  }

  if (etapa === 1) {
    return (
      <Screen>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <LogoCompleta largura={216} cor={cores.ink} />
            <Texto style={styles.titulo}>
              Para quem você está{"\n"}buscando saúde hoje?
            </Texto>
            <Texto style={styles.subtitulo}>
              Personalizamos os resultados para mostrar o que é mais relevante para você.
            </Texto>
          </View>

          <View style={styles.opcoes}>
            {PERSONAS.map((p) => (
              <Pressable
                key={p.slug}
                onPress={() => escolherPersona(p.slug)}
                accessibilityRole="button"
                accessibilityLabel={p.rotulo}
                style={({ pressed }) => [styles.chip, pressed && { opacity: 0.82 }]}
              >
                <Texto style={styles.chipEmoji}>{p.emoji}</Texto>
                <View style={styles.chipTextos}>
                  <Texto style={styles.chipRotulo}>{p.rotulo}</Texto>
                  <Texto style={styles.chipDica}>{p.placeholder}</Texto>
                </View>
                <Ionicons name="chevron-forward" size={20} color={cores.inkFaint} />
              </Pressable>
            ))}
          </View>

          <Pressable
            onPress={() => escolherPersona("eu_mesmo")}
            style={styles.pular}
            accessibilityRole="button"
            accessibilityLabel="Pular personalização"
          >
            <Texto style={styles.pularTexto}>Pular por agora</Texto>
          </Pressable>
        </ScrollView>
      </Screen>
    );
  }

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <LogoMarca size={72} />
          <Texto style={styles.titulo}>Mais um passo{"\n"}(opcional)</Texto>
          <Texto style={styles.subtitulo}>
            Isso nos permite enviar alertas de saúde personalizados para o seu perfil.
          </Texto>
        </View>

        <View style={styles.secaoWrap}>
          <Texto style={styles.secaoLabel}>Qual a faixa etária?</Texto>
          <View style={styles.faixasGrid}>
            {FAIXAS.map((f) => {
              const selecionado = faixaSelecionada === f.slug;
              return (
                <Pressable
                  key={f.slug}
                  onPress={() => setFaixaSelecionada(f.slug)}
                  accessibilityRole="button"
                  accessibilityLabel={f.rotulo}
                  style={({ pressed }) => [
                    styles.faixaChip,
                    selecionado && styles.faixaChipSelecionado,
                    pressed && { opacity: 0.82 },
                  ]}
                >
                  <Texto style={styles.faixaEmoji}>{f.emoji}</Texto>
                  <Texto style={[styles.faixaRotulo, selecionado && { color: cores.verdeDeep }]}>
                    {f.rotulo}
                  </Texto>
                  <Texto style={styles.faixaDica}>{f.dica}</Texto>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View style={styles.secaoWrap}>
          <Texto style={styles.secaoLabel}>Alguma dessas condições? (opcional)</Texto>
          <View style={styles.opcoes}>
            {CONDICOES_OPCOES.map((c) => {
              const ativo = condicoesSelecionadas.includes(c.slug);
              return (
                <Pressable
                  key={c.slug}
                  onPress={() => toggleCondicao(c.slug)}
                  accessibilityRole="checkbox"
                  accessibilityLabel={c.rotulo}
                  style={({ pressed }) => [
                    styles.condicaoChip,
                    ativo && styles.condicaoChipAtivo,
                    pressed && { opacity: 0.82 },
                  ]}
                >
                  <Ionicons name={c.icone} size={20} color={ativo ? cores.verdeDeep : cores.inkSoft} />
                  <Texto style={[styles.condicaoTexto, ativo && { color: cores.verdeDeep, fontWeight: "700" }]}>
                    {c.rotulo}
                  </Texto>
                  {ativo && <Ionicons name="checkmark-circle" size={18} color={cores.verde} />}
                </Pressable>
              );
            })}
          </View>
        </View>

        <Pressable
          onPress={concluir}
          accessibilityRole="button"
          accessibilityLabel="Continuar"
          style={({ pressed }) => [styles.btnConcluir, pressed && { opacity: 0.88 }]}
        >
          <Texto style={styles.btnConcluirTexto}>Continuar</Texto>
          <Ionicons name="arrow-forward" size={20} color="#ffffff" />
        </Pressable>

        <Pressable
          onPress={concluir}
          style={styles.pular}
          accessibilityRole="button"
          accessibilityLabel="Pular esta etapa"
        >
          <Texto style={styles.pularTexto}>Pular esta etapa</Texto>
        </Pressable>
      </ScrollView>
    </Screen>
  );
}

const makeStyles = (cores: Cores) =>
  StyleSheet.create({
    scroll: { padding: 28, gap: 28, flexGrow: 1, justifyContent: "center" },
    header: { gap: 14, alignItems: "center" },
    titulo: { fontSize: 26, fontWeight: "800", color: cores.ink, textAlign: "center", lineHeight: 34 },
    subtitulo: { fontSize: 15, color: cores.inkSoft, textAlign: "center", lineHeight: 22 },
    opcoes: { gap: 12 },
    chip: {
      flexDirection: "row", alignItems: "center", gap: 14,
      backgroundColor: cores.card, borderWidth: 1.5,
      borderColor: cores.line, borderRadius: 20, padding: 16,
    },
    chipEmoji: { fontSize: 26 },
    chipTextos: { flex: 1, gap: 2 },
    chipRotulo: { fontSize: 16, fontWeight: "700", color: cores.ink },
    chipDica: { fontSize: 12, color: cores.inkFaint },
    pular: { alignItems: "center", paddingVertical: 10 },
    pularTexto: { fontSize: 14, color: cores.inkFaint },
    secaoWrap: { gap: 12 },
    secaoLabel: {
      fontSize: 13, fontWeight: "700", color: cores.inkFaint,
      textTransform: "uppercase", letterSpacing: 1,
    },
    faixasGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
    faixaChip: {
      width: "47%", alignItems: "center", gap: 4,
      backgroundColor: cores.card, borderWidth: 1.5,
      borderColor: cores.line, borderRadius: 18, padding: 14,
    },
    faixaChipSelecionado: { borderColor: cores.verde, backgroundColor: cores.verdeWash },
    faixaEmoji: { fontSize: 24 },
    faixaRotulo: { fontSize: 15, fontWeight: "700", color: cores.ink },
    faixaDica: { fontSize: 11, color: cores.inkFaint },
    condicaoChip: {
      flexDirection: "row", alignItems: "center", gap: 12,
      backgroundColor: cores.card, borderWidth: 1.5,
      borderColor: cores.line, borderRadius: 18, padding: 14,
    },
    condicaoChipAtivo: { borderColor: cores.verde, backgroundColor: cores.verdeWash },
    condicaoTexto: { flex: 1, fontSize: 15, color: cores.inkSoft },
    btnConcluir: {
      flexDirection: "row", alignItems: "center", justifyContent: "center",
      gap: 10, backgroundColor: cores.verde,
      borderRadius: 20, paddingVertical: 16, marginTop: 4,
    },
    btnConcluirTexto: { fontSize: 17, fontWeight: "800", color: "#ffffff" },
  });
