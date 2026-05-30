import { useMemo } from "react";
import { ScrollView, StyleSheet, Switch, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { Screen } from "@/components/screen";
import { Texto } from "@/components/texto";
import { usePreferencias } from "@/stores/use-preferencias";
import { useTema } from "@/theme/tema";
import type { Cores } from "@/theme/colors";

export default function PerfilScreen() {
  const fonteGrande = usePreferencias((s) => s.fonteGrande);
  const altoContraste = usePreferencias((s) => s.altoContraste);
  const setFonteGrande = usePreferencias((s) => s.setFonteGrande);
  const setAltoContraste = usePreferencias((s) => s.setAltoContraste);

  const { cores } = useTema();
  const styles = useMemo(() => makeStyles(cores), [cores]);

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Texto style={styles.titulo}>Perfil</Texto>

        <Texto style={styles.secao}>Acessibilidade</Texto>
        <View style={styles.grupo}>
          <LinhaToggle
            icone="text-outline"
            rotulo="Fonte ampliada"
            valor={fonteGrande}
            onChange={setFonteGrande}
          />
          <LinhaToggle
            icone="contrast-outline"
            rotulo="Alto contraste"
            valor={altoContraste}
            onChange={setAltoContraste}
          />
          <LinhaToggle
            icone="mic-outline"
            rotulo="Busca por voz"
            valor={false}
            onChange={() => {}}
            emBreve
          />
        </View>

        <Texto style={styles.secao}>Sobre</Texto>
        <View style={styles.grupo}>
          <LinhaInfo icone="shield-checkmark-outline" rotulo="Dados oficiais do CNES" />
          <LinhaInfo icone="heart-outline" rotulo="Gratuito para sempre" />
          <LinhaInfo icone="information-circle-outline" rotulo="Conecta SUS · versão 0.1" />
        </View>
      </ScrollView>
    </Screen>
  );
}

function LinhaToggle({
  icone,
  rotulo,
  valor,
  onChange,
  emBreve,
}: {
  icone: string;
  rotulo: string;
  valor: boolean;
  onChange: (v: boolean) => void;
  emBreve?: boolean;
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
  });
