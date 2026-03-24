import type { Candidate, CandidateStatus, FormAnswers, CandidateDocument, DocumentType } from '../types';

// Generate unique IDs
let idCounter = 100;
function generateId(): string {
  return `cand_${++idCounter}_${Date.now().toString(36)}`;
}

// ===== SEED DATA =====
const SEED_CANDIDATES: Candidate[] = [
  {
    id: 'cand_001',
    nome: 'Maria da Silva Santos',
    cpf: '123.456.789-00',
    telefone: '(11) 98765-4321',
    email: 'maria.silva@email.com',
    dataNascimento: '1990-03-15',
    status: 'em_analise',
    createdAt: '2026-03-20T10:00:00',
    updatedAt: '2026-03-22T14:30:00',
    formAnswers: {
      estadoCivil: 'casado',
      temDependentes: true,
      quantosDependentes: 2,
      dependenteComRenda: false,
      possuiImovel: false,
      tipoMoradia: 'aluguel',
      tipoRenda: 'formal',
      faixaRenda: 'ate_2640',
      recebeuBeneficioHabitacional: false,
      dataBeneficio: '',
      recebeBolsaFamilia: true,
      possuiFGTS: true,
      narrativaAtividade: 'Trabalho como auxiliar de limpeza em uma empresa há 3 anos. Meu salário é de R$ 1.800 por mês. Meu marido trabalha como pedreiro e ganha cerca de R$ 800 por mês.',
    },
    documents: [
      {
        id: 'doc_001',
        candidateId: 'cand_001',
        type: 'rg',
        status: 'aprovado',
        fileName: 'rg_maria.pdf',
        fileUrl: '',
        fileSize: 245000,
        uploadedAt: '2026-03-21T09:00:00',
        validation: {
          documentId: 'doc_001',
          confidence: 95,
          isValid: true,
          issues: [],
          extractedData: { nome: 'Maria da Silva Santos', rg: '12.345.678-9' },
          qualityScore: 88,
        },
      },
      {
        id: 'doc_002',
        candidateId: 'cand_001',
        type: 'cpf',
        status: 'aprovado',
        fileName: 'cpf_maria.pdf',
        fileUrl: '',
        fileSize: 180000,
        uploadedAt: '2026-03-21T09:05:00',
        validation: {
          documentId: 'doc_002',
          confidence: 97,
          isValid: true,
          issues: [],
          extractedData: { nome: 'Maria da Silva Santos', cpf: '123.456.789-00' },
          qualityScore: 92,
        },
      },
      {
        id: 'doc_003',
        candidateId: 'cand_001',
        type: 'comprovante_endereco',
        status: 'enviado',
        fileName: 'conta_luz_maria.pdf',
        fileUrl: '',
        fileSize: 320000,
        uploadedAt: '2026-03-22T11:00:00',
      },
    ],
    requiredDocuments: ['rg', 'cpf', 'comprovante_endereco', 'certidao_casamento', 'certidao_dependentes', 'contracheque', 'ctps', 'extrato_bancario', 'comprovante_renda', 'certidao_negativa_imovel'],
    analystObservations: '',
  },
  {
    id: 'cand_002',
    nome: 'José Carlos Oliveira',
    cpf: '987.654.321-00',
    telefone: '(11) 91234-5678',
    email: 'jose.oliveira@email.com',
    dataNascimento: '1985-07-22',
    status: 'aguardando_correcao',
    createdAt: '2026-03-18T08:00:00',
    updatedAt: '2026-03-23T16:00:00',
    formAnswers: {
      estadoCivil: 'solteiro',
      temDependentes: false,
      quantosDependentes: 0,
      dependenteComRenda: null,
      possuiImovel: false,
      tipoMoradia: 'cedido',
      tipoRenda: 'informal',
      faixaRenda: 'ate_2640',
      recebeuBeneficioHabitacional: false,
      dataBeneficio: '',
      recebeBolsaFamilia: false,
      possuiFGTS: false,
      narrativaAtividade: 'Faço bicos como pintor e eletricista, ganho em média R$ 1.500 por mês mas varia bastante.',
    },
    documents: [
      {
        id: 'doc_010',
        candidateId: 'cand_002',
        type: 'rg',
        status: 'alerta',
        fileName: 'rg_jose.jpg',
        fileUrl: '',
        fileSize: 500000,
        uploadedAt: '2026-03-19T10:00:00',
        validation: {
          documentId: 'doc_010',
          confidence: 78,
          isValid: true,
          issues: ['RG pode estar vencido. Verificação manual recomendada (não bloqueante).'],
          extractedData: { nome: 'José Carlos Oliveira', rg: '98.765.432-1' },
          qualityScore: 72,
        },
      },
      {
        id: 'doc_011',
        candidateId: 'cand_002',
        type: 'comprovante_endereco',
        status: 'rejeitado',
        fileName: 'comp_end_jose.jpg',
        fileUrl: '',
        fileSize: 800000,
        uploadedAt: '2026-03-19T10:05:00',
        validation: {
          documentId: 'doc_011',
          confidence: 65,
          isValid: false,
          issues: ['Qualidade da imagem muito baixa. Por favor, tire uma nova foto com boa iluminação.', 'Documento vencido há 15 dias. Máximo permitido: 60 dias.'],
          extractedData: { endereco: 'Rua... (ilegível)' },
          qualityScore: 42,
          expiryCheck: { isExpired: true, daysRemaining: 15, message: 'Documento vencido há 15 dias.' },
        },
      },
    ],
    requiredDocuments: ['rg', 'cpf', 'comprovante_endereco', 'certidao_nascimento', 'extrato_bancario', 'comprovante_renda', 'certidao_negativa_imovel'],
    analystObservations: 'Comprovante de endereço rejeitado, aguardando reenvio com foto legível e documento atualizado.',
  },
  {
    id: 'cand_003',
    nome: 'Ana Beatriz Ferreira',
    cpf: '111.222.333-44',
    telefone: '(21) 99876-5432',
    email: 'ana.ferreira@email.com',
    dataNascimento: '1995-11-08',
    status: 'aprovado',
    createdAt: '2026-03-10T09:00:00',
    updatedAt: '2026-03-15T17:00:00',
    formAnswers: {
      estadoCivil: 'solteiro',
      temDependentes: true,
      quantosDependentes: 1,
      dependenteComRenda: false,
      possuiImovel: false,
      tipoMoradia: 'aluguel',
      tipoRenda: 'formal',
      faixaRenda: '2640_4400',
      recebeuBeneficioHabitacional: false,
      dataBeneficio: '',
      recebeBolsaFamilia: false,
      possuiFGTS: true,
      narrativaAtividade: 'Trabalho como caixa de supermercado há 5 anos. Ganho R$ 2.800 por mês com os benefícios.',
    },
    documents: [],
    requiredDocuments: ['rg', 'cpf', 'comprovante_endereco', 'certidao_nascimento', 'certidao_dependentes', 'contracheque', 'ctps', 'extrato_bancario', 'comprovante_renda', 'certidao_negativa_imovel'],
    analystObservations: 'Toda documentação em ordem. Aprovada para prosseguir.',
    approvalDate: '2026-03-15T17:00:00',
  },
  {
    id: 'cand_004',
    nome: 'Carlos Eduardo Lima',
    cpf: '555.666.777-88',
    telefone: '(11) 94567-8901',
    email: 'carlos.lima@email.com',
    dataNascimento: '1978-01-30',
    status: 'subsidio_bloqueado',
    createdAt: '2026-03-12T11:00:00',
    updatedAt: '2026-03-20T10:00:00',
    formAnswers: {
      estadoCivil: 'divorciado',
      temDependentes: true,
      quantosDependentes: 3,
      dependenteComRenda: true,
      possuiImovel: false,
      tipoMoradia: 'aluguel',
      tipoRenda: 'formal',
      faixaRenda: '2640_4400',
      recebeuBeneficioHabitacional: true,
      dataBeneficio: '2010-06-15',
      recebeBolsaFamilia: false,
      possuiFGTS: true,
      narrativaAtividade: 'Trabalho como motorista de ônibus, CLT, ganho R$ 3.200 por mês.',
    },
    documents: [],
    requiredDocuments: ['rg', 'cpf', 'comprovante_endereco', 'certidao_casamento', 'certidao_dependentes', 'contracheque', 'ctps', 'extrato_bancario', 'comprovante_renda', 'certidao_negativa_imovel'],
    analystObservations: 'Subsídio bloqueado: candidato recebeu benefício habitacional em 2010, após a data limite de 16/05/2005.',
  },
  {
    id: 'cand_005',
    nome: 'Francisca Souza',
    cpf: '999.888.777-66',
    telefone: '(85) 98765-1234',
    email: '',
    dataNascimento: '1988-05-12',
    status: 'documentacao_pendente',
    createdAt: '2026-03-23T15:00:00',
    updatedAt: '2026-03-23T15:00:00',
    formAnswers: null,
    documents: [],
    requiredDocuments: [],
    analystObservations: '',
  },
];

