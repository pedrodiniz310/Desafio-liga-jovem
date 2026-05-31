import { useEffect, useState } from "react";
import { useLocalSearchParams } from "expo-router";
import { View, ActivityIndicator } from "react-native";
import { supabase } from "@/lib/supabase";
import { useTema } from "@/theme/tema";
import { Texto } from "@/components/texto";

export default function VerifyScreen() {
  const { cores } = useTema();
  const { token, type, email } = useLocalSearchParams<{ token: string; type?: string; email?: string }>();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [msg, setMsg] = useState("");

  useEffect(() => {
    (async () => {
      if (!token || !email) {
        setStatus("error");
        setMsg("Token ou email inválido. Tente novamente.");
        return;
      }

      try {
        const { error } = await supabase.auth.verifyOtp({
          email,
          token,
          type: (type ?? "signup") as "signup" | "recovery" | "invite" | "magiclink",
        });

        if (error) throw error;
        setStatus("success");
        setMsg("Email confirmado! Redirecionando...");
        // Auth listener em _layout vai redirecionar para tabs automaticamente
      } catch (e) {
        setStatus("error");
        setMsg(e instanceof Error ? e.message : "Erro ao confirmar email");
      }
    })();
  }, [token, email, type]);

  return (
    <View
      style={{
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: cores.paper,
        gap: 16,
        paddingHorizontal: 20,
      }}
    >
      {status === "loading" && (
        <>
          <ActivityIndicator size="large" color={cores.verde} />
          <Texto style={{ fontSize: 16, color: cores.ink, fontWeight: "600" }}>
            Confirmando seu email...
          </Texto>
        </>
      )}
      {status === "success" && (
        <>
          <Texto
            style={{
              fontSize: 24,
              color: cores.verde,
              fontWeight: "700",
              textAlign: "center",
            }}
          >
            ✓
          </Texto>
          <Texto style={{ fontSize: 16, color: cores.verde, fontWeight: "600", textAlign: "center" }}>
            {msg}
          </Texto>
        </>
      )}
      {status === "error" && (
        <>
          <Texto
            style={{
              fontSize: 24,
              color: cores.coral,
              fontWeight: "700",
              textAlign: "center",
            }}
          >
            ✗
          </Texto>
          <Texto
            style={{
              fontSize: 16,
              color: cores.coral,
              fontWeight: "600",
              textAlign: "center",
            }}
          >
            {msg}
          </Texto>
        </>
      )}
    </View>
  );
}
