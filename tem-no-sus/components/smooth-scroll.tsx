"use client";

import { ReactLenis } from "lenis/react";
import { useEffect, useState } from "react";
import "lenis/dist/lenis.css";

/**
 * Scroll suave global (Lenis) — a base de "feeling premium" dos sites avançados.
 *
 * Acessibilidade: respeita prefers-reduced-motion. Se o usuário pede menos
 * movimento, o Lenis NÃO é montado e o scroll nativo do navegador é mantido
 * (sem inércia). `anchors: true` deixa os links #ancora suaves sem código extra.
 */
export function SmoothScroll({ children }: { children: React.ReactNode }) {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const onChange = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  if (reduced) return <>{children}</>;

  return (
    <ReactLenis
      root
      options={{ lerp: 0.1, duration: 1.2, smoothWheel: true, anchors: true }}
    >
      {children}
    </ReactLenis>
  );
}
