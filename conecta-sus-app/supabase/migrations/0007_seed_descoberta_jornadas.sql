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
