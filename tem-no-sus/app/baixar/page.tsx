import type { Metadata } from "next";
import Link from "next/link";
import QRCode from "qrcode";
import { ArrowLeft, Smartphone, ScanLine, ShieldCheck } from "lucide-react";

// Página de instalação da build EAS (detecta Android e oferece o APK).
// Atualizar este link quando sair uma build nova.
const BUILD_URL =
  "https://expo.dev/accounts/pedinizx/projects/tem-no-sus/builds/f74d00ec-3bbc-44f9-baef-85462983325b";

export const metadata: Metadata = {
  title: "Baixar o Tem no SUS! para Android",
  description:
    "Aponte a câmera do celular para o QR code ou toque no link para baixar o APK do Tem no SUS!.",
};

const PASSOS = [
  {
    icon: ScanLine,
    titulo: "Aponte a câmera",
    texto: "Mire a câmera do seu Android no QR code acima e toque na notificação.",
  },
  {
    icon: Smartphone,
    titulo: "Ou abra o link no celular",
    texto: "Tocou em “Baixar APK”? Conclua o download do arquivo .apk.",
  },
  {
    icon: ShieldCheck,
    titulo: "Permita a instalação",
    texto:
      "O Android pode pedir para autorizar “instalar de fontes desconhecidas”. É seguro — é o app oficial.",
  },
] as const;

export default async function BaixarPage() {
  const qrSvg = await QRCode.toString(BUILD_URL, {
    type: "svg",
    margin: 1,
    width: 240,
    color: { dark: "#14211c", light: "#ffffff" },
  });

  return (
    <main className="grain relative flex min-h-screen flex-col items-center justify-center px-5 py-16">
      <div className="relative w-full max-w-md">
        <Link
          href="/"
          className="group inline-flex items-center gap-2 text-sm font-medium text-ink-soft transition-colors hover:text-verde"
        >
          <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
          Voltar ao site
        </Link>

        <div className="mt-5 rounded-[2rem] border border-line bg-card p-8 text-center shadow-lift sm:p-10">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logo-wordmark.svg"
            alt="Tem no SUS!"
            className="mx-auto h-8 w-auto"
          />

          <h1 className="font-display mt-7 text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
            Baixe para Android
          </h1>
          <p className="mx-auto mt-3 max-w-sm leading-relaxed text-ink-soft">
            Aponte a câmera do seu celular para o QR code — ou toque no botão
            para baixar o APK.
          </p>

          {/* QR code (gerado no servidor) */}
          <div
            className="mx-auto mt-7 w-56 rounded-2xl border border-line bg-white p-4 shadow-soft [&>svg]:h-auto [&>svg]:w-full"
            dangerouslySetInnerHTML={{ __html: qrSvg }}
          />

          <a
            href={BUILD_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="cta-shiny mt-7 inline-flex h-[52px] w-full items-center justify-center gap-2.5 rounded-full px-6 text-base font-semibold"
          >
            <Smartphone className="h-5 w-5" aria-hidden="true" />
            Baixar APK
          </a>

          <ol className="mt-8 space-y-4 text-left">
            {PASSOS.map(({ icon: Icon, titulo, texto }, i) => (
              <li key={titulo} className="flex gap-3.5">
                <span className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-verde-wash text-verde">
                  <Icon className="h-[18px] w-[18px]" aria-hidden="true" />
                  <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-verde text-[0.6rem] font-bold text-paper-soft">
                    {i + 1}
                  </span>
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-ink">{titulo}</p>
                  <p className="text-[0.82rem] leading-snug text-ink-soft">
                    {texto}
                  </p>
                </div>
              </li>
            ))}
          </ol>

          <p className="mt-7 border-t border-line pt-5 text-xs text-ink-faint">
            iPhone — em breve. Por enquanto, o app está disponível para Android.
          </p>
        </div>
      </div>
    </main>
  );
}
