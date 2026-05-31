# Features Pitch P0+P1 — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use
> subagent-driven-development or executing-plans.

**Goal:** Implementar 5 features que transformam o app de protótipo funcional em produto impressionante para o pitch do Desafio Liga Jovem 2026.

**Architecture:** Cada feature é independente e pode ser executada em série. As features de UX (Tradutor, Onboarding, Waze das Filas, Celebração de Badge) tocam em componentes distintos. A única dependência é a Task 7 (migration Waze das Filas) que deve preceder a Task 8 (hook) e Task 9 (UI).

**Tech Stack:** Expo 54 / React Native 0.81, TypeScript, Supabase (Postgres + RLS), react-native-reanimated 4.1, @tanstack/react-query 5, AsyncStorage, Ionicons.

---

## FEATURE A — Error Boundaries Globais (P0)

### Task 1: Criar componente ErrorBoundary

**File:** `src/components/error-boundary.tsx`

**Test:** Não aplicável (class component — verificação manual: forçar throw num filho e confirmar tela de fallback)

**Implementation:**
```tsx
import { Component, type ReactNode } from "react";
import { View, StyleSheet, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}
interface State {
  hasError: boolean;
  message: string;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, message: "" };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, message: error.message };
  }

  reset = () => this.setState({ hasError: false, message: "" });

  render() {
    if (!this.state.hasError) return this.props.children;
    if (this.props.fallback) return this.props.fallback;
    return (
      <View style={styles.container}>
        <Ionicons name="alert-circle-outline" size={48} color="#d65a3c" />
        <View style={styles.texts}>
          <View style={styles.title}>
            <Ionicons name="medkit" size={16} color="#0d6a51" />
          </View>
        </View>
        <Pressable style={styles.btn} onPress={this.reset}>
          <Ionicons name="refresh-outline" size={18} color="#ffffff" />
        </Pressable>
      </View>
    );
  }
}

// Componente funcional helper para tela de fallback completa
import { Text } from "react-native";
export function FallbackTela({ onReset }: { onReset: () => void }) {
  return (
    <View style={styles.container}>
      <Ionicons name="alert-circle-outline" size={52} color="#d65a3c" />
      <Text style={styles.titulo}>Algo deu errado</Text>
      <Text style={styles.sub}>
        O app encontrou um problema inesperado. Suas informações estão salvas.
      </Text>
      <Pressable
        style={styles.btn}
        onPress={onReset}
        accessibilityRole="button"
        accessibilityLabel="Tentar novamente"
      >
        <Ionicons name="refresh-outline" size={18} color="#ffffff" />
        <Text style={styles.btnTexto}>Tentar novamente</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 40,
    gap: 16,
    backgroundColor: "#f5f5f0",
  },
  texts: { gap: 8, alignItems: "center" },
  titulo: {
    fontSize: 22,
    fontWeight: "800",
    color: "#16241f",
    textAlign: "center",
  },
  sub: {
    fontSize: 15,
    color: "#6b7c76",
    textAlign: "center",
    lineHeight: 22,
  },
  btn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#0d6a51",
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 16,
    marginTop: 8,
  },
  btnTexto: { fontSize: 15, fontWeight: "700", color: "#ffffff" },
});
```

**Verification:**
```bash
npx tsc --noEmit
# Expected: 0 errors
```

**Commit:** `feat(app): adicionar ErrorBoundary global com tela de fallback`

---

### Task 2: Envolver app com ErrorBoundary em _layout.tsx

**File:** `src/app/_layout.tsx`

**Test:** Não aplicável (verificação manual)

**Implementation:**

Adicionar import no topo:
```tsx
import { ErrorBoundary, FallbackTela } from "@/components/error-boundary";
```

Substituir o return de `RootLayout`:
```tsx
export default function RootLayout() {
  return (
    <ErrorBoundary fallback={<FallbackTela onReset={() => {}} />}>
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
    </ErrorBoundary>
  );
}
```

**Verification:**
```bash
npx tsc --noEmit
# Expected: 0 errors
```

**Commit:** `feat(app): envolver layout raiz com ErrorBoundary`

---

## FEATURE B — Tradutor de Sintomas (Polish do Badge) (P0)

### Task 3: Tornar o badge de interpretação mais empático e animado

**File:** `src/app/(tabs)/index.tsx`

**Test:** Não aplicável (verificação visual)

**Implementation:**

Adicionar import de Animated no topo (já importado via react-native). Substituir a função `Resultados` inteira. Localizar a seção `ListHeaderComponent` (linhas 258-267) e substituir por:

```tsx
// Adicionar este import no topo do arquivo:
import { useRef, useEffect } from "react"; // useRef e useEffect já importados

// Dentro da função Resultados, adicionar antes do return:
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
```

