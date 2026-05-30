import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { StatusConfirmacao } from "@/types/models";

type ConfirmarInput = {
  estabelecimentoId: number;
  status: StatusConfirmacao;
};

/**
 * Registra uma validação comunitária ("ainda funciona?") na tabela
 * `confirmacoes`. Insert anônimo (ver migration 0002).
 */
export function useConfirmar() {
  return useMutation({
    mutationFn: async ({ estabelecimentoId, status }: ConfirmarInput) => {
      const { error } = await supabase.from("confirmacoes").insert({
        estabelecimento_id: estabelecimentoId,
        status,
      });
      if (error) throw error;
    },
  });
}
