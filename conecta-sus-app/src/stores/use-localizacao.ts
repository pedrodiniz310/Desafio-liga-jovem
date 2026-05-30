import { create } from "zustand";
import type { Coordenada } from "@/types/models";

/** Município piloto: Joaçaba/SC (fallback enquanto o GPS não resolve). */
export const JOACABA: Coordenada = { lat: -27.1771, lng: -51.5045 };

type LocalizacaoState = {
  coordenada: Coordenada | null;
  municipioNome: string;
  permissaoNegada: boolean;
  setCoordenada: (c: Coordenada) => void;
  setMunicipio: (nome: string) => void;
  setPermissaoNegada: (v: boolean) => void;
};

export const useLocalizacao = create<LocalizacaoState>((set) => ({
  coordenada: null,
  municipioNome: "Joaçaba · SC",
  permissaoNegada: false,
  setCoordenada: (coordenada) => set({ coordenada }),
  setMunicipio: (municipioNome) => set({ municipioNome }),
  setPermissaoNegada: (permissaoNegada) => set({ permissaoNegada }),
}));
