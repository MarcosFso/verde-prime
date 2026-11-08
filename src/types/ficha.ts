import type { FichaRow } from "./database";

/** Foto ou documento anexado à ficha (o arquivo em si fica no Storage). */
export interface Anexo {
  path?: string;
  name: string;
  url?: string | null;
  size?: number;
}

export interface Pagamento {
  valor: number;
  data: string;
}

/** Registro de um recibo emitido, guardado dentro da ficha. */
export interface Recibo {
  valor: number;
  cliente?: string;
  /** Data de emissão informada na janela do recibo (AAAA-MM-DD). */
  data?: string;
  imoveis?: string[];
  ts?: string;
}

export interface HistoricoItem {
  ts: string;
  user?: string;
  action: string;
}

// Colunas que não são texto simples.
type ChavesLista = "uso_predominante" | "documentacao" | "providencias";
type ChavesNumero =
  | "area_aproximada"
  | "area_certificada"
  | "area_declarada"
  | "cadista_valor"
  | "valor_cobrado"
  | "valor_recebido";
type ChavesEspeciais =
  | "id"
  | "owner_id"
  | "criado_em"
  | "excluido_em"
  | "arquivado"
  | "fotos"
  | "documentos"
  | "historico"
  | "pagamentos"
  | "recibos"
  | "nome";
type ChavesTexto = Exclude<keyof FichaRow, ChavesLista | ChavesNumero | ChavesEspeciais>;

/**
 * Nome de um campo editável da ficha. É o tipo de `id` na configuração das
 * seções: digitar um nome que não existe no banco passa a ser um erro de
 * compilação, e não um campo que some em silêncio.
 */
export type FichaCampo = ChavesTexto | ChavesLista | ChavesNumero | "nome";

/**
 * A ficha como o app a manipula (no formulário e na lista).
 *
 * Difere da linha do banco (`FichaRow`) em três pontos: os campos de JSON
 * viram listas tipadas; números podem chegar como texto, porque vêm de
 * `<input>`; e `id` é nulo enquanto a ficha ainda não foi salva.
 */
export type Ficha = {
  id: string | null;
  nome: string;
  owner_id?: string;
  criado_em?: string | null;
  excluido_em?: string | null;
  arquivado: boolean;
  fotos: Anexo[];
  documentos: Anexo[];
  historico: HistoricoItem[];
  pagamentos: Pagamento[];
  recibos: Recibo[];
  /** Preenchido só na visão do administrador. */
  _owner_username?: string;
} & { [K in ChavesTexto]?: string | null } & { [K in ChavesLista]?: string[] | null } & {
    [K in ChavesNumero]?: number | string | null;
  };

/** Ficha que já existe no banco (tem id). */
export type FichaSalva = Ficha & { id: string };
