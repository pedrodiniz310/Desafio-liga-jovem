# Instalar o app no celular (APK Android, grátis) — Plano Guiado

> **For agentic workers:** REQUIRED SUB-SKILL: executing-plans (execução inline guiada).
> Este plano é **guiado passo-a-passo** para quem nunca fez deploy. Vários passos são **interativos** (login) e quem roda é o Pedro, no prompt da sessão usando o prefixo `!`.

**Goal:** Ter o "Tem no SUS!" instalado como app de verdade no celular Android do Pedro (ícone na tela, sem Expo Go, sem Metro), funcionando bem, de graça, sem Play Store.

**Architecture:** Build na nuvem com **EAS Build** (free tier) gera um arquivo `.apk` standalone. O Pedro baixa o `.apk` pelo link e instala no Android. As chaves públicas do Supabase (`EXPO_PUBLIC_*`) entram no build via `eas.json`. Mapa Leaflet, GPS e auth funcionam de verdade no build nativo.

**Tech Stack:** Expo SDK 54, EAS Build, Android APK. (iPhone standalone exige conta Apple paga → fora; ver Notas.)

---

## Antes de começar — o que é o quê (leitura de 30s)

- **EAS Build** = serviço da Expo que compila o app na nuvem e te devolve um `.apk`. Free tier serve (builds entram numa fila).
- **`.apk`** = o instalador do app no Android (tipo um `.exe` do Android).
- **Conta Expo** = grátis, é o login do EAS.
- Os passos com `!` na frente: digite no **prompt desta sessão** (ex.: `! npx eas login`) — assim o login interativo acontece e a saída aparece aqui.

Pré-condição já pronta: `app.json` com `android.package = com.temnosus.app`, ícone e splash configurados, `.env` com as chaves Supabase.

---

## Task 1: Conta Expo + login no EAS

**Ação (Pedro roda no prompt):**
1. Criar conta grátis em https://expo.dev (e-mail + senha). Guardar o usuário/senha.
2. No prompt da sessão:
```
! npx eas login
```
(pede e-mail/senha da conta Expo criada no passo 1).

**Verificação:**
```bash
cd conecta-sus-app
npx eas whoami
# Esperado: imprime seu usuário Expo (ex.: "pedrodiniz310"). Se disser "Not logged in", refazer o login.
```

**Commit:** (sem commit — só login)

---

## Task 2: Vincular o projeto ao EAS (cria o projectId)

**Ação:**
```bash
cd conecta-sus-app
npx eas init
```
Vai perguntar se quer criar o projeto na sua conta Expo → responder **Yes**. Isso grava `extra.eas.projectId` no `app.json` automaticamente.

**Verificação:**
```bash
grep -A2 '"eas"' app.json
# Esperado: aparece "projectId": "xxxxxxxx-xxxx-..." dentro de extra.eas
```

**Commit:** `chore(eas): vincula projeto ao EAS (projectId)`

---

## Task 3: Criar `eas.json` com o perfil de APK

**File:** `conecta-sus-app/eas.json`

**Implementation:**
```json
{
  "cli": {
    "version": ">= 16.0.0",
    "appVersionSource": "remote"
  },
  "build": {
    "preview": {
      "distribution": "internal",
      "android": {
        "buildType": "apk"
      },
      "autoIncrement": true,
      "env": {
        "EXPO_PUBLIC_SUPABASE_URL": "COLE_AQUI_O_VALOR_DO_.env",
        "EXPO_PUBLIC_SUPABASE_ANON_KEY": "COLE_AQUI_O_VALOR_DO_.env"
      }
    },
    "production": {
      "distribution": "internal",
      "android": {
        "buildType": "apk"
      },
      "autoIncrement": true,
      "env": {
        "EXPO_PUBLIC_SUPABASE_URL": "COLE_AQUI_O_VALOR_DO_.env",
        "EXPO_PUBLIC_SUPABASE_ANON_KEY": "COLE_AQUI_O_VALOR_DO_.env"
      }
    }
  },
  "submit": {
    "production": {}
  }
}
```

