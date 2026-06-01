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
  title: "Tem no SUS! — O SUS que você não sabia que tinha",
  description:
    "O SUS oferece mais de 100 serviços gratuitos. O Tem no SUS! te mostra quais existem perto de você, com endereço, horário e o que levar. Preparado para dados oficiais do CNES/DATASUS.",
  keywords: [
    "SUS",
    "saúde pública",
    "CNES",
    "serviços gratuitos",
    "CAPS",
    "Farmácia Popular",
  ],
  authors: [{ name: "Equipe Tem no SUS!" }],
  openGraph: {
    title: "Tem no SUS! — O SUS que você não sabia que tinha",
    description:
      "Encontre os serviços gratuitos do SUS perto de você em menos de um minuto.",
    locale: "pt_BR",
    type: "website",
  },
  icons: {
    icon: "/icon.png",
    apple: "/icon.png",
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
