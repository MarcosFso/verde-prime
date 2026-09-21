const SIM_NAO = [
  ["sim", "Sim"],
  ["nao", "Não"],
];
const SIM_NAO_NV = [
  ["sim", "Sim"],
  ["nao", "Não"],
  ["nao_verificado", "Não verificado"],
];

export const SECTIONS = [
  {
    id: "cabecalho",
    title: "Cadastrante",
    icon: "calendar",
    accent: "#3B4C99",
    fields: [
      { id: "data_visita", label: "Data", type: "date" },
      { id: "tecnico", label: "Técnico", type: "text" },
    ],
  },
  {
    id: "cadista",
    title: "Cadista",
    icon: "map",
    accent: "#8F631F",
    fields: [
      { id: "cadista_nome", label: "Nome", type: "text" },
      { id: "cadista_data", label: "Data", type: "date" },
      { id: "cadista_data_entrega", label: "Data de entrega", type: "date" },
      { id: "cadista_valor", label: "Valor", type: "currency" },
      { id: "cadista_observacoes", label: "Observações", type: "textarea" },
    ],
  },
  {
    id: "proprietario",
    title: "1. Proprietário / Possuidor",
    icon: "user",
    accent: "#2A5EAA",
    fields: [
      { id: "nome", label: "Nome completo *", type: "text", required: true },
      { id: "cpf_cnpj", label: "CPF/CNPJ", type: "text" },
      { id: "telefone", label: "Telefone", type: "text" },
      { id: "email", label: "E-mail", type: "text" },
    ],
  },
  {
    id: "imovel",
    title: "2. Imóvel Rural",
    icon: "home",
    accent: "#2F8F5E",
    fields: [
      { id: "nome_imovel", label: "Nome do imóvel", type: "text" },
      { id: "municipio_uf", label: "Município/UF", type: "text" },
      { id: "area_aproximada", label: "Área (ha)", type: "number" },
      { id: "matricula", label: "Matrícula nº", type: "text" },
      { id: "cartorio", label: "Cartório", type: "text" },
      { id: "ccir", label: "CCIR", type: "text" },
      { id: "possui_sigef", label: "Possui SIGEF?", type: "select", options: SIM_NAO },
      { id: "area_certificada", label: "Área certificada (ha)", type: "number" },
    ],
  },
  {
    id: "car",
    title: "3. Cadastro Ambiental Rural (CAR)",
    icon: "clipboard",
    accent: "#1F8A8A",
    fields: [
      { id: "possui_car", label: "Possui CAR?", type: "select", options: SIM_NAO },
      { id: "numero_car", label: "Nº do CAR", type: "text" },
      {
        id: "situacao_car",
        label: "Situação",
        type: "select",
        options: [
          ["ativo", "Ativo"],
          ["em_analise", "Em análise"],
          ["pendente", "Pendente"],
          ["notificado", "Notificado"],
          ["outro", "Outro"],
        ],
      },
      { id: "sobreposicao", label: "Há sobreposição identificada?", type: "select", options: SIM_NAO_NV },
      { id: "observacoes_car", label: "Observações", type: "textarea" },
    ],
  },
  {
    id: "levantamento",
    title: "4. Levantamento Ambiental Preliminar",
    icon: "sprout",
    accent: "#7A9A2E",
    fields: [
      {
        id: "uso_predominante",
        label: "Uso predominante do imóvel",
        type: "checkboxGroup",
        options: [
          ["pastagem", "Pastagem"],
          ["agricultura", "Agricultura"],
          ["vegetacao_nativa", "Vegetação nativa"],
          ["silvicultura", "Silvicultura"],
          ["outro", "Outro"],
        ],
      },
      { id: "uso_predominante_detalhe", label: 'Detalhamento (se "Outro")', type: "text" },
      { id: "app_curso_dagua", label: "APP / Curso d'água", type: "select", options: SIM_NAO_NV },
      { id: "nascente", label: "Nascente", type: "select", options: SIM_NAO_NV },
      { id: "represa_lagoa", label: "Represa / Lagoa", type: "select", options: SIM_NAO_NV },
      { id: "reserva_legal", label: "Reserva Legal", type: "select", options: SIM_NAO_NV },
      { id: "supressao_vegetacao", label: "Possível supressão de vegetação", type: "select", options: SIM_NAO_NV },
      { id: "desmatamento_anterior", label: "Indícios de desmatamento anterior a 22/07/2008", type: "select", options: SIM_NAO_NV },
      { id: "desmatamento_posterior", label: "Indícios de desmatamento posterior a 22/07/2008", type: "select", options: SIM_NAO_NV },
    ],
  },
  {
    id: "documentacao",
    title: "5. Documentação Apresentada",
    icon: "folder",
    accent: "#C98A2C",
    fields: [
      {
        id: "documentacao",
        label: "Documentos apresentados",
        type: "checkboxGroup",
        options: [
          ["matricula_escritura", "Matrícula / Escritura"],
          ["rg_cpf_cnpj", "RG/CPF ou CNPJ"],
          ["ccir_doc", "CCIR"],
          ["itr", "ITR"],
          ["car_doc", "CAR"],
          ["sigef_planta", "SIGEF / Planta"],
          ["memorial_descritivo", "Memorial descritivo"],
          ["documento_posse", "Documento de posse"],
          ["procuracao", "Procuração"],
          ["outros", "Outros"],
        ],
      },
      { id: "documentacao_detalhe", label: "Outros (detalhar)", type: "text" },
      { id: "documentos_pendentes", label: "Documentos pendentes", type: "textarea" },
    ],
  },
  {
    id: "notificacao",
    title: "6. Notificação / Pendência do CAR",
    icon: "alert",
    accent: "#C1440E",
    fields: [
      { id: "notificacao_sicar", label: "Existe notificação ou pendência no SICAR?", type: "select", options: SIM_NAO },
      { id: "numero_protocolo", label: "Nº do protocolo", type: "text" },
      { id: "data_notificacao", label: "Data da notificação", type: "date" },
      { id: "prazo_atendimento", label: "Prazo para atendimento", type: "date" },
      { id: "motivo_exigencia", label: "Motivo / exigência apresentada", type: "textarea" },
      { id: "providencia_necessaria", label: "Providência necessária", type: "textarea" },
      { id: "documentos_necessarios", label: "Documentos necessários para atendimento", type: "textarea" },
    ],
  },
  {
    id: "obs_tecnicas",
    title: "7. Observações Técnicas",
    icon: "note",
    accent: "#6B6470",
    fields: [{ id: "observacoes_tecnicas", label: "Observações técnicas", type: "textarea", rows: 4 }],
  },
  {
    id: "providencias",
    title: "8. Providências / Serviços a Executar",
    icon: "wrench",
    accent: "#7A4FA3",
    fields: [
      {
        id: "providencias",
        label: "Serviços a executar",
        type: "checkboxGroup",
        options: [
          ["inscricao_car", "Inscrição no CAR"],
          ["retificacao_car", "Retificação do CAR"],
          ["atendimento_notificacao", "Atendimento de notificação"],
          ["analise_ambiental", "Análise ambiental"],
          ["analise_sobreposicao", "Análise de sobreposição"],
          ["levantamento_georreferenciado", "Levantamento georreferenciado"],
          ["regularizacao_ambiental", "Regularização ambiental"],
          ["adequacao_reserva_legal", "Adequação da Reserva Legal"],
          ["regularizacao_app", "Regularização de APP"],
          ["adesao_pra", "Adesão ao PRA"],
          ["recursos_hidricos", "Recursos Hídricos"],
          ["solicitacao_documentos", "Solicitação de documentos"],
          ["outro", "Outro"],
        ],
      },
      { id: "providencias_detalhe", label: "Outro (detalhar)", type: "text" },
    ],
  },
  {
    id: "controle",
    title: "9. Controle do Atendimento",
    icon: "check",
    accent: "#3B4C99",
    fields: [
      { id: "data_prevista_execucao", label: "Data prevista para execução", type: "date" },
      { id: "responsavel_servico", label: "Responsável pelo serviço", type: "text" },
      { id: "data_conclusao", label: "Data de conclusão", type: "date" },
      {
        id: "situacao_atendimento",
        label: "Situação",
        type: "select",
        options: [
          ["aguardando_documentos", "Aguardando documentos"],
          ["em_elaboracao", "Em elaboração"],
          ["protocolado", "Protocolado"],
          ["aguardando_analise", "Aguardando análise do órgão ambiental"],
          ["necessita_complementacao", "Necessita complementação"],
          ["concluido", "Concluído"],
        ],
      },
    ],
  },
  {
    id: "protocolo",
    title: "10. Protocolo",
    icon: "bookmark",
    accent: "#8B5E3C",
    fields: [
      {
        id: "protocolo_tipo",
        label: "Tipo",
        type: "select",
        options: [
          ["sei", "SEI"],
          ["car", "CAR"],
        ],
      },
      { id: "sei_data", label: "Data", type: "date" },
      { id: "sei_processo", label: "Processo", type: "text" },
      { id: "sei_cliente", label: "Cliente", type: "text" },
      {
        id: "sei_acesso",
        label: "Acesso",
        type: "select",
        options: [
          ["publico", "Público"],
          ["restrito", "Restrito"],
          ["sigiloso", "Sigiloso"],
        ],
      },
      { id: "sei_status", label: "Status", type: "text" },
      { id: "sei_andamento", label: "Andamento", type: "textarea" },
    ],
  },
  {
    id: "financeiro",
    title: "11. Financeiro",
    icon: "dollar",
    accent: "#1E8F5F",
    fields: [
      { id: "valor_cobrado", label: "Valor Serviço", type: "currency" },
      {
        id: "forma_pagamento",
        label: "Forma de Pagamento",
        type: "select",
        options: [
          ["pix", "Pix"],
          ["cartao", "Cartão"],
          ["dinheiro", "Dinheiro"],
          ["outro", "Outro"],
        ],
      },
      { id: "observacoes_financeiro", label: "Observações financeiras", type: "textarea" },
    ],
  },
];

