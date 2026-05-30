/**
 * Tipos de domínio do Conecta SUS.
 * (Quando o schema do Supabase estiver no ar, substituir/gerar com
 *  `supabase gen types typescript` para tipagem ponta a ponta.)
 */

export type StatusConfirmacao = "funciona" | "fechou" | "mudou";

export interface Municipio {
  id: number;
  codigo_ibge: string;
  nome: string;
  uf: string;
}

export interface Estabelecimento {
  id: number;
  cnes_id: string;
  nome: string;
  nome_fantasia: string | null;
  tipo: string | null;
  endereco: string | null;
  bairro: string | null;
  telefone: string | null;
  horario: string | null;
  municipio_id: number | null;
  lat: number | null;
  lng: number | null;
  ativo: boolean;
}

/** Resultado da RPC `buscar_servicos` — estabelecimento + distância. */
export interface ResultadoBusca {
  estabelecimento_id: number;
  nome: string;
  endereco: string | null;
  telefone: string | null;
  horario: string | null;
  distancia_metros: number;
}

export interface Necessidade {
  id: number;
  slug: string;
  texto_cidadao: string;
  sinonimos: string[] | null;
  servico_codigo: string | null;
  icone: string | null;
}

export interface Coordenada {
  lat: number;
  lng: number;
}
