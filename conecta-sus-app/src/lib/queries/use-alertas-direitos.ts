import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { Perfil, RegraDireito } from "@/types/models";

function calcularIdade(dataNascimento: string): number {
  const nasc = new Date(dataNascimento);
  const hoje = new Date();
  let idade = hoje.getFullYear() - nasc.getFullYear();
  const m = hoje.getMonth() - nasc.getMonth();
  if (m < 0 || (m === 0 && hoje.getDate() < nasc.getDate())) idade--;
  return idade;
}

function regraAplica(regra: RegraDireito, perfil: Perfil): boolean {
  const c = regra.condicao;

  const temFiltroIdade = c.idade_min !== undefined || c.idade_max !== undefined;
  if (temFiltroIdade) {
    if (!perfil.data_nascimento) return false;
    const idade = calcularIdade(perfil.data_nascimento);
    if (c.idade_min !== undefined && idade < c.idade_min) return false;
    if (c.idade_max !== undefined && idade > c.idade_max) return false;
  }

  if (c.condicoes && c.condicoes.length > 0) {
    const temAlguma = c.condicoes.some((cond) => perfil.condicoes.includes(cond));
    if (!temAlguma) return false;
  }

  return true;
}

export function useAlertasDireitos(perfil: Perfil | null | undefined) {
  const query = useQuery({
    queryKey: ["regras_direitos"],
    staleTime: 1000 * 60 * 60,
    queryFn: async (): Promise<RegraDireito[]> => {
      const { data, error } = await supabase
        .from("regras_direitos")
        .select("id, titulo, mensagem, condicao, servico_codigo, icone")
        .eq("ativo", true);
      if (error) throw error;
      return (data ?? []) as RegraDireito[];
    },
  });

  const alertasAplicaveis =
    perfil && query.data
      ? query.data.filter((r) => regraAplica(r, perfil))
      : [];

  return {
    alertasAplicaveis,
    todasRegras: query.data ?? [],
    carregando: query.isLoading,
  };
}
