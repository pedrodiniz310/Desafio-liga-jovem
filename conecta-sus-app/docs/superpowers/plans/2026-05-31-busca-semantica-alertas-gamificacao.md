# Conecta SUS: Busca Semântica + Alertas de Direitos + Gamificação Completa

> **For agentic workers:** REQUIRED SUB-SKILL: Use `subagent-driven-development` or `executing-plans`.
> **OBRIGATÓRIO:** Antes de escrever qualquer código Expo/React Native, leia os docs em https://docs.expo.dev/versions/v56.0.0/

**Goal:** Implementar busca por linguagem natural com feedback semântico, notificações proativas de direitos baseadas em perfil do usuário, e sistema completo de gamificação com pontos e badges.

**Architecture:** Três features com schema compartilhado. (A) Busca Semântica expande a RPC `buscar_servicos` para retornar o campo `necessidade_texto` e enriquece os sinônimos com frases coloquiais. (B) Alertas de Direitos cria `perfis` e `regras_direitos` no DB, seção de perfil de saúde no app, e notificações locais via `expo-notifications`. (C) Gamificação Completa adiciona pontos via DB trigger, tabela de badges, hook de gamificação, stats comunitárias no detalhe do serviço, e toast de pontos após confirmação.

**Tech Stack:** Expo SDK 54, React Native 0.81, TypeScript 5.9, Supabase (PostgreSQL + PostGIS), React Query v5, `expo-notifications`

---

## Task 1: Migration 0003 — Tabelas, trigger de pontos, RPC verificar_badges e buscar_servicos atualizada

**File:** `supabase/migrations/0003_perfis_gamificacao_alertas.sql`

**Test:**
```
Não há unit tests para SQL. Verificar após aplicar:
1. supabase db push
2. No Studio: tabelas perfis, badges, usuario_badges, regras_direitos aparecem
3. Chamar buscar_servicos no SQL editor e verificar coluna necessidade_texto no resultado
```

**Implementation:**
```sql
-- ============================================================
-- Migration 0003: perfis, gamificação e alertas de direitos
-- ============================================================

-- ---------- perfis de usuário ----------
create table if not exists perfis (
  id               uuid primary key references auth.users(id) on delete cascade,
  data_nascimento  date,
  condicoes        text[] not null default '{}',
  pontos           int not null default 0,
  criado_em        timestamptz default now()
);

-- ---------- badges ----------
create table if not exists badges (
  slug                text primary key,
  nome                text not null,
  descricao           text not null,
  icone               text not null,
  pontos_necessarios  int not null default 0
);

create table if not exists usuario_badges (
  usuario_id     uuid references auth.users(id) on delete cascade,
  badge_slug     text references badges(slug) on delete cascade,
  conquistado_em timestamptz default now(),
  primary key (usuario_id, badge_slug)
);

-- ---------- regras de direitos ----------
create table if not exists regras_direitos (
  id             bigint primary key generated always as identity,
  titulo         text not null,
  mensagem       text not null,
  -- { "idade_min"?: int, "idade_max"?: int, "condicoes"?: string[] }
  condicao       jsonb not null default '{}',
  servico_codigo text references servicos(codigo),
  icone          text,
  ativo          boolean default true
);

-- ---------- trigger: 10 pontos por confirmação ----------
create or replace function fn_pontos_confirmacao()
returns trigger language plpgsql security definer as $$
begin
  if new.usuario_id is not null then
    insert into perfis (id, pontos)
    values (new.usuario_id, 10)
    on conflict (id) do update set pontos = perfis.pontos + 10;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_pontos_confirmacao on confirmacoes;
create trigger trg_pontos_confirmacao
  after insert on confirmacoes
  for each row execute function fn_pontos_confirmacao();

-- ---------- RPC: conceder badges por marco de confirmações ----------
create or replace function verificar_badges(uid uuid)
returns void language plpgsql security definer as $$
declare
  qtd int;
begin
  select count(*) into qtd from confirmacoes where usuario_id = uid;
  if qtd >= 1 then
    insert into usuario_badges (usuario_id, badge_slug)
    values (uid, 'primeira-confirmacao') on conflict do nothing;
  end if;
  if qtd >= 10 then
    insert into usuario_badges (usuario_id, badge_slug)
    values (uid, 'guia-comunidade') on conflict do nothing;
  end if;
  if qtd >= 50 then
    insert into usuario_badges (usuario_id, badge_slug)
    values (uid, 'guardiao-saude') on conflict do nothing;
  end if;
end;
$$;

-- ---------- buscar_servicos: adiciona campo necessidade_texto ----------
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
  necessidade_texto  text
)
language sql stable
as $$
  with ponto as (
    select st_setsrid(st_makepoint(lng, lat), 4326)::geography as g
  ),
  alvo as (
    select n.servico_codigo, n.texto_cidadao
    from necessidades n
    where n.ativo and (
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
         st_distance(e.localizacao, (select g from ponto)) as distancia_metros,
         (select texto_cidadao from alvo) as necessidade_texto
  from estabelecimentos e
  join estabelecimento_servicos es on es.estabelecimento_id = e.id
  join alvo a on a.servico_codigo = es.servico_codigo
  where e.ativo
    and e.localizacao is not null
    and st_dwithin(e.localizacao, (select g from ponto), raio_metros)
  order by distancia_metros
  limit 30;
$$;

-- ---------- RLS ----------
alter table perfis enable row level security;
alter table badges enable row level security;
alter table usuario_badges enable row level security;
alter table regras_direitos enable row level security;

drop policy if exists "perfil proprio" on perfis;
create policy "perfil proprio" on perfis
  for all using (auth.uid() = id) with check (auth.uid() = id);

drop policy if exists "badges publico" on badges;
create policy "badges publico" on badges for select using (true);

drop policy if exists "ub proprio" on usuario_badges;
create policy "ub proprio" on usuario_badges
  for all using (auth.uid() = usuario_id) with check (auth.uid() = usuario_id);

drop policy if exists "regras publico" on regras_direitos;
create policy "regras publico" on regras_direitos for select using (ativo = true);

-- ---------- Grants ----------
grant select, insert, update on perfis to authenticated;
grant select on badges to anon, authenticated;
grant select, insert on usuario_badges to authenticated;
grant select on regras_direitos to anon, authenticated;
grant execute on function verificar_badges(uuid) to authenticated;
```

**Verification:**
```bash
cd conecta-sus-app && npx supabase db push
# Esperado: ✓ migration aplicada sem erros
# Verificar no Supabase Studio: todas as 4 tabelas novas aparecem em Table Editor
```

**Commit:** `feat(db): schema para gamificação, alertas de direitos e busca semântica`

---

## Task 2: Migration 0004 — Seed: badges, regras_direitos e sinônimos coloquiais

**File:** `supabase/migrations/0004_seed_badges_regras_sinonimos.sql`