**Passo manual obrigatório:** abrir o arquivo `conecta-sus-app/.env`, copiar os valores reais de `EXPO_PUBLIC_SUPABASE_URL` e `EXPO_PUBLIC_SUPABASE_ANON_KEY`, e colar no lugar de `COLE_AQUI_O_VALOR_DO_.env` (nos dois perfis). **Pode comitar** esses dois: a *anon key* é pública por design (já vai dentro do app de qualquer jeito). **NUNCA** colocar aqui a `SUPABASE_SERVICE_ROLE_KEY` — essa é secreta e não entra no app.

**Verificação:**
```bash
cd conecta-sus-app
node -e "const e=require('./eas.json').build.preview.env; if(!e.EXPO_PUBLIC_SUPABASE_URL.startsWith('https://')||e.EXPO_PUBLIC_SUPABASE_URL.includes('COLE_AQUI')) throw new Error('faltou colar a URL'); if(e.EXPO_PUBLIC_SUPABASE_ANON_KEY.includes('COLE_AQUI')||e.EXPO_PUBLIC_SUPABASE_ANON_KEY.length<30) throw new Error('faltou colar a anon key'); console.log('eas.json env OK');"
# Esperado: "eas.json env OK"
```

**Commit:** `chore(eas): perfil preview/production de APK Android`

---

## Task 4: Garantir versionCode e revisar Android no `app.json`

**File:** `conecta-sus-app/app.json`

**Implementation:** dentro de `"android"`, garantir `versionCode` (o `autoIncrement` do EAS cuida do resto, mas deixar um valor base evita aviso). Adicionar se não existir:
```json
    "android": {
      "package": "com.temnosus.app",
      "versionCode": 1,
      "adaptiveIcon": {
        "backgroundColor": "#073b2e",
        "foregroundImage": "./assets/images/android-icon-foreground.png",
        "backgroundImage": "./assets/images/android-icon-background.png",
        "monochromeImage": "./assets/images/android-icon-monochrome.png"
      },
      "predictiveBackGestureEnabled": false,
      "permissions": [
        "android.permission.ACCESS_COARSE_LOCATION",
        "android.permission.ACCESS_FINE_LOCATION"
      ]
    }
```
> Manter o resto do `android` como já está. Só garantir `versionCode` presente e remover permissões duplicadas de localização se houver (deixar uma de cada).

**Verificação:**
```bash
cd conecta-sus-app
node -e "const a=require('./app.json').expo.android; if(a.package!=='com.temnosus.app') throw new Error('package errado'); if(typeof a.versionCode!=='number') throw new Error('faltou versionCode'); console.log('android OK:', a.package, 'v'+a.versionCode);"
# Esperado: "android OK: com.temnosus.app v1"
npx tsc --noEmit
# Esperado: 0 erros (sanity do projeto antes do build)
```

**Commit:** `chore(android): versionCode base para build EAS`

---

## Task 5: Rodar o build na nuvem (gera o .apk)

**Ação (Pedro roda no prompt):**
```
! cd conecta-sus-app && npx eas build -p android --profile preview
```
O que esperar / responder:
- "Generate a new Android Keystore?" → **Yes** (o EAS cria e guarda a assinatura sozinho; nunca mais precisa mexer).
- Sobe o projeto e entra na fila de build na nuvem. **Demora ~10–20 min** (free tier pode ter fila maior).
- No fim, imprime um **link de build** (`https://expo.dev/accounts/.../builds/...`) com o botão de download do `.apk`.

**Verificação:**
```bash
cd conecta-sus-app
npx eas build:list --platform android --limit 1
# Esperado: status "finished" e uma URL de artifact (.apk). Se "errored", abrir o link e ler o log.
```

**Commit:** (sem commit — build é na nuvem)

