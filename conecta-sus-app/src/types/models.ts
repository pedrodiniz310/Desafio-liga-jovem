/**
 * Tipos de domínio do Tem no SUS!.
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
  municipios: { nome: string; uf: string } | null;
  lat: number | null;
  lng: number | null;
  ativo: boolean;
  fonte_dados: string | null;
  competencia_cnes: string | null;
  importado_em: string | null;
  geocoding_status: string | null;
}

/** Resultado da RPC `buscar_servicos` — inclui lat/lng para o mapa a partir da migration 0012. */
export interface ResultadoBusca {
  estabelecimento_id: number;
  nome: string;
  endereco: string | null;
  telefone: string | null;
  horario: string | null;
  distancia_metros: number;
  necessidade_texto: string | null;
  lat: number | null;
  lng: number | null;
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

export interface ResultadoDescoberta {
  necessidade_id: number;
  slug: string;
  descoberta_texto: string;
  icone: string | null;
  /** true = vale em todo o SUS (sem estabelecimento/distância). */
  universal: boolean;
  estabelecimento_id: number | null;
  nome_estabelecimento: string | null;
  endereco: string | null;
  distancia_metros: number | null;
}

export interface JornadaPasso {
  ordem: number;
  servico_codigo: string;
  titulo_passo: string;
  por_que_importa: string;
}

export interface Jornada {
  id: number;
  slug: string;
  titulo: string;
  descricao: string;
  icone: string;
  cor: string;        // hex, ex: '#f8e6dd'
  passos: JornadaPasso[];
  ativo: boolean;
}
