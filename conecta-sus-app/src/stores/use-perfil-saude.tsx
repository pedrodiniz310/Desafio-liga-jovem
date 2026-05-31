import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  type ReactNode,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

export type FaixaEtaria = "crianca" | "jovem" | "adulto" | "idoso";

export interface PerfilSaude {
  faixaEtaria: FaixaEtaria | null;
  condicoes: string[];
}

type PerfilSaudeState = PerfilSaude & {
  carregado: boolean;
  setPerfil: (perfil: PerfilSaude) => Promise<void>;
};

const STORAGE_KEY = "@conecta_sus_perfil_saude";

const PerfilSaudeContext = createContext<PerfilSaudeState | undefined>(undefined);

export function PerfilSaudeProvider({ children }: { children: ReactNode }) {
  const [faixaEtaria, setFaixaEtaria] = useState<FaixaEtaria | null>(null);
  const [condicoes, setCondicoes] = useState<string[]>([]);
  const [carregado, setCarregado] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) {
          const parsed: PerfilSaude = JSON.parse(raw);
          setFaixaEtaria(parsed.faixaEtaria ?? null);
          setCondicoes(parsed.condicoes ?? []);
        }
      } catch {
        // silent
      }
      setCarregado(true);
    })();
  }, []);

  const setPerfil = useCallback(async (perfil: PerfilSaude) => {
    setFaixaEtaria(perfil.faixaEtaria);
    setCondicoes(perfil.condicoes);
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(perfil));
    } catch {
      // silent
    }
  }, []);

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
