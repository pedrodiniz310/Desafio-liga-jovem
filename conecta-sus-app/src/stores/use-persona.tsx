import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  type ReactNode,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

export type PersonaSlug = "eu_mesmo" | "meu_filho" | "mae_pai" | "familia";

export interface PersonaConfig {
  slug: PersonaSlug;
  rotulo: string;
  emoji: string;
  tituloBusca: string;   // texto do hero band (pode ter \n)
  placeholder: string;   // placeholder do TextInput de busca
}

export const PERSONAS: PersonaConfig[] = [
  {
    slug: "eu_mesmo",
    rotulo: "Eu mesmo",
    emoji: "🙋",
    tituloBusca: "O que você\nprecisa?",
    placeholder: "Ex.: preciso de psicólogo",
  },
  {
    slug: "meu_filho",
    rotulo: "Meu filho",
    emoji: "👶",
    tituloBusca: "O que seu filho\nprecisa?",
    placeholder: "Ex.: meu filho não fala, chora muito...",
  },
  {
    slug: "mae_pai",
    rotulo: "Minha mãe/pai",
    emoji: "👵",
    tituloBusca: "O que sua mãe ou\npai precisa?",
    placeholder: "Ex.: fraldas geriátricas, fisioterapia",
  },
  {
    slug: "familia",
    rotulo: "Minha família",
    emoji: "👨‍👩‍👧",
    tituloBusca: "O que sua família\nprecisa?",
    placeholder: "Ex.: dentista, vacina, psicólogo",
  },
];

const DEFAULT_PERSONA = PERSONAS[0]; // eu_mesmo

type PersonaState = {
  persona: PersonaSlug | null;
  personaConfig: PersonaConfig;
  carregado: boolean;
  setPersona: (slug: PersonaSlug) => Promise<void>;
};

const PersonaContext = createContext<PersonaState | undefined>(undefined);
const STORAGE_KEY = "@conecta_sus_persona";

export function PersonaProvider({ children }: { children: ReactNode }) {
  const [persona, setPersonaState] = useState<PersonaSlug | null>(null);
  const [carregado, setCarregado] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const data = await AsyncStorage.getItem(STORAGE_KEY);
        if (data) setPersonaState(data as PersonaSlug);
      } catch {
        // silent — falha no carregamento mantém persona null
      }
      setCarregado(true);
    })();
  }, []);

  const setPersona = useCallback(async (slug: PersonaSlug) => {
    setPersonaState(slug);
    try {
      await AsyncStorage.setItem(STORAGE_KEY, slug);
    } catch {
      // silent
    }
  }, []);

  const personaConfig =
    (persona ? PERSONAS.find((p) => p.slug === persona) : undefined) ??
    DEFAULT_PERSONA;

  return (
    <PersonaContext.Provider value={{ persona, personaConfig, carregado, setPersona }}>
      {children}
    </PersonaContext.Provider>
  );
}

export function usePersona(): PersonaState {
  const ctx = useContext(PersonaContext);
  if (!ctx) throw new Error("usePersona must be used inside PersonaProvider");
  return ctx;
}
