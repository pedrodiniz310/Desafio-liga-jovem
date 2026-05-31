import { useState, useEffect, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Persiste quais passos (por ordem) foram marcados como concluídos.
// Uma instância por jornada/slug — não é Context, é hook local.
export function useJornadaProgresso(slug: string) {
  const [passosConcluidos, setPassosConcluidos] = useState<number[]>([]);

  const storageKey = `@tem_no_sus_jornada_${slug}`;

  useEffect(() => {
    (async () => {
      try {
        const data = await AsyncStorage.getItem(storageKey);
        if (data) {
          const parsed = JSON.parse(data) as { passos_concluidos: number[] };
          setPassosConcluidos(parsed.passos_concluidos ?? []);
        }
      } catch {
        // silent
      }
    })();
  }, [storageKey]);

  const togglePasso = useCallback(
    async (ordem: number) => {
      const novos = passosConcluidos.includes(ordem)
        ? passosConcluidos.filter((o) => o !== ordem)
        : [...passosConcluidos, ordem];
      setPassosConcluidos(novos);
      try {
        await AsyncStorage.setItem(
          storageKey,
          JSON.stringify({ passos_concluidos: novos })
        );
      } catch {
        // silent
      }
    },
    [passosConcluidos, storageKey]
  );

  return { passosConcluidos, togglePasso };
}