**Implementation:**
```sql
-- ============================================================
-- Migration 0004: seed de badges, regras e sinônimos coloquiais
-- ============================================================

-- ---------- Badges ----------
insert into badges (slug, nome, descricao, icone, pontos_necessarios) values
  ('primeira-confirmacao', 'Primeira Contribuição', 'Ajudou a comunidade pela primeira vez!',  'star-outline',             10),
  ('guia-comunidade',      'Guia da Comunidade',    'Realizou 10 confirmações comunitárias.',   'people-outline',          100),
  ('guardiao-saude',       'Guardião da Saúde',     'Realizou 50 confirmações comunitárias.',   'shield-checkmark-outline', 500)
on conflict (slug) do nothing;

-- ---------- Regras de direitos ----------
insert into regras_direitos (titulo, mensagem, condicao, servico_codigo, icone) values
  (
    'Fraldas Geriátricas Gratuitas',
    'Você tem mais de 60 anos e pode retirar fraldas geriátricas gratuitamente na Farmácia Popular mais próxima. Basta apresentar receita médica.',
    '{"idade_min": 60}',
    'farmacia', 'bandage-outline'
  ),
  (
    'Insulina Gratuita no SUS',
    'Diabéticos têm direito à insulina e medicamentos antidiabéticos gratuitos na Unidade Básica de Saúde mais próxima.',
    '{"condicoes": ["diabetes"]}',
    'farmacia', 'medical-outline'
  ),
  (
    'Acompanhamento Gratuito para Hipertensos',
    'O SUS oferece monitoramento de pressão e medicamentos gratuitos para hipertensos na UBS mais próxima.',
    '{"condicoes": ["hipertensao"]}',
    'atencao_basica', 'heart-outline'
  ),
  (
    'Atenção Psicossocial Especializada',
    'O CAPS oferece atendimento especializado e gratuito para saúde mental, incluindo psicólogos e psiquiatras.',
    '{"condicoes": ["saude_mental"]}',
    'saude_mental', 'happy-outline'
  ),
  (
    'Reabilitação Gratuita para AVC',
    'Sobreviventes de AVC têm direito à fisioterapia e reabilitação gratuitas no CER mais próximo.',
    '{"condicoes": ["avc"]}',
    'reabilitacao', 'fitness-outline'
  )
on conflict do nothing;

-- ---------- Enriquecer sinônimos das necessidades existentes ----------
update necessidades set sinonimos = array[
  'terapia','saúde mental','psiquiatra','ansiedade','depressão','medo',
  'choro','tristeza','meu filho chora','filho chora muito','criança triste',
  'criança chorando','sofrimento','pânico','angústia','nervosismo',
  'estresse','burnout','não consigo dormir','insônia','automutilação'
] where slug = 'psicologo';

update necessidades set sinonimos = array[
  'dente','canal','aparelho','ortodontia','boca','gengiva','bruxismo',
  'dor de dente','meu dente doi','arrancar dente','extrair dente',
  'implante','prótese dentária','dentadura','dente quebrado'
] where slug = 'dentista';

update necessidades set sinonimos = array[
  'remédio','farmácia','medicamento','insulina','pressão','diabetes',
  'hipertensão','remedinho','remédio de graça','medicamento grátis',
  'fraldas','fraldas geriátricas','anti-hipertensivo','colesterol'
] where slug = 'remedio-gratis';

update necessidades set sinonimos = array[
  'fonoaudiólogo','fala','audição','gagueira','meu filho não fala',
  'criança não fala','demora falar','fala errado','dificuldade de fala',
  'surdez','perda auditiva','não ouve bem','autismo fala'
] where slug = 'fonoaudiologo';

update necessidades set sinonimos = array[
  'vacinar','vacinação','imunização','vacina da gripe','covid',
  'vacina infantil','carteira de vacinação','dose de reforço',
  'febre amarela','hepatite','sarampo','poliomielite'
] where slug = 'vacina';

update necessidades set sinonimos = array[
  'grávida','gestante','gravidez','prenatal','bebê a caminho',
  'esperando bebê','consulta gravidez','ultrassom','enjoo gravidez',
  'puerpério','pós-parto','amamentação'
] where slug = 'pre-natal';

update necessidades set sinonimos = array[
  'álcool','droga','alcoolismo','vício','beber demais','dependência',
  'crack','cocaína','desintoxicação','tratamento vício',
  'meu familiar bebe','meu filho usa droga','bebida','maconha'
] where slug = 'dependencia';

update necessidades set sinonimos = array[
  'fisioterapia','fisioterapeuta','reabilitar','avc','acidente vascular',
  'lesão','recuperação cirurgia','lesão no joelho','lesão no ombro',
  'ortopedia','cadeira de rodas','bengala','andador'
] where slug = 'fisioterapia';
```

**Verification:**
```bash
cd conecta-sus-app && npx supabase db push
# Esperado: ✓ seed aplicado sem erros
# No Studio: badges tem 3 linhas, regras_direitos tem 5 linhas
# Em necessidades: coluna sinonimos de 'psicologo' tem ≥ 15 termos
```

**Commit:** `feat(db): seed badges, regras de direitos e sinônimos coloquiais`

---

## Task 3: Atualizar types para refletir novo schema

**File:** `src/types/models.ts`

**Implementation:**
```typescript
/**
 * Tipos de domínio do Conecta SUS.
 */

export type StatusConfirmacao = "funciona" | "fechou" | "mudou";

export interface Municipio {
  id: number;
  codigo_ibge: string;
  nome: string;
  uf: string;
}

export interface Estabelecimento {
  id: number;
  cnes_id: string;
  nome: string;
  nome_fantasia: string | null;
  tipo: string | null;
  endereco: string | null;
  bairro: string | null;
  telefone: string | null;
  horario: string | null;
  municipio_id: number | null;
  lat: number | null;
  lng: number | null;
  ativo: boolean;
}

/** Resultado da RPC `buscar_servicos` — inclui necessidade_texto a partir de 0003. */
export interface ResultadoBusca {
  estabelecimento_id: number;
  nome: string;
  endereco: string | null;
  telefone: string | null;
  horario: string | null;
  distancia_metros: number;
  necessidade_texto: string | null;
}

export interface Necessidade {
  id: number;
  slug: string;
  texto_cidadao: string;
  sinonimos: string[] | null;
  servico_codigo: string | null;
  icone: string | null;
}

export interface Coordenada {
  lat: number;
  lng: number;
}

export interface Perfil {
  id: string;
  data_nascimento: string | null; // formato ISO 'YYYY-MM-DD'
  condicoes: string[];
  pontos: number;
}

export interface RegraDireito {
  id: number;
  titulo: string;
  mensagem: string;
  condicao: {
    idade_min?: number;
    idade_max?: number;
    condicoes?: string[];
  };
  servico_codigo: string | null;
  icone: string | null;
}

export interface BadgeInfo {
  slug: string;
  nome: string;
  descricao: string;
  icone: string;
  pontos_necessarios: number;
}

export interface BadgeUsuario extends BadgeInfo {
  conquistado: boolean;
  conquistado_em: string | null;
}

export interface EstatConfirmacoes {
  total: number;
  funciona: number;
  fechou: number;
  mudou: number;
  status_dominante: StatusConfirmacao | null;
}

export interface GamificacaoData {
  pontos: number;
  total_confirmacoes: number;
  badges: BadgeUsuario[];
}
```

**Verification:**
```bash
cd conecta-sus-app && npx tsc --noEmit
# Esperado: 0 erros
```

**Commit:** `feat(types): adiciona Perfil, RegraDireito, BadgeUsuario, EstatConfirmacoes, GamificacaoData`

---

## Task 4: UI da busca — badge "Mostrando por" e estado vazio inteligente

**File:** `src/app/(tabs)/index.tsx`

Replace the entire file content:

