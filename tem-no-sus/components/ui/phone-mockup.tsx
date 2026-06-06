import type { ReactNode } from "react";

interface PhoneMockupProps {
  children: ReactNode;
  className?: string;
}

/**
 * Moldura de celular neutra (sem signos de iPhone — o produto é Android).
 * Bezel em verde-deep pra amarrar na paleta; tela edge-to-edge: o conteúdo
 * provê o próprio header de app. Home indicator sutil só pra ler como "celular".
 */
export function PhoneMockup({ children, className = "" }: PhoneMockupProps) {
  return (
    <div className={`relative mx-auto w-[320px] max-w-full ${className}`}>
      {/* halo/sombra de presença atrás do aparelho */}
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 translate-y-8 scale-90 rounded-[3rem] bg-verde/25 blur-3xl"
      />

      {/* bezel verde-deep */}
      <div className="relative rounded-[2.8rem] bg-verde-deep p-2.5 shadow-[0_30px_70px_-22px_rgba(6,47,37,0.6),0_0_0_1px_rgba(6,47,37,0.5)]">
        {/* tela */}
        <div className="relative flex aspect-[9/17.5] flex-col overflow-hidden rounded-[2.15rem] bg-paper-soft">
          <div className="flex-1 overflow-hidden">{children}</div>

          {/* home indicator */}
          <div className="flex shrink-0 justify-center pb-2.5 pt-1">
            <div
              className="h-1 w-24 rounded-full bg-ink/15"
              aria-hidden="true"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
