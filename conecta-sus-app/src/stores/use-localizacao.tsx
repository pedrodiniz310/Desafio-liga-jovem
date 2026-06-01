import { createContext, useContext, useState, useCallback, ReactNode } from "react";
import type { Coordenada } from "@/types/models";

export const JOACABA: Coordenada = { lat: -27.1771, lng: -51.5045 };

type LocalizacaoState = {
  coordenada: Coordenada | null;
  municipioNome: string;
  codigoIbge: string | null;
  permissaoNegada: boolean;
  setCoordenada: (c: Coordenada) => void;
  setMunicipio: (nome: string, codigoIbge?: string) => void;
  setPermissaoNegada: (v: boolean) => void;
};

const LocalizacaoContext = createContext<LocalizacaoState | undefined>(undefined);

export function LocalizacaoProvider({ children }: { children: ReactNode }) {
  const [coordenada, setCoordenada] = useState<Coordenada | null>(null);
  const [municipioNome, setMunicipioNome] = useState("Carregando…");
  const [codigoIbge, setCodigoIbge] = useState<string | null>(null);
  const [permissaoNegada, setPermissaoNegada] = useState(false);

  const setMunicipio = useCallback((nome: string, ibge?: string) => {
    setMunicipioNome(nome);
    if (ibge) setCodigoIbge(ibge);
  }, []);
  const setCoordenadaCb = useCallback((c: Coordenada) => setCoordenada(c), []);
  const setPermissaoNegadaCb = useCallback((v: boolean) => setPermissaoNegada(v), []);

  return (
    <LocalizacaoContext.Provider
      value={{
        coordenada,
        municipioNome,
        codigoIbge,
        permissaoNegada,
        setCoordenada: setCoordenadaCb,
        setMunicipio,
        setPermissaoNegada: setPermissaoNegadaCb,
      }}
    >
      {children}
    </LocalizacaoContext.Provider>
  );
}

export function useLocalizacao(): LocalizacaoState {
  const ctx = useContext(LocalizacaoContext);
  if (!ctx) throw new Error("useLocalizacao must be used inside LocalizacaoProvider");
  return ctx;
}