**Implementation:**
```typescript
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as Location from "expo-location";

import { Screen } from "@/components/screen";
import { NeedChip } from "@/components/need-chip";
import { ServiceCard } from "@/components/service-card";
import { Texto } from "@/components/texto";
import { NECESSIDADES_COMUNS } from "@/lib/queries/necessidades-comuns";
import { useBuscaServicos } from "@/lib/queries/use-busca-servicos";
import { JOACABA, useLocalizacao } from "@/stores/use-localizacao";
import { useTema } from "@/theme/tema";
import type { Cores } from "@/theme/colors";
import type { ResultadoBusca } from "@/types/models";

const SUGESTOES_VAZIAS = [
  { rotulo: "psicólogo",       icone: "happy-outline"    as const },
  { rotulo: "dentista",        icone: "medical-outline"  as const },
  { rotulo: "remédio de graça",icone: "bandage-outline"  as const },
  { rotulo: "fisioterapia",    icone: "fitness-outline"  as const },
];

export default function BuscaScreen() {
  const router = useRouter();
  const [texto, setTexto] = useState("");
  const [termo, setTermo] = useState("");

  const { cores, escala } = useTema();
  const styles = useMemo(() => makeStyles(cores), [cores]);

  const { coordenada, municipioNome, setCoordenada, setPermissaoNegada } =
    useLocalizacao();
  const coord = coordenada ?? JOACABA;

  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") { setPermissaoNegada(true); return; }
        const pos = await Location.getCurrentPositionAsync({});
        setCoordenada({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      } catch {
        setPermissaoNegada(true);
      }
    })();
  }, [setCoordenada, setPermissaoNegada]);

  const busca = useBuscaServicos({ termo, coordenada: coord });
  const buscando = termo.trim().length > 1;
  const necessidadeTexto = busca.data?.[0]?.necessidade_texto ?? null;

  function pesquisar(valor: string) {
    setTexto(valor);
    setTermo(valor);
  }

  return (
    <Screen>
      {/* ── HERO BAND ── */}
      <View style={styles.heroBand}>
        <View style={styles.localRow}>
          <Ionicons name="location" size={13} color="#a8d5c4" />
          <Texto style={styles.local}>{municipioNome}</Texto>
        </View>
        <Texto style={styles.titulo}>O que você{"\n"}precisa?</Texto>
        <Texto style={styles.subtitulo}>Serviços de saúde gratuitos perto de você.</Texto>

        <View style={styles.searchBox}>
          <Ionicons name="search" size={18} color={cores.verde} />
          <TextInput
            value={texto}
            onChangeText={setTexto}
            onSubmitEditing={(e) => setTermo(e.nativeEvent.text)}
            placeholder="Ex.: meu filho chora muito"
            placeholderTextColor={cores.inkFaint}
            returnKeyType="search"
            style={[styles.input, { fontSize: 15 * escala }]}
            accessibilityLabel="Buscar serviço de saúde"
          />
          {texto.length > 0 && (
            <Pressable onPress={() => pesquisar("")} accessibilityLabel="Limpar busca" hitSlop={8}>
              <Ionicons name="close-circle" size={18} color={cores.inkFaint} />
            </Pressable>
          )}
        </View>
      </View>

      {buscando ? (
        <Resultados
          loading={busca.isLoading}
          error={busca.isError}
          dados={busca.data ?? []}
          necessidadeTexto={necessidadeTexto}
          termoBuscado={termo}
          onAbrir={(id) => router.push({ pathname: "/servico/[id]", params: { id: String(id) } })}
          onSugerir={pesquisar}
        />
      ) : (
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Texto style={styles.secao}>O que mais pedem por aqui</Texto>
          <View style={styles.chips}>
            {NECESSIDADES_COMUNS.map((n) => (
              <NeedChip
                key={n.slug}
                rotulo={n.rotulo}
                icone={n.icone}
                onPress={() => pesquisar(n.rotulo)}
              />
            ))}
          </View>

          <Pressable
            style={styles.explorarCard}
            onPress={() => pesquisar("saúde")}
            accessibilityRole="button"
            accessibilityLabel="Explorar todos os serviços"
          >
            <View style={styles.explorarTextos}>
              <Texto style={styles.explorarTitulo}>Não encontrou o que precisa?</Texto>
              <Texto style={styles.explorarSub}>
                Digite qualquer sintoma ou condição na busca acima
              </Texto>
            </View>
            <Ionicons name="arrow-forward-circle-outline" size={28} color={cores.verde} />
          </Pressable>

          <Texto style={styles.dica}>Tudo o que aparece aqui é gratuito pelo SUS.</Texto>
        </ScrollView>
      )}
    </Screen>
  );
}

function Resultados({
  loading,
  error,
  dados,
  necessidadeTexto,
  termoBuscado,
  onAbrir,
  onSugerir,
}: {
  loading: boolean;
  error: boolean;
  dados: ResultadoBusca[];
  necessidadeTexto: string | null;
  termoBuscado: string;
  onAbrir: (id: number) => void;
  onSugerir: (termo: string) => void;
}) {
  const { cores } = useTema();
  const styles = useMemo(() => makeStyles(cores), [cores]);

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
        Nenhum resultado para "{termoBuscado}".
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

  return (
    <FlatList
      data={dados}
      keyExtractor={(item) => String(item.estabelecimento_id)}
      contentContainerStyle={styles.lista}
      ListHeaderComponent={
        necessidadeTexto ? (
          <View style={styles.matchBadge}>
            <Ionicons name="sparkles-outline" size={13} color={cores.verdeDeep} />
            <Texto style={styles.matchTexto}>
              Mostrando por:{" "}
              <Texto style={styles.matchDestaque}>{necessidadeTexto}</Texto>
            </Texto>
          </View>
        ) : null
      }
      renderItem={({ item }) => (
        <ServiceCard
          servico={item}
          onPress={() => onAbrir(item.estabelecimento_id)}
        />
      )}
    />
  );
}

const makeStyles = (cores: Cores) =>
  StyleSheet.create({
    heroBand: {
      backgroundColor: cores.verdeDeep,
      paddingHorizontal: 20,
      paddingTop: 18,
      paddingBottom: 28,
      borderBottomLeftRadius: 28,
      borderBottomRightRadius: 28,
    },
    localRow: { flexDirection: "row", alignItems: "center", gap: 5, marginBottom: 12 },
    local: { fontSize: 13, color: "#a8d5c4", fontWeight: "600" },
    titulo: { fontSize: 30, fontWeight: "800", color: "#ffffff", lineHeight: 36, marginBottom: 6 },
    subtitulo: { fontSize: 14, color: "#a8d5c4", marginBottom: 18 },
    searchBox: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      backgroundColor: "#ffffff",
      borderRadius: 16,
      paddingHorizontal: 14,
      paddingVertical: 13,
    },
    input: { flex: 1, fontSize: 15, color: "#16241f" },
    scroll: { padding: 20, paddingTop: 22, gap: 14 },
    secao: {
      fontSize: 12,
      fontWeight: "700",
      color: cores.inkFaint,
      textTransform: "uppercase",
      letterSpacing: 1.2,
    },
    chips: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
    explorarCard: {
      flexDirection: "row",
      alignItems: "center",
      gap: 14,
      backgroundColor: cores.verdeWash,
      borderRadius: 18,
      paddingVertical: 16,
      paddingHorizontal: 18,
      marginTop: 4,
    },
    explorarTextos: { flex: 1, gap: 2 },
    explorarTitulo: { fontSize: 14, fontWeight: "700", color: cores.verdeDeep },
    explorarSub: { fontSize: 12, color: cores.inkSoft, lineHeight: 17 },
    dica: { fontSize: 12, color: cores.inkFaint, marginTop: 4 },
    lista: { padding: 20, gap: 12, paddingTop: 12 },
    estado: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      padding: 40,
      gap: 12,
    },
    estadoTexto: { fontSize: 15, color: cores.inkSoft, textAlign: "center" },
    sugestoes: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 8,
      justifyContent: "center",
      marginTop: 4,
    },
    sugestaoBtn: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      backgroundColor: cores.verdeWash,
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 20,
    },
    sugestaoTexto: { fontSize: 13, color: cores.verdeDeep, fontWeight: "600" },
    matchBadge: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      backgroundColor: cores.verdeWash,
      paddingHorizontal: 12,
      paddingVertical: 7,
      borderRadius: 20,
      alignSelf: "flex-start",
      marginBottom: 8,
    },
    matchTexto: { fontSize: 12, color: cores.inkSoft },
    matchDestaque: { fontSize: 12, fontWeight: "700", color: cores.verdeDeep },
  });
```

**Verification:**
```bash
cd conecta-sus-app && npx tsc --noEmit
# Esperado: 0 erros
# No app (se conectado ao Supabase):
# - Buscar "meu filho chora" → deve aparecer badge "Mostrando por: psicólogo"
# - Buscar "xyzabcfoo" → deve mostrar estado vazio com 4 sugestões clicáveis
```

**Commit:** `feat(busca): badge de necessidade matched e estado vazio com sugestões`

---

## Task 5: Hook usePerfil — leitura e escrita do perfil de saúde

**File:** `src/lib/queries/use-perfil.ts`

**Implementation:**
```typescript
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/stores/use-auth";
import type { Perfil } from "@/types/models";

export function usePerfil() {
  const { session } = useAuth();
  const uid = session?.user.id;
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ["perfil", uid],
    enabled: !!uid,
    queryFn: async (): Promise<Perfil | null> => {
      const { data, error } = await supabase
        .from("perfis")
        .select("id, data_nascimento, condicoes, pontos")
        .eq("id", uid!)
        .single();
      // PGRST116 = nenhuma linha encontrada — perfil ainda não foi criado
      if (error && error.code !== "PGRST116") throw error;
      return data ?? null;
    },
  });

  const salvarMutation = useMutation({
    mutationFn: async (dados: { data_nascimento: string | null; condicoes: string[] }) => {
      const { error } = await supabase.from("perfis").upsert({
        id: uid!,
        data_nascimento: dados.data_nascimento,
        condicoes: dados.condicoes,
      });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["perfil", uid] }),
  });

  return {
    perfil: query.data ?? null,
    carregando: query.isLoading,
    salvar: salvarMutation.mutate,
    salvando: salvarMutation.isPending,
    erroSalvar: salvarMutation.error,
  };
}
```

**Verification:**
```bash
cd conecta-sus-app && npx tsc --noEmit
# Esperado: 0 erros
```

**Commit:** `feat(perfil): hook usePerfil com leitura e upsert do perfil de saúde`

