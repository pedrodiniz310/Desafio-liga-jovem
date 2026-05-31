# Conecta SUS: Onboarding de Persona + Modo Descoberta + Jornada Guiada

> **For agentic workers:** REQUIRED SUB-SKILL: Use `subagent-driven-development` or `executing-plans`.
> **OBRIGATÓRIO:** Antes de qualquer código Expo/RN, leia https://docs.expo.dev/versions/v56.0.0/

**Goal:** Implementar três features de alto impacto para o pitch do Desafio Liga Jovem: onboarding que personaliza a experiência por perfil de busca, aba "Descobrir" com cards tipo stories revelando serviços desconhecidos, e jornadas guiadas passo-a-passo por situação de vida.

**Architecture:** (A) `use-persona` store (AsyncStorage + Context) + tela `onboarding.tsx` com redirect via `Stack.Screen redirect` prop; (B) RPC `buscar_descobertas` + aba `descobrir.tsx` com FlatList `snapToInterval` fullscreen; (C) tabela `jornadas` (JSONB passos) + `jornada/[slug].tsx` + checklist persistido em AsyncStorage + seção "Está passando por isso?" no index com `SituacaoCard`.

**Tech Stack:** Expo Router 6.0, React Native 0.81, TypeScript, Supabase PostGIS, React Query v5, AsyncStorage

---

## Task 1: Migration 0005 — descoberta_texto + tabela jornadas + RPC buscar_descobertas

**File:** `supabase/migrations/0005_descoberta_jornadas.sql`

**Test:**
```
Aplicar via Supabase MCP ou dashboard. Verificar:
- SELECT column_name FROM information_schema.columns WHERE table_name='necessidades' AND column_name='descoberta_texto';
- SELECT table_name FROM information_schema.tables WHERE table_name='jornadas';
- SELECT * FROM buscar_descobertas(-27.1768, -51.5052) LIMIT 3; -- retorna linhas após seed
```

**Implementation:**
```sql
-- ============================================================
-- Migration 0005: descoberta_texto, jornadas e buscar_descobertas
-- ============================================================

-- Coluna de texto emocional para o Modo Descoberta
alter table necessidades add column if not exists descoberta_texto text;

-- Tabela de jornadas guiadas
create table if not exists jornadas (
  id        bigint primary key generated always as identity,
  slug      text unique not null,
  titulo    text not null,
  descricao text not null,
  icone     text not null,
  cor       text not null,   -- hex p/ fundo do card (ex: '#f8e6dd')
  passos    jsonb not null default '[]',
  -- cada passo: {ordem:int, servico_codigo:text, titulo_passo:text, por_que_importa:text}
  ativo     boolean default true
);

alter table jornadas enable row level security;
drop policy if exists "jornadas publico" on jornadas;
create policy "jornadas publico" on jornadas for select using (ativo = true);
grant select on jornadas to anon, authenticated;

-- RPC: retorna 1 estabelecimento por tipo de serviço "descobrível" no raio
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
  estabelecimento_id   bigint,
  nome_estabelecimento text,
  endereco             text,
  distancia_metros     double precision
)
language sql stable as $$
  with ponto as (
    select st_setsrid(st_makepoint(lng, lat), 4326)::geography as g
  ),
  candidatos as (
    select distinct on (n.servico_codigo)
      n.id                          as necessidade_id,
      n.slug,
      n.descoberta_texto,
      n.icone,
      e.id                          as estabelecimento_id,
      e.nome                        as nome_estabelecimento,
      e.endereco,
      st_distance(e.localizacao, (select g from ponto)) as distancia_metros
    from necessidades n
    join estabelecimento_servicos es on es.servico_codigo = n.servico_codigo
    join estabelecimentos e on e.id = es.estabelecimento_id
    where n.descoberta_texto is not null
      and n.ativo
      and e.ativo
      and e.localizacao is not null
      and st_dwithin(e.localizacao, (select g from ponto), raio_metros)
    order by n.servico_codigo,
             st_distance(e.localizacao, (select g from ponto))
  )
  select * from candidatos
  order by distancia_metros
  limit 10;
$$;

grant execute on function buscar_descobertas(double precision, double precision, int)
  to anon, authenticated;
```

**Verification:**
```bash
# Aplicar via MCP execute_sql ou supabase dashboard
# Depois verificar com:
# SELECT descoberta_texto FROM necessidades LIMIT 1; -- coluna existe (NULL OK antes do seed)
# SELECT id, slug FROM jornadas LIMIT 1; -- tabela existe (vazia OK)
```

**Commit:** `feat(db): descoberta_texto em necessidades, tabela jornadas e RPC buscar_descobertas`

---

## Task 2: Seed 0006 — descoberta_texto em necessidades + 3 jornadas completas

**File:** `supabase/migrations/0006_seed_descoberta_jornadas.sql`