// ===== IN-MEMORY DATABASE =====
class MockDatabase {
  private candidates: Candidate[] = [...SEED_CANDIDATES];

  // List all
  async getCandidates(): Promise<Candidate[]> {
    await this.delay();
    return [...this.candidates].sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
  }

  // Get one
  async getCandidate(id: string): Promise<Candidate | undefined> {
    await this.delay();
    return this.candidates.find((c) => c.id === id);
  }

  // Create
  async createCandidate(data: Omit<Candidate, 'id' | 'createdAt' | 'updatedAt' | 'status' | 'documents' | 'requiredDocuments' | 'analystObservations'>): Promise<Candidate> {
    await this.delay();
    const candidate: Candidate = {
      ...data,
      id: generateId(),
      status: 'documentacao_pendente',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      documents: [],
      requiredDocuments: [],
      analystObservations: '',
    };
    this.candidates.push(candidate);
    return candidate;
  }

  // Update
  async updateCandidate(id: string, updates: Partial<Candidate>): Promise<Candidate | undefined> {
    await this.delay();
    const idx = this.candidates.findIndex((c) => c.id === id);
    if (idx === -1) return undefined;
    this.candidates[idx] = {
      ...this.candidates[idx],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    return this.candidates[idx];
  }

  // Update status
  async updateStatus(id: string, status: CandidateStatus): Promise<Candidate | undefined> {
    return this.updateCandidate(id, { status });
  }

  // Save form answers
  async saveFormAnswers(id: string, answers: FormAnswers, requiredDocs: DocumentType[]): Promise<Candidate | undefined> {
    return this.updateCandidate(id, {
      formAnswers: answers,
      requiredDocuments: requiredDocs,
      status: 'documentacao_pendente',
    });
  }

  // Add document
  async addDocument(candidateId: string, doc: CandidateDocument): Promise<Candidate | undefined> {
    const candidate = this.candidates.find((c) => c.id === candidateId);
    if (!candidate) return undefined;
    candidate.documents.push(doc);
    candidate.updatedAt = new Date().toISOString();
    return candidate;
  }

  // Update document
  async updateDocument(candidateId: string, docId: string, updates: Partial<CandidateDocument>): Promise<CandidateDocument | undefined> {
    const candidate = this.candidates.find((c) => c.id === candidateId);
    if (!candidate) return undefined;
    const docIdx = candidate.documents.findIndex((d) => d.id === docId);
    if (docIdx === -1) return undefined;
    candidate.documents[docIdx] = { ...candidate.documents[docIdx], ...updates };
    candidate.updatedAt = new Date().toISOString();
    return candidate.documents[docIdx];
  }

  // Stats
  async getStats(): Promise<Record<CandidateStatus, number>> {
    await this.delay();
    const stats: Record<string, number> = {
      documentacao_pendente: 0,
      em_analise: 0,
      aguardando_correcao: 0,
      aprovado: 0,
      subsidio_bloqueado: 0,
      sem_renda_comprovavel: 0,
    };
    this.candidates.forEach((c) => {
      stats[c.status] = (stats[c.status] || 0) + 1;
    });
    return stats as Record<CandidateStatus, number>;
  }

  private delay(ms = 200): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

export const db = new MockDatabase();
