import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { TemaProvider, useTema } from "@/theme/tema";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 min
      retry: 2,
    },
  },
});

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryClientProvider client={queryClient}>
        <TemaProvider>
          <Chrome />
        </TemaProvider>
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}

/** Navegação raiz — dentro do TemaProvider para refletir cores/contraste. */
function Chrome() {
  const { cores } = useTema();
  return (
    <>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: cores.paper },
        }}
      >
        <Stack.Screen name="(tabs)" />
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
