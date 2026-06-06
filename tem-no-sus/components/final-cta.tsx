import Link from "next/link";
import { ArrowRight, Smartphone, Clock } from "lucide-react";
import { Reveal } from "./reveal";
import { SplitText } from "./ui/split-text";

export function FinalCta() {
  return (
    <section id="baixar" className="px-5 pb-20 sm:px-8 sm:pb-28">
      <Reveal>
        <div className="grain-dark relative mx-auto max-w-6xl overflow-hidden rounded-[2rem] bg-verde-deep px-7 py-16 text-paper-soft sm:px-16 sm:py-20">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -top-24 -left-20 h-80 w-80 rounded-full bg-verde/40 blur-3xl"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-16 -bottom-24 h-72 w-72 rounded-full bg-coral/25 blur-3xl"
          />

          <div className="relative mx-auto max-w-2xl text-center">
            <h2 className="font-display text-3xl leading-[1.08] font-semibold tracking-tight sm:text-5xl">
              <SplitText text="O SUS que você não sabia que tinha." delay={0.1} />
            </h2>
            <p className="mx-auto mt-5 max-w-lg text-lg leading-relaxed text-paper-soft/80">
              Encontre, em menos de um minuto, o serviço gratuito que você
              procura. Sem cadastro complicado, sem sigla, sem custo.
            </p>

            <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <span
                className="inline-flex h-[52px] w-full cursor-not-allowed items-center justify-center gap-2.5 rounded-full bg-paper-soft/30 px-6 text-base font-semibold text-paper-soft/40 sm:w-auto"
                aria-disabled="true"
                title="Em breve na App Store"
              >
                <Clock className="h-5 w-5" aria-hidden="true" />
                iPhone — em breve
              </span>
              <Link
                href="/baixar"
                className="inline-flex h-[52px] w-full items-center justify-center gap-2.5 rounded-full bg-paper-soft px-6 text-base font-semibold text-verde-deep transition-transform hover:-translate-y-0.5 active:translate-y-0 sm:w-auto"
              >
                <Smartphone className="h-5 w-5" aria-hidden="true" />
                Baixar para Android
              </Link>
            </div>

            <a
              href="#"
              className="group mt-6 inline-flex items-center gap-2 text-sm font-medium text-paper-soft/70 transition-colors hover:text-paper-soft"
            >
              Sou de uma prefeitura e quero o painel de gestão
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </a>
          </div>
        </div>
      </Reveal>
    </section>
  );
}
