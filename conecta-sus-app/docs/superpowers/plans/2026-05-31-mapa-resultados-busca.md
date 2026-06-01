# Mapa nos Resultados de Busca — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use
> subagent-driven-development or executing-plans.

**Goal:** Adicionar toggle Lista ↔ Mapa nos resultados de busca do Tem no SUS!, exibindo os estabelecimentos como pins numerados sobre OpenStreetMap com popup de detalhes.

**Architecture:** A RPC `buscar_servicos` retorna atualmente 7 campos mas não inclui `lat`/`lng` — uma nova migration adiciona as duas colunas ao `SELECT`. O mapa usa `react-native-webview` com HTML inline gerado dinamicamente contendo Leaflet 1.9.4 via CDN + OpenStreetMap tiles; nenhuma API key é necessária e funciona em Expo Go SDK 54. O toggle é um estado local em `Resultados`, e o mapa ocupa `flex: 1` no lugar do `FlatList` quando ativo.

**Tech Stack:** PostgreSQL 17 + PostGIS (Supabase), Expo SDK 54 / React Native 0.81, `react-native-webview`, Leaflet 1.9.4 (CDN), TypeScript, `tsc --noEmit` + Playwright para verificação.

**Projeto Supabase:** `eydegpjzlxuxttzoinnh` — confirmar antes de aplicar SQL (existe 2º projeto BlindAR na conta).

---

## Mapa de arquivos

| Arquivo | Ação |
|---|---|
| `supabase/migrations/0012_buscar_servicos_lat_lng.sql` | **criar** |
| `src/types/models.ts` | **editar** — `lat`, `lng` nuláveis em `ResultadoBusca` |
| `package.json` / lock | **editar** — via `npx expo install react-native-webview` |
| `src/components/mapa-resultados.tsx` | **criar** |
| `src/app/(tabs)/index.tsx` | **editar** — importar `Coordenada`, passar `coordUsuario` ao `Resultados`, toggle + render condicional |

---

## Task 1: Migration — adicionar lat/lng ao retorno de buscar_servicos

**File:** `supabase/migrations/0012_buscar_servicos_lat_lng.sql`

**Implementation:**
```sql
-- ============================================================
-- Migration 0012: adiciona lat e lng ao retorno de buscar_servicos
-- Necessário para renderizar pins no mapa de resultados.
-- DROP obrigatório: o retorno da função mudou (novas colunas).
-- ============================================================

drop function if exists buscar_servicos(text, double precision, double precision, int);

create or replace function buscar_servicos(
  termo       text,
  lat         double precision,
  lng         double precision,
  raio_metros int default 15000
)
returns table (
  estabelecimento_id bigint,
  nome               text,
  endereco           text,
  telefone           text,
  horario            text,
  distancia_metros   double precision,
  necessidade_texto  text,
  lat                double precision,
  lng                double precision
)
language sql stable
as $$
  with ponto as (
    select st_setsrid(st_makepoint(lng, lat), 4326)::geography as g
  ),
  alvo as (
    select n.servico_codigo, n.texto_cidadao,
      greatest(
        similarity(n.texto_cidadao, termo),
        coalesce(
          (select max(similarity(s, termo))
           from unnest(coalesce(n.sinonimos, '{}')) s),
          0
        )
      ) as score
    from necessidades n
    where n.ativo
      and not n.universal
      and (
        termo ilike '%' || n.texto_cidadao || '%'
        or n.texto_cidadao ilike '%' || termo || '%'
        or n.texto_cidadao % termo
        or exists (
          select 1 from unnest(coalesce(n.sinonimos, '{}')) s
          where termo ilike '%' || s || '%' or s ilike '%' || termo || '%' or s % termo
        )
      )
    order by score desc
    limit 1
  )
  select e.id, e.nome, e.endereco, e.telefone, e.horario,
         st_distance(e.localizacao, (select g from ponto)) as distancia_metros,
         (select texto_cidadao from alvo)                  as necessidade_texto,
         e.lat,
         e.lng
  from estabelecimentos e
  join estabelecimento_servicos es on es.estabelecimento_id = e.id
  join alvo a on a.servico_codigo = es.servico_codigo
  where e.ativo
    and e.localizacao is not null
    and st_dwithin(e.localizacao, (select g from ponto), raio_metros)
  order by distancia_metros
  limit 30;
$$;

grant execute on function buscar_servicos(text, double precision, double precision, int)
  to anon, authenticated;
```