Substituir o `ListHeaderComponent`:
```tsx
ListHeaderComponent={
  necessidadeTexto ? (
    <Animated.View
      style={[
        styles.matchBadge,
        {
          opacity: badgeAnim,
          transform: [{ scale: badgeAnim.interpolate({ inputRange: [0, 1], outputRange: [0.85, 1] }) }],
        },
      ]}
    >
      <Ionicons name="sparkles" size={15} color={cores.verdeDeep} />
      <Texto style={styles.matchTexto}>
        Entendemos que você busca:{" "}
        <Texto style={styles.matchDestaque}>{necessidadeTexto}</Texto>
      </Texto>
    </Animated.View>
  ) : null
}
```

Atualizar os estilos `matchBadge` e `matchTexto` em `makeStyles`:
```tsx
matchBadge: {
  flexDirection: "row",
  alignItems: "center",
  gap: 8,
  backgroundColor: cores.verdeDeep,  // fundo escuro para destaque
  paddingHorizontal: 16,
  paddingVertical: 10,
  borderRadius: 20,
  alignSelf: "flex-start",
  marginBottom: 12,
},
matchTexto: { fontSize: 13, color: "#a8d5c4" },
matchDestaque: { fontSize: 13, fontWeight: "800", color: "#ffffff" },
```

**Verification:**
```bash
npx tsc --noEmit
# Expected: 0 errors
# Visual: buscar "meu filho chora" e confirmar badge verde-escuro com animação spring
```

**Commit:** `feat(busca): badge de interpretação mais empático com animação spring`

---

## FEATURE C — Onboarding com Condições de Saúde (P1)

### Task 4: Criar store de perfil de saúde

**File:** `src/stores/use-perfil-saude.tsx`

**Test:** Não aplicável (store simples, sem lógica complexa)

**Implementation:**
```tsx
import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  type ReactNode,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

export type FaixaEtaria = "crianca" | "jovem" | "adulto" | "idoso";

export interface PerfilSaude {
  faixaEtaria: FaixaEtaria | null;
  condicoes: string[];
}

type PerfilSaudeState = PerfilSaude & {
  carregado: boolean;
  setPerfil: (perfil: PerfilSaude) => Promise<void>;
};

const STORAGE_KEY = "@conecta_sus_perfil_saude";

const PerfilSaudeContext = createContext<PerfilSaudeState | undefined>(undefined);

export function PerfilSaudeProvider({ children }: { children: ReactNode }) {
  const [faixaEtaria, setFaixaEtaria] = useState<FaixaEtaria | null>(null);
  const [condicoes, setCondicoes] = useState<string[]>([]);
  const [carregado, setCarregado] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) {
          const parsed: PerfilSaude = JSON.parse(raw);
          setFaixaEtaria(parsed.faixaEtaria ?? null);
          setCondicoes(parsed.condicoes ?? []);
        }
      } catch {
        // silent
      }
      setCarregado(true);
    })();
  }, []);

  const setPerfil = useCallback(async (perfil: PerfilSaude) => {
    setFaixaEtaria(perfil.faixaEtaria);
    setCondicoes(perfil.condicoes);
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(perfil));
    } catch {
      // silent
    }
  }, []);

  return (
    <PerfilSaudeContext.Provider
      value={{ faixaEtaria, condicoes, carregado, setPerfil }}
    >
      {children}
    </PerfilSaudeContext.Provider>
  );
}

export function usePerfilSaude(): PerfilSaudeState {
  const ctx = useContext(PerfilSaudeContext);
  if (!ctx) throw new Error("usePerfilSaude must be used inside PerfilSaudeProvider");
  return ctx;
}
```

**Verification:**
```bash
npx tsc --noEmit
# Expected: 0 errors
```

**Commit:** `feat(stores): criar store PerfilSaude com AsyncStorage`

---

### Task 5: Registrar PerfilSaudeProvider no layout raiz

**File:** `src/app/_layout.tsx`

**Test:** Não aplicável

**Implementation:**

Adicionar import:
```tsx
import { PerfilSaudeProvider } from "@/stores/use-perfil-saude";
```

Envolver `<PersonaProvider>` com `<PerfilSaudeProvider>`:
```tsx
<PerfilSaudeProvider>
  <PersonaProvider>
    <AuthProvider>
      ...
    </AuthProvider>
  </PersonaProvider>
</PerfilSaudeProvider>
```

**Verification:**
```bash
npx tsc --noEmit
# Expected: 0 errors
```

**Commit:** `feat(app): registrar PerfilSaudeProvider no layout raiz`

---

### Task 6: Reescrever onboarding com etapa 2 de condições de saúde

**File:** `src/app/onboarding.tsx`

**Test:** Não aplicável (verificação visual do fluxo)