**Implementation:**
```sql
-- ============================================================
-- Migration 0006: seed de descobertas e jornadas
-- ============================================================

-- descoberta_texto para necessidades existentes
update necessidades set descoberta_texto =
  'O SUS tem PSICÓLOGO GRATUITO para você e sua família no CAPS'
  where slug = 'psicologo';

update necessidades set descoberta_texto =
  'Canal, extração e dentadura? Tudo GRATUITO no CEO mais próximo'
  where slug = 'dentista';

update necessidades set descoberta_texto =
  'Insulina, anti-hipertensivo e mais: REMÉDIOS GRÁTIS na Farmácia Popular'
  where slug = 'remedio-gratis';

update necessidades set descoberta_texto =
  'Seu filho tem direito a FONOAUDIÓLOGO GRATUITO se apresentar dificuldade de fala'
  where slug = 'fonoaudiologo';

update necessidades set descoberta_texto =
  'Fisioterapia após AVC ou lesão é 100% GRATUITA no CER mais próximo'
  where slug = 'fisioterapia';

-- 3 jornadas completas
insert into jornadas (slug, titulo, descricao, icone, cor, passos) values
(
  'gravidez',
  'Estou grávida',
  'Tudo que o SUS oferece para uma gestação saudável e segura, sem custo.',
  'heart-outline',
  '#f8e6dd',
  '[
    {"ordem":1,"servico_codigo":"prenatal","titulo_passo":"Cadastre no pré-natal","por_que_importa":"Acompanhamento desde a 1ª semana protege você e o bebê. É gratuito na UBS mais próxima."},
    {"ordem":2,"servico_codigo":"vacina","titulo_passo":"Atualize as vacinas","por_que_importa":"Vacinas como hepatite B e tétano são obrigatórias na gestação e protegem o recém-nascido."},
    {"ordem":3,"servico_codigo":"atencao_basica","titulo_passo":"Agende exames de rotina","por_que_importa":"Hemograma, glicemia e ultrassom são gratuitos pelo SUS durante o pré-natal."},
    {"ordem":4,"servico_codigo":"farmacia","titulo_passo":"Retire ácido fólico e ferro","por_que_importa":"Esses suplementos são distribuídos gratuitamente na Farmácia Popular para gestantes."}
  ]'::jsonb
),
(
  'diabetes',
  'Tenho diabetes',
  'O SUS oferece todo o suporte para controlar o diabetes sem nenhum custo.',
  'medical-outline',
  '#e2efe8',
  '[
    {"ordem":1,"servico_codigo":"atencao_basica","titulo_passo":"Cadastre-se na UBS","por_que_importa":"A UBS acompanha diabéticos com consultas regulares, exames e orientação nutricional gratuita."},
    {"ordem":2,"servico_codigo":"farmacia","titulo_passo":"Retire insulina e medicamentos","por_que_importa":"Insulina, metformina e glibenclamida são gratuitos na Farmácia Popular com receita médica."},
    {"ordem":3,"servico_codigo":"saude_mental","titulo_passo":"Cuide da saúde mental","por_que_importa":"Diabetes pode causar ansiedade e depressão. O CAPS oferece apoio psicológico gratuito."}
  ]'::jsonb
),
(
  'cuidador-idoso',
  'Cuido de idoso em casa',
  'Direitos e serviços gratuitos para quem cuida de um familiar idoso.',
  'people-outline',
  '#fef3e2',
  '[
    {"ordem":1,"servico_codigo":"atencao_basica","titulo_passo":"Cadastre o idoso na UBS","por_que_importa":"A UBS faz visitas domiciliares e acompanhamento regular para idosos com dificuldade de locomoção."},
    {"ordem":2,"servico_codigo":"farmacia","titulo_passo":"Retire fraldas geriátricas","por_que_importa":"Idosos com incontinência têm direito a fraldas geriátricas gratuitas na Farmácia Popular com receita."},
    {"ordem":3,"servico_codigo":"reabilitacao","titulo_passo":"Acesse fisioterapia gratuita","por_que_importa":"O CER oferece fisioterapia e terapia ocupacional que melhoram a mobilidade do idoso."},
    {"ordem":4,"servico_codigo":"saude_mental","titulo_passo":"Apoio para o cuidador","por_que_importa":"Cuidar cansa. O CAPS tem grupos de apoio gratuitos para cuidadores de idosos."}
  ]'::jsonb
)
on conflict (slug) do nothing;
```

**Verification:**
```sql
-- Verificar no Studio:
SELECT slug, descoberta_texto FROM necessidades WHERE descoberta_texto IS NOT NULL;
-- Esperado: 5 linhas

SELECT slug, titulo, jsonb_array_length(passos) as num_passos FROM jornadas;
-- Esperado: gravidez(4), diabetes(3), cuidador-idoso(4)
```

**Commit:** `feat(db): seed descoberta_texto e 3 jornadas guiadas completas`

---

## Task 3: Store use-persona.tsx — contexto de persona de busca

**File:** `src/stores/use-persona.tsx`

**Test:**
```typescript
// Não há unit test. Verificar via tsc --noEmit e fluxo manual.
```

