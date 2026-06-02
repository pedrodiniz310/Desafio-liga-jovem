# Pingo — Mascote do "Tem no SUS!" (identidade de marca)

> Decidido em 01/06/2026 via brainstorming. Desafio Liga Jovem 2026.
> Status: **IMPLEMENTADO** (01/06/2026) — asset (4 poses SVG) + componente `src/components/pingo.tsx` (SvgXml). Aparece em: seção "O que levar e como se preparar" (detalhe), busca vazia, **salvos vazio, descobrir vazio, banner "carregando cidade", onboarding boas-vindas, modal de celebração**. Commits `6843298`, `4747ed2`. Poses extra possíveis (comemorando 🎉 / "ops") = futuro.

## Conceito

**Pingo** é o **pin de localização do app ganhando vida** — um marcador de mapa cor laranja-coral, simpático, que **guia o cidadão até os serviços gratuitos do SUS** e o ajuda a se preparar (o que levar, como se preparar). É um *companheiro de saúde*: confiável, acolhedor, prestativo, brasileiro. Não é chatbot — é a "voz amiga" que personifica a ajuda do app.

## Nome

**Pingo** — escolhido sobre Zeca (rejeitado: cafona), Guido, Norte, Bento.
Razão: junta **forma** (o pin/pontinho), **calor** (afetivo sem ser infantil) e **acessibilidade** (todo mundo fala e guarda — inclui idoso/baixa escolaridade). Vira quase slogan: *"O Pingo te mostra onde tem no SUS."*

## Arquétipo / forma visual

- Corpo = pin de mapa (gota com ponta para baixo), arredondado e fofo.
- O furo branco circular clássico do pin vira o rosto.
- Rosto simples e amigável: dois olhos redondos + sorriso gentil.
- Bracinhos curtos — um apontando/indicando o caminho (gesto de guia).
- Opcional: pequena cruz médica branca no corpo (liga ao ícone do app).
- Estilo: vetorial flat moderno, limpo, arredondado, minimalista; qualidade de mascote de app premium; atemporal; **NÃO** infantil/cafona/realista.

## Paleta

| Uso | Cor |
|---|---|
| Corpo do Pingo | laranja-coral `#F2683C` (ou `#d65a3c`) |
| Apoio/contornos | verde pinheiro `#0d6a51`, verde escuro `#073b2e` |
| Fundo | creme `#f6f3ea` ou transparente |

## Tom de voz

- 2ª pessoa ("você"), frases curtas, calor sem infantilizar.
- Encoraja e tranquiliza ("pode ir tranquilo", "é seu por direito").
- Sempre reforça **gratuito pelo SUS**.
- Usa checklists com ✅.
- **NUNCA** dá conselho médico — só orienta navegação/preparo/direitos.
- Exemplo: *"Oi! Eu sou o Pingo. Pra ir nessa UBS, leve: ✅ RG ✅ Cartão SUS. Chegando, procure a recepção."*

## Onde o Pingo aparece

Feature **"O que levar e como se preparar"** na tela de detalhe do serviço (`src/app/servico/[id].tsx`) — uma seção em formato de checklist, **personificada pelo Pingo** (opção A do grill). Evoluível depois para painel personalizado (cruzar persona/salvos) e helper contextual em outras telas.

## Prompt para gerar no Claude Design

```
Crie um mascote chamado "Pingo" para o app de saúde pública "Tem no SUS!".

CONCEITO: o Pingo é o PIN DE LOCALIZAÇÃO do app ganhando vida — um
marcador de mapa (formato de gota com a ponta para baixo) na cor laranja-
coral, simpático, que guia o cidadão até os serviços gratuitos do SUS.
É um "companheiro de saúde": confiável, acolhedor, prestativo, brasileiro.

FORMA:
- Corpo = pin de mapa (gota/lágrima com ponta para baixo), arredondado e fofo.
- O furo branco circular clássico do pin vira o rosto.
- Rosto amigável e simples: dois olhos redondos, sorriso gentil e acolhedor.
- Bracinhos curtos — um deles apontando/indicando o caminho (gesto de guia).
- Opcional: uma pequena cruz médica branca no corpo (liga ao ícone do app).

ESTILO:
- Ilustração vetorial flat moderna, traços limpos e arredondados, minimalista.
- Qualidade de mascote de app premium. Cores chapadas + sombras suaves sutis.
- Atemporal: agrada de criança a idoso. NÃO infantil, NÃO cafona, NÃO
  realista, sem degradês pesados, sem excesso de detalhe.

CORES (marca):
- Corpo: laranja-coral #F2683C (ou #d65a3c).
- Apoio/contornos: verde pinheiro #0d6a51 e verde escuro #073b2e.
- Fundo: creme #f6f3ea (ou transparente).

GERAR UM SET DE POSES:
1. Pingo de frente, sorrindo, acenando "oi".
2. Pingo apontando o caminho (gesto de guia).
3. Pingo segurando uma pranchetinha/checklist (para o recurso "o que levar").
4. Versão busto/ícone pequeno (para listas e botões).

TÉCNICO: fundo transparente, vetorial/SVG-friendly, legível tanto pequeno
(24–48px) quanto grande. Sem nenhum texto dentro da imagem.
```

## Decisões em aberto (resolver no plano de implementação da seção "O que levar")

- Fonte dos dados do checklist: mapa estático por `servico_codigo` (recomendado) vs tabela no banco.
- Agregação por estabelecimento (UBS = vários serviços) → qual checklist mostrar.
- Checkboxes interativos/persistidos (como progresso de jornada) vs lista visual.
- Conteúdo: documentos por serviço (RG, CPF, Cartão SUS, comprovante de residência, encaminhamento, receita…) — validar com fonte confiável.
