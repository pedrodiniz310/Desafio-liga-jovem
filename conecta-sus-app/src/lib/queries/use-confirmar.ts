import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/stores/use-auth";
import type { StatusConfirmacao } from "@/types/models";

export type TempoEspera = 0 | 30 | 60 | 120;

export type NovoBadge = {
  slug: string;
  nome: string;
  descricao: string;
  icone: string;
};

type ConfirmarInput = {
  estabelecimentoId: number;
  status: StatusConfirmacao;
  tempoEsperaMinutos?: TempoEspera;
};

export function useConfirmar() {
  const { session } = useAuth();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({
      estabelecimentoId,
      status,
      tempoEsperaMinutos,
    }: ConfirmarInput): Promise<NovoBadge | null> => {
      const payload: Record<string, unknown> = {
        estabelecimento_id: estabelecimentoId,
        status,
      };
      if (session?.user.id) payload.usuario_id = session.user.id;
      if (tempoEsperaMinutos !== undefined) {
        payload.tempo_espera_minutos = tempoEsperaMinutos;
      }

      const { error } = await supabase.from("confirmacoes").insert(payload);
      if (error) throw error;

      if (!session?.user.id) return null;

      // Snapshot dos badges antes de verificar
      const { data: antesDados } = await supabase
        .from("usuario_badges")
        .select("badge_slug")
        .eq("usuario_id", session.user.id);
      const antesSet = new Set((antesDados ?? []).map((b) => b.badge_slug));

      await supabase.rpc("verificar_badges", { uid: session.user.id });

      // Detectar badge recém-conquistado
      const { data: depoisDados } = await supabase
        .from("usuario_badges")
        .select("badge_slug, badges(nome, descricao, icone)")
        .eq("usuario_id", session.user.id);

      const novo = (depoisDados ?? []).find((b) => !antesSet.has(b.badge_slug));
      if (!novo) return null;

      const badgeRaw = novo.badges as unknown;
      const badge = (Array.isArray(badgeRaw) ? badgeRaw[0] : badgeRaw) as {
        nome: string; descricao: string; icone: string;
      } | null;
      if (!badge) return null;

      return { slug: novo.badge_slug, nome: badge.nome, descricao: badge.descricao, icone: badge.icone };
    },
    onSuccess: (_, { estabelecimentoId }) => {
      qc.invalidateQueries({ queryKey: ["confirmacoes", estabelecimentoId] });
      if (session?.user.id) {
        qc.invalidateQueries({ queryKey: ["gamificacao", session.user.id] });
      }
    },
  });
}
