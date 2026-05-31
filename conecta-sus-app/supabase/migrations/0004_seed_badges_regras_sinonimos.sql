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