**Implementation:**
```typescript
import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  type ReactNode,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

export type PersonaSlug = "eu_mesmo" | "meu_filho" | "mae_pai" | "familia";

export interface PersonaConfig {
  slug: PersonaSlug;
  rotulo: string;
  emoji: string;
  tituloBusca: string;   // texto do hero band (pode ter \n)
  placeholder: string;   // placeholder do TextInput de busca
}

export const PERSONAS: PersonaConfig[] = [
  {
    slug: "eu_mesmo",
    rotulo: "Eu mesmo",
    emoji: "🙋",
    tituloBusca: "O que você\nprecisa?",
    placeholder: "Ex.: preciso de psicólogo",
  },
  {
    slug: "meu_filho",
    rotulo: "Meu filho",
    emoji: "👶",
    tituloBusca: "O que seu filho\nprecisa?",
    placeholder: "Ex.: meu filho não fala, chora muito...",
  },
  {
    slug: "mae_pai",
    rotulo: "Minha mãe/pai",
    emoji: "👵",
    tituloBusca: "O que sua mãe ou\npai precisa?",
    placeholder: "Ex.: fraldas geriátricas, fisioterapia",
  },
  {
    slug: "familia",
    rotulo: "Minha família",
    emoji: "👨‍👩‍👧",
    tituloBusca: "O que sua família\nprecisa?",
    placeholder: "Ex.: dentista, vacina, psicólogo",
  },
];

const DEFAULT_PERSONA = PERSONAS[0]; // eu_mesmo

type PersonaState = {
  persona: PersonaSlug | null;
  personaConfig: PersonaConfig;
  carregado: boolean;
  setPersona: (slug: PersonaSlug) => Promise<void>;
};

const PersonaContext = createContext<PersonaState | undefined>(undefined);
const STORAGE_KEY = "@conecta_sus_persona";

export function PersonaProvider({ children }: { children: ReactNode }) {
  const [persona, setPersonaState] = useState<PersonaSlug | null>(null);
  const [carregado, setCarregado] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const data = await AsyncStorage.getItem(STORAGE_KEY);
        if (data) setPersonaState(data as PersonaSlug);
      } catch {
        // silent — falha no carregamento mantém persona null
      }
      setCarregado(true);
    })();
  }, []);

  const setPersona = useCallback(async (slug: PersonaSlug) => {
    setPersonaState(slug);
    try {
      await AsyncStorage.setItem(STORAGE_KEY, slug);
    } catch {
      // silent
    }
  }, []);

  const personaConfig =
    (persona ? PERSONAS.find((p) => p.slug === persona) : undefined) ??
    DEFAULT_PERSONA;

  return (
    <PersonaContext.Provider value={{ persona, personaConfig, carregado, setPersona }}>
      {children}
    </PersonaContext.Provider>
  );
}

export function usePersona(): PersonaState {
  const ctx = useContext(PersonaContext);
  if (!ctx) throw new Error("usePersona must be used inside PersonaProvider");
  return ctx;
}
```

**Verification:**
```bash
cd conecta-sus-app && npx tsc --noEmit
# Esperado: 0 erros
```

**Commit:** `feat(persona): store use-persona com AsyncStorage e 4 configurações`

---

## Task 4: Tela src/app/onboarding.tsx

**File:** `src/app/onboarding.tsx`

**Implementation:**
```typescript
import { useMemo } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import { Screen } from "@/components/screen";
import { Texto } from "@/components/texto";
import { PERSONAS, usePersona, type PersonaSlug } from "@/stores/use-persona";
import { useTema } from "@/theme/tema";
import type { Cores } from "@/theme/colors";

export default function OnboardingScreen() {
  const router = useRouter();
  const { setPersona } = usePersona();
  const { cores } = useTema();
  const styles = useMemo(() => makeStyles(cores), [cores]);

  async function escolher(slug: PersonaSlug) {
    await setPersona(slug);
    router.replace("/(tabs)");
  }

  function pular() {
    // Navega para tabs sem definir persona; Chrome permite porque
    // personaCarregado=true mas persona=null → redirect=(true && !persona)=true
    // Solução: ao pular, salvar persona padrão
    escolher("eu_mesmo");
  }

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={styles.logoWrap}>
            <Ionicons name="medkit" size={36} color={cores.verde} />
          </View>
          <Texto style={styles.titulo}>
            Para quem você está{"\n"}buscando saúde hoje?
          </Texto>
          <Texto style={styles.subtitulo}>
            Personalizamos os resultados para mostrar o que é mais relevante para você.
          </Texto>
        </View>

        <View style={styles.opcoes}>
          {PERSONAS.map((p) => (
            <Pressable
              key={p.slug}
              onPress={() => escolher(p.slug)}
              accessibilityRole="button"
              accessibilityLabel={p.rotulo}
              style={({ pressed }) => [styles.chip, pressed && { opacity: 0.82 }]}
            >
              <Texto style={styles.chipEmoji}>{p.emoji}</Texto>
              <View style={styles.chipTextos}>
                <Texto style={styles.chipRotulo}>{p.rotulo}</Texto>
                <Texto style={styles.chipDica}>{p.placeholder}</Texto>
              </View>
              <Ionicons name="chevron-forward" size={20} color={cores.inkFaint} />
            </Pressable>
          ))}
        </View>

        <Pressable
          onPress={pular}
          style={styles.pular}
          accessibilityRole="button"
          accessibilityLabel="Pular personalização"
        >
          <Texto style={styles.pularTexto}>Pular por agora</Texto>
        </Pressable>
      </ScrollView>
    </Screen>
  );
}

const makeStyles = (cores: Cores) =>
  StyleSheet.create({
    scroll: { padding: 28, gap: 32, flexGrow: 1, justifyContent: "center" },
    header: { gap: 14, alignItems: "center" },
    logoWrap: {
      width: 72,
      height: 72,
      borderRadius: 24,
      backgroundColor: cores.verdeWash,
      alignItems: "center",
      justifyContent: "center",
    },
    titulo: {
      fontSize: 26,
      fontWeight: "800",
      color: cores.ink,
      textAlign: "center",
      lineHeight: 34,
    },
    subtitulo: {
      fontSize: 15,
      color: cores.inkSoft,
      textAlign: "center",
      lineHeight: 22,
    },
    opcoes: { gap: 12 },
    chip: {
      flexDirection: "row",
      alignItems: "center",
      gap: 14,
      backgroundColor: cores.card,
      borderWidth: 1.5,
      borderColor: cores.line,
      borderRadius: 20,
      padding: 16,
    },
    chipEmoji: { fontSize: 26 },
    chipTextos: { flex: 1, gap: 2 },
    chipRotulo: { fontSize: 16, fontWeight: "700", color: cores.ink },
    chipDica: { fontSize: 12, color: cores.inkFaint },
    pular: { alignItems: "center", paddingVertical: 10 },
    pularTexto: { fontSize: 14, color: cores.inkFaint },
  });
```

