import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { Coordenada, ResultadoBusca } from "@/types/models";

type Params = {
  termo: string;
  coordenada: Coordenada;
  raioMetros?: number;
  enabled?: boolean;
};

/**
 * Busca serviços do SUS por necessidade (texto livre) ordenados por distância.
 * Chama a RPC `buscar_servicos` no Postgres (ver Arquitetura do App §6).
 */
export function useBuscaServicos({
  termo,
  coordenada,
  raioMetros = 15000,
  enabled = true,
}: Params) {
  return useQuery({
    queryKey: ["busca", termo, coordenada.lat, coordenada.lng, raioMetros],
    enabled: enabled && termo.trim().length > 1,
    queryFn: async (): Promise<ResultadoBusca[]> => {
      const { data, error } = await supabase.rpc("buscar_servicos", {
        termo: termo.trim(),
        lat: coordenada.lat,
        lng: coordenada.lng,
        raio_metros: raioMetros,
      });
      if (error) throw error;
      return (data ?? []) as ResultadoBusca[];
    },
  });
}
