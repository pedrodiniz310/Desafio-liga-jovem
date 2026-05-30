export type AtalhoNecessidade = {
  slug: string;
  rotulo: string;
  icone: string; // nome do ícone Lucide
};

export const NECESSIDADES_COMUNS: AtalhoNecessidade[] = [
  { slug: "psicologo",    rotulo: "Psicólogo",       icone: "Brain" },
  { slug: "dentista",     rotulo: "Dentista",         icone: "Smile" },
  { slug: "remedio",      rotulo: "Remédio grátis",   icone: "Pill" },
  { slug: "fono",         rotulo: "Fonoaudiólogo",    icone: "Mic" },
  { slug: "vacina",       rotulo: "Vacina",           icone: "Syringe" },
  { slug: "pre-natal",    rotulo: "Pré-natal",        icone: "Baby" },
  { slug: "dependencia",  rotulo: "Dependência",      icone: "HandHeart" },
  { slug: "fisioterapia", rotulo: "Fisioterapia",     icone: "Activity" },
  { slug: "exame",        rotulo: "Exame de sangue",  icone: "TestTube" },
  { slug: "nutri",        rotulo: "Nutricionista",    icone: "Apple" },
];