**Implementation:**
```tsx
import { useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import { Screen } from "@/components/screen";
import { Texto } from "@/components/texto";
import { PERSONAS, usePersona, type PersonaSlug } from "@/stores/use-persona";
import { usePerfilSaude, type FaixaEtaria } from "@/stores/use-perfil-saude";
import { useTema } from "@/theme/tema";
import type { Cores } from "@/theme/colors";

type Etapa = 1 | 2;

interface OpcaoFaixa {
  slug: FaixaEtaria;
  rotulo: string;
  emoji: string;
  dica: string;
}

const FAIXAS: OpcaoFaixa[] = [
  { slug: "crianca",  rotulo: "Criança",  emoji: "👶", dica: "0 a 12 anos" },
  { slug: "jovem",    rotulo: "Jovem",    emoji: "🧑", dica: "13 a 29 anos" },
  { slug: "adulto",   rotulo: "Adulto",   emoji: "🙋", dica: "30 a 59 anos" },
  { slug: "idoso",    rotulo: "Idoso",    emoji: "👴", dica: "60 anos ou mais" },
];

const CONDICOES_OPCOES = [
  { slug: "gestante",      rotulo: "Gestante",      icone: "heart-outline" as const },
  { slug: "diabetes",      rotulo: "Diabetes",      icone: "medical-outline" as const },
  { slug: "hipertensao",   rotulo: "Hipertensão",   icone: "pulse-outline" as const },
  { slug: "cancer_mama",   rotulo: "Histórico de câncer de mama", icone: "ribbon-outline" as const },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const { setPersona } = usePersona();
  const { setPerfil } = usePerfilSaude();
  const { cores } = useTema();
  const styles = useMemo(() => makeStyles(cores), [cores]);

  const [etapa, setEtapa] = useState<Etapa>(1);
  const [personaPendente, setPersonaPendente] = useState<PersonaSlug>("eu_mesmo");
  const [faixaSelecionada, setFaixaSelecionada] = useState<FaixaEtaria | null>(null);
  const [condicoesSelecionadas, setCondicoesSelecionadas] = useState<string[]>([]);

  function escolherPersona(slug: PersonaSlug) {
    setPersonaPendente(slug);
    setEtapa(2);
  }

  function pular() {
    escolherPersona("eu_mesmo");
  }

  function toggleCondicao(slug: string) {
    setCondicoesSelecionadas((prev) =>
      prev.includes(slug) ? prev.filter((c) => c !== slug) : [...prev, slug]
    );
  }

  async function concluir() {
    await setPerfil({
      faixaEtaria: faixaSelecionada,
      condicoes: condicoesSelecionadas,
    });
    await setPersona(personaPendente);
    router.replace("/(tabs)");
  }

  if (etapa === 1) {
    return (
      <Screen>
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
        >
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
                onPress={() => escolherPersona(p.slug)}
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

  return (
    <Screen>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View style={styles.logoWrap}>
            <Ionicons name="person" size={32} color={cores.verde} />
          </View>
          <Texto style={styles.titulo}>Mais um passo{"\n"}(opcional)</Texto>
          <Texto style={styles.subtitulo}>
            Isso nos permite enviar alertas de saúde certos para o seu perfil.
          </Texto>
        </View>

        {/* Faixa etária */}
        <View style={styles.secaoWrap}>
          <Texto style={styles.secaoLabel}>Qual a faixa etária?</Texto>
          <View style={styles.faixasGrid}>
            {FAIXAS.map((f) => {
              const selecionado = faixaSelecionada === f.slug;
              return (
                <Pressable
                  key={f.slug}
                  onPress={() => setFaixaSelecionada(f.slug)}
                  accessibilityRole="button"
                  accessibilityLabel={f.rotulo}
                  style={({ pressed }) => [
                    styles.faixaChip,
                    selecionado && styles.faixaChipSelecionado,
                    pressed && { opacity: 0.82 },
                  ]}
                >
                  <Texto style={styles.faixaEmoji}>{f.emoji}</Texto>
                  <Texto style={[styles.faixaRotulo, selecionado && { color: cores.verdeDeep }]}>
                    {f.rotulo}
                  </Texto>
                  <Texto style={styles.faixaDica}>{f.dica}</Texto>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Condições */}
        <View style={styles.secaoWrap}>
          <Texto style={styles.secaoLabel}>Alguma dessas condições? (opcional)</Texto>
          <View style={styles.opcoes}>
            {CONDICOES_OPCOES.map((c) => {
              const ativo = condicoesSelecionadas.includes(c.slug);
              return (
                <Pressable
                  key={c.slug}
                  onPress={() => toggleCondicao(c.slug)}
                  accessibilityRole="checkbox"
                  accessibilityLabel={c.rotulo}
                  style={({ pressed }) => [
                    styles.condicaoChip,
                    ativo && styles.condicaoChipAtivo,
                    pressed && { opacity: 0.82 },
                  ]}
                >
                  <Ionicons
                    name={c.icone}
                    size={20}
                    color={ativo ? cores.verdeDeep : cores.inkSoft}
                  />
                  <Texto
                    style={[styles.condicaoTexto, ativo && { color: cores.verdeDeep, fontWeight: "700" }]}
                  >
                    {c.rotulo}
                  </Texto>
                  {ativo && (
                    <Ionicons name="checkmark-circle" size={18} color={cores.verde} />
                  )}
                </Pressable>
              );
            })}
          </View>
        </View>

        <Pressable
          onPress={concluir}
          accessibilityRole="button"
          accessibilityLabel="Continuar"
          style={({ pressed }) => [styles.btnConcluir, pressed && { opacity: 0.88 }]}
        >
          <Texto style={styles.btnConcluirTexto}>Continuar</Texto>
          <Ionicons name="arrow-forward" size={20} color="#ffffff" />
        </Pressable>

        <Pressable
          onPress={() => concluir()}
          style={styles.pular}
          accessibilityRole="button"
          accessibilityLabel="Pular esta etapa"
        >
          <Texto style={styles.pularTexto}>Pular esta etapa</Texto>
        </Pressable>
      </ScrollView>
    </Screen>
  );
}

const makeStyles = (cores: Cores) =>
  StyleSheet.create({
    scroll: { padding: 28, gap: 28, flexGrow: 1, justifyContent: "center" },
    header: { gap: 14, alignItems: "center" },
    logoWrap: {
      width: 72, height: 72, borderRadius: 24,
      backgroundColor: cores.verdeWash,
      alignItems: "center", justifyContent: "center",
    },
    titulo: {
      fontSize: 26, fontWeight: "800", color: cores.ink,
      textAlign: "center", lineHeight: 34,
    },
    subtitulo: {
      fontSize: 15, color: cores.inkSoft,
      textAlign: "center", lineHeight: 22,
    },
    opcoes: { gap: 12 },
    chip: {
      flexDirection: "row", alignItems: "center", gap: 14,
      backgroundColor: cores.card, borderWidth: 1.5,
      borderColor: cores.line, borderRadius: 20, padding: 16,
    },
    chipEmoji: { fontSize: 26 },
    chipTextos: { flex: 1, gap: 2 },
    chipRotulo: { fontSize: 16, fontWeight: "700", color: cores.ink },
    chipDica: { fontSize: 12, color: cores.inkFaint },
    pular: { alignItems: "center", paddingVertical: 10 },
    pularTexto: { fontSize: 14, color: cores.inkFaint },
    secaoWrap: { gap: 12 },
    secaoLabel: {
      fontSize: 13, fontWeight: "700", color: cores.inkFaint,
      textTransform: "uppercase", letterSpacing: 1,
    },
    faixasGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
    faixaChip: {
      width: "47%", alignItems: "center", gap: 4,
      backgroundColor: cores.card, borderWidth: 1.5,
      borderColor: cores.line, borderRadius: 18, padding: 14,
    },
    faixaChipSelecionado: {
      borderColor: cores.verde,
      backgroundColor: cores.verdeWash,
    },
    faixaEmoji: { fontSize: 24 },
    faixaRotulo: { fontSize: 15, fontWeight: "700", color: cores.ink },
    faixaDica: { fontSize: 11, color: cores.inkFaint },
    condicaoChip: {
      flexDirection: "row", alignItems: "center", gap: 12,
      backgroundColor: cores.card, borderWidth: 1.5,
      borderColor: cores.line, borderRadius: 18, padding: 14,
    },
    condicaoChipAtivo: {
      borderColor: cores.verde, backgroundColor: cores.verdeWash,
    },
    condicaoTexto: { flex: 1, fontSize: 15, color: cores.inkSoft },
    btnConcluir: {
      flexDirection: "row", alignItems: "center", justifyContent: "center",
      gap: 10, backgroundColor: cores.verde,
      borderRadius: 20, paddingVertical: 16, marginTop: 4,
    },
    btnConcluirTexto: { fontSize: 17, fontWeight: "800", color: "#ffffff" },
  });
```

