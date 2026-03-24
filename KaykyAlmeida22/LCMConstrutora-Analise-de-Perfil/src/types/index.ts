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
  dependentes?: Dependent[]; 

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
  id: string; 
  nome_completo: string;
  cpf: string;
  telefone: string;
  endereco: string;
  municipio_projeto: string;
  status: string; 
  observacoes_analista?: string;
  narrativa_renda?: string;
  aprovado_em?: string;
  aprovado_por?: string;
  created_at: string;
  updated_at: string;

  fichas_cadastrais?: FormAnswers;
  documentos?: Document[];
  dependentes?: Dependent[];
}

export interface SelectOption {
  value: string;
  label: string;
}

export interface FormField {
  id: keyof FormAnswers;
  label: string;
  type: 'text' | 'number' | 'email' | 'select' | 'boolean' | 'date';
  required?: boolean;
  options?: SelectOption[];
  helpText?: string;
  conditionalOn?: {
    field: keyof FormAnswers;
    value: any;
  };
}

export interface FormStep {
  id: string;
  title: string;
  description: string;
  questions: FormField[];
}

export type CandidateStatus = 
  | 'documentacao_pendente'
  | 'em_analise'
  | 'aguardando_correcao'
  | 'aprovado'
  | 'subsidio_bloqueado'
  | 'sem_renda_comprovavel';

export const STATUS_LABELS: Record<CandidateStatus, string> = {
  documentacao_pendente: 'Doc. Pendente',
  em_analise: 'Em Análise',
  aguardando_correcao: 'Ag. Correção',
  aprovado: 'Aprovado',
  subsidio_bloqueado: 'Subsídio Bloq.',
  sem_renda_comprovavel: 'Sem Renda',
};

export const STATUS_COLORS: Record<CandidateStatus, string> = {
  documentacao_pendente: '#eab308',
  em_analise: '#3b82f6',
  aguardando_correcao: '#f97316',
  aprovado: '#10b981',
  subsidio_bloqueado: '#ef4444',
  sem_renda_comprovavel: '#991b1b',
};

export type DocumentType = 
  | 'identidade_rg_cnh'
  | 'cpf_separado'
  | 'certidao_nascimento'
  | 'certidao_casamento'
  | 'certidao_casamento_divorcio'
  | 'certidao_uniao_estavel'
  | 'pacto_antenupcial'
  | 'comprovante_endereco'
  | 'comprovante_residencia_3anos'
  | 'ctps_digital'
  | 'contra_cheque'
  | 'comprovante_imposto_pro_labore'
  | 'declaracao_ir'
  | 'extrato_bancario'
  | 'fatura_cartao_credito'
  | 'declaracao_aplicativo_uber_99_ifood'
  | 'cnpj_mei'
  | 'contrato_social_mei'
  | 'das_mei'
  | 'extrato_fgts'
  | 'certidao_nascimento_dependente'
  | 'comprovacao_responsabilidade_legal_dependente'
  | 'outros';

export interface ValidationResult {
  documentId: string;
  confidence: number;
  isValid: boolean;
  issues: string[];
  extractedData: Record<string, string>;
  qualityScore: number;
  expiryCheck?: {
    isExpired: boolean;
    daysRemaining: number;
    message: string;
  };
}