**Verification:**
```bash
cd conecta-sus-app && npx tsc --noEmit
# Esperado: 0 erros
```

**Commit:** `feat(onboarding): tela de seleção de persona com 4 opções`

---

## Task 5: Update _layout.tsx — PersonaProvider + rotas onboarding/jornada + fix imports duplicados

**File:** `src/app/_layout.tsx`

**Implementation — reescrever o arquivo inteiro:**
```typescript
import { Platform, ActivityIndicator, View } from "react-native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { AuthProvider, useAuth } from "@/stores/use-auth";
import { TemaProvider, useTema } from "@/theme/tema";
import { LocalizacaoProvider } from "@/stores/use-localizacao";
import { FavoritosProvider } from "@/stores/use-favoritos";
import { PreferenciasProvider } from "@/stores/use-preferencias";
import { PersonaProvider, usePersona } from "@/stores/use-persona";

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
  defaultOptions: { queries: { staleTime: 1000 * 60 * 5, retry: 2 } },
});

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryClientProvider client={queryClient}>
        <PreferenciasProvider>
          <PersonaProvider>
            <AuthProvider>
              <LocalizacaoProvider>
                <FavoritosProvider>
                  <TemaProvider>
                    <Chrome />
                  </TemaProvider>
                </FavoritosProvider>
              </LocalizacaoProvider>
            </AuthProvider>
          </PersonaProvider>
        </PreferenciasProvider>
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}

function Chrome() {
  const { cores } = useTema();
  const { session, loading } = useAuth();
  const { persona, carregado: personaCarregado } = usePersona();

  // Aguarda auth E persona antes de resolver rotas
  if (loading || (session && !personaCarregado)) {
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
        {/* login: redireciona se já tem sessão */}
        <Stack.Screen name="login" redirect={!!session} />

        {/* onboarding: redireciona se sem sessão OU persona já definida */}
        <Stack.Screen
          name="onboarding"
          redirect={!session || (personaCarregado && !!persona)}
          options={{ headerShown: false }}
        />

        {/* tabs: redireciona se sem sessão OU persona não definida */}
        <Stack.Screen
          name="(tabs)"
          redirect={!session || (personaCarregado && !persona)}
        />

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

        <Stack.Screen
          name="jornada/[slug]"
          options={{
            headerShown: true,
            title: "Jornada de Cuidado",
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
# Fluxo manual:
# 1. App sem persona → aparece onboarding
# 2. Escolher persona → vai para tabs
# 3. Sair (logout) → vai para login
# 4. Login novamente → persona já salva → vai direto para tabs
```

**Commit:** `feat(layout): PersonaProvider, rotas onboarding/jornada e redirect por persona`

---

## Task 6: Novos tipos em src/types/models.ts

**File:** `src/types/models.ts`

Adicionar ao final do arquivo (após `GamificacaoData`):

**Implementation:**
```typescript
// — acrescentar ao final de src/types/models.ts —

export interface ResultadoDescoberta {
  necessidade_id: number;
  slug: string;
  descoberta_texto: string;
  icone: string | null;
  estabelecimento_id: number;
  nome_estabelecimento: string;
  endereco: string | null;
  distancia_metros: number;
}

export interface JornadaPasso {
  ordem: number;
  servico_codigo: string;
  titulo_passo: string;
  por_que_importa: string;
}

export interface Jornada {
  id: number;
  slug: string;
  titulo: string;
  descricao: string;
  icone: string;
  cor: string;        // hex, ex: '#f8e6dd'
  passos: JornadaPasso[];
  ativo: boolean;
}
```

**Verification:**
```bash
cd conecta-sus-app && npx tsc --noEmit
```

**Commit:** `feat(types): ResultadoDescoberta, JornadaPasso, Jornada`

---

## Task 7: Hook use-descoberta.ts

**File:** `src/lib/queries/use-descoberta.ts`

**Implementation:**
```typescript
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { Coordenada, ResultadoDescoberta } from "@/types/models";

export function useDescoberta(coordenada: Coordenada, raioMetros = 20000) {
  return useQuery({
    queryKey: ["descoberta", coordenada.lat, coordenada.lng, raioMetros],
    staleTime: 1000 * 60 * 15, // refresca a cada 15 min
    queryFn: async (): Promise<ResultadoDescoberta[]> => {
      const { data, error } = await supabase.rpc("buscar_descobertas", {
        lat: coordenada.lat,
        lng: coordenada.lng,
        raio_metros: raioMetros,
      });
      if (error) throw error;
      return (data ?? []) as ResultadoDescoberta[];
    },
  });
}
```

**Verification:**
```bash
cd conecta-sus-app && npx tsc --noEmit
```

**Commit:** `feat(descoberta): hook useDescoberta via RPC buscar_descobertas`

---

## Task 8: Tela src/app/(tabs)/descobrir.tsx

**File:** `src/app/(tabs)/descobrir.tsx`