**Verification:**
```bash
npx tsc --noEmit
# Expected: 0 errors
# Visual: novo fluxo onboarding — etapa 1 escolhe persona, etapa 2 mostra faixa etária + condições
```

**Commit:** `feat(onboarding): adicionar etapa 2 com faixa etária e condições de saúde`

---

## FEATURE D — Waze das Filas (P1)

### Task 7: Migration — adicionar campos de tempo de espera em confirmacoes

**File:** `supabase/migrations/0008_waze_filas.sql`

**Test:** Não aplicável (migration SQL)

**Implementation:**
```sql
-- Adiciona campos de "pulso da comunidade" às confirmações
alter table confirmacoes
  add column if not exists tempo_espera_minutos int check (tempo_espera_minutos in (0, 30, 60, 120)),
  add column if not exists expira_em timestamptz generated always as (criado_em + interval '6 hours') stored;

-- Índice para busca de confirmações recentes por estabelecimento
create index if not exists idx_confirmacoes_estab_expira
  on confirmacoes(estabelecimento_id, expira_em desc)
  where expira_em > now();

comment on column confirmacoes.tempo_espera_minutos is
  'Tempo de espera informado pelo usuário: 0=sem fila, 30=~30min, 60=~1h, 120=>2h. NULL se não informado.';
comment on column confirmacoes.expira_em is
  'Confirmação expira 6h após criação para garantir frescor dos dados.';
```

**Verification:**
```bash
# Aplicar migration via Supabase CLI ou dashboard
npx supabase db push
# Verificar no banco:
# SELECT column_name FROM information_schema.columns WHERE table_name = 'confirmacoes';
# Expected: colunas tempo_espera_minutos e expira_em presentes
```

