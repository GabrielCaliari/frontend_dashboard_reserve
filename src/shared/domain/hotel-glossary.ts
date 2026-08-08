export type GlossaryKey =
  | "investimento"
  | "pessoas_alcancadas"
  | "visualizacoes"
  | "conversas_iniciadas"
  | "custo_por_conversa"
  | "frequencia"
  | "leads_qualificados"
  | "leads_prontos_fechar"
  | "taxa_qualificacao"
  | "seguidores"
  | "alcance_organico"
  | "engajamento"
  | "taxa_engajamento";

export interface GlossaryEntry {
  label: string;
  tooltip: string;
}

export const glossary: Record<GlossaryKey, GlossaryEntry> = {
  investimento: {
    label: "Investimento",
    tooltip: "Quanto foi investido em anúncios neste período",
  },
  pessoas_alcancadas: {
    label: "Pessoas alcançadas",
    tooltip: "Quantas pessoas diferentes viram seus anúncios",
  },
  visualizacoes: {
    label: "Visualizações",
    tooltip: "Quantas vezes seus anúncios apareceram",
  },
  conversas_iniciadas: {
    label: "Conversas iniciadas",
    tooltip: "Quantas pessoas clicaram e abriram conversa no WhatsApp",
  },
  custo_por_conversa: {
    label: "Custo por conversa",
    tooltip: "Quanto custou, em média, cada pessoa que chamou no WhatsApp",
  },
  frequencia: {
    label: "Frequência",
    tooltip: "Quantas vezes, em média, cada pessoa viu o anúncio",
  },
  leads_qualificados: {
    label: "Leads qualificados",
    tooltip: "Conversas que avançaram no atendimento e já foram entendidas como interesse real",
  },
  leads_prontos_fechar: {
    label: "Leads prontos para fechar",
    tooltip: "Conversas no ponto em que a Reserve entrega para o hotel fechar a reserva",
  },
  taxa_qualificacao: {
    label: "Taxa de qualificação",
    tooltip: "De cada 100 conversas, quantas avançam para qualificado",
  },
  seguidores: {
    label: "Seguidores",
    tooltip: "Total de seguidores da sua conta no Instagram",
  },
  alcance_organico: {
    label: "Alcance orgânico",
    tooltip: "Quantas contas diferentes viram seu conteúdo sem impulsionamento pago",
  },
  engajamento: {
    label: "Engajamento",
    tooltip: "Curtidas, comentários, salvamentos e compartilhamentos somados",
  },
  taxa_engajamento: {
    label: "Taxa de engajamento",
    tooltip: "Engajamento dividido pelo alcance, em percentual",
  },
};
