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
