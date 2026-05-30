import { createContext, useContext, type ReactNode } from "react";

import { colors, coresAltoContraste, type Cores } from "@/theme/colors";
import { usePreferencias } from "@/stores/use-preferencias";

type Tema = {
  /** Paleta ativa (base ou alto contraste). */
  cores: Cores;
  /** Multiplicador de fonte (1 normal, 1.25 com "Fonte ampliada"). */
  escala: number;
};

const TemaContext = createContext<Tema>({ cores: colors, escala: 1 });

/** Fornece cores e escala de fonte derivadas das preferências do usuário. */
export function TemaProvider({ children }: { children: ReactNode }) {
  const fonteGrande = usePreferencias((s) => s.fonteGrande);
  const altoContraste = usePreferencias((s) => s.altoContraste);

  const cores = altoContraste ? coresAltoContraste : colors;
  const escala = fonteGrande ? 1.25 : 1;

  return (
    <TemaContext.Provider value={{ cores, escala }}>
      {children}
    </TemaContext.Provider>
  );
}

export function useTema() {
  return useContext(TemaContext);
}
