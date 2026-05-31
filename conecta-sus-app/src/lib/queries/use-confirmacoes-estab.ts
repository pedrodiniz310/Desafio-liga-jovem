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
      const seisHorasAtras = new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString();

      const { data, error } = await supabase
        .from("confirmacoes")
        .select("status, tempo_espera_minutos")
        .eq("estabelecimento_id", estabelecimentoId)
        .gte("criado_em", seisHorasAtras);

      if (error) throw error;

      const rows = data ?? [];
      const counts = { funciona: 0, fechou: 0, mudou: 0 };
      const tempos: number[] = [];

      for (const c of rows) {
        counts[c.status as StatusConfirmacao]++;
        if (c.tempo_espera_minutos !== null && c.tempo_espera_minutos !== undefined) {
          tempos.push(c.tempo_espera_minutos as number);
        }
      }

      const total = counts.funciona + counts.fechou + counts.mudou;

      let status_dominante: StatusConfirmacao | null = null;
      if (total > 0) {
        status_dominante = (
          Object.entries(counts) as [StatusConfirmacao, number][]
        ).reduce((a, b) => (a[1] >= b[1] ? a : b))[0];
      }

      let tempo_espera_recente: number | null = null;
      if (tempos.length > 0) {
        const sorted = [...tempos].sort((a, b) => a - b);
        tempo_espera_recente = sorted[Math.floor(sorted.length / 2)];
      }

      return { total, ...counts, status_dominante, tempo_espera_recente };
    },
  });
}
