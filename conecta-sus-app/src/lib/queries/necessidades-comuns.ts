/**
 * Atalhos de necessidades mais comuns — exibidos na home como sugestões.
 * (Versão semente; a base real virá da tabela `necessidades` no Supabase.)
 */
export type AtalhoNecessidade = {
  slug: string;
  rotulo: string;
  icone: string; // nome de ícone Ionicons
};

export const NECESSIDADES_COMUNS: AtalhoNecessidade[] = [
  { slug: "psicologo", rotulo: "Psicólogo", icone: "happy-outline" },
  { slug: "dentista", rotulo: "Dentista", icone: "medical-outline" },
  { slug: "remedio-gratis", rotulo: "Remédio de graça", icone: "bandage-outline" },
  { slug: "fonoaudiologo", rotulo: "Fono", icone: "ear-outline" },
  { slug: "vacina", rotulo: "Vacina", icone: "shield-checkmark-outline" },
  { slug: "pre-natal", rotulo: "Pré-natal", icone: "heart-outline" },
  { slug: "dependencia", rotulo: "Dependência química", icone: "people-outline" },
  { slug: "fisioterapia", rotulo: "Reabilitação", icone: "fitness-outline" },
];
