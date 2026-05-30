# Desafio Liga Jovem 4ª Edição — Banco de Ideias (Geração 3 + Geração 2)

> **Geração 3** adicionada em 2026-05-29 — fórmula dos vencedores: produto físico como núcleo, resíduos regionais transformados, demonstrável em 5 minutos.
> **Geração 2** brainstorm multi-AI realizado em 2026-05-29 — ideias completamente novas, sem repetir temas da geração anterior.

## Contexto Regional: Meio Oeste Catarinense

- Economia forte em agroindústria (BRF, frigoríficos, laticínios), suinocultura, avicultura e pequenas propriedades rurais familiares
- UNIARP e UNOESC em Joaçaba — polo universitário
- Rio do Peixe corta a região
- Descendentes italianos, cidades pequenas/médias (~300k pessoas)
- Desafios explorados nesta rodada: lesão de trabalhadores, informalidade rural, risco climático, ofícios tácitos, certificação

---

## Critérios de Avaliação

| Critério | Peso |
|---|---|
| Entendimento do público-alvo | 1–5 |
| Criatividade e Inovação | 1–5 |
| Impacto comunitário | 1–5 |
| Sustentabilidade financeira | 1–5 |
| Protótipo | 1–5 |

---

## Ranking das Melhores Ideias

| # | Ideia | Pontos fortes | Origem |
|---|---|---|---|
| ⭐⭐⭐⭐⭐ | CicatriFrig | Paradoxo único, sindicato paga, app simples, protótipo real | 🔵 Claude |
| ⭐⭐⭐⭐⭐ | OficioVivo | Resolve êxodo pela raiz, SEBRAE financia, conceito inédito | 🔵 Claude |
| ⭐⭐⭐⭐⭐ | Cria Certa | Bem-estar animal como poder de barganha, universitários como auditores | 🟡 Gemini |
| ⭐⭐⭐⭐ | SafraSeca | Risco climático invisível nomeado pela primeira vez, cooperativas pagam | 🔵 Claude |
| ⭐⭐⭐⭐ | RaízCerta | Protocolo de confiança para artesanais premium, municipios co-financiam | 🔵 Claude |
| ⭐⭐⭐⭐ | Diária Direita | LinkedIn rural, modelo simples, impacto imediato | 🟡 Gemini |
| ⭐⭐⭐ | Ritmo Certo | Boa analogia (manutenção preditiva), mas empresa como pagante cria conflito | 🟡 Gemini |
| ⭐⭐⭐ | Nossa Horta, Nossa Loja | Resolve dois problemas, mas matchmaking é difícil de sustentar | 🟡 Gemini |

---

## Ideias Detalhadas

---

### ⭐⭐⭐⭐⭐ CicatriFrig `🔵 Claude`

**O problema:** Trabalhadores de linha de abate — especialmente mulheres na evisceração e no corte de peito — desenvolvem LER/DORT em 3 a 7 anos, mas o processo de reconhecimento como doença ocupacional leva anos por falta de documentação longitudinal. O frigorífico tem os dados de produtividade; o trabalhador não tem nenhum dado sobre seu próprio corpo no trabalho. É uma assimetria de informação sobre saúde física.

**A ideia:** App mobile (FlutterFlow + Supabase) onde o trabalhador registra, ao final do turno, sintomas em um "mapa corporal" (toque em silhueta humana), nível de dor 1–5, função exercida no dia e foto opcional de EPIs usados. Os dados ficam em custódia do trabalhador — não da empresa. Após 90 dias, gera um PDF cronológico assinado digitalmente para perícia do INSS ou ação trabalhista.

**Sustentabilidade:** Sindicatos dos trabalhadores (STIA) pagam R$8/trabalhador/mês como benefício aos filiados. Escritórios de advocacia trabalhista pagam R$200/mês por painel anonimizado de tendências de lesão. Receita projetada: R$4.000–R$12.000/mês com 500–1.500 usuários.

**Público-alvo:** Mulheres abatedoras de 30–55 anos na evisceração/corte, 3+ anos de empresa, filiadas ao sindicato, que já sentiram dor mas nunca formalizaram por medo de demissão.

