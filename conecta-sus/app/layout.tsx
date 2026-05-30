import type { Metadata, Viewport } from "next";
import { Fraunces, Inter } from "next/font/google";
import "./globals.css";

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  axes: ["opsz"],
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Conecta SUS — O SUS que você não sabia que tinha",
  description:
    "O SUS oferece mais de 100 serviços gratuitos. O Conecta SUS te mostra quais existem perto de você, com endereço, horário e o que levar. Dados oficiais do CNES.",
  keywords: [
    "SUS",
    "saúde pública",
    "CNES",
    "serviços gratuitos",
    "CAPS",
    "Farmácia Popular",
  ],
  authors: [{ name: "Equipe Conecta SUS" }],
  openGraph: {
    title: "Conecta SUS — O SUS que você não sabia que tinha",
    description:
      "Encontre os serviços gratuitos do SUS perto de você em menos de um minuto.",
    locale: "pt_BR",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#0d6a51",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt-BR"
      className={`${fraunces.variable} ${inter.variable} h-full`}
    >
      <body className="min-h-full">{children}</body>
    </html>
  );
}