**Implementation:**
```typescript
import { useMemo } from "react";
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Pressable,
  StyleSheet,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import { Texto } from "@/components/texto";
import { Screen } from "@/components/screen";
import { useTema } from "@/theme/tema";
import type { Cores } from "@/theme/colors";
import { useDescoberta } from "@/lib/queries/use-descoberta";
import { JOACABA, useLocalizacao } from "@/stores/use-localizacao";
import { formatarDistancia } from "@/utils/format";
import type { ResultadoDescoberta } from "@/types/models";

// Altura aproximada da tab bar + safe area bottom
const TAB_BAR_HEIGHT = 84;

export default function DescobrirScreen() {
  const { coordenada } = useLocalizacao();
  const coord = coordenada ?? JOACABA;
  const { data: descobertas, isLoading } = useDescoberta(coord);
  const router = useRouter();
  const { cores } = useTema();
  const styles = useMemo(() => makeStyles(cores), [cores]);

  const windowHeight = Dimensions.get("window").height;
  const cardHeight = windowHeight - TAB_BAR_HEIGHT;

  if (isLoading) {
    return (
      <Screen>
        <View style={styles.loading}>
          <ActivityIndicator color={cores.verde} size="large" />
          <Texto style={styles.loadingTexto}>
            Encontrando serviços que você não conhecia…
          </Texto>
        </View>
      </Screen>
    );
  }

  if (!descobertas || descobertas.length === 0) {
    return (
      <Screen>
        <View style={styles.loading}>
          <Ionicons name="compass-outline" size={52} color={cores.inkFaint} />
          <Texto style={styles.loadingTexto}>
            Nenhuma descoberta disponível perto de você agora.
          </Texto>
        </View>
      </Screen>
    );
  }

  return (
    <Screen topInset={false}>
      <FlatList
        data={descobertas}
        keyExtractor={(item) => String(item.necessidade_id)}
        snapToInterval={cardHeight}
        decelerationRate="fast"
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <DiscoveryCard
            item={item}
            height={cardHeight}
            onVer={() =>
              router.push({
                pathname: "/servico/[id]",
                params: { id: String(item.estabelecimento_id) },
              })
            }
          />
        )}
      />
    </Screen>
  );
}

function DiscoveryCard({
  item,
  height,
  onVer,
}: {
  item: ResultadoDescoberta;
  height: number;
  onVer: () => void;
}) {
  const { cores } = useTema();
  const styles = useMemo(() => makeStyles(cores), [cores]);

  return (
    <View style={[styles.card, { height }]}>
      <View style={styles.inner}>
        <View style={styles.topBadge}>
          <Ionicons name="sparkles" size={13} color={cores.verdeBright} />
          <Texto style={styles.badgeTexto}>Você sabia?</Texto>
        </View>

        {item.icone ? (
          <View style={styles.iconCircle}>
            <Ionicons name={item.icone as never} size={38} color="#ffffff" />
          </View>
        ) : null}

        <Texto style={styles.descobertaTexto}>{item.descoberta_texto}</Texto>

        <View style={styles.meta}>
          <Texto style={styles.nomeEstab} numberOfLines={2}>
            {item.nome_estabelecimento}
          </Texto>
          <View style={styles.distRow}>
            <Ionicons name="location" size={14} color={cores.verdeBright} />
            <Texto style={styles.dist}>
              {formatarDistancia(item.distancia_metros)}
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

        <Texto style={styles.hint}>▲ Deslize para descobrir mais</Texto>
      </View>
    </View>
  );
}

const makeStyles = (cores: Cores) =>
  StyleSheet.create({
    loading: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      gap: 16,
      padding: 40,
    },
    loadingTexto: { fontSize: 15, color: cores.inkSoft, textAlign: "center" },
    card: { backgroundColor: cores.verdeDeep, justifyContent: "center" },
    inner: { padding: 32, gap: 22, alignItems: "center" },
    topBadge: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      backgroundColor: "rgba(255,255,255,0.15)",
      paddingHorizontal: 14,
      paddingVertical: 7,
      borderRadius: 20,
    },
    badgeTexto: { fontSize: 13, fontWeight: "700", color: "#ffffff" },
    iconCircle: {
      width: 88,
      height: 88,
      borderRadius: 44,
      backgroundColor: "rgba(255,255,255,0.18)",
      alignItems: "center",
      justifyContent: "center",
    },
    descobertaTexto: {
      fontSize: 26,
      fontWeight: "900",
      color: "#ffffff",
      textAlign: "center",
      lineHeight: 34,
    },
    meta: { alignItems: "center", gap: 6 },
    nomeEstab: {
      fontSize: 15,
      fontWeight: "600",
      color: "rgba(255,255,255,0.82)",
      textAlign: "center",
    },
    distRow: { flexDirection: "row", alignItems: "center", gap: 4 },
    dist: { fontSize: 14, fontWeight: "700", color: cores.verdeBright },
    ctaBtn: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      backgroundColor: "#ffffff",
      paddingHorizontal: 28,
      paddingVertical: 15,
      borderRadius: 18,
      marginTop: 8,
    },
    ctaTexto: { fontSize: 16, fontWeight: "800", color: cores.verdeDeep },
    hint: {
      fontSize: 12,
      color: "rgba(255,255,255,0.4)",
      marginTop: 8,
    },
  });
```

**Verification:**
```bash
cd conecta-sus-app && npx tsc --noEmit
# No app: aba Descobrir mostra cards fullscreen com swipe vertical
# Card exibe descoberta_texto grande + nome estabelecimento + distância
```

**Commit:** `feat(descobrir): aba com stories verticais de serviços desconhecidos`

---

## Task 9: Update src/app/(tabs)/_layout.tsx — add aba Descobrir

**File:** `src/app/(tabs)/_layout.tsx`

**Implementation:**
```typescript
import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import { useTema } from "@/theme/tema";

export default function TabsLayout() {
  const { cores } = useTema();
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: cores.verde,
        tabBarInactiveTintColor: cores.inkFaint,
        tabBarStyle: {
          backgroundColor: cores.card,
          borderTopColor: cores.line,
        },
        tabBarLabelStyle: { fontSize: 12, fontWeight: "600" },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Buscar",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="search" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="descobrir"
        options={{
          title: "Descobrir",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="compass-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="salvos"
        options={{
          title: "Salvos",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="bookmark-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="perfil"
        options={{
          title: "Perfil",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person-outline" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
```

