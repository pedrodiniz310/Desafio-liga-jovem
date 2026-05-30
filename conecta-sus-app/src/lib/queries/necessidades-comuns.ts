export type AtalhoNecessidade = {
  slug: string;
  rotulo: string;
  emoji: string;
};

export const NECESSIDADES_COMUNS: AtalhoNecessidade[] = [
  { slug: "psicologo",    rotulo: "Psicólogo",        emoji: "🧠" },
  { slug: "dentista",     rotulo: "Dentista",          emoji: "🦷" },
  { slug: "remedio",      rotulo: "Remédio grátis",    emoji: "💊" },
  { slug: "fono",         rotulo: "Fonoaudiólogo",     emoji: "🗣️" },
  { slug: "vacina",       rotulo: "Vacina",            emoji: "💉" },
  { slug: "pre-natal",    rotulo: "Pré-natal",         emoji: "🤰" },
  { slug: "dependencia",  rotulo: "Dependência",       emoji: "🤝" },
  { slug: "fisioterapia", rotulo: "Fisioterapia",      emoji: "🦵" },
  { slug: "exame",        rotulo: "Exame de sangue",   emoji: "🔬" },
  { slug: "nutri",        rotulo: "Nutricionista",     emoji: "🥗" },
];
