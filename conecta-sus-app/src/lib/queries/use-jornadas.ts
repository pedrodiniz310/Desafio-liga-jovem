import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { Jornada } from "@/types/models";

export function useJornadas() {
  return useQuery({
    queryKey: ["jornadas"],
    staleTime: 1000 * 60 * 30,
    queryFn: async (): Promise<Jornada[]> => {
      const { data, error } = await supabase
        .from("jornadas")
        .select("*")
        .eq("ativo", true)
        .order("id");
      if (error) throw error;
      return (data ?? []) as Jornada[];
    },
  });
}
