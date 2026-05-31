import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { Estabelecimento } from "@/types/models";

/** Detalhe de um estabelecimento por id. */
export function useServico(id: number | null) {
  return useQuery({
    queryKey: ["servico", id],
    enabled: id != null,
    queryFn: async (): Promise<Estabelecimento> => {
      const { data, error } = await supabase
        .from("estabelecimentos")
        .select("*, municipios(nome, uf)")
        .eq("id", id)
        .single();
      if (error) throw error;
      return data as Estabelecimento;
    },
  });
}
