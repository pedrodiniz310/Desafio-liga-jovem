/** Formata distância em metros para texto curto (ex.: "850 m", "1,2 km"). */
export function formatarDistancia(metros: number): string {
  if (metros < 1000) {
    return `${Math.round(metros)} m`;
  }
  const km = metros / 1000;
  return `${km.toFixed(1).replace(".", ",")} km`;
}

/** Remove caracteres não numéricos para uso em link tel:. */
export function telParaLink(telefone: string): string {
  return telefone.replace(/[^\d+]/g, "");
}