**Verification — SQL no Supabase (ref eydegpjzlxuxttzoinnh):**
```sql
-- (a) DROP+CREATE sem erro
select proname, pronargs from pg_proc where proname = 'buscar_servicos';
-- Esperado: 1 linha

-- (b) retorna lat/lng não nulos para Joaçaba (dados reais do CNES)
select estabelecimento_id, nome, round(distancia_metros) as m, lat, lng
from buscar_servicos('psicólogo', -27.1768, -51.5052, 15000)
limit 3;
-- Esperado: linhas com lat e lng preenchidos (não null)
```

**Commit:** `feat(db): adiciona lat/lng ao retorno de buscar_servicos`

---

## Task 2: Tipo ResultadoBusca — adicionar lat e lng nuláveis

**File:** `src/types/models.ts`

**Implementation:** Substituir a interface `ResultadoBusca` existente (em torno da linha 36):
```typescript
/** Resultado da RPC `buscar_servicos` — inclui lat/lng para o mapa a partir da migration 0012. */
export interface ResultadoBusca {
  estabelecimento_id: number;
  nome: string;
  endereco: string | null;
  telefone: string | null;
  horario: string | null;
  distancia_metros: number;
  necessidade_texto: string | null;
  lat: number | null;
  lng: number | null;
}
```

**Verification:**
```bash
cd conecta-sus-app && npx tsc --noEmit
# Esperado: 0 erros (lat/lng são nuláveis — sem breaking change)
```

**Commit:** `feat(types): ResultadoBusca inclui lat e lng para mapa`

---

## Task 3: Instalar react-native-webview

**File:** `package.json` (atualizado via expo install)

**Implementation:**
```bash
cd conecta-sus-app
npx expo install react-native-webview
```

`expo install` escolhe a versão compatível com Expo SDK 54 e a adiciona em `dependencies`. `react-native-webview` está presente no bundle do Expo Go SDK 54 — não exige dev build.

**Verification:**
```bash
npx tsc --noEmit
# Esperado: 0 erros
node -e "require('./node_modules/react-native-webview/package.json').version" && echo "ok"
# Esperado: imprime a versão + "ok"
```

**Commit:** `chore: instala react-native-webview para mapa de resultados`

---

## Task 4: Componente MapaResultados

**File:** `src/components/mapa-resultados.tsx`

**Implementation:**
```tsx
import { useCallback, useMemo } from "react";
import { StyleSheet, View } from "react-native";
import { WebView } from "react-native-webview";
import type { WebViewMessageEvent } from "react-native-webview";

import { formatarDistancia } from "@/utils/format";
import type { Coordenada, ResultadoBusca } from "@/types/models";

interface Props {
  dados: ResultadoBusca[];
  coordUsuario: Coordenada;
  onAbrir: (id: number) => void;
}

interface PinMapa {
  id: number;
  nome: string;
  dist: string;
  lat: number;
  lng: number;
}

function gerarHtml(pins: PinMapa[], uLat: number, uLng: number): string {
  const pinsJson = JSON.stringify(pins);
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no"/>
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"><\/script>
<style>
*{box-sizing:border-box;margin:0;padding:0}
html,body,#map{width:100%;height:100%;overflow:hidden}
.pn{background:#073b2e;color:#fff;border:2.5px solid #fff;border-radius:50%;
    width:32px;height:32px;display:flex;align-items:center;justify-content:center;
    font:700 13px/1 sans-serif;box-shadow:0 2px 8px rgba(0,0,0,.35)}
.pu{background:#F2683C;border:2.5px solid #fff;border-radius:50%;
    width:16px;height:16px;box-shadow:0 0 0 5px rgba(242,104,60,.2)}
.leaflet-popup-content{min-width:190px;font-family:sans-serif}
.pm-nome{font-size:14px;font-weight:700;color:#16241f;margin-bottom:3px}
.pm-dist{font-size:12px;color:#6b7c76;margin-bottom:10px}
.pm-btn{background:#0d6a51;color:#fff;border:none;border-radius:10px;
        padding:10px 0;font-size:13px;font-weight:700;width:100%;cursor:pointer}
</style>
</head>
<body>
<div id="map"></div>
<script>
function verDetalhes(id){window.ReactNativeWebView.postMessage(JSON.stringify({id:id}))}
var pins=${pinsJson};
var map=L.map('map',{zoomControl:true});
L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19,attribution:'© OSM'}).addTo(map);
var ui=L.divIcon({className:'',html:'<div class="pu"></div>',iconSize:[16,16],iconAnchor:[8,8]});
L.marker([${uLat},${uLng}],{icon:ui}).addTo(map).bindPopup('<strong>Você está aqui</strong>');
var bounds=[[${uLat},${uLng}]];
pins.forEach(function(p,i){
  var ic=L.divIcon({className:'',html:'<div class="pn">'+(i+1)+'</div>',iconSize:[32,32],iconAnchor:[16,16]});
  L.marker([p.lat,p.lng],{icon:ic}).addTo(map)
   .bindPopup('<div class="pm-nome">'+p.nome+'</div><div class="pm-dist">'+p.dist+'</div><button class="pm-btn" onclick="verDetalhes('+p.id+')">Ver detalhes ›</button>');
  bounds.push([p.lat,p.lng]);
});
map.fitBounds(bounds,{padding:[40,40]});
<\/script>
</body>
</html>`;
}