**Verification:**
```bash
cd conecta-sus-app && npx tsc --noEmit
# No app: bottom tab bar mostra 4 abas: Buscar | Descobrir | Salvos | Perfil
```

**Commit:** `feat(tabs): adiciona aba Descobrir com ícone compass`

---

## Task 10: Hooks use-jornadas.ts + use-jornada.ts

**File A:** `src/lib/queries/use-jornadas.ts`

**Implementation A:**
```typescript
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { Jornada } from "@/types/models";

export function useJornadas() {
  return useQuery({
    queryKey: ["jornadas"],
    staleTime: 1000 * 60 * 30,
    queryFn: async (): Promise<Jornada[]> => {
      const { data, error } = await supabase
        .from("jornadas")
        .select("*")
        .eq("ativo", true)
        .order("id");
      if (error) throw error;
      return (data ?? []) as Jornada[];
    },
  });
}
```

**File B:** `src/lib/queries/use-jornada.ts`

**Implementation B:**
```typescript
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { Jornada } from "@/types/models";

export function useJornada(slug: string) {
  return useQuery({
    queryKey: ["jornada", slug],
    staleTime: 1000 * 60 * 30,
    enabled: !!slug,
    queryFn: async (): Promise<Jornada | null> => {
      const { data, error } = await supabase
        .from("jornadas")
        .select("*")
        .eq("slug", slug)
        .eq("ativo", true)
        .single();
      if (error && error.code !== "PGRST116") throw error;
      return (data as Jornada) ?? null;
    },
  });
}
```

**Verification:**
```bash
cd conecta-sus-app && npx tsc --noEmit
```

**Commit:** `feat(jornadas): hooks useJornadas e useJornada`

---

## Task 11: Store src/stores/use-jornada-progresso.ts

**File:** `src/stores/use-jornada-progresso.ts`

**Implementation:**
```typescript
import { useState, useEffect, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Persiste quais passos (por ordem) foram marcados como concluídos.
// Uma instância por jornada/slug — não é Context, é hook local.
export function useJornadaProgresso(slug: string) {
  const [passosConcluidos, setPassosConcluidos] = useState<number[]>([]);

  const storageKey = `@conecta_sus_jornada_${slug}`;

  useEffect(() => {
    (async () => {
      try {
        const data = await AsyncStorage.getItem(storageKey);
        if (data) {
          const parsed = JSON.parse(data) as { passos_concluidos: number[] };
          setPassosConcluidos(parsed.passos_concluidos ?? []);
        }
      } catch {
        // silent
      }
    })();
  }, [storageKey]);

  const togglePasso = useCallback(
    async (ordem: number) => {
      const novos = passosConcluidos.includes(ordem)
        ? passosConcluidos.filter((o) => o !== ordem)
        : [...passosConcluidos, ordem];
      setPassosConcluidos(novos);
      try {
        await AsyncStorage.setItem(
          storageKey,
          JSON.stringify({ passos_concluidos: novos })
        );
      } catch {
        // silent
      }
    },
    [passosConcluidos, storageKey]
  );

  return { passosConcluidos, togglePasso };
}
```

**Verification:**
```bash
cd conecta-sus-app && npx tsc --noEmit
```

**Commit:** `feat(jornada): hook useJornadaProgresso com persistência em AsyncStorage`

---

## Task 12: Componente src/components/situacao-card.tsx

**File:** `src/components/situacao-card.tsx`

**Implementation:**
```typescript
import { useMemo } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { Texto } from "@/components/texto";
import { useTema } from "@/theme/tema";
import type { Cores } from "@/theme/colors";
import type { Jornada } from "@/types/models";

type Props = {
  jornada: Jornada;
  onPress: () => void;
};

export function SituacaoCard({ jornada, onPress }: Props) {
  const { cores } = useTema();
  const styles = useMemo(() => makeStyles(cores), [cores]);

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={jornada.titulo}
      style={({ pressed }) => [
        styles.card,
        { backgroundColor: jornada.cor },
        pressed && { opacity: 0.82 },
      ]}
    >
      <View style={styles.iconWrap}>
        <Ionicons name={jornada.icone as never} size={20} color={cores.verdeDeep} />
      </View>
      <Texto style={styles.titulo} numberOfLines={2}>
        {jornada.titulo}
      </Texto>
      <Texto style={styles.passos}>{jornada.passos.length} passos</Texto>
    </Pressable>
  );
}

const makeStyles = (cores: Cores) =>
  StyleSheet.create({
    card: {
      width: 136,
      padding: 14,
      borderRadius: 18,
      gap: 8,
    },
    iconWrap: {
      width: 40,
      height: 40,
      borderRadius: 12,
      backgroundColor: "rgba(255,255,255,0.55)",
      alignItems: "center",
      justifyContent: "center",
    },
    titulo: {
      fontSize: 13,
      fontWeight: "700",
      color: cores.verdeDeep,
      lineHeight: 18,
    },
    passos: {
      fontSize: 11,
      color: cores.inkSoft,
      fontWeight: "500",
    },
  });
```

**Verification:**
```bash
cd conecta-sus-app && npx tsc --noEmit
```

**Commit:** `feat(componentes): SituacaoCard para jornadas guiadas`

---

## Task 13: Update src/app/(tabs)/index.tsx — persona + seção jornadas + busca pendente

**File:** `src/app/(tabs)/index.tsx`

Adicionar 4 mudanças ao arquivo atual:

1. **Imports novos** (adicionar junto aos existentes):
```typescript
import { useCallback } from "react";
import { useFocusEffect } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { SituacaoCard } from "@/components/situacao-card";
import { usePersona } from "@/stores/use-persona";
import { useJornadas } from "@/lib/queries/use-jornadas";
```

2. **Hooks novos** (dentro de `BuscaScreen`, após `const busca = ...`):
```typescript
const { personaConfig } = usePersona();
const { data: jornadas = [] } = useJornadas();

// Aplica busca pendente definida pela tela de jornada
useFocusEffect(
  useCallback(() => {
    (async () => {
      const pendente = await AsyncStorage.getItem("@conecta_sus_busca_pendente");
      if (pendente) {
        setTexto(pendente);
        setTermo(pendente);
        await AsyncStorage.removeItem("@conecta_sus_busca_pendente");
      }
    })();
  }, [])
);
```

3. **Hero band atualizado** — substituir as duas linhas fixas de `titulo` e `placeholder`:
```typescript
// Substituir:
//   <Texto style={styles.titulo}>O que você{"\n"}precisa?</Texto>
// Por:
<Texto style={styles.titulo}>{personaConfig.tituloBusca}</Texto>

// Substituir o placeholder= no TextInput:
//   placeholder="Ex.: meu filho chora muito"
// Por:
placeholder={personaConfig.placeholder}
```

4. **Seção "Está passando por isso?"** — adicionar dentro do `<ScrollView>` idle, após o bloco dos chips e antes de `explorarCard`:
```typescript
{jornadas.length > 0 && (
  <>
    <Texto style={styles.secao}>Está passando por isso?</Texto>
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.jornadasScroll}
    >
      {jornadas.map((j) => (
        <SituacaoCard
          key={j.slug}
          jornada={j}
          onPress={() =>
            router.push({
              pathname: "/jornada/[slug]",
              params: { slug: j.slug },
            })
          }
        />
      ))}
    </ScrollView>
  </>
)}
```

5. **Estilo novo** em `makeStyles`:
```typescript
jornadasScroll: { gap: 10, paddingRight: 4 },
```

**Verification:**
```bash
cd conecta-sus-app && npx tsc --noEmit
# No app:
# - Hero mostra título personalizado por persona (ex: "O que seu filho\nprecisa?")
# - Seção "Está passando por isso?" aparece com cards horizontais de jornadas
# - Tocar em "Estou grávida" navega para jornada/gravidez
```

**Commit:** `feat(busca): persona no hero, jornadas em destaque e busca pendente de jornada`

---

## Task 14: Tela src/app/jornada/[slug].tsx

**File:** `src/app/jornada/[slug].tsx`

