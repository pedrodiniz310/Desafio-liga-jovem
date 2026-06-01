// Ao ser importado, o expo-notifications auto-registra um listener de push token
// (DevicePushTokenAutoRegistration.fx → addPushTokenListener). No Expo Go a partir
// do SDK 53 isso dispara um aviso de que push REMOTO foi removido do Expo Go — e no
// Android esse aviso sai como console.error, virando um overlay vermelho de "Console
// Error". Nossas notificações são LOCAIS (agendadas no device) e continuam funcionando
// normalmente no Expo Go, então o aviso é apenas ruído.
//
// Filtramos somente essa mensagem específica; qualquer outro erro/aviso passa intacto.
// Só atua em __DEV__ (o próprio aviso do expo-notifications só ocorre em __DEV__).

const MSG_PUSH_EXPO_GO =
  "expo-notifications: Android Push notifications (remote notifications) functionality provided by expo-notifications was removed from Expo Go";

import { LogBox } from "react-native";
LogBox.ignoreLogs([MSG_PUSH_EXPO_GO, "expo-notifications: Android Push notifications"]);

function ehAvisoPushExpoGo(args: unknown[]): boolean {
  return typeof args[0] === "string" && args[0].includes(MSG_PUSH_EXPO_GO);
}

if (__DEV__) {
  const erroOriginal = console.error.bind(console);
  console.error = (...args: unknown[]) => {
    if (ehAvisoPushExpoGo(args)) return;
    erroOriginal(...args);
  };

  const avisoOriginal = console.warn.bind(console);
  console.warn = (...args: unknown[]) => {
    if (ehAvisoPushExpoGo(args)) return;
    avisoOriginal(...args);
  };
}
