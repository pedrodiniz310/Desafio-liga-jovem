# Descobertas Universais + Novas Jornadas — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use
> subagent-driven-development or executing-plans.

**Goal:** Expandir o Modo Descoberta ("Você sabia?") com fatos do SUS que não dependem de um estabelecimento próximo (vigilância, sangue, PICS, dignidade & direitos) e adicionar duas jornadas guiadas (Saúde do Homem e Saúde da Mulher).

**Architecture:** Hoje `buscar_descobertas` só devolve descobertas ancoradas em local (join obrigatório com `estabelecimento_servicos` + `st_dwithin`). Introduzimos uma coluna `universal boolean` em `necessidades`; descobertas universais não exigem estabelecimento. A RPC passa a fazer `UNION ALL` entre **locais** (com distância) e **universais** (sem estabelecimento) e intercala os dois grupos (`row_number()` por grupo) para que o feed alterne "perto de você" com "uau, o SUS faz isso". A UI do card renderiza condicionalmente: locais mostram nome + distância + CTA "Ver como chegar"; universais mostram selo "Em todo o SUS" e nenhum CTA de navegação. As jornadas novas são puro seed (tabela `jornadas`), reusando `servico_codigo` já existentes para não exigir mudança de código.

**Tech Stack:** Supabase (PostgreSQL 17 + PostGIS), Expo Router 6 / React Native 0.81, React Query 5, TypeScript. Sem framework de testes unitários — verificação por `tsc --noEmit`, `expo lint`, execução de SQL no Supabase e Playwright (`scripts/flow-e2e.mjs`).

**Projeto Supabase:** ref `eydegpjzlxuxttzoinnh` (cuidado: existe um 2º projeto BlindAR na conta — confirmar o ref antes de aplicar).

---

## Resumo de arquivos tocados

| Arquivo | Ação |
|---|---|
| `supabase/migrations/0009_descobertas_universais.sql` | **criar** — coluna `universal` + reescrita de `buscar_descobertas` + exclusão de universais em `buscar_servicos` |
| `supabase/migrations/0010_seed_descobertas_universais.sql` | **criar** — seed dos 6 cards universais |
| `supabase/migrations/0011_seed_jornadas_homem_mulher.sql` | **criar** — seed das 2 jornadas |
| `src/types/models.ts` | **editar** — `ResultadoDescoberta` ganha `universal` e campos de local nuláveis |
| `src/app/(tabs)/descobrir.tsx` | **editar** — render condicional do card (local vs universal) |

> Nenhuma mudança em `src/app/jornada/[slug].tsx` nem `BUSCA_MAP`: as jornadas novas usam apenas `servico_codigo` já mapeados (`atencao_basica`, `vacina`, `saude_mental`, `farmacia`).

---

## Task 1: Migration de schema + RPC (coluna `universal`, reescrita de `buscar_descobertas`, blindagem de `buscar_servicos`)

**File:** `supabase/migrations/0009_descobertas_universais.sql`

