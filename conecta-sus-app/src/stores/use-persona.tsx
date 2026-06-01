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
// Persona é por usuário: a chave inclui o id da conta. Assim, criar uma conta
// nova (ou trocar de usuário no mesmo aparelho) zera a persona e dispara o
// onboarding, enquanto o mesmo usuário que volta a logar mantém a sua escolha.
const STORAGE_PREFIX = "@tem_no_sus_persona:";

export function PersonaProvider({ children }: { children: ReactNode }) {
  const { session } = useAuth();
  const userId = session?.user?.id ?? null;

  const [persona, setPersonaState] = useState<PersonaSlug | null>(null);
  // Guarda para qual usuário a persona em memória foi carregada. Enquanto não
  // bater com o userId atual, `carregado` é false — evita usar persona de outro
  // usuário por um frame durante a troca de conta.
  const [userIdCarregado, setUserIdCarregado] = useState<string | null | undefined>(
    undefined
  );

  useEffect(() => {
    let ativo = true;
    (async () => {
      let valor: PersonaSlug | null = null;
      if (userId) {
        try {
          const data = await AsyncStorage.getItem(`${STORAGE_PREFIX}${userId}`);
          if (data) valor = data as PersonaSlug;
        } catch {
          // silent — falha no carregamento mantém persona null
        }
      }
      if (ativo) {
        setPersonaState(valor);
        setUserIdCarregado(userId);
      }
    })();
    return () => {
      ativo = false;
    };
  }, [userId]);

  const setPersona = useCallback(
    async (slug: PersonaSlug) => {
      setPersonaState(slug);
      if (!userId) return;
      try {
        await AsyncStorage.setItem(`${STORAGE_PREFIX}${userId}`, slug);
      } catch {
        // silent
      }
    },
    [userId]
  );

  const carregado = userIdCarregado === userId;

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
