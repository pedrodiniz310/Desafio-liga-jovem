-- ============================================================
-- Migration 0010: seed de descobertas universais
-- (servico_codigo NULL, universal = true, descoberta_texto preenchido)
-- texto_cidadao é apenas rótulo interno: universais são excluídas de buscar_servicos.
-- ============================================================

insert into necessidades (slug, texto_cidadao, servico_codigo, icone, descoberta_texto, universal, ativo) values
  -- SUS Invisível
  ('vigilancia-agua', 'vigilância sanitária', null, 'shield-checkmark-outline',
   'A água da sua torneira e a comida do restaurante onde você comeu ontem são fiscalizadas pela Vigilância Sanitária do SUS.',
   true, true),
  ('doacao-sangue', 'doação de sangue', null, 'water-outline',
   'Todo o sangue usado nos hospitais — até nos particulares — vem dos Hemocentros do SUS. Uma única doação salva até 4 vidas.',
   true, true),
  -- PICS (Práticas Integrativas e Complementares)
  ('pics', 'práticas integrativas', null, 'leaf-outline',
   'O SUS oferece acupuntura, yoga, meditação e auriculoterapia de graça — terapias que o plano de saúde raramente cobre.',
   true, true),
  -- Dignidade & Direitos
  ('absorventes', 'dignidade menstrual', null, 'heart-outline',
   'Estudantes e pessoas em vulnerabilidade têm direito a absorventes gratuitos pelo SUS. Pergunte na sua UBS.',
   true, true),
  ('oculos-grau', 'óculos de grau', null, 'eye-outline',
   'Muitos municípios entregam óculos de grau de graça pelo SUS. Não compre sem antes perguntar na sua Unidade Básica de Saúde.',
   true, true),
  ('proteses', 'prótese', null, 'medical-outline',
   'Próteses dentárias e aparelhos auditivos podem ser 100% gratuitos pelo SUS, via CEO e serviços de reabilitação.',
   true, true)
on conflict (slug) do update set
  descoberta_texto = excluded.descoberta_texto,
  icone            = excluded.icone,
  universal        = excluded.universal,
  ativo            = excluded.ativo;
