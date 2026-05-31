import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

export type ServicoSalvo = {
  id: number;
  nome: string;
  endereco: string | null;
  horario: string | null;
};

type FavoritosState = {
  itens: ServicoSalvo[];
  alternar: (s: ServicoSalvo) => Promise<void>;
  remover: (id: number) => Promise<void>;
  estaSalvo: (id: number) => boolean;
};

const FavoritosContext = createContext<FavoritosState | undefined>(undefined);
const STORAGE_KEY = "@tem_no_sus_favoritos";

export function FavoritosProvider({ children }: { children: ReactNode }) {
  const [itens, setItens] = useState<ServicoSalvo[]>([]);
  const [carregado, setCarregado] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const data = await AsyncStorage.getItem(STORAGE_KEY);
        if (data) setItens(JSON.parse(data));
      } catch (e) {
        console.error("erro ao carregar favoritos:", e);
      }
      setCarregado(true);
    })();
  }, []);

  const salvar = useCallback(async (items: ServicoSalvo[]) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch (e) {
      console.error("erro ao salvar favoritos:", e);
    }
  }, []);

  const alternar = useCallback(
    async (servico: ServicoSalvo) => {
      const novoItens = itens.some((i) => i.id === servico.id)
        ? itens.filter((i) => i.id !== servico.id)
        : [...itens, servico];
      setItens(novoItens);
      await salvar(novoItens);
    },
    [itens, salvar]
  );

  const remover = useCallback(
    async (id: number) => {
      const novoItens = itens.filter((i) => i.id !== id);
      setItens(novoItens);
      await salvar(novoItens);
    },
    [itens, salvar]
  );

  const estaSalvo = useCallback((id: number) => itens.some((i) => i.id === id), [itens]);

  const value: FavoritosState = { itens, alternar, remover, estaSalvo };

  return (
    <FavoritosContext.Provider value={value}>
      {children}
    </FavoritosContext.Provider>
  );
}

export function useFavoritos(): FavoritosState {
  const ctx = useContext(FavoritosContext);
  if (!ctx) throw new Error("useFavoritos must be used inside FavoritosProvider");
  return ctx;
}
