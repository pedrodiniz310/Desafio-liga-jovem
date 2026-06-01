// DEVE ser o primeiro import: filtra o aviso de push do Expo Go antes que
// o expo-notifications seja carregado (require abaixo).
import "@/lib/silence-expo-go-warnings";

import { Platform, ActivityIndicator, View } from "react-native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { ErrorBoundary, FallbackTela } from "@/components/error-boundary";
import { AuthProvider, useAuth } from "@/stores/use-auth";
import { TemaProvider, useTema } from "@/theme/tema";
import { LocalizacaoProvider } from "@/stores/use-localizacao";
import { FavoritosProvider } from "@/stores/use-favoritos";
import { PreferenciasProvider } from "@/stores/use-preferencias";
import { PersonaProvider, usePersona } from "@/stores/use-persona";
import { PerfilSaudeProvider } from "@/stores/use-perfil-saude";

if (Platform.OS !== "web") {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const Notifications = require("expo-notifications");
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: false,
      shouldSetBadge: false,
    }),
  });
}

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 1000 * 60 * 5, retry: 2 } },
});

export default function RootLayout() {
  return (
    <ErrorBoundary fallback={<FallbackTela onReset={() => {}} />}>
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryClientProvider client={queryClient}>
        <PreferenciasProvider>
          <AuthProvider>
            <PerfilSaudeProvider>
            <PersonaProvider>
              <LocalizacaoProvider>
                <FavoritosProvider>
                  <TemaProvider>
                    <Chrome />
                  </TemaProvider>
                </FavoritosProvider>
              </LocalizacaoProvider>
            </PersonaProvider>
            </PerfilSaudeProvider>
          </AuthProvider>
        </PreferenciasProvider>
      </QueryClientProvider>
    </GestureHandlerRootView>
    </ErrorBoundary>
  );
}

function Chrome() {
  const { cores } = useTema();
  const { session, loading } = useAuth();
  const { persona, carregado: personaCarregado } = usePersona();

  // Aguarda auth E persona antes de resolver rotas
  if (loading || (session && !personaCarregado)) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: cores.paper }}>
        <ActivityIndicator size="large" color={cores.verde} />
      </View>
    );
  }

  return (
    <>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: cores.paper },
        }}
      >
        {/* login: redireciona se já tem sessão */}
        <Stack.Screen name="login" redirect={!!session} />

        {/* onboarding: redireciona se sem sessão OU persona já definida */}
        <Stack.Screen
          name="onboarding"
          redirect={!session || (personaCarregado && !!persona)}
          options={{ headerShown: false }}
        />

        {/* tabs: redireciona se sem sessão OU persona não definida */}
        <Stack.Screen
          name="(tabs)"
          redirect={!session || (personaCarregado && !persona)}
        />

        <Stack.Screen
          name="servico/[id]"
          options={{
            headerShown: true,
            title: "Serviço",
            headerTintColor: cores.verde,
            headerStyle: { backgroundColor: cores.paper },
            headerShadowVisible: false,
          }}
        />

        <Stack.Screen
          name="jornada/[slug]"
          options={{
            headerShown: true,
            title: "Jornada de Cuidado",
            headerTintColor: cores.verde,
            headerStyle: { backgroundColor: cores.paper },
            headerShadowVisible: false,
          }}
        />
      </Stack>
    </>
  );
}
