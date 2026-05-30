import { Logo } from "./logo";

const COLUNAS = [
  {
    titulo: "Produto",
    links: [
      { label: "O problema", href: "#problema" },
      { label: "Como funciona", href: "#como-funciona" },
      { label: "Diferenciais", href: "#diferenciais" },
      { label: "Impacto", href: "#impacto" },
    ],
  },
  {
    titulo: "Para gestores",
    links: [
      { label: "Painel municipal", href: "#" },
      { label: "Dados do CNES", href: "https://cnes.datasus.gov.br/" },
      { label: "Falar com a equipe", href: "#" },
    ],
  },
  {
    titulo: "Projeto",
    links: [
      {
        label: "Desafio Liga Jovem",
        href: "https://www.desafioligajovem.com.br/",
      },
      { label: "SEBRAE", href: "https://sebrae.com.br/" },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="border-t border-line bg-paper-soft">
      <div className="mx-auto max-w-6xl px-5 py-14 sm:px-8">
        <div className="grid gap-10 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div className="max-w-xs">
            <Logo />
            <p className="mt-4 text-sm leading-relaxed text-ink-soft">
              O SUS que você não sabia que tinha. Um projeto para o Desafio Liga
              Jovem — Cidadania e Políticas Públicas.
            </p>
          </div>

          {COLUNAS.map((coluna) => (
            <nav key={coluna.titulo} aria-label={coluna.titulo}>
              <h3 className="text-sm font-semibold tracking-wide text-ink">
                {coluna.titulo}
              </h3>
              <ul className="mt-3 sm:mt-4">
                {coluna.links.map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      className="inline-block py-1.5 text-sm text-ink-soft transition-colors hover:text-verde"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        <div className="mt-12 flex flex-col gap-3 border-t border-line pt-6 text-sm text-ink-faint sm:flex-row sm:items-center sm:justify-between">
          <p>© 2026 Conecta SUS. Feito com cuidado público.</p>
          <p>
            Dados de saúde do{" "}
            <a
              href="https://datasus.saude.gov.br"
              className="font-medium text-ink-soft hover:text-verde"
            >
              DATASUS / CNES
            </a>
            .
          </p>
        </div>
      </div>
    </footer>
  );
}
