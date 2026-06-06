"use client";

import { useEffect, useRef } from "react";

/**
 * Fundo do hero — partículas verdes subindo (canvas) + linhas-guia que se
 * desenham no mount com um shimmer.
 *
 * Adaptado do efeito "minimal hero" do 21st.dev (originalmente partículas
 * brancas em `mix-blend: screen` sobre fundo #0a0a0a) para a paleta CREME do
 * Tem no SUS!: partículas em verde-marca com `mix-blend: multiply` (escurecem o
 * creme em vez de clarear) e linhas em tom verde sutil.
 *
 * O canvas dimensiona pela seção-pai (não pela window) via ResizeObserver, já
 * que o hero não ocupa o viewport inteiro e cresce com o conteúdo/responsivo.
 * Respeita prefers-reduced-motion: desenha um quadro estático e não anima; as
 * linhas (CSS) já caem no estado final por causa da media query global.
 */
export function HeroField() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const parent = canvas.parentElement;
    if (!parent) return;

    const reduce = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    const setSize = () => {
      const rect = parent.getBoundingClientRect();
      canvas.width = Math.max(1, Math.floor(rect.width));
      canvas.height = Math.max(1, Math.floor(rect.height));
    };

    type Particle = {
      x: number;
      y: number;
      speed: number;
      opacity: number;
      fadeStart: number;
      fadingOut: boolean;
    };

    let particles: Particle[] = [];
    let raf = 0;

    const count = () => Math.floor((canvas.width * canvas.height) / 6500);

    const make = (): Particle => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      speed: Math.random() / 5 + 0.1,
      opacity: Math.random() * 0.3 + 0.35, // 0.35..0.65
      fadeStart: Date.now() + (Math.random() * 600 + 100),
      fadingOut: false,
    });

    const reset = (p: Particle) => {
      p.x = Math.random() * canvas.width;
      p.y = Math.random() * canvas.height;
      p.speed = Math.random() / 5 + 0.1;
      p.opacity = Math.random() * 0.3 + 0.35;
      p.fadeStart = Date.now() + (Math.random() * 600 + 100);
      p.fadingOut = false;
    };

    const init = () => {
      particles = [];
      for (let i = 0; i < count(); i++) particles.push(make());
    };

    // 13,106,81 = --color-verde. Multiply no canvas escurece o creme.
    const paint = (p: Particle) => {
      ctx.fillStyle = `rgba(13, 106, 81, ${p.opacity})`;
      ctx.fillRect(p.x, p.y, 0.8, Math.random() * 2.5 + 1.2);
    };

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach((p) => {
        p.y -= p.speed;
        if (p.y < 0) reset(p);
        if (!p.fadingOut && Date.now() > p.fadeStart) p.fadingOut = true;
        if (p.fadingOut) {
          p.opacity -= 0.008;
          if (p.opacity <= 0) reset(p);
        }
        paint(p);
      });
      raf = requestAnimationFrame(draw);
    };

    const onResize = () => {
      setSize();
      init();
      if (reduce) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        particles.forEach(paint);
      }
    };

    setSize();
    init();

    if (reduce) {
      // quadro único, sem loop
      particles.forEach(paint);
    } else {
      raf = requestAnimationFrame(draw);
    }

    const ro = new ResizeObserver(onResize);
    ro.observe(parent);

    return () => {
      ro.disconnect();
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 overflow-hidden"
    >
      <canvas ref={canvasRef} className="hf-canvas" />
      <div className="hf-lines">
        <span className="hf-h" />
        <span className="hf-h" />
        <span className="hf-h" />
        <span className="hf-v" />
        <span className="hf-v" />
        <span className="hf-v" />
      </div>
    </div>
  );
}
