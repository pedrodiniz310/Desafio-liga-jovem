import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";

/** Serviço guardado pelo usuário. Distância fica de fora (é volátil). */
export type ServicoSalvo = {
  id: number;
  nome: string;
  endereco: string | null;
  horario: string | null;
};

type FavoritosState = {
  itens: ServicoSalvo[];
  alternar: (servico: ServicoSalvo) => void;
  remover: (id: number) => void;
  estaSalvo: (id: number) => boolean;
};

export const useFavoritos = create<FavoritosState>()(
  persist(
    (set, get) => ({
      itens: [],
      alternar: (servico) =>
        set((state) =>
          state.itens.some((i) => i.id === servico.id)
            ? { itens: state.itens.filter((i) => i.id !== servico.id) }
            : { itens: [servico, ...state.itens] },
        ),
      remover: (id) =>
        set((state) => ({ itens: state.itens.filter((i) => i.id !== id) })),
      estaSalvo: (id) => get().itens.some((i) => i.id === id),
    }),
    {
      name: "conecta-sus-favoritos",
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
