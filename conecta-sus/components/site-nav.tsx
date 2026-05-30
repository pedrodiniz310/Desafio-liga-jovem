"use client";

import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import { Logo } from "./logo";
import { CtaButton } from "./ui/cta-button";

const LINKS = [
  { href: "#problema", label: "O problema" },
  { href: "#como-funciona", label: "Como funciona" },
  { href: "#diferenciais", label: "Diferenciais" },
  { href: "#impacto", label: "Impacto" },
];

export function SiteNav() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
        scrolled
          ? "border-b border-line/80 bg-paper/85 backdrop-blur-md"
          : "border-b border-transparent bg-transparent"
      }`}
    >
      <nav
        className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5 sm:px-8"
        aria-label="Navegação principal"
      >
        <a href="#topo" className="rounded-lg" aria-label="Conecta SUS, início">
          <Logo />
        </a>

        <ul className="hidden items-center gap-1 md:flex">
          {LINKS.map((link) => (
            <li key={link.href}>
              <a
                href={link.href}
                className="rounded-lg px-3.5 py-2 text-sm font-medium text-ink-soft transition-colors hover:text-verde"
              >
                {link.label}
              </a>
            </li>
          ))}
        </ul>

        <div className="hidden md:block">
          <a
            href="#baixar"
            className="inline-flex h-11 items-center rounded-full bg-verde px-5 text-sm font-semibold text-paper-soft shadow-soft transition-transform hover:-translate-y-0.5 active:translate-y-0"
          >
            Quero usar
          </a>
        </div>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="flex h-11 w-11 items-center justify-center rounded-xl text-ink md:hidden"
          aria-label={open ? "Fechar menu" : "Abrir menu"}
          aria-expanded={open}
        >
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </nav>

      {/* menu mobile */}
      {open && (
        <div className="border-t border-line bg-paper/95 backdrop-blur-md md:hidden">
          <ul className="mx-auto flex max-w-6xl flex-col gap-1 px-5 py-4">
            {LINKS.map((link) => (
              <li key={link.href}>
                <a
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className="block rounded-xl px-4 py-3 text-base font-medium text-ink-soft hover:bg-verde-wash hover:text-verde"
                >
                  {link.label}
                </a>
              </li>
            ))}
            <li className="mt-2">
              <a
                href="#baixar"
                onClick={() => setOpen(false)}
                className="block rounded-full bg-verde px-5 py-3.5 text-center text-base font-semibold text-paper-soft"
              >
                Quero usar
              </a>
            </li>
          </ul>
        </div>
      )}
    </header>
  );
}
