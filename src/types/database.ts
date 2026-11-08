/**
 * Tipos do banco de dados, no formato que o supabase-js espera.
 *
 * (As linhas são `type` e não `interface`: o supabase-js só aceita assim.)
 *
 * Gerados a partir do projeto no Supabase em 08/11/2026 (ferramenta
 * `generate_typescript_types`) e compactados: Insert e Update derivam de Row.
 * Para atualizar depois de mudar o banco:
 *   npx supabase gen types typescript --project-id <id> > src/types/database.ts
 * (ou peça a regeneração e confira a diferença no git).
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type FichaRow = {
  app_curso_dagua: string | null;
  area_aproximada: number | null;
  area_certificada: number | null;
  area_declarada: number | null;
  arquivado: boolean;
  arquivo_geografico: string | null;
  cadista_data: string | null;
  cadista_data_entrega: string | null;
  cadista_nome: string | null;
  cadista_observacoes: string | null;
  cadista_valor: number | null;
  cartorio: string | null;
  ccir: string | null;
  coordenada_referencia: string | null;
  cpf_cnpj: string | null;
  criado_em: string | null;
  data_conclusao: string | null;
  data_notificacao: string | null;
  data_prevista_execucao: string | null;
  data_visita: string | null;
  desmatamento_anterior: string | null;
  desmatamento_posterior: string | null;
  documentacao: string[] | null;
  documentacao_detalhe: string | null;
  documentos: Json;
  documentos_necessarios: string | null;
  documentos_pendentes: string | null;
  email: string | null;
  excluido_em: string | null;
  forma_pagamento: string | null;
  formato_arquivo: string | null;
  formato_arquivo_detalhe: string | null;
  fotos: Json;
  historico: Json;
  id: string;
  levantamento_gps: string | null;
  matricula: string | null;
  motivo_exigencia: string | null;
  municipio_uf: string | null;
  nascente: string | null;
  nome: string;
  nome_imovel: string | null;
  notificacao_sicar: string | null;
  numero_car: string | null;
  numero_protocolo: string | null;
  observacoes_campo: string | null;
  observacoes_car: string | null;
  observacoes_financeiro: string | null;
  observacoes_tecnicas: string | null;
  outro_car_contiguo: string | null;
  owner_id: string;
  pagamentos: Json | null;
  passivo_ambiental: string | null;
  possui_car: string | null;
  possui_sigef: string | null;
  prazo_atendimento: string | null;
  protocolo_car: string | null;
  protocolo_tipo: string | null;
  providencia_necessaria: string | null;
  providencias: string[] | null;
  providencias_detalhe: string | null;
  recibos: Json | null;
  registro_fotografico: string | null;
  represa_lagoa: string | null;
  reserva_legal: string | null;
  responsavel_servico: string | null;
  sei_acesso: string | null;
  sei_andamento: string | null;
  sei_cliente: string | null;
  sei_data: string | null;
  sei_processo: string | null;
  sei_status: string | null;
  situacao_atendimento: string | null;
  situacao_car: string | null;
  situacao_car_detalhe: string | null;
  sobreposicao: string | null;
  supressao_vegetacao: string | null;
  tecnico: string | null;
  telefone: string | null;
  uso_predominante: string[] | null;
  uso_predominante_detalhe: string | null;
  valor_cobrado: number | null;
  valor_recebido: number | null;
};

export type ProfileRow = {
  created_at: string | null;
  id: string;
  is_active: boolean;
  is_admin: boolean;
  terms_accepted_at: string | null;
  username: string;
};

export type DespesaRow = {
  categoria: string;
  criado_em: string;
  data: string;
  descricao: string;
  id: number;
  owner_id: string;
  valor: number;
};

export type Database = {
  // Exigido pelo supabase-js para escolher a versão certa da API de consultas.
  __InternalSupabase: {
    PostgrestVersion: "14.15";
  };
  public: {
    Tables: {
      fichas: {
        Row: FichaRow;
        Insert: Partial<FichaRow> & Pick<FichaRow, "nome">;
        Update: Partial<FichaRow>;
        Relationships: [];
      };
      profiles: {
        Row: ProfileRow;
        Insert: Partial<ProfileRow> & Pick<ProfileRow, "id" | "username">;
        Update: Partial<ProfileRow>;
        Relationships: [];
      };
      despesas: {
        Row: DespesaRow;
        Insert: Partial<DespesaRow> & Pick<DespesaRow, "descricao" | "owner_id">;
        Update: Partial<DespesaRow>;
        Relationships: [];
      };
    };
    Views: { [_ in never]: never };
    Functions: {
      is_admin: { Args: { uid: string }; Returns: boolean };
    };
    Enums: { [_ in never]: never };
    CompositeTypes: { [_ in never]: never };
  };
};