---

## Task 6: Hook useAlertasDireitos — calcula regras aplicáveis ao perfil

**File:** `src/lib/queries/use-alertas-direitos.ts`

**Implementation:**
```typescript
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { Perfil, RegraDireito } from "@/types/models";

function calcularIdade(dataNascimento: string): number {
  const nasc = new Date(dataNascimento);
  const hoje = new Date();
  let idade = hoje.getFullYear() - nasc.getFullYear();
  const m = hoje.getMonth() - nasc.getMonth();
  if (m < 0 || (m === 0 && hoje.getDate() < nasc.getDate())) idade--;
  return idade;
}

function regraAplica(regra: RegraDireito, perfil: Perfil): boolean {
  const c = regra.condicao;

  const temFiltroIdade = c.idade_min !== undefined || c.idade_max !== undefined;
  if (temFiltroIdade) {
    if (!perfil.data_nascimento) return false;
    const idade = calcularIdade(perfil.data_nascimento);
    if (c.idade_min !== undefined && idade < c.idade_min) return false;
    if (c.idade_max !== undefined && idade > c.idade_max) return false;
  }

  if (c.condicoes && c.condicoes.length > 0) {
    const temAlguma = c.condicoes.some((cond) => perfil.condicoes.includes(cond));
    if (!temAlguma) return false;
  }

  return true;
}

export function useAlertasDireitos(perfil: Perfil | null | undefined) {
  const query = useQuery({
    queryKey: ["regras_direitos"],
    staleTime: 1000 * 60 * 60, // re-busca a cada 1 hora
    queryFn: async (): Promise<RegraDireito[]> => {
      const { data, error } = await supabase
        .from("regras_direitos")
        .select("id, titulo, mensagem, condicao, servico_codigo, icone")
        .eq("ativo", true);
      if (error) throw error;
      return (data ?? []) as RegraDireito[];
    },
  });

  const alertasAplicaveis =
    perfil && query.data
      ? query.data.filter((r) => regraAplica(r, perfil))
      : [];

  return {
    alertasAplicaveis,
    todasRegras: query.data ?? [],
    carregando: query.isLoading,
  };
}
```

**Verification:**
```bash
cd conecta-sus-app && npx tsc --noEmit
# Esperado: 0 erros
```

**Commit:** `feat(alertas): hook useAlertasDireitos com filtro por idade e condições`

---

## Task 7: Instalar expo-notifications e criar hook useNotificacoesAlertas

**File:** `src/lib/use-notificacoes-alertas.ts` (novo)

Antes de escrever, instalar o pacote:
```bash
cd conecta-sus-app && npx expo install expo-notifications
```

**Implementation:**
```typescript
import { useEffect } from "react";
import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { Perfil, RegraDireito } from "@/types/models";

// Importação lazy para não quebrar web build
let Notifications: typeof import("expo-notifications") | null = null;
if (Platform.OS !== "web") {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  Notifications = require("expo-notifications");
}

const STORAGE_KEY = "alertas_notificados_data";

export function useNotificacoesAlertas(
  perfil: Perfil | null | undefined,
  alertasAplicaveis: RegraDireito[]
) {
  useEffect(() => {
    if (!Notifications) return;
    if (!perfil || alertasAplicaveis.length === 0) return;

    async function agendar() {
      const hoje = new Date().toISOString().split("T")[0];
      const ultimaData = await AsyncStorage.getItem(STORAGE_KEY);
      if (ultimaData === hoje) return; // já notificou hoje

      const { status } = await Notifications!.requestPermissionsAsync();
      if (status !== "granted") return;

      if (Platform.OS === "android") {
        await Notifications!.setNotificationChannelAsync("direitos_sus", {
          name: "Seus Direitos de Saúde",
          importance: Notifications!.AndroidImportance.DEFAULT,
          sound: null,
        });
      }

      // Máximo 3 alertas por abertura de app
      const paraMostrar = alertasAplicaveis.slice(0, 3);
      for (const regra of paraMostrar) {
        await Notifications!.scheduleNotificationAsync({
          content: {
            title: `💚 ${regra.titulo}`,
            body: regra.mensagem,
            data: { regra_id: regra.id, servico_codigo: regra.servico_codigo },
          },
          trigger: null,
        });
      }

      await AsyncStorage.setItem(STORAGE_KEY, hoje);
    }

    agendar();
  }, [perfil?.id, alertasAplicaveis.length]);
}
```

Adicionar o handler de notificações no topo de `src/app/_layout.tsx` (antes do export default):
```typescript
// Adicionar no topo do arquivo, após os imports:
import { Platform } from "react-native";
if (Platform.OS !== "web") {
  const Notifications = require("expo-notifications");
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: false,
      shouldSetBadge: false,
    }),
  });
}
```

**Verification:**
```bash
cd conecta-sus-app && npx tsc --noEmit
# Esperado: 0 erros
# Em dispositivo físico com perfil preenchido (ex: ano 1960 → >60 anos):
# Ao abrir o app → deve aparecer notificação de sistema "Fraldas Geriátricas Gratuitas"
```

**Commit:** `feat(notificacoes): instala expo-notifications e agenda alertas de direitos diários`

---

## Task 8: Seção "Meu Perfil de Saúde" em perfil.tsx

**File:** `src/app/(tabs)/perfil.tsx`

Replace the entire file with the version abaixo que adiciona a seção de perfil de saúde **antes** da seção "Acessibilidade":

