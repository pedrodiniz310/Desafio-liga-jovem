# Viabilidade Técnica: Arquitetura Geográfica (PostGIS)

Este documento detalha as decisões de arquitetura de dados e busca espacial do projeto **Tem no SUS!**, servindo como base técnica e argumento de "Viabilidade" para os jurados do **Desafio Liga Jovem**.

## Por que a nossa busca é eficiente e escalável?

O aplicativo "Tem no SUS!" utiliza o padrão da indústria para dados espaciais: **PostgreSQL + PostGIS** (através do Supabase). Não realizamos cálculos matemáticos simples (como o Teorema de Pitágoras) direto no aplicativo do usuário. Em vez disso, deixamos que o banco de dados resolva a complexidade geográfica.

### 1. Escalabilidade Real com Índice GiST
Na nossa migration inicial, criamos um índice geográfico especializado para os estabelecimentos:
```sql
create index if not exists idx_estab_geo on estabelecimentos using gist (localizacao);
```
**O impacto:** Isso significa que a base está preparada para receber as mais de **45.000 Unidades Básicas de Saúde (UBSs)** do Brasil. Quando o usuário busca algo num raio de 15km (`st_dwithin`), o índice GiST funciona como uma "árvore de busca espacial", descartando rapidamente estados e cidades inteiras da consulta. O resultado é devolvido em milissegundos.

### 2. Precisão Geográfica (Curvatura da Terra)
Utilizamos o tipo `geography(point, 4326)` no banco de dados em vez da simples geometria plana.
**O impacto:** A geometria plana gera grandes distorções dependendo da posição no globo porque a Terra é redonda. O tipo `geography` calcula a distância exata em metros seguindo a curvatura da Terra, garantindo que a rota sugerida ao paciente seja extremamente precisa.

### 3. Computação no Servidor = Economia de Dados (4G)
Nossa lógica de busca roda 100% no banco de dados (via RPC `buscar_servicos` e `buscar_descobertas`).
**O impacto para o público-alvo:** Se o app trouxesse as informações de todos os hospitais para processar a distância dentro do celular (React Native), ele travaria os celulares mais antigos e gastaria muita internet (4G) do cidadão. Ao fazer a filtragem no servidor (nuvem) e retornar apenas os 10-30 estabelecimentos mais próximos, o consumo de banda de internet é quase **zero**, o que é um argumento fortíssimo de **Acessibilidade e Viabilidade** para populações vulneráveis.

---

## 🎤 Sugerindo o Discurso no Pitch (Elevator Pitch)

> *"Nossa arquitetura já nasce pronta para o Brasil inteiro. Não usamos cálculos amadores no aplicativo. Construímos um motor de busca semântico aliado ao PostGIS (padrão ouro em geolocalização) no nosso banco de dados. Isso significa que podemos cadastrar todas as 45 mil UBSs do Brasil amanhã, e a busca continuará levando milissegundos e consumindo quase zero da franquia de dados (4G) da população, pois todo o processamento geográfico ocorre na nuvem."*