export function MapaResultados({ dados, coordUsuario, onAbrir }: Props) {
  const pins = useMemo<PinMapa[]>(
    () =>
      dados
        .filter(
          (d): d is ResultadoBusca & { lat: number; lng: number } =>
            d.lat != null && d.lng != null
        )
        .map((d) => ({
          id: d.estabelecimento_id,
          nome: d.nome,
          dist: formatarDistancia(d.distancia_metros),
          lat: d.lat,
          lng: d.lng,
        })),
    [dados]
  );

  const html = useMemo(
    () => gerarHtml(pins, coordUsuario.lat, coordUsuario.lng),
    [pins, coordUsuario]
  );

  const onMessage = useCallback(
    (e: WebViewMessageEvent) => {
      try {
        const payload = JSON.parse(e.nativeEvent.data) as { id: number };
        if (typeof payload.id === "number") onAbrir(payload.id);
      } catch {}
    },
    [onAbrir]
  );

  return (
    <View style={styles.container}>
      <WebView
        source={{ html }}
        style={styles.webview}
        onMessage={onMessage}
        originWhitelist={["*"]}
        javaScriptEnabled
        domStorageEnabled={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  webview: { flex: 1 },
});
```

**Verification:**
```bash
cd conecta-sus-app && npx tsc --noEmit
# Esperado: 0 erros
```

**Commit:** `feat(mapa): componente MapaResultados com Leaflet e OpenStreetMap`

---

## Task 5: Toggle Lista/Mapa na tela de busca

**File:** `src/app/(tabs)/index.tsx`

Esta task tem três mudanças cirúrgicas no arquivo existente:

### 5a — Adicionar imports necessários

Localizar o bloco de imports existente e adicionar `useState`, `Coordenada`, `MapaResultados`:

```tsx
// Linha atual — adicionar useState aos React hooks existentes
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

// Adicionar após os imports de componentes existentes:
import { MapaResultados } from "@/components/mapa-resultados";

// Editar o import de models para incluir Coordenada:
import type { Coordenada, ResultadoBusca } from "@/types/models";
```

### 5b — Passar coordUsuario ao componente Resultados

Localizar a chamada `<Resultados ...>` dentro de `BuscaScreen` (linha ~125) e adicionar a prop:

```tsx
<Resultados
  loading={busca.isLoading}
  error={busca.isError}
  dados={busca.data ?? []}
  necessidadeTexto={necessidadeTexto}
  termoBuscado={termo}
  coordUsuario={coord}
  onAbrir={(id) => router.push({ pathname: "/servico/[id]", params: { id: String(id) } })}
  onSugerir={pesquisar}
/>
```

### 5c — Atualizar o componente Resultados

Substituir a assinatura e o corpo do componente `Resultados` (linha ~198–310):

```tsx
function Resultados({
  loading,
  error,
  dados,
  necessidadeTexto,
  termoBuscado,
  coordUsuario,
  onAbrir,
  onSugerir,
}: {
  loading: boolean;
  error: boolean;
  dados: ResultadoBusca[];
  necessidadeTexto: string | null;
  termoBuscado: string;
  coordUsuario: Coordenada;
  onAbrir: (id: number) => void;
  onSugerir: (termo: string) => void;
}) {
  const { cores } = useTema();
  const styles = useMemo(() => makeStyles(cores), [cores]);
  const [modo, setModo] = useState<"lista" | "mapa">("lista");

  const badgeAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (necessidadeTexto) {
      badgeAnim.setValue(0);
      Animated.spring(badgeAnim, {
        toValue: 1,
        useNativeDriver: true,
        tension: 80,
        friction: 8,
      }).start();
    }
  }, [necessidadeTexto, badgeAnim]);

  if (loading) return (
    <View style={styles.estado}>
      <ActivityIndicator color={cores.verde} />
      <Texto style={styles.estadoTexto}>Procurando perto de você…</Texto>
    </View>
  );

  if (error) return (
    <View style={styles.estado}>
      <Ionicons name="cloud-offline-outline" size={36} color={cores.inkFaint} />
      <Texto style={styles.estadoTexto}>Não foi possível buscar. Verifique a conexão.</Texto>
    </View>
  );

  if (dados.length === 0) return (
    <View style={styles.estado}>
      <Ionicons name="search-outline" size={36} color={cores.inkFaint} />
      <Texto style={styles.estadoTexto}>
        Nenhum resultado para {termoBuscado}.
      </Texto>
      <Texto style={[styles.estadoTexto, { fontSize: 13, marginTop: -4 }]}>
        Experimente uma dessas buscas:
      </Texto>
      <View style={styles.sugestoes}>
        {SUGESTOES_VAZIAS.map((s) => (
          <Pressable
            key={s.rotulo}
            style={styles.sugestaoBtn}
            onPress={() => onSugerir(s.rotulo)}
            accessibilityRole="button"
            accessibilityLabel={`Buscar por ${s.rotulo}`}
          >
            <Ionicons name={s.icone} size={15} color={cores.verde} />
            <Texto style={styles.sugestaoTexto}>{s.rotulo}</Texto>
          </Pressable>
        ))}
      </View>
    </View>
  );

  const temCoordenadas = dados.some((d) => d.lat != null && d.lng != null);

  const matchBadgeNode = necessidadeTexto ? (
    <Animated.View
      style={[
        styles.matchBadge,
        {
          opacity: badgeAnim,
          transform: [
            {
              scale: badgeAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [0.85, 1],
              }),
            },
          ],
        },
      ]}
    >
      <Ionicons name="sparkles" size={15} color="#a8d5c4" />
      <Texto style={styles.matchTexto}>
        Entendemos que você busca:{" "}
        <Texto style={styles.matchDestaque}>{necessidadeTexto}</Texto>
      </Texto>
    </Animated.View>
  ) : null;

  return (
    <View style={{ flex: 1 }}>
      {/* Toggle Lista / Mapa — só aparece quando há coordenadas */}
      {temCoordenadas && (
        <View style={styles.toggle}>
          <Pressable
            style={[styles.toggleBtn, modo === "lista" && styles.toggleBtnAtivo]}
            onPress={() => setModo("lista")}
            accessibilityRole="button"
            accessibilityLabel="Ver em lista"
          >
            <Ionicons
              name="list"
              size={15}
              color={modo === "lista" ? "#ffffff" : cores.verdeDeep}
            />
            <Texto style={[styles.toggleTexto, modo === "lista" && styles.toggleTextoAtivo]}>
              Lista
            </Texto>
          </Pressable>
          <Pressable
            style={[styles.toggleBtn, modo === "mapa" && styles.toggleBtnAtivo]}
            onPress={() => setModo("mapa")}
            accessibilityRole="button"
            accessibilityLabel="Ver no mapa"
          >
            <Ionicons
              name="map"
              size={15}
              color={modo === "mapa" ? "#ffffff" : cores.verdeDeep}
            />
            <Texto style={[styles.toggleTexto, modo === "mapa" && styles.toggleTextoAtivo]}>
              Mapa
            </Texto>
          </Pressable>
        </View>
      )}

      {modo === "mapa" && temCoordenadas ? (
        <MapaResultados
          dados={dados}
          coordUsuario={coordUsuario}
          onAbrir={onAbrir}
        />
      ) : (
        <FlatList
          data={dados}
          keyExtractor={(item) => String(item.estabelecimento_id)}
          contentContainerStyle={styles.lista}
          ListHeaderComponent={matchBadgeNode}
          renderItem={({ item }) => (
            <ServiceCard
              servico={item}
              onPress={() => onAbrir(item.estabelecimento_id)}
            />
          )}
        />
      )}
    </View>
  );
}
```

### 5d — Adicionar estilos do toggle ao `makeStyles`

Localizar `makeStyles` e adicionar antes do fechamento `});`:

```tsx
    toggle: {
      flexDirection: "row",
      gap: 8,
      paddingHorizontal: 20,
      paddingTop: 12,
      paddingBottom: 4,
    },
    toggleBtn: {
      flexDirection: "row",
      alignItems: "center",
      gap: 5,
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 20,
      borderWidth: 1.5,
      borderColor: cores.verdeDeep,
    },
    toggleBtnAtivo: {
      backgroundColor: cores.verdeDeep,
    },
    toggleTexto: {
      fontSize: 13,
      fontWeight: "700",
      color: cores.verdeDeep,
    },
    toggleTextoAtivo: {
      color: "#ffffff",
    },
