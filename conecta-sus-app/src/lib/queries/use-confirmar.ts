import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/stores/use-auth";
import type { StatusConfirmacao } from "@/types/models";

type ConfirmarInput = {
  estabelecimentoId: number;
  status: StatusConfirmacao;
};

export function useConfirmar() {
  const { session } = useAuth();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ estabelecimentoId, status }: ConfirmarInput) => {
      const payload: Record<string, unknown> = {
        estabelecimento_id: estabelecimentoId,
        status,
      };
      if (session?.user.id) {
        payload.usuario_id = session.user.id;
      }

      const { error } = await supabase.from("confirmacoes").insert(payload);
      if (error) throw error;

      // Verificar e conceder badges (apenas se autenticado)
      if (session?.user.id) {
        await supabase.rpc("verificar_badges", { uid: session.user.id });
      }
    },
    onSuccess: (_, { estabelecimentoId }) => {
      qc.invalidateQueries({ queryKey: ["confirmacoes", estabelecimentoId] });
      if (session?.user.id) {
        qc.invalidateQueries({ queryKey: ["gamificacao", session.user.id] });
      }
    },
  });
}