**Paradoxo central — "corpo como ativo invisível":** O trabalhador industrial usa o corpo como meio de produção mas não tem nenhum instrumento de contabilidade desse ativo. Toda a literatura de saúde do trabalhador foca em prevenção pela empresa; nenhuma ferramenta devolve a soberania do dado ao trabalhador. A dor é normalizada como "parte do serviço" — isso é o problema tão entranhado que ninguém o nomeia como problema de informação.

---

### ⭐⭐⭐⭐⭐ OficioVivo `🔵 Claude`

**O problema:** Jovens de 18–28 anos no Meio Oeste aprenderam ofícios de altíssimo valor econômico com pais e avós — inseminação artificial de suínos, castração a laser de leitões, manutenção de sistemas de ventilação de aviários, análise visual de qualidade de leite — mas nunca formalizaram esse conhecimento, não sabem quanto cobrar, e prestam serviço para 2–5 vizinhos por valor muito abaixo do mercado. Migram para frigoríficos ou para Chapecó não por falta de oportunidade, mas por invisibilidade.

**A ideia:** App (FlutterFlow + Supabase) com duas telas: para o jovem prestador — cadastro do ofício com vídeo de 60 segundos demonstrando a habilidade, área de atuação, disponibilidade, precificação sugerida pelo app baseada em tabela colaborativa. Para o produtor rural — busca por serviço + distância, visualiza o vídeo, contrata, avalia. O app gera "Ordem de Serviço Digital" que serve como comprovante para MEI e histórico de reputação. Módulo SEBRAE de abertura de MEI em 3 passos integrado ao app.

**Sustentabilidade:** SEBRAE-SC paga R$60.000–R$100.000 por projeto de formalização de jovens empreendedores rurais (linha existente). Sindicatos Rurais municipais pagam R$200/mês pelo banco de prestadores. Comissão de 3% sobre ordens de serviço acima de R$500 após escala.

**Público-alvo:** Jovens rurais de 18–28 anos, filhos de produtores integrados, sem universidade ou no primeiro ano de curso técnico, que prestam serviços informais e têm smartphone mas nunca pensaram em formalizar o que fazem.

**Paradoxo central — "conhecimento invisível por familiaridade":** Inseminação de suínos vale R$150–R$300/visita no mercado formal, mas o jovem que faz isso desde os 14 anos não enxerga como habilidade porque "todo mundo aqui sabe isso". A ferramenta não ensina nada novo — torna legível para o jovem o valor econômico do que ele já sabe. O êxodo rural nesse caso não é fuga da pobreza, é fuga da invisibilidade.

---

### ⭐⭐⭐⭐⭐ Cria Certa `🟡 Gemini`

**O problema:** Pequenos suinocultores e avicultores são "price takers" espremidos pelas integradoras, com pouca margem para negociar. Consumidores urbanos se interessam por consumo ético mas não há selo regional que traduza boas práticas de pequenos produtores em valor de mercado.

**A ideia:** Selo de certificação de bem-estar animal hiperlocal, desenvolvido com os cursos de Veterinária e Agronomia das universidades locais. O protocolo "Cria Certa" estabelece critérios auditáveis e alcançáveis para granjas familiares (m² por animal, ausência de antibióticos preventivos, enriquecimento ambiental). Produtores se cadastram e usam app para documentar conformidade. Estudantes universitários são treinados e remunerados para fazer auditorias periódicas. O produto final recebe QR Code que leva o consumidor ao perfil da fazenda com "score" de bem-estar.

**Sustentabilidade:** Produtores certificados pagam anuidade de R$600/ano (cobre auditorias + plataforma). Retorno via acesso a açougues premium e restaurantes com preço superior. Universidades co-financiam como extensão remunerada.

**Público-alvo:** Suinocultores e avicultores de base familiar + estudantes de ciências agrárias.

**Por que é não-óbvio:** Transforma bem-estar animal de custo/barreira em ativo de marketing tangível — analogia com "Fair Trade" para café. Cria cadeia de valor paralela e premium, dando poder de barganha ao pequeno produtor e conectando a universidade ao principal setor econômico da região de forma prática e remunerada.

