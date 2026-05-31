import { useMemo } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import { Screen } from "@/components/screen";
import { Texto } from "@/components/texto";
import { PERSONAS, usePersona, type PersonaSlug } from "@/stores/use-persona";
import { useTema } from "@/theme/tema";
import type { Cores } from "@/theme/colors";

export default function OnboardingScreen() {
  const router = useRouter();
  const { setPersona } = usePersona();
  const { cores } = useTema();
  const styles = useMemo(() => makeStyles(cores), [cores]);

  async function escolher(slug: PersonaSlug) {
    await setPersona(slug);
    router.replace("/(tabs)");
  }

  function pular() {
    escolher("eu_mesmo");
  }

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={styles.logoWrap}>
            <Ionicons name="medkit" size={36} color={cores.verde} />
          </View>
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
              onPress={() => escolher(p.slug)}
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
          onPress={pular}
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

const makeStyles = (cores: Cores) =>
  StyleSheet.create({
    scroll: { padding: 28, gap: 32, flexGrow: 1, justifyContent: "center" },
    header: { gap: 14, alignItems: "center" },
    logoWrap: {
      width: 72,
      height: 72,
      borderRadius: 24,
      backgroundColor: cores.verdeWash,
      alignItems: "center",
      justifyContent: "center",
    },
    titulo: {
      fontSize: 26,
      fontWeight: "800",
      color: cores.ink,
      textAlign: "center",
      lineHeight: 34,
    },
    subtitulo: {
      fontSize: 15,
      color: cores.inkSoft,
      textAlign: "center",
      lineHeight: 22,
    },
    opcoes: { gap: 12 },
    chip: {
      flexDirection: "row",
      alignItems: "center",
      gap: 14,
      backgroundColor: cores.card,
      borderWidth: 1.5,
      borderColor: cores.line,
      borderRadius: 20,
      padding: 16,
    },
    chipEmoji: { fontSize: 26 },
    chipTextos: { flex: 1, gap: 2 },
    chipRotulo: { fontSize: 16, fontWeight: "700", color: cores.ink },
    chipDica: { fontSize: 12, color: cores.inkFaint },
    pular: { alignItems: "center", paddingVertical: 10 },
    pularTexto: { fontSize: 14, color: cores.inkFaint },
  });