**Implementation:**
```sql
-- ============================================================
-- Migration 0009: descobertas universais (decoupladas de local)
-- ============================================================

-- 1) Flag: descoberta vale em qualquer lugar (não exige estabelecimento próximo)
alter table necessidades add column if not exists universal boolean not null default false;

-- 2) buscar_descobertas: une descobertas LOCAIS (com distância) + UNIVERSAIS (sem local),
--    intercalando os dois grupos para um feed mais rico.
create or replace function buscar_descobertas(
  lat         double precision,
  lng         double precision,
  raio_metros int default 20000
)
returns table (
  necessidade_id       bigint,
  slug                 text,
  descoberta_texto     text,
  icone                text,
  universal            boolean,
  estabelecimento_id   bigint,
  nome_estabelecimento text,
  endereco             text,
  distancia_metros     double precision
)
language sql stable as $$
  with ponto as (
    select st_setsrid(st_makepoint(lng, lat), 4326)::geography as g
  ),
  locais as (
    select distinct on (n.servico_codigo)
      n.id                          as necessidade_id,
      n.slug,
      n.descoberta_texto,
      n.icone,
      false                         as universal,
      e.id                          as estabelecimento_id,
      e.nome                        as nome_estabelecimento,
      e.endereco,
      st_distance(e.localizacao, (select g from ponto)) as distancia_metros
    from necessidades n
    join estabelecimento_servicos es on es.servico_codigo = n.servico_codigo
    join estabelecimentos e on e.id = es.estabelecimento_id
    where n.descoberta_texto is not null
      and n.ativo
      and not n.universal
      and e.ativo
      and e.localizacao is not null
      and st_dwithin(e.localizacao, (select g from ponto), raio_metros)
    order by n.servico_codigo,
             st_distance(e.localizacao, (select g from ponto))
  ),
  universais as (
    select
      n.id                          as necessidade_id,
      n.slug,
      n.descoberta_texto,
      n.icone,
      true                          as universal,
      null::bigint                  as estabelecimento_id,
      null::text                    as nome_estabelecimento,
      null::text                    as endereco,
      null::double precision        as distancia_metros
    from necessidades n
    where n.descoberta_texto is not null
      and n.ativo
      and n.universal
  ),
  combinado as (
    select *,
      row_number() over (partition by universal order by distancia_metros nulls last, necessidade_id) as rn
    from (
      select * from locais
      union all
      select * from universais
    ) t
  )
  select
    necessidade_id, slug, descoberta_texto, icone, universal,
    estabelecimento_id, nome_estabelecimento, endereco, distancia_metros
  from combinado
  order by rn, universal      -- intercala: local(rn1), universal(rn1), local(rn2), universal(rn2)...
  limit 20;
$$;

grant execute on function buscar_descobertas(double precision, double precision, int)
  to anon, authenticated;

-- 3) buscar_servicos: descobertas universais NÃO devem virar alvo de busca
--    (não têm estabelecimento → resultado vazio "dead-end"). Excluímos via not n.universal.
create or replace function buscar_servicos(
  termo text,
  lat double precision,
  lng double precision,
  raio_metros int default 15000
)
returns table (
  estabelecimento_id bigint,
  nome text,
  endereco text,
  telefone text,
  horario text,
  distancia_metros double precision
)
language sql stable
as $$
  with ponto as (
    select st_setsrid(st_makepoint(lng, lat), 4326)::geography as g
  ),
  alvo as (
    select n.servico_codigo
    from necessidades n
    where n.ativo
      and not n.universal
      and (
        termo ilike '%' || n.texto_cidadao || '%'
        or n.texto_cidadao ilike '%' || termo || '%'
        or n.texto_cidadao % termo
        or exists (
          select 1 from unnest(coalesce(n.sinonimos, '{}')) s
          where termo ilike '%' || s || '%' or s % termo
        )
      )
    order by similarity(n.texto_cidadao, termo) desc
    limit 1
  )
  select e.id, e.nome, e.endereco, e.telefone, e.horario,
         st_distance(e.localizacao, (select g from ponto)) as distancia_metros
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

> ⚠️ Nota: `buscar_servicos` na migration `0003` adiciona a coluna `necessidade_texto` ao retorno (vide tipo `ResultadoBusca`). **Antes de aplicar**, abrir `0003_perfis_gamificacao_alertas.sql` e confirmar a assinatura/retorno atuais de `buscar_servicos`; se `0003` já alterou o retorno, copiar essa versão e adicionar **apenas** o `and not n.universal` no CTE `alvo`, preservando as colunas extras. Não regredir o contrato da função.

**Verification:**
```sql
-- Aplicar a migration no Supabase (ref eydegpjzlxuxttzoinnh) e rodar:

-- (a) coluna existe e default = false
select column_name, data_type, column_default
from information_schema.columns
where table_name = 'necessidades' and column_name = 'universal';
-- Esperado: 1 linha, boolean, default false

-- (b) RPC ainda devolve as descobertas locais de Joaçaba (lat/lng do CAPS)
select slug, universal, nome_estabelecimento, round(distancia_metros) as m
from buscar_descobertas(-27.1768, -51.5052, 20000);
-- Esperado: linhas com universal = false e nome_estabelecimento preenchido (ainda sem universais até a Task 2)

-- (c) busca de serviço clínico segue funcionando
select nome from buscar_servicos('psicólogo', -27.1768, -51.5052, 15000);
-- Esperado: 'CAPS II Joaçaba'
```

**Commit:** `feat(db): adiciona descobertas universais e blinda buscar_servicos`

---

## Task 2: Seed dos cards universais (SUS Invisível, PICS, Dignidade & Direitos)

**File:** `supabase/migrations/0010_seed_descobertas_universais.sql`

**Implementation:**
```sql
-- ============================================================
-- Migration 0010: seed de descobertas universais
-- (servico_codigo NULL, universal = true, descoberta_texto preenchido)
-- texto_cidadao é apenas rótulo interno: universais são excluídas de buscar_servicos.
-- ============================================================

