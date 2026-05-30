import { ScrollView, StyleSheet, Switch, Text, View } from "react-native";
import { useState } from "react";
import { Ionicons } from "@expo/vector-icons";

import { Screen } from "@/components/screen";
import { colors } from "@/theme/colors";

export default function PerfilScreen() {
  const [fonteGrande, setFonteGrande] = useState(false);
  const [altoContraste, setAltoContraste] = useState(false);
  const [voz, setVoz] = useState(false);

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.titulo}>Perfil</Text>

        <Text style={styles.secao}>Acessibilidade</Text>
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
            valor={voz}
            onChange={setVoz}
          />
        </View>

        <Text style={styles.secao}>Sobre</Text>
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
}: {
  icone: string;
  rotulo: string;
  valor: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <View style={styles.linha}>
      <Ionicons name={icone as never} size={20} color={colors.verde} />
      <Text style={styles.linhaTexto}>{rotulo}</Text>
      <Switch
        value={valor}
        onValueChange={onChange}
        trackColor={{ true: colors.verde, false: colors.line }}
        thumbColor={colors.card}
      />
    </View>
  );
}

function LinhaInfo({ icone, rotulo }: { icone: string; rotulo: string }) {
  return (
    <View style={styles.linha}>
      <Ionicons name={icone as never} size={20} color={colors.inkSoft} />
      <Text style={styles.linhaTexto}>{rotulo}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: 20, gap: 12 },
  titulo: { fontSize: 26, fontWeight: "800", color: colors.ink, marginBottom: 4 },
  secao: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.inkSoft,
    textTransform: "uppercase",
    letterSpacing: 1,
    marginTop: 12,
  },
  grupo: {
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
  linhaTexto: { flex: 1, fontSize: 15, color: colors.ink, fontWeight: "500" },
});
