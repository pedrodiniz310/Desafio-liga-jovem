import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useLocalizacao } from "@/stores/use-localizacao";
import type { Coordenada, MunicipioProximo } from "@/types/models";

type Estado = "ocioso" | "resolvendo" | "importando" | "pronto" | "erro";

/**
 * Resolve o município mais próximo das coordenadas (RPC PostGIS),
 * atualiza o header e, se aquele município ainda não foi ingerido,
 * dispara a Edge Function `importar-municipio` (CNES on-demand).
 */
export function useMunicipioAtivo(coordenada: Coordenada) {
  const { setMunicipio } = useLocalizacao();
  const [estado, setEstado] = useState<Estado>("ocioso");

  useEffect(() => {
    let ativo = true;
    (async () => {
      try {
        setEstado("resolvendo");
        const { data, error } = await supabase.rpc("municipio_mais_proximo", {
          p_lat: coordenada.lat,
          p_lng: coordenada.lng,
        });
        if (error) throw error;
        const muni = (data as MunicipioProximo[] | null)?.[0];
        if (!muni || !ativo) {
          if (ativo) setEstado("pronto");
          return;
        }

        setMunicipio(`${muni.nome} · ${muni.uf}`, muni.codigo_ibge);

        if (!muni.importado_em) {
          setEstado("importando");
          const { error: fnErr } = await supabase.functions.invoke("importar-municipio", {
            body: { codigo_ibge: muni.codigo_ibge },
          });
          if (fnErr) throw fnErr;
        }
        if (ativo) setEstado("pronto");
      } catch {
        if (ativo) setEstado("erro");
      }
    })();
    return () => {
      ativo = false;
    };
  }, [coordenada.lat, coordenada.lng, setMunicipio]);

  return {
    carregandoCidade: estado === "resolvendo" || estado === "importando",
    importando: estado === "importando",
    erro: estado === "erro",
  };
}
