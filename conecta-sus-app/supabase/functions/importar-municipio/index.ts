import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import {
  fetchTiposUnidade, fetchEstabelecimentos,
  normalizeEstabelecimento, inferServicos, uniqueByCnes,
} from "./cnes.ts";

const CACHE_HORAS = 24;

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });

  try {
    const { codigo_ibge } = await req.json();
    const ibge = String(codigo_ibge ?? "").replace(/\D/g, "");
    if (!/^\d{7}$/.test(ibge)) return json({ erro: "codigo_ibge invalido (7 digitos)" }, 400);
    const codigoMunicipioCnes = ibge.slice(0, 6);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { persistSession: false, autoRefreshToken: false } },
    );

    // Cache: ja importado nas ultimas CACHE_HORAS?
    const { data: muni } = await supabase
      .from("municipios").select("id, nome, uf, importado_em")
      .eq("codigo_ibge", ibge).maybeSingle();
    if (muni?.importado_em) {
      const horas = (Date.now() - new Date(muni.importado_em).getTime()) / 3.6e6;
      if (horas < CACHE_HORAS) return json({ status: "cache", codigo_ibge: ibge, importados: 0 }, 200);
    }

    const [tipos, estabApi] = await Promise.all([
      fetchTiposUnidade(),
      fetchEstabelecimentos(codigoMunicipioCnes),
    ]);
    // deno-lint-ignore no-explicit-any
    const tiposPorCodigo = new Map(tipos.map((t: any) => [Number(t.codigo_tipo_unidade), t]));
    const estabs = uniqueByCnes(
      estabApi
        // deno-lint-ignore no-explicit-any
        .filter((r: any) => String(r.codigo_municipio) === codigoMunicipioCnes)
        // deno-lint-ignore no-explicit-any
        .map((r: any) => normalizeEstabelecimento(r, tiposPorCodigo)),
    );

    // municipio_id (upsert garante existencia mesmo se centroide ainda nao semeado)
    const { data: muniUp, error: muniErr } = await supabase
      .from("municipios")
      .upsert({ codigo_ibge: ibge, nome: muni?.nome ?? `IBGE ${ibge}`, uf: muni?.uf ?? "BR" }, { onConflict: "codigo_ibge" })
      .select("id").single();
    if (muniErr) throw muniErr;
    const municipioId = muniUp.id;

    const rows = estabs.map((e) => ({
      cnes_id: e.cnes_id, nome: e.nome, nome_fantasia: e.nome_fantasia, tipo: e.tipo,
      endereco: e.endereco, bairro: e.bairro, telefone: e.telefone, horario: e.horario,
      municipio_id: municipioId, lat: e.lat, lng: e.lng, ativo: e.ativo,
      atualizado_em: new Date().toISOString(), fonte_dados: e.fonte_dados,
      competencia_cnes: e.competencia_cnes, importado_em: new Date().toISOString(),
      geocoding_status: e.geocoding_status,
    }));
    for (const c of chunk(rows, 500)) {
      const { error } = await supabase.from("estabelecimentos").upsert(c, { onConflict: "cnes_id" });
      if (error) throw error;
    }

    // ids por cnes
    const idPorCnes = new Map<string, number>();
    for (const c of chunk(rows.map((r) => r.cnes_id), 200)) {
      const { data, error } = await supabase.from("estabelecimentos").select("id, cnes_id").in("cnes_id", c);
      if (error) throw error;
      for (const r of data ?? []) idPorCnes.set(r.cnes_id, r.id);
    }

    // substitui vinculos de servico desses estabelecimentos
    const ids = [...idPorCnes.values()];
    for (const c of chunk(ids, 200)) {
      const { error } = await supabase.from("estabelecimento_servicos").delete().in("estabelecimento_id", c);
      if (error) throw error;
    }
    const vinculos: { estabelecimento_id: number; servico_codigo: string }[] = [];
    for (const e of estabs) {
      const id = idPorCnes.get(e.cnes_id);
      if (!id) continue;
      for (const servico_codigo of inferServicos(e)) vinculos.push({ estabelecimento_id: id, servico_codigo });
    }
    for (const c of chunk(vinculos, 500)) {
      if (c.length === 0) continue;
      const { error } = await supabase.from("estabelecimento_servicos").upsert(c);
      if (error) throw error;
    }

    // primeira ingestao oficial global => desativa seeds de prototipo
    if (rows.length > 0) {
      await supabase.from("estabelecimentos").update({ ativo: false }).like("cnes_id", "SEED%");
    }

    await supabase.from("municipios").update({ importado_em: new Date().toISOString() }).eq("codigo_ibge", ibge);

    return json({ status: "ok", codigo_ibge: ibge, importados: rows.length, vinculos: vinculos.length }, 200);
  } catch (e) {
    return json({ erro: String((e as Error)?.message ?? e) }, 500);
  }
});

function json(body: unknown, status: number) {
  return new Response(JSON.stringify(body), { status, headers: { ...CORS, "Content-Type": "application/json" } });
}
function* chunk<T>(arr: T[], n: number): Generator<T[]> { for (let i = 0; i < arr.length; i += n) yield arr.slice(i, i + n); }
