export type DocumentStatus = 'Pendente' | 'Enviado' | 'Rejeitado' | 'Aprovado';
export type IAStatus = 'Pendente' | 'Processando' | 'Aprovado' | 'Rejeitado';

export interface Dependent {
  id?: string;
  candidato_id?: string;
  nome: string;
  idade: number;
  grau_parentesco: string;
  tem_renda: boolean;
  valor_renda?: number;
}

export interface Document {
  id?: string;
  candidato_id: string;
  tipo_documento: string;
  arquivo_url: string;
  arquivo_original_nome?: string;
  formato_original?: string;
  status_upload: DocumentStatus;
  status_ia: IAStatus;
  confianca_leitura_ia?: number;
  alertas_ia?: any;
  data_emissao_documento?: string;
  data_upload?: string;
  motivo_rejeicao?: string;
  aprovado_pelo_analista: boolean;
  observacao_analista?: string;
  created_at?: string;
  updated_at?: string;
}

export interface FormAnswers {
  candidato_id?: string;
  // Bloco 1: Moradia
  tipo_residencia?: string;
  valor_aluguel?: number;
  teve_imovel_anterior?: boolean;
  venda_registrada_cartorio?: boolean;
  
  // Bloco 2: Escolaridade
  escolaridade?: string;
  
  // Bloco 3: Estado Civil
  estado_civil?: string;
  regime_bens?: string;
  data_casamento?: string;
  
  // Bloco 4: Dependentes
  tem_dependentes?: boolean;
  dependentes?: Dependent[]; // Utilizado para coletar na UI antes de salvar na tabela N:1

  // Bloco 5: Financiamento
  tem_financiamento_habitacional?: boolean;
  data_contrato_habitacional?: string;
  financiamento_habitacional_pos_2005?: boolean;
  tem_financiamento_estudantil?: boolean;
  financiamento_estudantil_em_atraso?: boolean;

  // Bloco 6: Automóvel
  tem_veiculo?: boolean;
  valor_mercado_veiculo?: number;
  veiculo_financiado?: boolean;
  prestacao_veiculo?: number;
  parcelas_restantes_veiculo?: number;

  // Bloco 7: Cartão de Crédito
  tem_cartao_credito?: boolean;
  bandeira_cartao?: string;

  // Bloco 8: Imóveis
  tem_imovel?: boolean;
  valor_mercado_imovel?: number;

  // Bloco 9: Imposto e Conta
  declara_ir?: boolean;
  tem_conta_corrente?: boolean;
  banco_conta_corrente?: string;
  limite_cheque_especial?: number;

  // Bloco 10: Poupança
  tem_poupanca_aplicacao?: boolean;

  // Bloco 11: FGTS
  comprova_36_meses_fgts?: boolean;
  fara_uso_fgts?: boolean;

  // Resumo Renda
  tipo_renda?: string;
  faixa_renda?: string;
  trabalha_aplicativo?: boolean;
}

export interface Candidate {
  id: string; // uuid from Supabase
  nome_completo: string;
  cpf: string;
  telefone: string;
  endereco: string;
  municipio_projeto: string;
  status: string; // 'documentacao_pendente', 'em_analise', 'aguardando_correcao', 'aprovado', 'subsidio_bloqueado', 'sem_renda_comprovavel'
  observacoes_analista?: string;
  narrativa_renda?: string;
  aprovado_em?: string;
  aprovado_por?: string;
  created_at: string;
  updated_at: string;

  // Joined properties / Virtual
  fichas_cadastrais?: FormAnswers;
  documentos?: Document[];
  dependentes?: Dependent[];
}
