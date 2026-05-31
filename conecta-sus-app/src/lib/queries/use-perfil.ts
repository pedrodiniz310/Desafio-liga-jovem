import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/stores/use-auth";
import type { Perfil } from "@/types/models";

export function usePerfil() {
  const { session } = useAuth();
  const uid = session?.user.id;
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ["perfil", uid],
    enabled: !!uid,
    queryFn: async (): Promise<Perfil | null> => {
      const { data, error } = await supabase
        .from("perfis")
        .select("id, data_nascimento, condicoes, pontos")
        .eq("id", uid!)
        .single();
      // PGRST116 = nenhuma linha — perfil ainda não foi criado
      if (error && error.code !== "PGRST116") throw error;
      return data ?? null;
    },
  });

  const salvarMutation = useMutation({
    mutationFn: async (dados: { data_nascimento: string | null; condicoes: string[] }) => {
      const { error } = await supabase.from("perfis").upsert({
        id: uid!,
        data_nascimento: dados.data_nascimento,
        condicoes: dados.condicoes,
      });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["perfil", uid] }),
  });

  return {
    perfil: query.data ?? null,
    carregando: query.isLoading,
    salvar: salvarMutation.mutate,
    salvando: salvarMutation.isPending,
    erroSalvar: salvarMutation.error,
  };
}
