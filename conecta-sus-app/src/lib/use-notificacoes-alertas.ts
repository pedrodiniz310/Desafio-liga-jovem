import { useEffect } from "react";
import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { Perfil, RegraDireito } from "@/types/models";

// Importação lazy para não quebrar web build
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let Notifications: any = null;
if (Platform.OS !== "web") {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  Notifications = require("expo-notifications");
}

const STORAGE_KEY = "alertas_notificados_data";

export function useNotificacoesAlertas(
  perfil: Perfil | null | undefined,
  alertasAplicaveis: RegraDireito[]
) {
  useEffect(() => {
    if (!Notifications) return;
    if (!perfil || alertasAplicaveis.length === 0) return;

    async function agendar() {
      const hoje = new Date().toISOString().split("T")[0];
      const ultimaData = await AsyncStorage.getItem(STORAGE_KEY);
      if (ultimaData === hoje) return; // já notificou hoje

      const { status } = await Notifications.requestPermissionsAsync();
      if (status !== "granted") return;

      if (Platform.OS === "android") {
        await Notifications.setNotificationChannelAsync("direitos_sus", {
          name: "Seus Direitos de Saúde",
          importance: Notifications.AndroidImportance.DEFAULT,
          sound: null,
        });
      }

      const paraMostrar = alertasAplicaveis.slice(0, 3);
      for (const regra of paraMostrar) {
        await Notifications.scheduleNotificationAsync({
          content: {
            title: `💚 ${regra.titulo}`,
            body: regra.mensagem,
            data: { regra_id: regra.id, servico_codigo: regra.servico_codigo },
          },
          trigger: null,
        });
      }

      await AsyncStorage.setItem(STORAGE_KEY, hoje);
    }

    agendar();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [perfil?.id, alertasAplicaveis.length]);
}