insert into necessidades (slug, texto_cidadao, servico_codigo, icone, descoberta_texto, universal, ativo) values
  -- SUS Invisível
  ('vigilancia-agua', 'vigilância sanitária', null, 'shield-checkmark-outline',
   'A água da sua torneira e a comida do restaurante onde você comeu ontem são fiscalizadas pela Vigilância Sanitária do SUS.',
   true, true),
  ('doacao-sangue', 'doação de sangue', null, 'water-outline',
   'Todo o sangue usado nos hospitais — até nos particulares — vem dos Hemocentros do SUS. Uma única doação salva até 4 vidas.',
   true, true),
  -- PICS (Práticas Integrativas e Complementares)
  ('pics', 'práticas integrativas', null, 'leaf-outline',
   'O SUS oferece acupuntura, yoga, meditação e auriculoterapia de graça — terapias que o plano de saúde raramente cobre.',
   true, true),
  -- Dignidade & Direitos
  ('absorventes', 'dignidade menstrual', null, 'heart-outline',
   'Estudantes e pessoas em vulnerabilidade têm direito a absorventes gratuitos pelo SUS. Pergunte na sua UBS.',
   true, true),
  ('oculos-grau', 'óculos de grau', null, 'eye-outline',
   'Muitos municípios entregam óculos de grau de graça pelo SUS. Não compre sem antes perguntar na sua Unidade Básica de Saúde.',
   true, true),
  ('proteses', 'prótese', null, 'medical-outline',
   'Próteses dentárias e aparelhos auditivos podem ser 100% gratuitos pelo SUS, via CEO e serviços de reabilitação.',
   true, true)
on conflict (slug) do update set
  descoberta_texto = excluded.descoberta_texto,
  icone            = excluded.icone,
  universal        = excluded.universal,
  ativo            = excluded.ativo;
```

> Ícones escolhidos são nomes válidos do conjunto `Ionicons` já usado no app (`shield-checkmark-outline`, `water-outline`, `leaf-outline`, `heart-outline`, `eye-outline`, `medical-outline`). Se algum não renderizar no device, substituir por equivalente válido — não inventar nome.

**Verification:**
```sql
-- (a) 6 universais ativas com texto
select count(*) from necessidades where universal and descoberta_texto is not null and ativo;
-- Esperado: 6

-- (b) elas aparecem no feed mesmo SEM estabelecimento próximo
select slug, universal, nome_estabelecimento, distancia_metros
from buscar_descobertas(-27.1768, -51.5052, 20000)
where universal = true;
-- Esperado: linhas universais com nome_estabelecimento = null e distancia_metros = null

-- (c) o feed intercala locais e universais (não vêm todas universais no fim)
select slug, universal from buscar_descobertas(-27.1768, -51.5052, 20000) limit 6;
-- Esperado: alternância entre universal=false e universal=true

-- (d) universais NÃO criam busca dead-end
select count(*) from buscar_servicos('doação de sangue', -27.1768, -51.5052, 15000);
-- Esperado: 0 (sem dead-end disfarçado — a busca simplesmente não casa serviço clínico)
```

**Commit:** `feat(db): seed de descobertas universais (vigilância, sangue, PICS, direitos)`

---

## Task 3: Seed das jornadas Saúde do Homem e Saúde da Mulher

**File:** `supabase/migrations/0011_seed_jornadas_homem_mulher.sql`

**Implementation:**
```sql
-- ============================================================
-- Migration 0011: jornadas Saúde do Homem e Saúde da Mulher
-- Reusa servico_codigo existentes (atencao_basica, vacina, saude_mental, farmacia)
-- já presentes em BUSCA_MAP (src/app/jornada/[slug].tsx).
-- ============================================================