**Implementation:**
```typescript
import { useEffect, useMemo, useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { Screen } from "@/components/screen";
import { Texto } from "@/components/texto";
import { usePreferencias } from "@/stores/use-preferencias";
import { useAuth } from "@/stores/use-auth";
import { usePerfil } from "@/lib/queries/use-perfil";
import { useAlertasDireitos } from "@/lib/queries/use-alertas-direitos";
import { useNotificacoesAlertas } from "@/lib/use-notificacoes-alertas";
import { useTema } from "@/theme/tema";
import type { Cores } from "@/theme/colors";

const CONDICOES_OPCOES = [
  { slug: "diabetes",    rotulo: "Diabetes",      icone: "medical-outline"   as const },
  { slug: "hipertensao", rotulo: "Hipertensão",   icone: "heart-outline"     as const },
  { slug: "saude_mental",rotulo: "Saúde Mental",  icone: "happy-outline"     as const },
  { slug: "avc",         rotulo: "AVC",           icone: "fitness-outline"   as const },
];

export default function PerfilScreen() {
  const { fonteGrande, altoContraste, setFonteGrande, setAltoContraste } = usePreferencias();
  const { sair, session } = useAuth();
  const { perfil, salvar, salvando } = usePerfil();
  const { alertasAplicaveis, todasRegras } = useAlertasDireitos(perfil);

  // Aciona notificações se perfil e regras estiverem carregados
  useNotificacoesAlertas(perfil, alertasAplicaveis);

  const { cores } = useTema();
  const styles = useMemo(() => makeStyles(cores), [cores]);

  const [anoNasc, setAnoNasc] = useState("");
  const [condicoesSel, setCondicoesSel] = useState<string[]>([]);

  // Preenche campos ao carregar o perfil do servidor
  useEffect(() => {
    if (!perfil) return;
    if (perfil.data_nascimento) {
      setAnoNasc(perfil.data_nascimento.split("-")[0]);
    }
    setCondicoesSel(perfil.condicoes);
  }, [perfil?.id]);

  function toggleCondicao(slug: string) {
    setCondicoesSel((prev) =>
      prev.includes(slug) ? prev.filter((c) => c !== slug) : [...prev, slug]
    );
  }

  function salvarPerfil() {
    const ano = parseInt(anoNasc, 10);
    const dataValida =
      anoNasc.length === 4 && !isNaN(ano) && ano >= 1900 && ano <= new Date().getFullYear()
        ? `${anoNasc}-01-01`
        : null;

    salvar(
      { data_nascimento: dataValida, condicoes: condicoesSel },
      {
        onSuccess: () =>
          Alert.alert("Conecta SUS", "Perfil salvo! Alertas de direitos personalizados ativados."),
        onError: () =>
          Alert.alert("Erro", "Não foi possível salvar. Verifique a conexão."),
      }
    );
  }

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Texto style={styles.titulo}>Perfil</Texto>

        {/* ── Perfil de Saúde ── */}
        {session && (
          <>
            <Texto style={styles.secao}>Meu Perfil de Saúde</Texto>
            <View style={styles.grupo}>
              <View style={[styles.linha, { flexDirection: "column", alignItems: "flex-start", gap: 8 }]}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                  <Ionicons name="calendar-outline" size={20} color={cores.verde} />
                  <Texto style={styles.linhaTexto}>Ano de nascimento</Texto>
                </View>
                <TextInput
                  value={anoNasc}
                  onChangeText={setAnoNasc}
                  placeholder="Ex.: 1965"
                  placeholderTextColor={cores.inkFaint}
                  keyboardType="number-pad"
                  maxLength={4}
                  style={styles.anoInput}
                  accessibilityLabel="Ano de nascimento"
                />
              </View>

              <View style={[styles.linha, { flexDirection: "column", alignItems: "flex-start", gap: 10, borderBottomWidth: 0 }]}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                  <Ionicons name="medical-outline" size={20} color={cores.verde} />
                  <Texto style={styles.linhaTexto}>Condições de saúde</Texto>
                </View>
                <View style={styles.condicoesGrid}>
                  {CONDICOES_OPCOES.map((op) => {
                    const ativo = condicoesSel.includes(op.slug);
                    return (
                      <Pressable
                        key={op.slug}
                        onPress={() => toggleCondicao(op.slug)}
                        accessibilityRole="checkbox"
                        accessibilityState={{ checked: ativo }}
                        accessibilityLabel={op.rotulo}
                        style={[
                          styles.condicaoChip,
                          ativo && { backgroundColor: cores.verde, borderColor: cores.verde },
                        ]}
                      >
                        <Ionicons
                          name={op.icone}
                          size={14}
                          color={ativo ? "#ffffff" : cores.verde}
                        />
                        <Texto
                          style={[
                            styles.condicaoTexto,
                            ativo && { color: "#ffffff" },
                          ]}
                        >
                          {op.rotulo}
                        </Texto>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            </View>

            {alertasAplicaveis.length > 0 && (
              <View style={styles.alertaBox}>
                <Ionicons name="notifications-outline" size={16} color={cores.verdeDeep} />
                <Texto style={styles.alertaTexto}>
                  {alertasAplicaveis.length} alerta
                  {alertasAplicaveis.length > 1 ? "s" : ""} de direito
                  {alertasAplicaveis.length > 1 ? "s" : ""} ativo
                  {alertasAplicaveis.length > 1 ? "s" : ""} para seu perfil
                </Texto>
              </View>
            )}

            <Pressable
              onPress={salvarPerfil}
              disabled={salvando}
              style={[styles.btnSalvar, salvando && { opacity: 0.6 }]}
              accessibilityRole="button"
              accessibilityLabel="Salvar perfil de saúde"
            >
              <Ionicons name="checkmark-circle-outline" size={20} color="#ffffff" />
              <Texto style={styles.btnSalvarTexto}>
                {salvando ? "Salvando…" : "Salvar perfil"}
              </Texto>
            </Pressable>
          </>
        )}

        {/* ── Acessibilidade ── */}
        <Texto style={styles.secao}>Acessibilidade</Texto>
        <View style={styles.grupo}>
          <LinhaToggle
            icone="text-outline"
            rotulo="Fonte ampliada"
            valor={fonteGrande}
            onChange={setFonteGrande}
          />
          <LinhaToggle
            icone="contrast-outline"
            rotulo="Alto contraste"
            valor={altoContraste}
            onChange={setAltoContraste}
          />
          <LinhaToggle
            icone="mic-outline"
            rotulo="Busca por voz"
            valor={false}
            onChange={() => {}}
            emBreve
          />
        </View>

        {/* ── Sobre ── */}
        <Texto style={styles.secao}>Sobre</Texto>
        <View style={styles.grupo}>
          <LinhaInfo icone="shield-checkmark-outline" rotulo="Dados oficiais do CNES" />
          <LinhaInfo icone="heart-outline" rotulo="Gratuito para sempre" />
          <LinhaInfo icone="information-circle-outline" rotulo="Conecta SUS · versão 0.1" />
        </View>

        {/* ── Conta ── */}
        <Texto style={styles.secao}>Conta</Texto>
        <Pressable
          style={[styles.btnSair, { backgroundColor: cores.coralWash }]}
          onPress={sair}
          accessibilityRole="button"
          accessibilityLabel="Sair da conta"
        >
          <Ionicons name="log-out-outline" size={20} color={cores.coral} />
          <Texto style={[styles.btnSairTexto, { color: cores.coral }]}>Sair da conta</Texto>
        </Pressable>
      </ScrollView>
    </Screen>
  );
}

function LinhaToggle({
  icone, rotulo, valor, onChange, emBreve,
}: {
  icone: string; rotulo: string; valor: boolean; onChange: (v: boolean) => void; emBreve?: boolean;
}) {
  const { cores } = useTema();
  const styles = useMemo(() => makeStyles(cores), [cores]);
  const { Switch } = require("react-native");
  return (
    <View style={[styles.linha, emBreve && styles.linhaDesabilitada]}>
      <Ionicons name={icone as never} size={20} color={cores.verde} />
      <View style={styles.linhaTextoWrap}>
        <Texto style={styles.linhaTexto}>{rotulo}</Texto>
        {emBreve ? <Texto style={styles.emBreve}>Em breve</Texto> : null}
      </View>
      <Switch
        value={valor}
        onValueChange={onChange}
        disabled={emBreve}
        trackColor={{ true: cores.verde, false: cores.line }}
        thumbColor={cores.card}
      />
    </View>
  );
}

function LinhaInfo({ icone, rotulo }: { icone: string; rotulo: string }) {
  const { cores } = useTema();
  const styles = useMemo(() => makeStyles(cores), [cores]);
  return (
    <View style={styles.linha}>
      <Ionicons name={icone as never} size={20} color={cores.inkSoft} />
      <Texto style={styles.linhaTexto}>{rotulo}</Texto>
    </View>
  );
}

const makeStyles = (cores: Cores) =>
  StyleSheet.create({
    scroll: { padding: 20, gap: 12 },
    titulo: { fontSize: 26, fontWeight: "800", color: cores.ink, marginBottom: 4 },
    secao: {
      fontSize: 13,
      fontWeight: "700",
      color: cores.inkSoft,
      textTransform: "uppercase",
      letterSpacing: 1,
      marginTop: 12,
    },
    grupo: {
      backgroundColor: cores.card,
      borderWidth: 1,
      borderColor: cores.line,
      borderRadius: 18,
      overflow: "hidden",
    },
    linha: {
      flexDirection: "row",
      alignItems: "center",
      gap: 14,
      paddingHorizontal: 16,
      paddingVertical: 16,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: cores.line,
    },
    linhaDesabilitada: { opacity: 0.6 },
    linhaTextoWrap: { flex: 1 },
    linhaTexto: { fontSize: 15, color: cores.ink, fontWeight: "500" },
    emBreve: { fontSize: 12, color: cores.inkFaint, marginTop: 2 },
    anoInput: {
      borderWidth: 1,
      borderColor: cores.line,
      borderRadius: 12,
      paddingHorizontal: 14,
      paddingVertical: 10,
      fontSize: 16,
      color: cores.ink,
      width: "100%",
      backgroundColor: cores.paper,
    },
    condicoesGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8, width: "100%" },
    condicaoChip: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      borderWidth: 1.5,
      borderColor: cores.verde,
      borderRadius: 20,
      paddingHorizontal: 12,
      paddingVertical: 7,
    },
    condicaoTexto: { fontSize: 13, fontWeight: "600", color: cores.verde },
    alertaBox: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      backgroundColor: cores.verdeWash,
      borderRadius: 14,
      paddingHorizontal: 14,
      paddingVertical: 10,
    },
    alertaTexto: { fontSize: 13, color: cores.verdeDeep, flex: 1 },
    btnSalvar: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      backgroundColor: cores.verde,
      borderRadius: 16,
      paddingHorizontal: 20,
      paddingVertical: 14,
      justifyContent: "center",
    },
    btnSalvarTexto: { fontSize: 15, fontWeight: "700", color: "#ffffff" },
    btnSair: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      paddingHorizontal: 16,
      paddingVertical: 14,
      borderRadius: 18,
    },
    btnSairTexto: { fontSize: 15, fontWeight: "600" },
  });
```

**Nota:** O `Switch` está sendo importado via require dentro do componente para evitar problema de ordem dos hooks. Mover para o import estático no topo do arquivo junto com os outros imports do react-native.

