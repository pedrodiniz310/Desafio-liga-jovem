import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { ActivityIndicator, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { AuthProvider, useAuth } from "@/stores/use-auth";
import { TemaProvider, useTema } from "@/theme/tema";
import { LocalizacaoProvider } from "@/stores/use-localizacao";
import { FavoritosProvider } from "@/stores/use-favoritos";
import { PreferenciasProvider } from "@/stores/use-preferencias";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      retry: 2,
    },
  },
});

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryClientProvider client={queryClient}>
        <PreferenciasProvider>
          <AuthProvider>
            <LocalizacaoProvider>
              <FavoritosProvider>
                <TemaProvider>
                  <Chrome />
                </TemaProvider>
              </FavoritosProvider>
            </LocalizacaoProvider>
          </AuthProvider>
        </PreferenciasProvider>
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}

function Chrome() {
  const { cores } = useTema();
  const { session, loading } = useAuth();

  if (loading) {
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
        <Stack.Screen name="login" redirect={!!session} />
        <Stack.Screen name="(tabs)" redirect={!session} />
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
      </Stack>
    </>
  );
}
