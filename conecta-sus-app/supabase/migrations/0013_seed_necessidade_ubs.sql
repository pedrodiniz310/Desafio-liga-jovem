-- ============================================================
-- Migration 0013: necessidade para atencao_basica (UBS / Posto de Saúde)
-- Era o único servico_codigo sem necessidade correspondente.
-- ============================================================

insert into necessidades (slug, texto_cidadao, sinonimos, servico_codigo, icone, descoberta_texto) values
(
  'ubs',
  'posto de saúde',
  array[
    'UBS', 'unidade básica', 'unidade de saúde', 'posto', 'consulta médica',
    'médico', 'clínico geral', 'médico de família', 'médico da família',
    'pediatra', 'pediatria', 'check-up', 'consulta', 'atendimento médico',
    'exame de rotina', 'exame básico', 'pressão alta', 'hipertensão',
    'glicemia', 'colesterol', 'atendimento básico', 'atendimento primário',
    'agente de saúde', 'saúde da família', 'ESF', 'PSF',
    'estratégia saúde família', 'saúde básica', 'cuidado básico'
  ],
  'atencao_basica',
  'medkit-outline',
  'Consulta médica, exame de rotina e acompanhamento de saúde são 100% GRATUITOS na UBS do seu bairro.'
)
on conflict (slug) do nothing;