insert into jornadas (slug, titulo, descricao, icone, cor, passos) values
(
  'saude-do-homem',
  'Saúde do Homem',
  'Prevenção que homem costuma deixar pra depois — tudo gratuito pelo SUS.',
  'man-outline',
  '#e9eef7',
  '[
    {"ordem":1,"servico_codigo":"atencao_basica","titulo_passo":"Faça seu check-up na UBS","por_que_importa":"Não precisa estar doente. Pressão, glicemia e colesterol são avaliados de graça na UBS e evitam infarto e AVC."},
    {"ordem":2,"servico_codigo":"atencao_basica","titulo_passo":"Converse sobre a próstata","por_que_importa":"A partir dos 50 anos (ou 45 com histórico na família), a avaliação da próstata é gratuita na UBS. Falar cedo salva vidas."},
    {"ordem":3,"servico_codigo":"saude_mental","titulo_passo":"Cuide da cabeça também","por_que_importa":"Ansiedade e uso de álcool estão entre as maiores causas de morte precoce em homens. O CAPS atende de graça."},
    {"ordem":4,"servico_codigo":"farmacia","titulo_passo":"Retire seus medicamentos contínuos","por_que_importa":"Remédio de pressão e colesterol saem de graça na Farmácia Popular, com receita."}
  ]'::jsonb
),
(
  'saude-da-mulher',
  'Saúde da Mulher',
  'Muito além da gravidez: prevenção e direitos garantidos pelo SUS.',
  'woman-outline',
  '#f6e8f1',
  '[
    {"ordem":1,"servico_codigo":"atencao_basica","titulo_passo":"Faça o preventivo (Papanicolau)","por_que_importa":"O exame que previne o câncer de colo de útero é gratuito na UBS a partir dos 25 anos."},
    {"ordem":2,"servico_codigo":"vacina","titulo_passo":"Tome a vacina contra o HPV","por_que_importa":"A vacina que previne o câncer de colo de útero é gratuita pelo SUS."},
    {"ordem":3,"servico_codigo":"atencao_basica","titulo_passo":"Agende a mamografia","por_que_importa":"Mulheres de 50 a 69 anos têm mamografia gratuita pelo SUS. Converse na UBS."},
    {"ordem":4,"servico_codigo":"farmacia","titulo_passo":"Conheça os métodos contraceptivos","por_que_importa":"Pílula, DIU e injeção são gratuitos pelo SUS. A UBS orienta e a Farmácia Popular distribui."}
  ]'::jsonb
)
on conflict (slug) do nothing;
```

> Cores `#e9eef7` e `#f6e8f1` são distintas das jornadas existentes (`#f8e6dd`, `#e2efe8`, `#fef3e2`). Ícones `man-outline` / `woman-outline` são válidos no `Ionicons`.

**Verification:**
```sql
-- (a) as duas jornadas ativas com 4 passos cada
select slug, titulo, jsonb_array_length(passos) as passos
from jornadas where slug in ('saude-do-homem','saude-da-mulher') and ativo;
-- Esperado: 2 linhas, passos = 4 cada

-- (b) todos os servico_codigo dos passos existem em `servicos` (sem passo órfão)
select j.slug, p->>'servico_codigo' as codigo
from jornadas j, jsonb_array_elements(j.passos) p
left join servicos s on s.codigo = p->>'servico_codigo'
where j.slug in ('saude-do-homem','saude-da-mulher') and s.codigo is null;
-- Esperado: 0 linhas (nenhum código inexistente)
```

**Commit:** `feat(db): jornadas Saúde do Homem e Saúde da Mulher`

---

## Task 4: Atualizar o tipo `ResultadoDescoberta`

**File:** `src/types/models.ts`

**Implementation:** Substituir a interface `ResultadoDescoberta` existente (linhas ~107-116) por:
```typescript
export interface ResultadoDescoberta {
  necessidade_id: number;
  slug: string;
  descoberta_texto: string;
  icone: string | null;
  /** true = vale em todo o SUS (sem estabelecimento/distância). */
  universal: boolean;
  estabelecimento_id: number | null;
  nome_estabelecimento: string | null;
  endereco: string | null;
  distancia_metros: number | null;
}
```

**Verification:**
```bash
cd conecta-sus-app && npx tsc --noEmit
# Esperado: erros em src/app/(tabs)/descobrir.tsx (estabelecimento_id agora pode ser null) —
# serão resolvidos na Task 5. Nenhum erro em outros arquivos.
```

**Commit:** `feat(types): ResultadoDescoberta suporta descobertas universais`

---

## Task 5: Render condicional do card no Modo Descoberta

**File:** `src/app/(tabs)/descobrir.tsx`

**Implementation:**

5.1 — No `renderItem` do `FlatList`, tornar a navegação segura para universais (sem `estabelecimento_id`). Substituir o `onVer` atual:
```tsx
renderItem={({ item }) => (
  <DiscoveryCard
    item={item}
    height={cardHeight}
    onVer={
      item.estabelecimento_id != null
        ? () =>
            router.push({
              pathname: "/servico/[id]",
              params: { id: String(item.estabelecimento_id) },
            })
        : undefined
    }
  />
)}
```

5.2 — Ajustar a assinatura de `DiscoveryCard` para `onVer` opcional:
```tsx
function DiscoveryCard({
  item,
  height,
  onVer,
}: {
  item: ResultadoDescoberta;
  height: number;
  onVer?: () => void;
}) {
```