**Implementation:**
```typescript
import { useMemo } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { Texto } from "@/components/texto";
import { useTema } from "@/theme/tema";
import type { Cores } from "@/theme/colors";
import { useJornada } from "@/lib/queries/use-jornada";
import { useJornadaProgresso } from "@/stores/use-jornada-progresso";
import type { JornadaPasso } from "@/types/models";

// Mapeia servico_codigo → termo de busca legível
const BUSCA_MAP: Record<string, string> = {
  prenatal:      "pré-natal",
  vacina:        "vacina",
  atencao_basica:"atendimento básico",
  farmacia:      "farmácia popular",
  saude_mental:  "psicólogo",
  reabilitacao:  "fisioterapia",
  odonto_esp:    "dentista",
  fono:          "fonoaudiólogo",
  dependencia:   "dependência química",
};

export default function JornadaScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const { data: jornada, isLoading, isError } = useJornada(slug);
  const { passosConcluidos, togglePasso } = useJornadaProgresso(slug);
  const router = useRouter();
  const { cores } = useTema();
  const styles = useMemo(() => makeStyles(cores), [cores]);

  async function buscarServico(servico_codigo: string) {
    const termo = BUSCA_MAP[servico_codigo] ?? servico_codigo;
    await AsyncStorage.setItem("@conecta_sus_busca_pendente", termo);
    router.push("/(tabs)");
  }

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={cores.verde} />
      </View>
    );
  }

  if (isError || !jornada) {
    return (
      <View style={styles.center}>
        <Ionicons name="alert-circle-outline" size={36} color={cores.inkFaint} />
        <Texto style={styles.errTexto}>Jornada não encontrada.</Texto>
      </View>
    );
  }

  const concluidos = passosConcluidos.length;
  const total = jornada.passos.length;
  const progresso = total > 0 ? concluidos / total : 0;

  return (
    <ScrollView contentContainerStyle={styles.scroll}>
      {/* Cabeçalho colorido */}
      <View style={[styles.header, { backgroundColor: jornada.cor }]}>
        <View style={styles.headerIconWrap}>
          <Ionicons name={jornada.icone as never} size={28} color={cores.verdeDeep} />
        </View>
        <View style={{ flex: 1 }}>
          <Texto style={styles.headerTitulo}>{jornada.titulo}</Texto>
          <Texto style={styles.headerDesc}>{jornada.descricao}</Texto>
        </View>
      </View>

      {/* Barra de progresso */}
      <View style={styles.progressoWrap}>
        <View style={styles.progressoBar}>
          <View style={[styles.progressoFill, { width: `${progresso * 100}%` }]} />
        </View>
        <Texto style={styles.progressoTexto}>
          {concluidos}/{total} passos concluídos
        </Texto>
      </View>

      {/* Passos */}
      <View style={styles.passos}>
        {[...jornada.passos]
          .sort((a, b) => a.ordem - b.ordem)
          .map((passo) => (
            <PassoCard
              key={passo.ordem}
              passo={passo}
              concluido={passosConcluidos.includes(passo.ordem)}
              onToggle={() => togglePasso(passo.ordem)}
              onBuscar={() => buscarServico(passo.servico_codigo)}
            />
          ))}
      </View>
    </ScrollView>
  );
}

function PassoCard({
  passo,
  concluido,
  onToggle,
  onBuscar,
}: {
  passo: JornadaPasso;
  concluido: boolean;
  onToggle: () => void;
  onBuscar: () => void;
}) {
  const { cores } = useTema();
  const styles = useMemo(() => makeStyles(cores), [cores]);

  return (
    <View style={[styles.passo, concluido && styles.passoConcluido]}>
      <View style={styles.passoHeader}>
        <Pressable
          onPress={onToggle}
          style={[styles.ordemCircle, concluido && { backgroundColor: cores.verde }]}
          accessibilityRole="checkbox"
          accessibilityState={{ checked: concluido }}
          accessibilityLabel={concluido ? "Marcar como não feito" : "Marcar como feito"}
        >
          {concluido ? (
            <Ionicons name="checkmark" size={16} color="#ffffff" />
          ) : (
            <Texto style={styles.ordemNum}>{passo.ordem}</Texto>
          )}
        </Pressable>
        <View style={styles.passoTextos}>
          <Texto
            style={[
              styles.passoTitulo,
              concluido && { color: cores.inkSoft, textDecorationLine: "line-through" },
            ]}
          >
            {passo.titulo_passo}
          </Texto>
          <Texto style={styles.passoMotivo}>{passo.por_que_importa}</Texto>
        </View>
      </View>

      <View style={styles.passoBotoes}>
        <Pressable
          onPress={onBuscar}
          style={({ pressed }) => [styles.btnBuscar, pressed && { opacity: 0.8 }]}
          accessibilityRole="button"
          accessibilityLabel="Buscar este serviço na aba Buscar"
        >
          <Ionicons name="search-outline" size={13} color={cores.verde} />
          <Texto style={styles.btnBuscarTexto}>Buscar este serviço</Texto>
        </Pressable>
      </View>
    </View>
  );
}

const makeStyles = (cores: Cores) =>
  StyleSheet.create({
    center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12, padding: 40 },
    errTexto: { fontSize: 15, color: cores.inkSoft, textAlign: "center" },
    scroll: { gap: 16, paddingBottom: 40 },
    header: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: 14,
      padding: 20,
    },
    headerIconWrap: {
      width: 52,
      height: 52,
      borderRadius: 16,
      backgroundColor: "rgba(255,255,255,0.55)",
      alignItems: "center",
      justifyContent: "center",
    },
    headerTitulo: { fontSize: 20, fontWeight: "800", color: cores.verdeDeep, marginBottom: 4 },
    headerDesc: { fontSize: 13, color: cores.inkSoft, lineHeight: 18 },
    progressoWrap: {
      paddingHorizontal: 20,
      gap: 6,
    },
    progressoBar: {
      height: 6,
      backgroundColor: cores.line,
      borderRadius: 3,
      overflow: "hidden",
    },
    progressoFill: {
      height: "100%",
      backgroundColor: cores.verde,
      borderRadius: 3,
    },
    progressoTexto: { fontSize: 12, color: cores.inkFaint, fontWeight: "600" },
    passos: { paddingHorizontal: 16, gap: 12 },
    passo: {
      backgroundColor: cores.card,
      borderWidth: 1,
      borderColor: cores.line,
      borderRadius: 18,
      padding: 16,
      gap: 12,
    },
    passoConcluido: { opacity: 0.7 },
    passoHeader: { flexDirection: "row", gap: 12, alignItems: "flex-start" },
    ordemCircle: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: cores.verdeWash,
      alignItems: "center",
      justifyContent: "center",
      flexShrink: 0,
    },
    ordemNum: { fontSize: 14, fontWeight: "800", color: cores.verde },
    passoTextos: { flex: 1, gap: 4 },
    passoTitulo: { fontSize: 15, fontWeight: "700", color: cores.ink },
    passoMotivo: { fontSize: 13, color: cores.inkSoft, lineHeight: 18 },
    passoBotoes: { flexDirection: "row", gap: 8 },
    btnBuscar: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      backgroundColor: cores.verdeWash,
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 12,
    },
    btnBuscarTexto: { fontSize: 12, fontWeight: "600", color: cores.verde },
  });
```

**Verification:**
```bash
cd conecta-sus-app && npx tsc --noEmit
# No app:
# - Tocar "Estou grávida" → abre tela de jornada com 4 passos
# - Barra de progresso reflete passos concluídos
# - Tocar no círculo de ordem → marca como concluído (riscado)
# - "Buscar este serviço" → navega para aba Buscar com termo pré-preenchido
# - Fechar app e reabrir → progresso preservado
```

**Commit:** `feat(jornada): tela de jornada guiada com checklist e busca integrada`

---

## Checklist de conclusão

- [ ] Migrations 0005 + 0006 aplicadas (verificar via MCP execute_sql)
- [ ] `npx tsc --noEmit` — 0 erros
- [ ] Primeira abertura após logout → tela de onboarding aparece
- [ ] Escolher persona → hero da busca muda (ex: "O que seu filho precisa?")
- [ ] Aba "Descobrir" aparece na tab bar com cards fullscreen swipeable
- [ ] Seção "Está passando por isso?" aparece no scroll da tela Buscar
- [ ] Tocar "Estou grávida" → abre jornada com 4 passos ordenados
- [ ] Marcar passo como feito → círculo vira checkmark verde
- [ ] "Buscar este serviço" → navega p/ busca com termo pré-preenchido
- [ ] Progresso da jornada persiste após fechar app