---

### ⭐⭐⭐⭐ SafraSeca `🔵 Claude`

**O problema:** Produtores integrados à BRF ou Aurora acreditam que o risco climático é da integradora. Na prática, eventos extremos (seca, enchentes, ondas de calor) geram perdas 100% com o produtor — custo de energia extra, mortalidade não coberta, antecipação de insumos. Nenhum produtor integrado da região tem qualquer ferramenta para quantificar esse risco antes que aconteça.

**A ideia:** Web app (browser, sem app store — FlutterFlow Web + Supabase) onde o produtor entra com dados básicos (tipo de integração, número de animais, ciclos/ano, custo fixo mensal). O sistema cruza com dados históricos climáticos do CIRAM/Epagri para o município e simula 3 cenários (normal, seca moderada, evento extremo), mostrando em reais quanto perderia e qual reserva de emergência é recomendada. Gera relatório de 1 página para levar ao banco ou cooperativa de crédito.

**Sustentabilidade:** Cooperativas de crédito rurais (Cresol, Sicredi) pagam R$500–R$1.500/mês por licença white-label — reduz inadimplência e gera demanda por produtos de seguro. Epagri/Estado paga projeto-piloto de R$40.000–R$80.000 para validação com 200 produtores.

**Público-alvo:** Produtores integrados de suínos, 35–55 anos, com financiamento ativo de estrutura (PRONAF), associados a cooperativa de crédito, que já tiveram perda não ressarcida e "engoliu o prejuízo" sem entender por quê.

**Paradoxo central — "risco transferido mas não eliminado":** O modelo de integração vende ao produtor a narrativa de que a empresa assume o risco de mercado. O produtor acredita nisso e não desenvolve cultura de reserva. O risco climático — distinto do risco de mercado — permanece 100% com o produtor e nunca foi nomeado claramente.

---

### ⭐⭐⭐⭐ RaízCerta `🔵 Claude`

**O problema:** O Meio Oeste produz queijo colonial, salame artesanal, banha de porco, mel e vinho de uva bordô de altíssima qualidade gastronômica — mas tudo é vendido na informalidade sem identidade de origem. O turismo gastronômico de Florianópolis e Balneário Camboriú busca "autenticidade colonial" mas não consegue conectar com produtores reais por falta de verificação mínima de confiança.

**A ideia:** Plataforma web + app leve onde produtores criam "perfil de fazenda" com geolocalização, fotos do processo, documentação sanitária e catálogo de produtos sazonais. Compradores (restaurantes, empórios gourmet, grupos de assinatura) fazem buscas por produto + distância + tipo de certificação. App gera QR Code de rastreio para a embalagem — consumidor escaneia e vê a fazenda de origem.

**Sustentabilidade:** Produtores pagam R$39/mês (isenção nos 3 primeiros meses). Compradores pagam R$99/mês por acesso ilimitado. Municípios do Consórcio Intermunicipal pagam patrocínio anual de R$15.000–R$30.000 pelo logo "Origem Meio Oeste".

**Público-alvo:** Produtores rurais familiares de 45–65 anos com produção artesanal consolidada mas sem canal de venda fora da cidade natal + filhos de 18–30 anos que fazem gestão digital da propriedade.

**Paradoxo central — "invisibilidade voluntária":** Produtores com produto superior ao industrial se mantêm invisíveis por falta de protocolo de confiança + cultura de humildade colonial. A solução não é marketing; é infraestrutura de confiança mínima que permite um comprador em Florianópolis confiar num desconhecido em Tangará sem visitar a fazenda.

---

### ⭐⭐⭐⭐ Diária Direita `🟡 Gemini`

**O problema:** Trabalhadores rurais informais têm vasta experiência mas nenhuma forma de comprová-la. Sua reputação é "boca a boca" e restrita a um pequeno círculo — dificulta negociação por melhores diárias e expõe contratantes ao risco de contratar sem referências.

**A ideia:** App onde o trabalhador cria perfil com foto e habilidades. Ao final do trabalho, o contratante valida a experiência via QR Code do app. A validação é objetiva: "Trabalhou de [data] a [data] na [Fazenda X]. Tarefa: [Colheita de uva]. Acordo cumprido: Sim/Não". Com o tempo, o trabalhador constrói um currículo de experiências verificadas e portável.

