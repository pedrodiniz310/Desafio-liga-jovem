import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";

type PreferenciasState = {
  fonteGrande: boolean;
  altoContraste: boolean;
  setFonteGrande: (v: boolean) => void;
  setAltoContraste: (v: boolean) => void;
};

export const usePreferencias = create<PreferenciasState>()(
  persist(
    (set) => ({
      fonteGrande: false,
      altoContraste: false,
      setFonteGrande: (fonteGrande) => set({ fonteGrande }),
      setAltoContraste: (altoContraste) => set({ altoContraste }),
    }),
    {
      name: "conecta-sus-preferencias",
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
