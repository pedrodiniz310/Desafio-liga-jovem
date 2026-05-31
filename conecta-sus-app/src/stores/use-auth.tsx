import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";

type AuthCtx = {
  session: Session | null;
  loading: boolean;
  erro: string | null;
  entrando: boolean;
  entrar: (email: string, senha: string) => Promise<void>;
  criarConta: (email: string, senha: string) => Promise<void>;
  sair: () => Promise<void>;
};

const AuthContext = createContext<AuthCtx | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [entrando, setEntrando] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        if (error) throw error;
        setSession(data.session);
      } catch (e) {
        console.error("getSession erro:", e);
      } finally {
        setLoading(false);
      }
    })();

    const { data: listener } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
    });

    return () => listener?.subscription.unsubscribe();
  }, []);

  const entrar = async (email: string, senha: string) => {
    setEntrando(true);
    setErro(null);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: senha,
      });
      if (error) throw new Error(error.message);
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Erro ao entrar");
    } finally {
      setEntrando(false);
    }
  };

  const criarConta = async (email: string, senha: string) => {
    setEntrando(true);
    setErro(null);
    try {
      const { error } = await supabase.auth.signUp({
        email: email.trim(),
        password: senha,
      });
      if (error) throw new Error(error.message);
      setErro(null);
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Erro ao criar conta");
    } finally {
      setEntrando(false);
    }
  };

  const sair = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      setSession(null);
    } catch (e) {
      console.error("signOut erro:", e);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        session,
        loading,
        erro,
        entrando,
        entrar,
        criarConta,
        sair,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth fora de AuthProvider");
  return ctx;
}