**Commit:** `feat(db): migration 0008 — adicionar tempo_espera e expira_em em confirmacoes`

---

### Task 8: Atualizar hook useConfirmar para aceitar tempo de espera

**File:** `src/lib/queries/use-confirmar.ts`

**Test:** Não aplicável

**Implementation:**
```typescript
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/stores/use-auth";
import type { StatusConfirmacao } from "@/types/models";

export type TempoEspera = 0 | 30 | 60 | 120;

type ConfirmarInput = {
  estabelecimentoId: number;
  status: StatusConfirmacao;
  tempoEsperaMinutos?: TempoEspera;
};

export function useConfirmar() {
  const { session } = useAuth();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ estabelecimentoId, status, tempoEsperaMinutos }: ConfirmarInput) => {
      const payload: Record<string, unknown> = {
        estabelecimento_id: estabelecimentoId,
        status,
      };
      if (session?.user.id) payload.usuario_id = session.user.id;
      if (tempoEsperaMinutos !== undefined) {
        payload.tempo_espera_minutos = tempoEsperaMinutos;
      }

      const { error } = await supabase.from("confirmacoes").insert(payload);
      if (error) throw error;

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
npx tsc --noEmit
# Expected: 0 errors
```

**Commit:** `feat(queries): useConfirmar aceita tempoEsperaMinutos opcional`

---

### Task 9: Atualizar useConfirmacoesEstab para retornar tempo de espera recente

**File:** `src/lib/queries/use-confirmacoes-estab.ts`

**Test:** Não aplicável

**Implementation:**
```typescript
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { EstatConfirmacoes, StatusConfirmacao } from "@/types/models";

export interface EstatConfirmacoesComFila extends EstatConfirmacoes {
  tempo_espera_recente: number | null; // mediana das últimas 6h, null se sem dados
}

export function useConfirmacoesEstab(estabelecimentoId: number) {
  return useQuery({
    queryKey: ["confirmacoes", estabelecimentoId],
    queryFn: async (): Promise<EstatConfirmacoesComFila> => {
      const agora = new Date().toISOString();

      const { data, error } = await supabase
        .from("confirmacoes")
        .select("status, tempo_espera_minutos, criado_em")
        .eq("estabelecimento_id", estabelecimentoId)
        .gt("expira_em", agora);

      if (error) throw error;

      const rows = data ?? [];
      const counts = { funciona: 0, fechou: 0, mudou: 0 };
      const tempos: number[] = [];

      for (const c of rows) {
        counts[c.status as StatusConfirmacao]++;
        if (c.tempo_espera_minutos !== null && c.tempo_espera_minutos !== undefined) {
          tempos.push(c.tempo_espera_minutos);
        }
      }

      const total = counts.funciona + counts.fechou + counts.mudou;

      let status_dominante: StatusConfirmacao | null = null;
      if (total > 0) {
        status_dominante = (
          Object.entries(counts) as [StatusConfirmacao, number][]
        ).reduce((a, b) => (a[1] >= b[1] ? a : b))[0];
      }

      let tempo_espera_recente: number | null = null;
      if (tempos.length > 0) {
        const sorted = [...tempos].sort((a, b) => a - b);
        tempo_espera_recente = sorted[Math.floor(sorted.length / 2)];
      }

      return { total, ...counts, status_dominante, tempo_espera_recente };
    },
  });
}
```

**Verification:**
```bash
npx tsc --noEmit
# Expected: 0 errors
```

**Commit:** `feat(queries): useConfirmacoesEstab retorna tempo_espera_recente das últimas 6h`

---

### Task 10: UI do Waze das Filas em servico/[id].tsx

**File:** `src/app/servico/[id].tsx`

**Test:** Não aplicável (verificação visual)

**Implementation:**

1. Atualizar o import do hook:
```tsx
import { useConfirmacoesEstab, type EstatConfirmacoesComFila } from "@/lib/queries/use-confirmacoes-estab";
import { useConfirmar, type TempoEspera } from "@/lib/queries/use-confirmar";
```

2. Adicionar estado para o picker de tempo de espera:
```tsx
const [tempoEsperaSelecionado, setTempoEsperaSelecionado] = useState<TempoEspera | null>(null);
const [mostraPicker, setMostraPicker] = useState(false);
```

3. Substituir a função `confirmar`:
```tsx
function confirmar(status: StatusConfirmacao) {
  if (confirmarMutation.isPending) return;
  if (status === "funciona" && !mostraPicker) {
    setMostraPicker(true);
    return;
  }
  const msg: Record<StatusConfirmacao, string> = {
    funciona: "Obrigado! Você ajudou a próxima pessoa.",
    fechou:   "Valeu pelo aviso. Vamos revisar este serviço.",
    mudou:    "Obrigado! Vamos atualizar as informações.",
  };
  confirmarMutation.mutate(
    {
      estabelecimentoId: servicoId,
      status,
      tempoEsperaMinutos: status === "funciona" ? (tempoEsperaSelecionado ?? undefined) : undefined,
    },
    {
      onSuccess: () => {
        setMostraPicker(false);
        setTempoEsperaSelecionado(null);
        Alert.alert("Tem no SUS!", msg[status]);
        if (session?.user.id) mostrarToast();
      },
      onError: () =>
        Alert.alert("Tem no SUS!", "Não foi possível registrar agora. Verifique a conexão e tente de novo."),
    }
  );
}
```

