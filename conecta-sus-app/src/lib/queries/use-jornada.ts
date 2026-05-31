import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { Jornada } from "@/types/models";

export function useJornada(slug: string) {
  return useQuery({
    queryKey: ["jornada", slug],
    staleTime: 1000 * 60 * 30,
    enabled: !!slug,
    queryFn: async (): Promise<Jornada | null> => {
      const { data, error } = await supabase
        .from("jornadas")
        .select("*")
        .eq("slug", slug)
        .eq("ativo", true)
        .single();
      if (error && error.code !== "PGRST116") throw error;
      return (data as Jornada) ?? null;
    },
  });
}