**Correction** — corrigir LinhaToggle para não usar require:

No topo do arquivo, junto aos outros imports:
```typescript
import { Alert, Pressable, ScrollView, StyleSheet, Switch, TextInput, View } from "react-native";
```

E remover o `require` dentro de `LinhaToggle`.

**Verification:**
```bash
cd conecta-sus-app && npx tsc --noEmit
# Esperado: 0 erros
# No app: aba Perfil mostra seção "Meu Perfil de Saúde" com campo de ano e chips de condições
# Selecionar "Diabetes" + salvar → Alert de sucesso
```

**Commit:** `feat(perfil): seção de perfil de saúde com ano de nascimento e condições`

---

## Task 9: Atualizar _layout.tsx — handler de notificações no boot

**File:** `src/app/_layout.tsx`

**Implementation:**
```typescript
import { Platform } from "react-native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { ActivityIndicator, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { AuthProvider, useAuth } from "@/stores/use-auth";
import { TemaProvider, useTema } from "@/theme/tema";
import { LocalizacaoProvider } from "@/stores/use-localizacao";
import { FavoritosProvider } from "@/stores/use-favoritos";
import { PreferenciasProvider } from "@/stores/use-preferencias";

// Configurar handler antes de qualquer renderização
if (Platform.OS !== "web") {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const Notifications = require("expo-notifications");
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: false,
      shouldSetBadge: false,
    }),
  });
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      retry: 2,
    },
  },
});

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryClientProvider client={queryClient}>
        <PreferenciasProvider>
          <AuthProvider>
            <LocalizacaoProvider>
              <FavoritosProvider>
                <TemaProvider>
                  <Chrome />
                </TemaProvider>
              </FavoritosProvider>
            </LocalizacaoProvider>
          </AuthProvider>
        </PreferenciasProvider>
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}

function Chrome() {
  const { cores } = useTema();
  const { session, loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: cores.paper }}>
        <ActivityIndicator size="large" color={cores.verde} />
      </View>
    );
  }

  return (
    <>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: cores.paper },
        }}
      >
        <Stack.Screen name="login" redirect={!!session} />
        <Stack.Screen name="(tabs)" redirect={!session} />
        <Stack.Screen
          name="servico/[id]"
          options={{
            headerShown: true,
            title: "Serviço",
            headerTintColor: cores.verde,
            headerStyle: { backgroundColor: cores.paper },
            headerShadowVisible: false,
          }}
        />
      </Stack>
    </>
  );
}
```

**Verification:**
```bash
cd conecta-sus-app && npx tsc --noEmit
# Esperado: 0 erros
# App inicia sem crash
```

**Commit:** `feat(layout): configura handler de notificações no boot da app`

---

## Task 10: Hook useGamificacao — pontos, badges e total de confirmações

**File:** `src/lib/queries/use-gamificacao.ts`

**Implementation:**
```typescript
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/stores/use-auth";
import type { BadgeUsuario, GamificacaoData } from "@/types/models";

export function useGamificacao() {
  const { session } = useAuth();
  const uid = session?.user.id;

  return useQuery({
    queryKey: ["gamificacao", uid],
    enabled: !!uid,
    queryFn: async (): Promise<GamificacaoData> => {
      const [perfisRes, badgesRes, ubRes, confRes] = await Promise.all([
        supabase
          .from("perfis")
          .select("pontos")
          .eq("id", uid!)
          .single(),
        supabase
          .from("badges")
          .select("slug, nome, descricao, icone, pontos_necessarios"),
        supabase
          .from("usuario_badges")
          .select("badge_slug, conquistado_em")
          .eq("usuario_id", uid!),
        supabase
          .from("confirmacoes")
          .select("id", { count: "exact", head: true })
          .eq("usuario_id", uid!),
      ]);

      const pontos = perfisRes.data?.pontos ?? 0;
      const allBadges = badgesRes.data ?? [];
      const earned = ubRes.data ?? [];
      const total_confirmacoes = confRes.count ?? 0;

      const badges: BadgeUsuario[] = allBadges.map((b) => {
        const e = earned.find((x) => x.badge_slug === b.slug);
        return {
          ...b,
          conquistado: !!e,
          conquistado_em: e?.conquistado_em ?? null,
        };
      });

      return { pontos, total_confirmacoes, badges };
    },
  });
}
```

**Verification:**
```bash
cd conecta-sus-app && npx tsc --noEmit
```

**Commit:** `feat(gamificacao): hook useGamificacao com pontos, badges e contagem de confirmações`

---

## Task 11: Hook useConfirmacoesEstab — stats comunitárias por estabelecimento

**File:** `src/lib/queries/use-confirmacoes-estab.ts`

**Implementation:**
```typescript
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { EstatConfirmacoes, StatusConfirmacao } from "@/types/models";

export function useConfirmacoesEstab(estabelecimentoId: number) {
  return useQuery({
    queryKey: ["confirmacoes", estabelecimentoId],
    queryFn: async (): Promise<EstatConfirmacoes> => {
      const { data, error } = await supabase
        .from("confirmacoes")
        .select("status")
        .eq("estabelecimento_id", estabelecimentoId);
      if (error) throw error;

      const counts = { funciona: 0, fechou: 0, mudou: 0 };
      for (const c of data ?? []) {
        counts[c.status as StatusConfirmacao]++;
      }
      const total = counts.funciona + counts.fechou + counts.mudou;

      let status_dominante: StatusConfirmacao | null = null;
      if (total > 0) {
        status_dominante = (
          Object.entries(counts) as [StatusConfirmacao, number][]
        ).reduce((a, b) => (a[1] >= b[1] ? a : b))[0];
      }

      return { total, ...counts, status_dominante };
    },
  });
}
```

**Verification:**
```bash
cd conecta-sus-app && npx tsc --noEmit
```

**Commit:** `feat(confirmacoes): hook useConfirmacoesEstab para stats comunitárias`

---

## Task 12: Atualizar useConfirmar — passa usuario_id e chama verificar_badges

**File:** `src/lib/queries/use-confirmar.ts`

**Implementation:**
```typescript
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/stores/use-auth";
import type { StatusConfirmacao } from "@/types/models";

type ConfirmarInput = {
  estabelecimentoId: number;
  status: StatusConfirmacao;
};

export function useConfirmar() {
  const { session } = useAuth();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ estabelecimentoId, status }: ConfirmarInput) => {
      const payload: Record<string, unknown> = {
        estabelecimento_id: estabelecimentoId,
        status,
      };
      if (session?.user.id) {
        payload.usuario_id = session.user.id;
      }

      const { error } = await supabase.from("confirmacoes").insert(payload);
      if (error) throw error;

      // Verificar e conceder badges (apenas se autenticado)
      if (session?.user.id) {
        await supabase.rpc("verificar_badges", { uid: session.user.id });
      }
    },
    onSuccess: (_, { estabelecimentoId }) => {
      qc.invalidateQueries({ queryKey: ["confirmacoes", estabelecimentoId] });
      if (session?.user.id) {
        qc.invalidateQueries({ queryKey: ["gamificacao", session.user.id] });
      }
    },
  });
}
```

**Verification:**
```bash
cd conecta-sus-app && npx tsc --noEmit
# Confirmar um serviço → pontos em perfis aumenta 10 (verificar no Studio)
# Após 1ª confirmação → badge 'primeira-confirmacao' aparece em usuario_badges
```

**Commit:** `feat(confirmacoes): passa usuario_id e aciona verificar_badges após confirmar`

---

## Task 13: Seção "Minhas Contribuições" em perfil.tsx

**File:** `src/app/(tabs)/perfil.tsx`

Adicionar após a seção "Meu Perfil de Saúde" (após o `btnSalvar`) e antes da seção "Acessibilidade":

**Inserir este import** no topo (junto com os outros):
```typescript
import { useGamificacao } from "@/lib/queries/use-gamificacao";
```

**Adicionar chamada do hook** dentro de `PerfilScreen`, junto aos outros hooks:
```typescript
const { data: gamificacao } = useGamificacao();
```

