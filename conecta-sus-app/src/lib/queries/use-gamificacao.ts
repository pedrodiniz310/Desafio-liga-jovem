import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/stores/use-auth";
import type { BadgeUsuario, GamificacaoData } from "@/types/models";

export function useGamificacao() {
  const { session } = useAuth();
  const uid = session?.user.id;

  return useQuery({
    queryKey: ["gamificacao", uid],
    enabled: !!uid,
    queryFn: async (): Promise<GamificacaoData> => {
      const [perfisRes, badgesRes, ubRes, confRes] = await Promise.all([
        supabase.from("perfis").select("pontos").eq("id", uid!).single(),
        supabase.from("badges").select("slug, nome, descricao, icone, pontos_necessarios"),
        supabase.from("usuario_badges").select("badge_slug, conquistado_em").eq("usuario_id", uid!),
        supabase.from("confirmacoes").select("id", { count: "exact", head: true }).eq("usuario_id", uid!),
      ]);

      const pontos = perfisRes.data?.pontos ?? 0;
      const allBadges = badgesRes.data ?? [];
      const earned = ubRes.data ?? [];
      const total_confirmacoes = confRes.count ?? 0;

      const badges: BadgeUsuario[] = allBadges.map((b) => {
        const e = earned.find((x) => x.badge_slug === b.slug);
        return {
          ...b,
          conquistado: !!e,
          conquistado_em: e?.conquistado_em ?? null,
        };
      });

      return { pontos, total_confirmacoes, badges };
    },
  });
}