**Sustentabilidade:** Uso gratuito para o trabalhador. Contratantes pagam R$2 por validação (via PIX). Sindicatos rurais e cooperativas podem patrocinar para acesso a banco de mão-de-obra qualificada.

**Público-alvo:** Trabalhadores rurais sazonais e informais + pequenos e médios produtores que os contratam.

**Por que é não-óbvio:** Foge da complexidade da formalização legal (CLT). Foca na formalização da reputação — analogia com "LinkedIn para o campo" onde a moeda é experiência prática verificada, não diploma.

---

### ⭐⭐⭐ Ritmo Certo `🟡 Gemini`

**O problema:** Pausas em frigoríficos são padronizadas e não consideram fadiga individual — levando a afastamentos e custos para as empresas.

**A ideia:** App + sensor simples (acelerômetro do próprio celular em braçadeira) que monitora padrões de movimento do trabalhador na linha de produção. Detecta micro-variações que indicam fadiga muscular e envia alerta para rotação de função antes da exaustão.

**Sustentabilidade:** Frigoríficos pagam assinatura de R$25/trabalhador/mês. ROI vem de redução de afastamentos médicos.

**Público-alvo:** Trabalhadores na linha de desossa e seus supervisores.

**Por que é não-óbvio:** Analogia com manutenção preditiva de máquinas — trata o trabalhador como ativo de performance, não item de compliance.

**Atenção:** Modelo de sustentabilidade (empresa paga) cria conflito de interesse — empresa pode usar os dados contra o trabalhador. Considerar se é possível inverter para modelo sindicato/trabalhador (como no CicatriFrig).

---

### ⭐⭐⭐ Nossa Horta, Nossa Loja `🟡 Gemini`

**O problema:** Pequenos produtores rurais têm produtos de alta qualidade mas sem tempo/habilidade para gestão digital. Jovens universitários com habilidades digitais deixam a região por falta de oportunidade.

**A ideia:** Plataforma que conecta estudantes da UNIARP/UNOESC a pequenos produtores. O estudante cria presença digital (Instagram, WhatsApp Business, fotos) e ensina o produtor a gerenciar pedidos. Produtor paga R$250 de setup + 8% de comissão (5% para o estudante, 3% para a plataforma).

**Público-alvo:** Produtores da agricultura familiar + estudantes de comunicação/administração/TI.

**Por que é não-óbvio:** O verdadeiro produto é a mentoria disfarçada de plataforma — resolve escoamento do agricultor e "primeiro emprego qualificado" do jovem simultaneamente.

---

## Conceitos-Chave Nomeados (Geração 2)

> Conceitos emergentes desta rodada de brainstorming:

- **"Corpo como ativo invisível"** — trabalhador industrial não possui dados sobre seu próprio ativo produtivo principal
- **"Conhecimento invisível por familiaridade"** — habilidades rurais desvalorizadas por quem as possui por considerar óbvias
- **"Risco transferido mas não eliminado"** — integração cria ilusão de proteção que impede resiliência real
- **"Invisibilidade voluntária"** — produtor com produto superior ao industrial fica fora do mercado por ausência de protocolo de confiança
- **"Formalização da reputação"** — alternativa à formalização legal (CLT) para mercado informal rural

---

## Sessão Multi-AI — Metadados

| Provider | Status | Contribuição |
|---|---|---|
| 🟡 Gemini CLI (gemini-2.5-pro) | ✓ Ativo | 4 ideias: Ritmo Certo, Nossa Horta, Cria Certa, Diária Direita |
| 🔵 Claude (claude-sonnet-4-6) | ✓ Ativo | 4 ideias: CicatriFrig, RaízCerta, SafraSeca, OficioVivo |
| 🔴 Codex CLI | ✗ Falhou | Nenhum modelo disponível (gpt-5.3, gpt-5.4, o3 não suportados na conta ChatGPT) |

*Sessão realizada em 2026-05-29 — Geração 2, ideias completamente novas*
