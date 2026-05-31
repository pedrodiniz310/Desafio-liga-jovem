/**
 * Tipos de domínio do Conecta SUS.
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

/** Resultado da RPC `buscar_servicos` — inclui necessidade_texto a partir da migration 0003. */
export interface ResultadoBusca {
  estabelecimento_id: number;
  nome: string;
  endereco: string | null;
  telefone: string | null;
  horario: string | null;
  distancia_metros: number;
  necessidade_texto: string | null;
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

export interface Perfil {
  id: string;
  data_nascimento: string | null; // formato ISO 'YYYY-MM-DD'
  condicoes: string[];
  pontos: number;
}

export interface RegraDireito {
  id: number;
  titulo: string;
  mensagem: string;
  condicao: {
    idade_min?: number;
    idade_max?: number;
    condicoes?: string[];
  };
  servico_codigo: string | null;
  icone: string | null;
}

export interface BadgeInfo {
  slug: string;
  nome: string;
  descricao: string;
  icone: string;
  pontos_necessarios: number;
}

export interface BadgeUsuario extends BadgeInfo {
  conquistado: boolean;
  conquistado_em: string | null;
}

export interface EstatConfirmacoes {
  total: number;
  funciona: number;
  fechou: number;
  mudou: number;
  status_dominante: StatusConfirmacao | null;
}

export interface GamificacaoData {
  pontos: number;
  total_confirmacoes: number;
  badges: BadgeUsuario[];
}
