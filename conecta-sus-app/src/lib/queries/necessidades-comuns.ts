export type AtalhoNecessidade = {
  slug: string;
  rotulo: string;
  icone: string;
  cor: string; // hex — acento do ícone
};

export const NECESSIDADES_COMUNS: AtalhoNecessidade[] = [
  { slug: "psicologo",    rotulo: "Psicólogo",       icone: "happy-outline",            cor: "#7c3aed" },
  { slug: "dentista",     rotulo: "Dentista",         icone: "medical-outline",          cor: "#0d6a51" },
  { slug: "remedio",      rotulo: "Remédio de graça", icone: "bandage-outline",          cor: "#d97706" },
  { slug: "fono",         rotulo: "Fono",             icone: "ear-outline",              cor: "#0891b2" },
  { slug: "vacina",       rotulo: "Vacina",           icone: "shield-checkmark-outline", cor: "#16a34a" },
  { slug: "pre-natal",    rotulo: "Pré-natal",        icone: "heart-outline",            cor: "#e11d48" },
  { slug: "dependencia",  rotulo: "Dependência",      icone: "people-outline",           cor: "#4f46e5" },
  { slug: "fisioterapia", rotulo: "Reabilitação",     icone: "fitness-outline",          cor: "#ea580c" },
];