4. Substituir o bloco `{/* ── Stats comunitárias ── */}` para incluir tempo de espera:
```tsx
{stats && stats.total > 0 && (
  <View style={[
    styles.statsBand,
    stats.status_dominante
      ? { borderLeftColor: STATUS_COR[stats.status_dominante], borderLeftWidth: 3 }
      : undefined,
  ]}>
    <Ionicons name="people" size={16} color={cores.inkSoft} />
    <View style={{ flex: 1, gap: 2 }}>
      <Texto style={styles.statsTexto}>
        <Texto style={{ fontWeight: "700" }}>{stats.total}</Texto>
        {" "}validaçõe{stats.total === 1 ? "o" : "s"} recente{stats.total === 1 ? "" : "s"}
        {stats.status_dominante ? ` · ${STATUS_LABEL[stats.status_dominante]}` : ""}
      </Texto>
      {stats.tempo_espera_recente !== null && (
        <Texto style={[styles.statsTexto, { color: tempoParaCor(stats.tempo_espera_recente, cores) }]}>
          {tempoParaLabel(stats.tempo_espera_recente)}
        </Texto>
      )}
    </View>
  </View>
)}
```

5. Adicionar o picker de tempo de espera logo abaixo da seção de validação:
```tsx
{mostraPicker && (
  <View style={styles.pickerWrap}>
    <Texto style={styles.pickerTitulo}>Quanto tempo de espera?</Texto>
    <View style={styles.pickerOpcoes}>
      {([0, 30, 60, 120] as TempoEspera[]).map((t) => (
        <Pressable
          key={t}
          onPress={() => setTempoEsperaSelecionado(t)}
          style={({ pressed }) => [
            styles.pickerBtn,
            tempoEsperaSelecionado === t && styles.pickerBtnAtivo,
            pressed && { opacity: 0.8 },
          ]}
          accessibilityRole="button"
          accessibilityLabel={tempoParaLabel(t)}
        >
          <Texto style={[
            styles.pickerBtnTexto,
            tempoEsperaSelecionado === t && { color: cores.verdeDeep, fontWeight: "800" },
          ]}>
            {tempoParaLabel(t)}
          </Texto>
        </Pressable>
      ))}
    </View>
    <Pressable
      onPress={() => confirmar("funciona")}
      style={({ pressed }) => [styles.pickerConfirmar, pressed && { opacity: 0.88 }]}
      accessibilityRole="button"
      accessibilityLabel="Confirmar funcionamento"
    >
      <Ionicons name="checkmark-circle" size={18} color="#ffffff" />
      <Texto style={styles.pickerConfirmarTexto}>Confirmar</Texto>
    </Pressable>
  </View>
)}
```

6. Adicionar funções auxiliares antes de `makeStyles`:
```tsx
function tempoParaLabel(minutos: number): string {
  if (minutos === 0) return "🟢 Sem fila";
  if (minutos === 30) return "🟡 ~30 minutos";
  if (minutos === 60) return "🟠 ~1 hora";
  return "🔴 +2 horas";
}

function tempoParaCor(minutos: number, cores: Cores): string {
  if (minutos === 0) return cores.verde;
  if (minutos === 30) return cores.amber;
  if (minutos === 60) return "#e07d3f";
  return cores.coral;
}
```

7. Adicionar estilos em `makeStyles`:
```tsx
pickerWrap: {
  backgroundColor: cores.card, borderWidth: 1, borderColor: cores.line,
  borderRadius: 18, padding: 16, gap: 12,
},
pickerTitulo: { fontSize: 14, fontWeight: "700", color: cores.ink },
pickerOpcoes: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
pickerBtn: {
  paddingHorizontal: 14, paddingVertical: 10,
  backgroundColor: cores.paper, borderWidth: 1.5, borderColor: cores.line,
  borderRadius: 20,
},
pickerBtnAtivo: { borderColor: cores.verde, backgroundColor: cores.verdeWash },
pickerBtnTexto: { fontSize: 13, color: cores.inkSoft },
pickerConfirmar: {
  flexDirection: "row", alignItems: "center", justifyContent: "center",
  gap: 8, backgroundColor: cores.verde, borderRadius: 16, paddingVertical: 14,
},
pickerConfirmarTexto: { fontSize: 15, fontWeight: "700", color: "#ffffff" },
```

**Verification:**
```bash
npx tsc --noEmit
# Expected: 0 errors
# Visual: clicar "Funciona" → picker de tempo aparece → confirmar → toast
```

**Commit:** `feat(servico): Waze das Filas — picker de espera e exibição de tempo na stats band`

