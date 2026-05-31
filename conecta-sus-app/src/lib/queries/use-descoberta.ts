import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { Coordenada, ResultadoDescoberta } from "@/types/models";

export function useDescoberta(coordenada: Coordenada, raioMetros = 20000) {
  return useQuery({
    queryKey: ["descoberta", coordenada.lat, coordenada.lng, raioMetros],
    staleTime: 1000 * 60 * 15, // refresca a cada 15 min
    queryFn: async (): Promise<ResultadoDescoberta[]> => {
      const { data, error } = await supabase.rpc("buscar_descobertas", {
        lat: coordenada.lat,
        lng: coordenada.lng,
        raio_metros: raioMetros,
      });
      if (error) throw error;
      return (data ?? []) as ResultadoDescoberta[];
    },
  });
}
