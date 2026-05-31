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