---

## FEATURE E — Celebração Visual de Badge (P1)

### Task 11: Criar componente BadgeCelebracao com animação reanimated

**File:** `src/components/badge-celebracao.tsx`

**Test:** Não aplicável (verificação visual)

**Implementation:**
```tsx
import { useEffect } from "react";
import { Modal, Pressable, StyleSheet, View } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withSequence,
  withDelay,
  runOnJS,
} from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import { Texto } from "@/components/texto";
import { useTema } from "@/theme/tema";

interface Props {
  visivel: boolean;
  badgeNome: string;
  badgeIcone: string;
  badgeDescricao: string;
  onFechar: () => void;
}

export function BadgeCelebracao({ visivel, badgeNome, badgeIcone, badgeDescricao, onFechar }: Props) {
  const { cores } = useTema();
  const escala = useSharedValue(0);
  const opacidadeFundo = useSharedValue(0);

  useEffect(() => {
    if (visivel) {
      opacidadeFundo.value = withTiming(1, { duration: 200 });
      escala.value = withSequence(
        withSpring(1.12, { damping: 8, stiffness: 180 }),
        withSpring(1.0, { damping: 12, stiffness: 200 })
      );
    } else {
      escala.value = withTiming(0, { duration: 150 });
      opacidadeFundo.value = withTiming(0, { duration: 200 });
    }
  }, [visivel, escala, opacidadeFundo]);

  const estiloCard = useAnimatedStyle(() => ({
    transform: [{ scale: escala.value }],
  }));

  const estiloFundo = useAnimatedStyle(() => ({
    opacity: opacidadeFundo.value,
  }));

  // Partículas decorativas (estrelas animadas)
  const estrelas = [0, 1, 2, 3, 4, 5].map((i) => {
    const angulo = (i / 6) * Math.PI * 2;
    const raio = 80;
    const x = Math.cos(angulo) * raio;
    const y = Math.sin(angulo) * raio;
    const op = useSharedValue(0);
    const tr = useSharedValue(0);

    useEffect(() => {
      if (visivel) {
        op.value = withDelay(i * 60, withSequence(withTiming(1, { duration: 200 }), withDelay(600, withTiming(0, { duration: 300 }))));
        tr.value = withDelay(i * 60, withSpring(1, { damping: 10, stiffness: 120 }));
      } else {
        op.value = 0;
        tr.value = 0;
      }
    }, [visivel]);

    const estiloEstrela = useAnimatedStyle(() => ({
      opacity: op.value,
      transform: [
        { translateX: x * tr.value },
        { translateY: y * tr.value },
      ],
    }));

    return (
      <Animated.View key={i} style={[estiloEstrela, styles.estrela]}>
        <Ionicons name="star" size={14} color={cores.amber} />
      </Animated.View>
    );
  });

  return (
    <Modal visible={visivel} transparent animationType="none" onRequestClose={onFechar}>
      <Animated.View style={[styles.fundo, estiloFundo]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onFechar} />
        <View style={styles.estrelaContainer}>{estrelas}</View>
        <Animated.View style={[styles.card, estiloCard]}>
          <View style={[styles.iconeWrap, { backgroundColor: cores.amber + "22" }]}>
            <Ionicons name={badgeIcone as never} size={44} color={cores.amber} />
          </View>
          <Texto style={styles.conquista}>🏆 Badge conquistado!</Texto>
          <Texto style={styles.nome}>{badgeNome}</Texto>
          <Texto style={styles.descricao}>{badgeDescricao}</Texto>
          <Pressable
            onPress={onFechar}
            style={({ pressed }) => [styles.btn, pressed && { opacity: 0.88 }]}
            accessibilityRole="button"
            accessibilityLabel="Fechar celebração"
          >
            <Texto style={styles.btnTexto}>Incrível!</Texto>
          </Pressable>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  fundo: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.55)",
    alignItems: "center",
    justifyContent: "center",
  },
  estrelaContainer: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
  },
  estrela: { position: "absolute" },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 28,
    padding: 32,
    marginHorizontal: 40,
    alignItems: "center",
    gap: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 12,
  },
  iconeWrap: {
    width: 88, height: 88, borderRadius: 44,
    alignItems: "center", justifyContent: "center",
    marginBottom: 4,
  },
  conquista: { fontSize: 13, color: "#6b7c76", fontWeight: "600", letterSpacing: 0.5 },
  nome: { fontSize: 22, fontWeight: "800", color: "#16241f", textAlign: "center" },
  descricao: { fontSize: 14, color: "#6b7c76", textAlign: "center", lineHeight: 20 },
  btn: {
    backgroundColor: "#0d6a51",
    paddingHorizontal: 36, paddingVertical: 14,
    borderRadius: 20, marginTop: 8,
  },
  btnTexto: { fontSize: 16, fontWeight: "800", color: "#ffffff" },
});
```

**Verification:**
```bash
npx tsc --noEmit
# Expected: 0 errors
```

**Commit:** `feat(components): BadgeCelebracao com animação spring e estrelas voando`