---

## Task 6: Instalar o .apk no celular

**Ação (no celular Android do Pedro):**
1. Abrir o **link do build** (mandar pra si no WhatsApp/e-mail, ou abrir `expo.dev` logado → Builds).
2. Tocar em **Install** / baixar o `.apk`.
3. Android vai avisar "instalar apps de fontes desconhecidas" → permitir pro navegador/arquivos.
4. Abrir o `.apk` baixado → **Instalar**.
5. Vai aparecer o ícone **"Tem no SUS!"** na tela inicial.

**Verificação (no device):**
- App abre **sem precisar de Metro/PC ligado** (fecha tudo no PC e abre o app — tem que funcionar).
- Ícone e splash corretos (cruz + pin laranja, fundo verde).

---

## Task 7: Verificação funcional no celular

**Checklist no app instalado:**
- [ ] **Login** Supabase entra (criar conta nova → cai no onboarding).
- [ ] **Onboarding** persona + perfil → home.
- [ ] **GPS**: app pede permissão de localização → header mostra a **cidade real** (não "Carregando…" travado).
- [ ] **Busca**: digitar "UBS" / "psicólogo" → lista de serviços com distância.
- [ ] **Mapa**: tocar no toggle **Mapa** → aparece o **mapa Leaflet de verdade** com os pins (NÃO o fallback "use no celular" — isso só acontecia no web).
- [ ] **Descobrir**: feed "Você sabia?" desliza.
- [ ] **Jornadas / Salvar / Perfil**: funcionam.
- [ ] **Contribuir** num serviço → modal de celebração.

**Se a cidade não for Joaçaba e a busca vier vazia:** é a dependência abaixo (Edge Function ainda não deployada).

---

## Notas e dependências

1. **Cobertura nacional depende do deploy da Edge Function.** O app resolve a cidade pelo GPS, mas só traz dados de cidade nova depois que a Edge Function `importar-municipio` for deployada (plano `2026-06-01-brasil-on-demand-cnes.md`, passo pendente: `supabase login` + `supabase functions deploy`). Sem isso, no celular: **Joaçaba funciona** (fallback + já importado); outras cidades aparecem no header mas a busca pode vir vazia até o primeiro ingest. **Ordem ideal:** deployar a Edge Function ANTES de testar o APK fora de Joaçaba.

2. **Atualizar o app depois sem rebuildar (OTA):** mudanças só de JS/TS podem ir pro celular via `npx eas update` (configurar `expo-updates` antes). Útil pra ajustes rápidos no dia do pitch sem refazer o `.apk`. Opcional — fica como follow-up.

3. **iPhone:** não há caminho **grátis** pra instalar standalone (Apple cobra US$99/ano). Em iPhone, as alternativas grátis são **Expo Go** (rodando `npx expo start` no PC) ou a versão **web**. O APK só cobre Android.

4. **Free tier EAS:** builds entram em fila e há limite mensal — suficiente pra alguns builds do pitch. Se a fila estiver longa, é só aguardar.

---

## Resumo da ordem de execução

| Passo | Quem | Interativo? |
|---|---|---|
| 1. Conta Expo + `eas login` | Pedro (`!`) | sim |
| 2. `eas init` (projectId) | Pedro/Claude | sim (Yes) |
| 3. criar `eas.json` + colar env | Claude escreve, Pedro cola env | não |
| 4. `app.json` versionCode | Claude | não |
| 5. `eas build` (gera .apk) | Pedro (`!`) | sim (keystore Yes) |
| 6. instalar .apk | Pedro (celular) | sim |
| 7. checklist no device | Pedro | — |

## Execution Options

1. **Inline guiado** (recomendado) — `/executing-plans`: Claude faz as Tasks 3 e 4 (arquivos), e te conduz nos passos interativos 1, 2, 5, 6.
2. **Subagent-driven** — não recomendado aqui: o gargalo são logins interativos teus, não código.