export const STATUS_COLORS = {
  aguardando_documentos: "#C98A2C",
  em_elaboracao: "#2E86C1",
  protocolado: "#7A4FA3",
  aguardando_analise: "#C1440E",
  necessita_complementacao: "#B23A3A",
  concluido: "#2F8F5E",
};

export const STATUS_LABELS = Object.fromEntries(
  SECTIONS.find((s) => s.id === "controle").fields.find((f) => f.id === "situacao_atendimento").options
);

export const THEME = {
  ink: "var(--vp-ink)",
  muted: "var(--vp-muted)",
  line: "var(--vp-line)",
  bg: "var(--vp-bg)",
  pageBg: "var(--vp-page-bg)",
  card: "var(--vp-card)",
  cardGlass: "var(--vp-card-glass)",
  brand: "var(--vp-brand)",
  brandDark: "var(--vp-brand-dark)",
  teal: "var(--vp-teal)",
  amber: "var(--vp-amber)",
  danger: "var(--vp-danger)",
  brandTint: "var(--vp-brand-tint)",
  tealTint: "var(--vp-teal-tint)",
  amberTint: "var(--vp-amber-tint)",
  dangerTint: "var(--vp-danger-tint)",
};

export function emptyRecord() {
  const r = { id: null, fotos: [], documentos: [], arquivado: false, historico: [], pagamentos: [], valor_recebido: 0 };
  SECTIONS.forEach((s) => s.fields.forEach((f) => {
    if (f.type === "checkboxGroup") r[f.id] = [];
    else if (f.type === "currency") r[f.id] = 0;
    else r[f.id] = "";
  }));
  return r;
}

/** Converts empty-string number/date fields to null (or 0 for currency) so Postgres accepts them. */
export function sanitizeForDb(record) {
  const clean = { ...record };
  SECTIONS.forEach((s) =>
    s.fields.forEach((f) => {
      if (f.type === "currency" && (clean[f.id] === "" || clean[f.id] === null || clean[f.id] === undefined)) {
        clean[f.id] = 0;
      } else if ((f.type === "number" || f.type === "date") && clean[f.id] === "") {
        clean[f.id] = null;
      }
    })
  );
  return clean;
}
