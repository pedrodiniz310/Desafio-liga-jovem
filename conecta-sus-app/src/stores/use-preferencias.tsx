import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

type PreferenciasState = {
  fonteGrande: boolean;
  altoContraste: boolean;
  setFonteGrande: (v: boolean) => Promise<void>;
  setAltoContraste: (v: boolean) => Promise<void>;
};

const PreferenciasContext = createContext<PreferenciasState | undefined>(undefined);
const STORAGE_KEY = "@tem_no_sus_preferencias";

export function PreferenciasProvider({ children }: { children: ReactNode }) {
  const [fonteGrande, setFonteGrandeState] = useState(false);
  const [altoContraste, setAltoContrasteState] = useState(false);
  const [carregado, setCarregado] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const data = await AsyncStorage.getItem(STORAGE_KEY);
        if (data) {
          const { fonteGrande: fg, altoContraste: ac } = JSON.parse(data);
          setFonteGrandeState(fg ?? false);
          setAltoContrasteState(ac ?? false);
        }
      } catch (e) {
        console.error("erro ao carregar preferências:", e);
      }
      setCarregado(true);
    })();
  }, []);

  const salvar = useCallback(async (fg: boolean, ac: boolean) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({ fonteGrande: fg, altoContraste: ac }));
    } catch (e) {
      console.error("erro ao salvar preferências:", e);
    }
  }, []);

  const setFonteGrande = useCallback(
    async (v: boolean) => {
      setFonteGrandeState(v);
      await salvar(v, altoContraste);
    },
    [altoContraste, salvar]
  );

  const setAltoContraste = useCallback(
    async (v: boolean) => {
      setAltoContrasteState(v);
      await salvar(fonteGrande, v);
    },
    [fonteGrande, salvar]
  );

  const value: PreferenciasState = { fonteGrande, altoContraste, setFonteGrande, setAltoContraste };

  return (
    <PreferenciasContext.Provider value={value}>
      {children}
    </PreferenciasContext.Provider>
  );
}

export function usePreferencias(): PreferenciasState {
  const ctx = useContext(PreferenciasContext);
  if (!ctx) throw new Error("usePreferencias must be used inside PreferenciasProvider");
  return ctx;
}