**Adicionar o JSX** da seção de contribuições após o `btnSalvar` e antes da seção "Acessibilidade":
```typescript
{/* ── Minhas Contribuições ── */}
{session && gamificacao && (
  <>
    <Texto style={styles.secao}>Minhas Contribuições</Texto>
    <View style={styles.grupo}>
      <View style={[styles.linha, { justifyContent: "space-between" }]}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
          <Ionicons name="star" size={20} color={cores.amber} />
          <Texto style={styles.linhaTexto}>{gamificacao.pontos} pontos</Texto>
        </View>
        <Texto style={[styles.linhaTexto, { color: cores.inkSoft }]}>
          {gamificacao.total_confirmacoes} confirmações
        </Texto>
      </View>
    </View>

    <View style={styles.badgesGrid}>
      {gamificacao.badges.map((badge) => (
        <View
          key={badge.slug}
          style={[
            styles.badgeCard,
            !badge.conquistado && { opacity: 0.4 },
          ]}
        >
          <View style={[
            styles.badgeIconWrap,
            badge.conquistado && { backgroundColor: cores.amber + "22" },
          ]}>
            <Ionicons
              name={badge.icone as never}
              size={22}
              color={badge.conquistado ? cores.amber : cores.inkFaint}
            />
            {badge.conquistado && (
              <View style={styles.badgeCheck}>
                <Ionicons name="checkmark" size={10} color="#ffffff" />
              </View>
            )}
          </View>
          <Texto style={styles.badgeNome} numberOfLines={2}>{badge.nome}</Texto>
        </View>
      ))}
    </View>
  </>
)}
```

**Adicionar estilos** ao `makeStyles`:
```typescript
badgesGrid: {
  flexDirection: "row",
  flexWrap: "wrap",
  gap: 10,
},
badgeCard: {
  width: "30%",
  alignItems: "center",
  gap: 6,
  padding: 12,
  backgroundColor: cores.card,
  borderWidth: 1,
  borderColor: cores.line,
  borderRadius: 16,
},
badgeIconWrap: {
  width: 48,
  height: 48,
  borderRadius: 14,
  alignItems: "center",
  justifyContent: "center",
  backgroundColor: cores.paper,
  position: "relative",
},
badgeCheck: {
  position: "absolute",
  bottom: -2,
  right: -2,
  width: 16,
  height: 16,
  borderRadius: 8,
  backgroundColor: cores.verde,
  alignItems: "center",
  justifyContent: "center",
},
badgeNome: {
  fontSize: 11,
  fontWeight: "600",
  color: cores.ink,
  textAlign: "center",
  lineHeight: 15,
},
```

**Verification:**
```bash
cd conecta-sus-app && npx tsc --noEmit
# No app, aba Perfil: seção "Minhas Contribuições" mostra pontos, contagem e grid de badges
# Badges não conquistados aparecem acinzentados (opacity 0.4)
# Badges conquistados têm checkmark verde
```

**Commit:** `feat(perfil): seção Minhas Contribuições com pontos e grid de badges`

---

## Task 14: Stats comunitárias e toast de pontos em servico/[id].tsx

**File:** `src/app/servico/[id].tsx`

**Implementation:**

Replace the entire file:

```typescript
import { useRef, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import { Texto } from "@/components/texto";
import { useTema } from "@/theme/tema";
import type { Cores } from "@/theme/colors";
import { useServico } from "@/lib/queries/use-servico";
import { useConfirmar } from "@/lib/queries/use-confirmar";
import { useConfirmacoesEstab } from "@/lib/queries/use-confirmacoes-estab";
import { useFavoritos } from "@/stores/use-favoritos";
import { useAuth } from "@/stores/use-auth";
import { telParaLink } from "@/utils/format";
import type { StatusConfirmacao } from "@/types/models";

const STATUS_COR: Record<StatusConfirmacao, string> = {
  funciona: "#0d6a51",
  fechou:   "#d65a3c",
  mudou:    "#e0a23f",
};

const STATUS_LABEL: Record<StatusConfirmacao, string> = {
  funciona: "✓ Funcionando",
  fechou:   "✗ Fechado",
  mudou:    "⚠ Mudou",
};

export default function ServicoDetalhe() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const servicoId = Number(id);
  const { data: servico, isLoading, isError } = useServico(servicoId);

  const { itens: itensSalvos, alternar: alternarSalvo } = useFavoritos();
  const salvo = itensSalvos.some((i) => i.id === servicoId);

  const { session } = useAuth();
  const confirmarMutation = useConfirmar();
  const { data: stats } = useConfirmacoesEstab(servicoId);

  const { cores } = useTema();
  const styles = useMemo(() => makeStyles(cores), [cores]);

  // Toast "+10 pontos" após confirmação autenticada
  const toastAnim = useRef(new Animated.Value(0)).current;
  const [toastVisivel, setToastVisivel] = useState(false);

  function mostrarToast() {
    setToastVisivel(true);
    toastAnim.setValue(0);
    Animated.sequence([
      Animated.timing(toastAnim, { toValue: 1, duration: 250, useNativeDriver: true }),
      Animated.delay(1600),
      Animated.timing(toastAnim, { toValue: 0, duration: 250, useNativeDriver: true }),
    ]).start(() => setToastVisivel(false));
  }

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={cores.verde} />
      </View>
    );
  }

  if (isError || !servico) {
    return (
      <View style={styles.center}>
        <Ionicons name="alert-circle-outline" size={36} color={cores.inkFaint} />
        <Texto style={styles.estadoTexto}>
          Não foi possível carregar o serviço.
        </Texto>
      </View>
    );
  }

  function ligar() {
    if (servico?.telefone) {
      Linking.openURL(`tel:${telParaLink(servico.telefone)}`);
    }
  }

  function comoChegar() {
    if (!servico) return;
    const destino =
      servico.lat != null && servico.lng != null
        ? `${servico.lat},${servico.lng}`
        : encodeURIComponent(servico.endereco ?? servico.nome);
    Linking.openURL(
      `https://www.google.com/maps/search/?api=1&query=${destino}`
    );
  }

  function confirmar(status: StatusConfirmacao) {
    if (confirmarMutation.isPending) return;
    const msg: Record<StatusConfirmacao, string> = {
      funciona: "Obrigado! Você ajudou a próxima pessoa.",
      fechou:   "Valeu pelo aviso. Vamos revisar este serviço.",
      mudou:    "Obrigado! Vamos atualizar as informações.",
    };
    confirmarMutation.mutate(
      { estabelecimentoId: servicoId, status },
      {
        onSuccess: () => {
          Alert.alert("Conecta SUS", msg[status]);
          if (session?.user.id) mostrarToast();
        },
        onError: () =>
          Alert.alert(
            "Conecta SUS",
            "Não foi possível registrar agora. Verifique a conexão e tente de novo."
          ),
      }
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.topo}>
          <View style={styles.iconWrap}>
            <Ionicons name="medkit" size={28} color={cores.verde} />
          </View>
          <Pressable
            onPress={async () =>
              await alternarSalvo({
                id: servicoId,
                nome: servico.nome,
                endereco: servico.endereco,
                horario: servico.horario,
              })
            }
            accessibilityRole="button"
            accessibilityLabel={salvo ? "Remover dos salvos" : "Salvar serviço"}
            hitSlop={10}
            style={({ pressed }) => [styles.bookmark, pressed && { opacity: 0.7 }]}
          >
            <Ionicons
              name={salvo ? "bookmark" : "bookmark-outline"}
              size={26}
              color={cores.verde}
            />
          </Pressable>
        </View>

        <Texto style={styles.nome}>{servico.nome}</Texto>
        {servico.tipo ? <Texto style={styles.tipo}>{servico.tipo}</Texto> : null}

        {/* ── Stats comunitárias ── */}
        {stats && stats.total > 0 && (
          <View style={[
            styles.statsBand,
            stats.status_dominante
              ? { borderLeftColor: STATUS_COR[stats.status_dominante], borderLeftWidth: 3 }
              : null,
          ]}>
            <Ionicons name="people" size={16} color={cores.inkSoft} />
            <Texto style={styles.statsTexto}>
              <Texto style={{ fontWeight: "700" }}>{stats.total}</Texto>
              {" "}validaçõe{stats.total > 1 ? "s" : "o"} da comunidade
              {stats.status_dominante
                ? ` · ${STATUS_LABEL[stats.status_dominante]}`
                : ""}
            </Texto>
          </View>
        )}

        {/* ── Ações principais ── */}
        <View style={styles.acoes}>
          <AcaoBotao icone="navigate" rotulo="Como chegar" destaque onPress={comoChegar} />
          {servico.telefone ? (
            <AcaoBotao icone="call" rotulo="Ligar" onPress={ligar} />
          ) : null}
        </View>

        {/* ── Informações ── */}
        <View style={styles.bloco}>
          {servico.endereco ? (
            <LinhaInfo icone="location-outline" rotulo={servico.endereco} />
          ) : null}
          {servico.horario ? (
            <LinhaInfo icone="time-outline" rotulo={servico.horario} />
          ) : null}
          {servico.telefone ? (
            <LinhaInfo icone="call-outline" rotulo={servico.telefone} />
          ) : null}
        </View>

        {/* ── Validação comunitária ── */}
        <View style={styles.gamificacaoCabecalho}>
          <Ionicons name="people-circle" size={24} color={cores.verde} />
          <View style={{ flex: 1 }}>
            <Texto style={styles.secao}>Ajude sua comunidade</Texto>
            <Texto style={styles.subSecao}>
              Você esteve aqui recentemente? Confirme se o serviço está funcionando e ajude outras
              pessoas.
            </Texto>
          </View>
        </View>
        <View style={styles.validacao}>
          <ValidaBotao
            icone="checkmark-circle-outline"
            rotulo="Funciona"
            cor={cores.verde}
            onPress={() => confirmar("funciona")}
          />
          <ValidaBotao
            icone="close-circle-outline"
            rotulo="Fechou"
            cor={cores.coral}
            onPress={() => confirmar("fechou")}
          />
          <ValidaBotao
            icone="swap-horizontal-outline"
            rotulo="Mudou"
            cor={cores.amber}
            onPress={() => confirmar("mudou")}
          />
        </View>
      </ScrollView>

      {/* ── Toast de pontos ── */}
      {toastVisivel && (
        <Animated.View
          style={[
            styles.toast,
            {
              opacity: toastAnim,
              transform: [
                {
                  translateY: toastAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [16, 0],
                  }),
                },
              ],
            },
          ]}
          pointerEvents="none"
        >
          <Ionicons name="star" size={16} color={cores.amber} />
          <Texto style={styles.toastTexto}>+10 pontos ganhos!</Texto>
        </Animated.View>
      )}
    </View>
  );
}