```

**Verification:**
```bash
cd conecta-sus-app && npx tsc --noEmit && npx expo lint
# Esperado: 0 erros de tipo, 0 erros de lint
```

Verificação visual (após aplicar migration 0012 e rodar `npm run import:cnes`):
```bash
npx expo export -p web && node ./scripts/flow-e2e.mjs
# Verificar .playwright-screens/:
#   - na tela de busca por "psicólogo", toggle Lista/Mapa aparece acima dos resultados
#   - ao clicar "Mapa", WebView renderiza pins numerados sobre fundo OpenStreetMap
#   - ao clicar pin → popup com nome + distância + "Ver detalhes"
#   - "Ver detalhes" navega à tela de detalhe do estabelecimento
```

**Commit:** `feat(busca): toggle Lista/Mapa com WebView Leaflet`

---

## Verificação final (todas as tasks)

1. **Banco** — aplicar `0012_buscar_servicos_lat_lng.sql` no Supabase (`eydegpjzlxuxttzoinnh`) e confirmar com a query de verificação da Task 1.
2. **App** — `tsc --noEmit` e `expo lint` sem erros.
3. **Import CNES** — `npm run import:cnes` (precisa de `SUPABASE_SERVICE_ROLE_KEY` no `.env`) para popular `lat`/`lng` com dados reais. Sem isso o toggle não aparece (estabelecimentos seed têm `lat`/`lng` mas são coordenadas aproximadas).
4. **Playwright** — adicionar etapa no `scripts/flow-e2e.mjs`: buscar "psicólogo" → clicar "Mapa" → `waitFor("Vale em qualquer cidade")` não, esperar que o WebView carregue → screenshot.

## Notas técnicas

- **Offline e pitch:** tiles OpenStreetMap requerem internet. Para demo em ambiente sem rede, considerar carregar tiles via cache ou usar um mapa estático como fallback.
- **Expo Go vs dev build:** `react-native-webview` funciona em Expo Go SDK 54 sem dev build.
- **Dados seed vs CNES:** estabelecimentos seed (SEED0001–SEED0006) têm `lat`/`lng` aproximados de Joaçaba e já permitem testar o mapa sem rodar o import. Os pins aparecerão, mas as coordenadas são estimativas do centro da cidade.
- **RPC e retorno tipado:** o `useBuscaServicos` usa `as ResultadoBusca[]` — após a migration 0012 o Supabase devolverá `lat` e `lng` automaticamente, sem alterar o hook.

---

## Execution Options

1. **Inline Execution** (recomendado para este plano — 5 tasks sequenciais simples) — executar com `/executing-plans`
2. **Subagent-Driven** — task por task via `/subagent-driven-development`
