// Conteúdo do "O que levar e como se preparar" por tipo de serviço.
// Baseado nas exigências padrão do SUS. Tom: orientação amigável (Pingo),
// nunca conselho médico. Itens marcados "(se tiver)" são opcionais.

export interface PreparoItem {
  texto: string;
  opcional?: boolean;
}

export interface Preparo {
  fala: string; // fala curta do Pingo
  itens: PreparoItem[];
  dica?: string; // dica de como se preparar / o que esperar
}

const BASE: PreparoItem[] = [
  { texto: "Documento com foto (RG ou CNH)" },
  { texto: "CPF" },
  { texto: "Cartão Nacional de Saúde (Cartão SUS)" },
  { texto: "Comprovante de residência" },
];

/**
 * Monta o preparo a partir do tipo de unidade (descricao_tipo_unidade do CNES)
 * e do nome do estabelecimento. Cai num preparo geral quando não reconhece.
 */
export function preparoParaServico(tipo: string | null, nome: string | null): Preparo {
  const t = normalizar(`${tipo ?? ""} ${nome ?? ""}`);

  // Farmácia Popular
  if (/FARMAC/.test(t)) {
    return {
      fala: "Vai pegar remédio? Pra retirar de graça, o que importa é a receita.",
      itens: [
        { texto: "Receita médica dentro da validade" },
        { texto: "CPF" },
        { texto: "Documento com foto (RG ou CNH)" },
        { texto: "Cartão SUS", opcional: true },
      ],
      dica: "A receita precisa estar legível e dentro do prazo. Remédios de pressão, diabetes e asma saem sem pagar nada.",
    };
  }

  // CAPS — saúde mental
  if (/PSICOSSOCIAL|CAPS|SAUDE MENTAL/.test(t)) {
    return {
      fala: "No CAPS você não precisa marcar hora: é porta aberta, pode chegar e ser acolhido.",
      itens: [
        ...BASE,
        { texto: "Encaminhamento da UBS", opcional: true },
        { texto: "Lista dos remédios que você usa", opcional: true },
      ],
      dica: "Pode ir sozinho ou com alguém de confiança. O atendimento é gratuito e sigiloso.",
    };
  }

  // CER / reabilitação / fisioterapia
  if (/REABIL|FISIOTER|\bCER\b/.test(t)) {
    return {
      fala: "Pra reabilitação, leve o que o médico já pediu — ajuda a agilizar.",
      itens: [
        ...BASE,
        { texto: "Encaminhamento ou laudo médico" },
        { texto: "Exames que você já tem (se houver)", opcional: true },
      ],
      dica: "Use roupa confortável no dia da fisioterapia.",
    };
  }

  // CEO — odontologia especializada
  if (/ODONTO|SAUDE BUCAL|\bCEO\b/.test(t)) {
    return {
      fala: "Pra tratamento no dentista especializado, normalmente vem encaminhado da UBS.",
      itens: [...BASE, { texto: "Encaminhamento da UBS" }],
      dica: "Canal, extração e prótese são gratuitos pelo SUS no CEO.",
    };
  }

  // UBS / Atenção básica
  if (/UNIDADE BASICA|CENTRO DE SAUDE|POSTO DE SAUDE|SAUDE DA FAMILIA|\bUBS\b|\bESF\b/.test(t)) {
    return {
      fala: "Na UBS é seu ponto de partida no SUS. Com esses documentos você é atendido.",
      itens: [
        ...BASE,
        { texto: "Caderneta de vacinação (se for vacinar)", opcional: true },
        { texto: "Cartão da gestante (se estiver grávida)", opcional: true },
      ],
      dica: "Chegue cedo para consultas por ordem de chegada. Procure a recepção ao chegar.",
    };
  }

  // Geral
  return {
    fala: "Antes de ir, separe seus documentos — assim você é atendido sem voltar pra casa.",
    itens: BASE,
    dica: "Na dúvida, ligue antes para confirmar o horário de atendimento.",
  };
}

function normalizar(v: string): string {
  return v.normalize("NFD").replace(/\p{Diacritic}/gu, "").toUpperCase();
}
