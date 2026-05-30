/**
 * Paleta Conecta SUS — mesma identidade da landing page.
 * Pinheiro/esmeralda (saúde, confiança) + terracota (calor humano)
 * sobre creme quente.
 */
export const colors = {
  paper: "#f6f3ea",
  paperSoft: "#fbf9f2",
  card: "#ffffff",
  line: "#e6e0d2",

  ink: "#16241f",
  inkSoft: "#4c5a53",
  inkFaint: "#6e7b74",

  verde: "#0d6a51",
  verdeDeep: "#073b2e",
  verdeBright: "#18a878",
  verdeWash: "#e2efe8",

  coral: "#d65a3c",
  coralBright: "#e8714f",
  coralWash: "#f8e6dd",

  amber: "#e0a23f",
} as const;

export type AppColor = keyof typeof colors;

/** Conjunto de cores do tema (mesmas chaves da paleta base). */
export type Cores = Record<AppColor, string>;

/**
 * Variante de alto contraste: texto mais escuro, bordas reforçadas e verdes
 * mais profundos para legibilidade. Mantém a identidade da marca.
 */
export const coresAltoContraste: Cores = {
  paper: "#ffffff",
  paperSoft: "#ffffff",
  card: "#ffffff",
  line: "#1c1c1c",

  ink: "#000000",
  inkSoft: "#1a1a1a",
  inkFaint: "#333333",

  verde: "#0a4f3c",
  verdeDeep: "#062a20",
  verdeBright: "#0d6a51",
  verdeWash: "#d4e7df",

  coral: "#a83a1a",
  coralBright: "#c24a28",
  coralWash: "#f1d6ca",

  amber: "#8a5e12",
};