function AcaoBotao({
  icone, rotulo, onPress, destaque,
}: {
  icone: string; rotulo: string; onPress: () => void; destaque?: boolean;
}) {
  const { cores } = useTema();
  const styles = useMemo(() => makeStyles(cores), [cores]);
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={rotulo}
      style={({ pressed }) => [
        styles.acao,
        destaque ? styles.acaoDestaque : styles.acaoSecundaria,
        pressed && { opacity: 0.8 },
      ]}
    >
      <Ionicons name={icone as never} size={20} color={destaque ? cores.paperSoft : cores.verde} />
      <Texto style={[styles.acaoTexto, destaque && { color: cores.paperSoft }]}>{rotulo}</Texto>
    </Pressable>
  );
}

function LinhaInfo({ icone, rotulo }: { icone: string; rotulo: string }) {
  const { cores } = useTema();
  const styles = useMemo(() => makeStyles(cores), [cores]);
  return (
    <View style={styles.linha}>
      <Ionicons name={icone as never} size={20} color={cores.verde} />
      <Texto style={styles.linhaTexto}>{rotulo}</Texto>
    </View>
  );
}

function ValidaBotao({
  icone, rotulo, cor, onPress,
}: {
  icone: string; rotulo: string; cor: string; onPress: () => void;
}) {
  const { cores } = useTema();
  const styles = useMemo(() => makeStyles(cores), [cores]);
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={rotulo}
      style={({ pressed }) => [styles.valida, pressed && { opacity: 0.8 }]}
    >
      <Ionicons name={icone as never} size={22} color={cor} />
      <Texto style={styles.validaTexto}>{rotulo}</Texto>
    </Pressable>
  );
}

const makeStyles = (cores: Cores) =>
  StyleSheet.create({
    center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12, padding: 40 },
    estadoTexto: { fontSize: 15, color: cores.inkSoft, textAlign: "center" },
    scroll: { padding: 20, gap: 16 },
    topo: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
    iconWrap: {
      width: 60, height: 60, borderRadius: 20,
      alignItems: "center", justifyContent: "center",
      backgroundColor: cores.verdeWash,
    },
    bookmark: {
      width: 44, height: 44, borderRadius: 14,
      alignItems: "center", justifyContent: "center",
      backgroundColor: cores.card, borderWidth: 1, borderColor: cores.line,
    },
    nome: { fontSize: 24, fontWeight: "800", color: cores.ink },
    tipo: { fontSize: 15, color: cores.inkSoft, marginTop: -8 },
    statsBand: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      backgroundColor: cores.card,
      borderWidth: 1,
      borderColor: cores.line,
      borderRadius: 12,
      paddingHorizontal: 14,
      paddingVertical: 10,
    },
    statsTexto: { fontSize: 13, color: cores.inkSoft, flex: 1 },
    acoes: { flexDirection: "row", gap: 12 },
    acao: {
      flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center",
      gap: 8, borderRadius: 16, paddingVertical: 14,
    },
    acaoDestaque: { backgroundColor: cores.verde },
    acaoSecundaria: { backgroundColor: cores.card, borderWidth: 1, borderColor: cores.line },
    acaoTexto: { fontSize: 15, fontWeight: "700", color: cores.verde },
    bloco: {
      backgroundColor: cores.card, borderWidth: 1, borderColor: cores.line,
      borderRadius: 18, overflow: "hidden",
    },
    linha: {
      flexDirection: "row", alignItems: "center", gap: 14,
      paddingHorizontal: 16, paddingVertical: 16,
      borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: cores.line,
    },
    linhaTexto: { flex: 1, fontSize: 15, color: cores.ink },
    gamificacaoCabecalho: {
      flexDirection: "row", alignItems: "center", gap: 12, marginTop: 8,
      backgroundColor: cores.verdeWash, padding: 16, borderRadius: 16,
    },
    secao: { fontSize: 14, fontWeight: "800", color: cores.verdeDeep, letterSpacing: 0.5 },
    subSecao: { fontSize: 13, color: cores.inkSoft, marginTop: 2, lineHeight: 18 },
    validacao: { flexDirection: "row", gap: 10 },
    valida: {
      flex: 1, alignItems: "center", gap: 6,
      backgroundColor: cores.card, borderWidth: 1, borderColor: cores.line,
      borderRadius: 16, paddingVertical: 16,
    },
    validaTexto: { fontSize: 13, fontWeight: "600", color: cores.ink },
    toast: {
      position: "absolute",
      bottom: 32,
      alignSelf: "center",
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      backgroundColor: cores.ink,
      paddingHorizontal: 18,
      paddingVertical: 12,
      borderRadius: 24,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.2,
      shadowRadius: 8,
      elevation: 8,
    },
    toastTexto: { fontSize: 14, fontWeight: "700", color: "#ffffff" },
  });
```

**Verification:**
```bash
cd conecta-sus-app && npx tsc --noEmit
# Esperado: 0 erros
# No app:
# - Detalhe de serviço com confirmações existentes → mostra banda de stats (ex: "3 validações da comunidade · ✓ Funcionando")
# - Confirmar um serviço estando logado → Alert de sucesso + toast "+10 pontos ganhos!" aparece e desaparece
# - Confirmar sem login → Alert de sucesso, sem toast (comportamento correto)
```

**Commit:** `feat(servico): stats comunitárias e toast de pontos após confirmação`

---

## Checklist de conclusão

- [ ] Migrations 0003 e 0004 aplicadas em Supabase (ref: eydegpjzlxuxttzoinnh)
- [ ] `npx tsc --noEmit` sem erros
- [ ] Busca semântica: "meu filho chora muito" → retorna CAPS com badge "Mostrando por: psicólogo"
- [ ] Estado vazio: termo sem resultado → mostra 4 chips de sugestões clicáveis
- [ ] Perfil de saúde: salvar ano 1960 → alerta "Fraldas Geriátricas" aparece ativado
- [ ] Notificação local: no dispositivo físico/emulador com perfil salvo → notificação de sistema aparece
- [ ] Gamificação: confirmar serviço logado → pontos +10 no Supabase Studio
- [ ] Gamificação: 1ª confirmação → badge 'primeira-confirmacao' em usuario_badges
- [ ] Toast: "+10 pontos ganhos!" aparece e some após confirmar (só quando logado)
- [ ] Stats: detalhe de serviço com confirmações existentes → mostra contagem correta