5.3 — Dentro do `DiscoveryCard`, substituir o bloco `<View style={styles.meta}>…</View>` e o `<Pressable … styles.ctaBtn>…</Pressable>` por render condicional. Universais mostram selo "Em todo o SUS" e não têm CTA de navegação:
```tsx
{item.universal ? (
  <View style={styles.universalBadge}>
    <Ionicons name="globe-outline" size={15} color={cores.verdeBright} />
    <Texto style={styles.universalTexto}>Vale em qualquer cidade do Brasil</Texto>
  </View>
) : (
  <>
    <View style={styles.meta}>
      <Texto style={styles.nomeEstab} numberOfLines={2}>
        {item.nome_estabelecimento}
      </Texto>
      <View style={styles.distRow}>
        <Ionicons name="location" size={14} color={cores.verdeBright} />
        <Texto style={styles.dist}>
          {item.distancia_metros != null
            ? formatarDistancia(item.distancia_metros)
            : ""}
        </Texto>
      </View>
    </View>

    <Pressable
      onPress={onVer}
      style={({ pressed }) => [styles.ctaBtn, pressed && { opacity: 0.8 }]}
      accessibilityRole="button"
      accessibilityLabel="Ver como chegar"
    >
      <Texto style={styles.ctaTexto}>Ver como chegar</Texto>
      <Ionicons name="arrow-forward" size={18} color={cores.verdeDeep} />
    </Pressable>
  </>
)}
```

5.4 — Adicionar os estilos `universalBadge` e `universalTexto` no `makeStyles` (junto de `meta`):
```tsx
universalBadge: {
  flexDirection: "row",
  alignItems: "center",
  gap: 8,
  backgroundColor: "rgba(255,255,255,0.15)",
  paddingHorizontal: 16,
  paddingVertical: 12,
  borderRadius: 18,
},
universalTexto: {
  fontSize: 14,
  fontWeight: "700",
  color: "#ffffff",
  textAlign: "center",
},
```

> O `keyExtractor` segue usando `item.necessidade_id` (único entre locais e universais — sem colisão). Sem mudanças nele.

**Verification:**
```bash
cd conecta-sus-app && npx tsc --noEmit && npx expo lint
# Esperado: 0 erros de tipo, 0 erros de lint.
```
Verificação visual (após aplicar as migrations no Supabase):
```bash
cd conecta-sus-app && npx expo export -p web && node ./scripts/flow-e2e.mjs
# Abrir .playwright-screens/ e confirmar na aba "Descobrir":
#  - cards locais mostram nome do estabelecimento + distância + "Ver como chegar"
#  - cards universais (ex.: doação de sangue) mostram selo "Vale em qualquer cidade do Brasil" e SEM botão "Ver como chegar"
```

**Commit:** `feat(descobrir): renderiza descobertas universais sem distância/CTA`

---

## Verificação final (todas as tasks)

1. **Banco** — aplicar 0009, 0010, 0011 no projeto `eydegpjzlxuxttzoinnh` (via `supabase db push` ou SQL Editor) e rodar os blocos de verificação SQL de cada task.
2. **App** — `npx tsc --noEmit` e `npx expo lint` sem erros.
3. **Visual/funcional (Playwright + skills)** — conforme [[usar-playwright-para-verificar-app]]: feed do Descobrir intercala locais e universais; jornadas Homem/Mulher aparecem em "Está passando por isso?" na home e abrem com 4 passos + botão "Buscar este serviço".
4. **Obsidian** — atualizar o vault com o que foi entregue (memória [[sempre-atualizar-obsidian]]).

## Decisões deliberadas / fora de escopo

- **Não criamos tabela `descobertas` separada.** Reusamos `necessidades` + flag `universal` (decisão do usuário: "descobertas universais") — menor risco de migration para o prazo do pitch.
- **Overlap com `regras_direitos` (Direitos personalizados por idade/condição):** fraldas geriátricas e insulina permanecem só lá. No feed Descobrir entram apenas direitos **universais não cobertos** por aquele sistema (absorventes, óculos, próteses) para evitar duplicação.
- **Hemocentro como universal**, não local: não há dado de hemocentro no seed; tratar como conhecimento ("vem dos Hemocentros do SUS") evita card quebrado.
- **Pitch / PostGIS:** descobertas universais não enfraquecem o argumento geográfico — as locais continuam usando `st_dwithin` + índice GiST; as universais reforçam a narrativa "o SUS é universal".

---

## Execution Options

1. **Subagent-Driven** (recomendado) — um subagente novo por task via `/subagent-driven-development`.
2. **Inline Execution** — executar as tasks em lote nesta sessão via `/executing-plans`.
