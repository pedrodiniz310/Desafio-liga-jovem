import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { EstatConfirmacoes, StatusConfirmacao } from "@/types/models";

export interface EstatConfirmacoesComFila extends EstatConfirmacoes {
  tempo_espera_recente: number | null;
}

export function useConfirmacoesEstab(estabelecimentoId: number) {
  return useQuery({
    queryKey: ["confirmacoes", estabelecimentoId],
    queryFn: async (): Promise<EstatConfirmacoesComFila> => {
      // Estatisticas da comunidade via RPC agregada (SECURITY DEFINER): nao expoe
      // usuario_id nem linhas individuais (privacidade) — ver migration 0015.
      const { data, error } = await supabase.rpc("estatisticas_confirmacoes", {
        p_estab: estabelecimentoId,
      });
      if (error) throw error;

      const r = (Array.isArray(data) ? data[0] : data) as
        | {
            total: number;
            funciona: number;
            fechou: number;
            mudou: number;
            status_dominante: StatusConfirmacao | null;
            tempo_espera_recente: number | null;
          }
        | undefined;

      if (!r) {
        return {
          total: 0, funciona: 0, fechou: 0, mudou: 0,
          status_dominante: null, tempo_espera_recente: null,
        };
      }

      return {
        total: Number(r.total),
        funciona: Number(r.funciona),
        fechou: Number(r.fechou),
        mudou: Number(r.mudou),
        status_dominante: r.status_dominante,
        tempo_espera_recente:
          r.tempo_espera_recente === null ? null : Number(r.tempo_espera_recente),
      };
    },
  });
}
