export type AtalhoNecessidade = {
  slug: string;
  rotulo: string;
  icone: string; // Ionicons name
};

export const NECESSIDADES_COMUNS: AtalhoNecessidade[] = [
  { slug: "psicologo",    rotulo: "Psicólogo",       icone: "body-outline" },
  { slug: "dentista",     rotulo: "Dentista",         icone: "medical-outline" },
  { slug: "remedio",      rotulo: "Remédio grátis",   icone: "flask-outline" },
  { slug: "fono",         rotulo: "Fonoaudiólogo",    icone: "mic-outline" },
  { slug: "vacina",       rotulo: "Vacina",           icone: "bandage-outline" },
  { slug: "pre-natal",    rotulo: "Pré-natal",        icone: "heart-outline" },
  { slug: "dependencia",  rotulo: "Dependência",      icone: "people-outline" },
  { slug: "fisioterapia", rotulo: "Fisioterapia",     icone: "walk-outline" },
  { slug: "exame",        rotulo: "Exame de sangue",  icone: "eyedrop-outline" },
  { slug: "nutri",        rotulo: "Nutricionista",    icone: "leaf-outline" },
];
