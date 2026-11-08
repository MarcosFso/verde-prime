/** Imóvel listado no recibo. */
export interface ImovelRecibo {
  nome: string;
  matricula: string;
}

/** Dados preenchidos na janela "Gerar recibo". */
export interface DadosRecibo {
  nome_cliente: string;
  valor: number;
  servicos: string;
  complemento: string;
  relacao: string;
  imoveis: ImovelRecibo[];
  data: string;
}
