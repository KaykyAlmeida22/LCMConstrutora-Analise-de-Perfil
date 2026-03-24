// ===== STATUS =====
export type CandidateStatus =
  | 'documentacao_pendente'
  | 'em_analise'
  | 'aguardando_correcao'
  | 'aprovado'
  | 'subsidio_bloqueado'
  | 'sem_renda_comprovavel';

export const STATUS_LABELS: Record<CandidateStatus, string> = {
  documentacao_pendente: 'Documentação Pendente',
  em_analise: 'Em Análise',
  aguardando_correcao: 'Aguardando Correção',
  aprovado: 'Aprovado',
  subsidio_bloqueado: 'Subsídio Bloqueado',
  sem_renda_comprovavel: 'Sem Renda Comprovável',
};

export const STATUS_COLORS: Record<CandidateStatus, string> = {
  documentacao_pendente: '#f59e0b',
  em_analise: '#3b82f6',
  aguardando_correcao: '#ef4444',
  aprovado: '#10b981',
  subsidio_bloqueado: '#8b5cf6',
  sem_renda_comprovavel: '#6b7280',
};

// ===== DOCUMENT TYPES =====
export type DocumentType =
  | 'rg'
  | 'cpf'
  | 'certidao_nascimento'
  | 'certidao_casamento'
  | 'comprovante_endereco'
  | 'comprovante_renda'
  | 'contracheque'
  | 'extrato_bancario'
  | 'declaracao_ir'
  | 'ctps'
  | 'certidao_negativa_imovel'
  | 'comprovante_estado_civil'
  | 'certidao_dependentes';

export const DOCUMENT_LABELS: Record<DocumentType, string> = {
  rg: 'RG (Identidade)',
  cpf: 'CPF',
  certidao_nascimento: 'Certidão de Nascimento',
  certidao_casamento: 'Certidão de Casamento',
  comprovante_endereco: 'Comprovante de Endereço',
  comprovante_renda: 'Comprovante de Renda',
  contracheque: 'Contracheque',
  extrato_bancario: 'Extrato Bancário (últimos 6 meses)',
  declaracao_ir: 'Declaração de Imposto de Renda',
  ctps: 'Carteira de Trabalho (CTPS)',
  certidao_negativa_imovel: 'Certidão Negativa de Imóvel',
  comprovante_estado_civil: 'Comprovante de Estado Civil',
  certidao_dependentes: 'Certidão de Dependentes',
};

// ===== DOCUMENT STATUS =====
export type DocumentStatus =
  | 'pendente'
  | 'enviado'
  | 'validando'
  | 'aprovado'
  | 'rejeitado'
  | 'alerta';

// ===== VALIDATION =====
export interface ValidationResult {
  documentId: string;
  confidence: number;       // 0–100
  isValid: boolean;
  issues: string[];
  extractedData: Record<string, string>;
  qualityScore: number;     // 0–100
  expiryCheck?: {
    isExpired: boolean;
    daysRemaining?: number;
    message: string;
  };
}

// ===== DOCUMENT =====
export interface CandidateDocument {
  id: string;
  candidateId: string;
  type: DocumentType;
  status: DocumentStatus;
  fileName: string;
  fileUrl: string;          // object URL or base64
  fileSize: number;
  uploadedAt: string;
  validation?: ValidationResult;
  analystNotes?: string;
}

// ===== FORM ANSWERS (Ficha Pré-Cadastral) =====
export interface FormAnswers {
  // Dados pessoais
  estadoCivil: 'solteiro' | 'casado' | 'uniao_estavel' | 'divorciado' | 'viuvo' | '';
  temDependentes: boolean | null;
  quantosDependentes: number;
  dependenteComRenda: boolean | null;

  // Moradia
  possuiImovel: boolean | null;
  tipoMoradia: 'aluguel' | 'cedido' | 'proprio' | 'irregular' | '';

  // Renda
  tipoRenda: 'formal' | 'informal' | 'ambos' | 'sem_renda' | '';
  faixaRenda: 'ate_2640' | '2640_4400' | '4400_8000' | 'acima_8000' | '';

  // Benefícios
  recebeuBeneficioHabitacional: boolean | null;
  dataBeneficio: string;
  recebeBolsaFamilia: boolean | null;
  possuiFGTS: boolean | null;

  // Narrativa
  narrativaAtividade: string;
}

// ===== CANDIDATE =====
export interface Candidate {
  id: string;
  nome: string;
  cpf: string;
  telefone: string;
  email: string;
  dataNascimento: string;
  status: CandidateStatus;
  createdAt: string;
  updatedAt: string;
  formAnswers: FormAnswers | null;
  documents: CandidateDocument[];
  requiredDocuments: DocumentType[];
  analystObservations: string;
  approvalDate?: string;
}

// ===== FORM STEP =====
export interface FormStep {
  id: string;
  title: string;
  description: string;
  questions: FormQuestion[];
}

export interface FormQuestion {
  id: keyof FormAnswers;
  label: string;
  helpText?: string;
  type: 'boolean' | 'select' | 'number' | 'text' | 'date';
  options?: { value: string; label: string }[];
  required: boolean;
  conditionalOn?: {
    field: keyof FormAnswers;
    value: unknown;
  };
}
