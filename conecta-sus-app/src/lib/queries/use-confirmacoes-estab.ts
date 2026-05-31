import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { EstatConfirmacoes, StatusConfirmacao } from "@/types/models";

export function useConfirmacoesEstab(estabelecimentoId: number) {
  return useQuery({
    queryKey: ["confirmacoes", estabelecimentoId],
    queryFn: async (): Promise<EstatConfirmacoes> => {
      const { data, error } = await supabase
        .from("confirmacoes")
        .select("status")
        .eq("estabelecimento_id", estabelecimentoId);
      if (error) throw error;

      const counts = { funciona: 0, fechou: 0, mudou: 0 };
      for (const c of data ?? []) {
        counts[c.status as StatusConfirmacao]++;
      }
      const total = counts.funciona + counts.fechou + counts.mudou;

      let status_dominante: StatusConfirmacao | null = null;
      if (total > 0) {
        status_dominante = (
          Object.entries(counts) as [StatusConfirmacao, number][]
        ).reduce((a, b) => (a[1] >= b[1] ? a : b))[0];
      }

      return { total, ...counts, status_dominante };
    },
  });
}
