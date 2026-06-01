"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { MapPin, ShieldCheck, X } from "lucide-react";
import { LogoMark } from "./logo";

export function PermissionPrimer() {
  const [visivel, setVisivel] = useState(false);

  useEffect(() => {
    // Só mostra se ainda não tivermos a permissão e não estivermos em um estado negado
    if ("geolocation" in navigator) {
      navigator.permissions.query({ name: "geolocation" }).then((result) => {
        if (result.state === "prompt") {
          // Delay sutil para não assustar o usuário assim que a página carrega
          const timer = setTimeout(() => setVisivel(true), 1500);
          return () => clearTimeout(timer);
        }
      });
    }
  }, []);

  const solicitarLocalizacao = () => {
    setVisivel(false);
    navigator.geolocation.getCurrentPosition(
      () => {
        // Sucesso - o navegador já disparou o prompt e o usuário aceitou
        console.log("Localização concedida");
      },
      () => {
        // Erro ou Negado
        console.log("Localização negada");
      }
    );
  };

  return (
    <AnimatePresence>
      {visivel && (
        <div className="fixed inset-0 z-[100] flex items-end justify-center p-5 pb-8 sm:items-center">
          {/* backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-ink/40 backdrop-blur-sm"
            onClick={() => setVisivel(false)}
          />

          {/* modal */}
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-sm rounded-[32px] border border-line bg-card p-8 shadow-lift sm:p-10"
          >
            <button
              onClick={() => setVisivel(false)}
              className="absolute top-6 right-6 text-ink-faint hover:text-ink"
              aria-label="Fechar"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex flex-col items-center text-center">
              <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-[24px] bg-verde-wash text-verde">
                <MapPin className="h-10 w-10" />
              </div>

              <div className="mb-2 flex items-center gap-1.5 rounded-full bg-verde/10 px-3 py-1 text-[0.7rem] font-bold tracking-wider text-verde uppercase">
                <ShieldCheck className="h-3.5 w-3.5" />
                Privacidade Garantida
              </div>

              <h2 className="font-display text-2xl font-semibold text-ink sm:text-3xl">
                Ver serviços próximos?
              </h2>

              <p className="mt-4 text-base leading-relaxed text-ink-soft">
                Para mostrar os postos de saúde e farmácias <span className="font-semibold text-verde">realmente perto de você</span> agora, precisamos da sua localização.
              </p>

              <div className="mt-8 flex w-full flex-col gap-3">
                <button
                  onClick={solicitarLocalizacao}
                  className="cta-shiny flex h-14 w-full items-center justify-center rounded-2xl text-base font-bold text-white shadow-soft transition-transform active:scale-[0.98]"
                >
                  Sim, encontrar agora
                </button>
                <button
                  onClick={() => setVisivel(false)}
                  className="flex h-12 w-full items-center justify-center text-sm font-medium text-ink-faint hover:text-ink-soft"
                >
                  Agora não, prefiro buscar manual
                </button>
              </div>

              <p className="mt-6 text-[0.7rem] leading-tight text-ink-faint">
                Seu local é usado apenas para a busca e <span className="font-medium">nunca é armazenado</span> em nossos servidores.
              </p>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
