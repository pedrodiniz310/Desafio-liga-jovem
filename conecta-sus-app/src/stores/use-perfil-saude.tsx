import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  type ReactNode,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAuth } from "@/stores/use-auth";

export type FaixaEtaria = "crianca" | "jovem" | "adulto" | "idoso";

export interface PerfilSaude {
  faixaEtaria: FaixaEtaria | null;
  condicoes: string[];
}

type PerfilSaudeState = PerfilSaude & {
  carregado: boolean;
  setPerfil: (perfil: PerfilSaude) => Promise<void>;
};

// Perfil de saúde é por usuário (mesma lógica da persona): a chave inclui o id
// da conta, para que uma conta nova não herde a faixa etária/condições de outra.
const STORAGE_PREFIX = "@tem_no_sus_perfil_saude:";

const PerfilSaudeContext = createContext<PerfilSaudeState | undefined>(undefined);

export function PerfilSaudeProvider({ children }: { children: ReactNode }) {
  const { session } = useAuth();
  const userId = session?.user?.id ?? null;

  const [faixaEtaria, setFaixaEtaria] = useState<FaixaEtaria | null>(null);
  const [condicoes, setCondicoes] = useState<string[]>([]);
  const [userIdCarregado, setUserIdCarregado] = useState<string | null | undefined>(
    undefined
  );

  useEffect(() => {
    let ativo = true;
    (async () => {
      let fe: FaixaEtaria | null = null;
      let cond: string[] = [];
      if (userId) {
        try {
          const raw = await AsyncStorage.getItem(`${STORAGE_PREFIX}${userId}`);
          if (raw) {
            const parsed: PerfilSaude = JSON.parse(raw);
            fe = parsed.faixaEtaria ?? null;
            cond = parsed.condicoes ?? [];
          }
        } catch {
          // silent
        }
      }
      if (ativo) {
        setFaixaEtaria(fe);
        setCondicoes(cond);
        setUserIdCarregado(userId);
      }
    })();
    return () => {
      ativo = false;
    };
  }, [userId]);

  const setPerfil = useCallback(
    async (perfil: PerfilSaude) => {
      setFaixaEtaria(perfil.faixaEtaria);
      setCondicoes(perfil.condicoes);
      if (!userId) return;
      try {
        await AsyncStorage.setItem(`${STORAGE_PREFIX}${userId}`, JSON.stringify(perfil));
      } catch {
        // silent
      }
    },
    [userId]
  );

  const carregado = userIdCarregado === userId;

  return (
    <PerfilSaudeContext.Provider value={{ faixaEtaria, condicoes, carregado, setPerfil }}>
      {children}
    </PerfilSaudeContext.Provider>
  );
}

export function usePerfilSaude(): PerfilSaudeState {
  const ctx = useContext(PerfilSaudeContext);
  if (!ctx) throw new Error("usePerfilSaude must be used inside PerfilSaudeProvider");
  return ctx;
}