---

### Task 12: Modificar useConfirmar para capturar novos badges e useGamificacao para detectar mudanças

**File:** `src/lib/queries/use-confirmar.ts`

**Test:** Não aplicável

**Implementation:**

Atualizar `mutationFn` para retornar badges recém conquistados:
```typescript
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/stores/use-auth";
import type { StatusConfirmacao } from "@/types/models";

export type TempoEspera = 0 | 30 | 60 | 120;

type ConfirmarInput = {
  estabelecimentoId: number;
  status: StatusConfirmacao;
  tempoEsperaMinutos?: TempoEspera;
};

export type NovoBadge = {
  slug: string;
  nome: string;
  descricao: string;
  icone: string;
};

export function useConfirmar() {
  const { session } = useAuth();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ estabelecimentoId, status, tempoEsperaMinutos }: ConfirmarInput): Promise<NovoBadge | null> => {
      const payload: Record<string, unknown> = {
        estabelecimento_id: estabelecimentoId,
        status,
      };
      if (session?.user.id) payload.usuario_id = session.user.id;
      if (tempoEsperaMinutos !== undefined) payload.tempo_espera_minutos = tempoEsperaMinutos;

      const { error } = await supabase.from("confirmacoes").insert(payload);
      if (error) throw error;

      if (!session?.user.id) return null;

      // Snapshot dos badges antes de verificar
      const { data: antesDados } = await supabase
        .from("usuario_badges")
        .select("badge_slug")
        .eq("usuario_id", session.user.id);
      const antesSet = new Set((antesDados ?? []).map((b) => b.badge_slug));

      await supabase.rpc("verificar_badges", { uid: session.user.id });

      // Snapshot depois — detectar badge novo
      const { data: depoisDados } = await supabase
        .from("usuario_badges")
        .select("badge_slug, badges(nome, descricao, icone)")
        .eq("usuario_id", session.user.id);

      const novo = (depoisDados ?? []).find((b) => !antesSet.has(b.badge_slug));
      if (!novo) return null;

      const badge = novo.badges as { nome: string; descricao: string; icone: string } | null;
      if (!badge) return null;

      return { slug: novo.badge_slug, nome: badge.nome, descricao: badge.descricao, icone: badge.icone };
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
npx tsc --noEmit
# Expected: 0 errors
```

**Commit:** `feat(queries): useConfirmar retorna NovoBadge quando badge é conquistado`

---

### Task 13: Integrar BadgeCelebracao na tela de detalhe do serviço

**File:** `src/app/servico/[id].tsx`

**Test:** Não aplicável (verificação visual)

**Implementation:**

1. Adicionar imports:
```tsx
import { BadgeCelebracao } from "@/components/badge-celebracao";
import type { NovoBadge } from "@/lib/queries/use-confirmar";
```

2. Adicionar estado:
```tsx
const [novoBadge, setNovoBadge] = useState<NovoBadge | null>(null);
```

3. Modificar o `onSuccess` em `confirmarMutation.mutate(...)`:
```tsx
onSuccess: (resultado) => {
  setMostraPicker(false);
  setTempoEsperaSelecionado(null);
  if (resultado) {
    // Badge novo conquistado — mostrar celebração (sobrepõe o toast)
    setNovoBadge(resultado);
  } else {
    Alert.alert("Tem no SUS!", msg[status]);
    if (session?.user.id) mostrarToast();
  }
},
```

4. Adicionar o componente de celebração antes do fechamento do `<View style={{ flex: 1 }}>`:
```tsx
<BadgeCelebracao
  visivel={novoBadge !== null}
  badgeNome={novoBadge?.nome ?? ""}
  badgeIcone={novoBadge?.icone ?? "ribbon"}
  badgeDescricao={novoBadge?.descricao ?? ""}
  onFechar={() => setNovoBadge(null)}
/>
```

**Verification:**
```bash
npx tsc --noEmit
# Expected: 0 errors
# Visual: ao ganhar um badge, modal animado aparece com estrelas e botão "Incrível!"
```

**Commit:** `feat(servico): integrar BadgeCelebracao ao fluxo de confirmação`

---

## Ordem de Execução

```
Task 1  → Task 2   (Error Boundaries — ~30min)
Task 3             (Tradutor polish — ~20min)
Task 4  → Task 5 → Task 6   (Onboarding — ~50min)
Task 7  → Task 8 → Task 9 → Task 10  (Waze das Filas — ~90min)
Task 11 → Task 12 → Task 13  (Badge Celebration — ~60min)
```

**Tempo total estimado:** ~4h 30min

## Checklist Final

- [ ] `npx tsc --noEmit` passa sem erros
- [ ] ErrorBoundary cobre o app inteiro
- [ ] Badge empático anima ao aparecer
- [ ] Onboarding tem 2 etapas, persona só salva na etapa 2
- [ ] Clicar "Funciona" abre picker de tempo antes de confirmar
- [ ] Stats band mostra tempo de espera com cor semântica
- [ ] Confirmar + ganhar badge → modal de celebração com estrelas
