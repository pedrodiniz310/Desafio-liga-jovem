import { createContext, useContext, useState, useCallback, ReactNode } from "react";
import type { Coordenada } from "@/types/models";

export const JOACABA: Coordenada = { lat: -27.1771, lng: -51.5045 };

type LocalizacaoState = {
  coordenada: Coordenada | null;
  municipioNome: string;
  permissaoNegada: boolean;
  setCoordenada: (c: Coordenada) => void;
  setMunicipio: (nome: string) => void;
  setPermissaoNegada: (v: boolean) => void;
};

const LocalizacaoContext = createContext<LocalizacaoState | undefined>(undefined);

export function LocalizacaoProvider({ children }: { children: ReactNode }) {
  const [coordenada, setCoordenada] = useState<Coordenada | null>(null);
  const [municipioNome, setMunicipioNome] = useState("Joaçaba · SC");
  const [permissaoNegada, setPermissaoNegada] = useState(false);

  const setMunicipio = useCallback((nome: string) => setMunicipioNome(nome), []);
  const setCoordenadaCallback = useCallback((c: Coordenada) => setCoordenada(c), []);
  const setPermissaoNegadaCallback = useCallback((v: boolean) => setPermissaoNegada(v), []);

  const value: LocalizacaoState = {
    coordenada,
    municipioNome,
    permissaoNegada,
    setCoordenada: setCoordenadaCallback,
    setMunicipio,
    setPermissaoNegada: setPermissaoNegadaCallback,
  };

  return (
    <LocalizacaoContext.Provider value={value}>
      {children}
    </LocalizacaoContext.Provider>
  );
}

export function useLocalizacao(): LocalizacaoState {
  const ctx = useContext(LocalizacaoContext);
  if (!ctx) throw new Error("useLocalizacao must be used inside LocalizacaoProvider");
  return ctx;
}
