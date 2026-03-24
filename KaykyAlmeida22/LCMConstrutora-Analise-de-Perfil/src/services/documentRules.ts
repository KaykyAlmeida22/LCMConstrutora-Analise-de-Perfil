import type { FormAnswers } from '../types';

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

export function getRequiredDocuments(answers: FormAnswers): DocumentType[] {
  const req: DocumentType[] = [];

  // Padrão Geral (sempre obrigatórios)
  req.push('identidade_rg_cnh', 'cpf_separado', 'comprovante_endereco');

  // Comprovante Residência 3 Anos (para projetos municipais como Extrema e Mariana)
  const isProjetoMunicipal = true; // Por padrão na V1, assumimos que sim (Extrema)
  if (isProjetoMunicipal) {
    req.push('comprovante_residencia_3anos');
  }

  // Estado Civil
  if (answers.estado_civil === 'Solteiro') {
    req.push('certidao_nascimento');
  } else if (answers.estado_civil === 'Casado') {
    req.push('certidao_casamento');
    if (answers.regime_bens === 'Pacto_Antenupcial') {
      req.push('pacto_antenupcial');
    }
  } else if (answers.estado_civil === 'Divorciado' || answers.estado_civil === 'Separado_Judicialmente') {
    req.push('certidao_casamento_divorcio');
  } else if (answers.estado_civil === 'Uniao_Estavel') {
    req.push('certidao_uniao_estavel');
  }

  // Dependentes
  if (answers.tem_dependentes) {
    req.push('certidao_nascimento_dependente', 'comprovacao_responsabilidade_legal_dependente');
  }

  // Renda Formal (CLT)
  if (['CLT', 'Mista'].includes(answers.tipo_renda || '')) {
    req.push('ctps_digital', 'contra_cheque');
  }

  // Renda Pró-Labore
  if (['Pro-Labore', 'Mista'].includes(answers.tipo_renda || '')) {
    req.push('comprovante_imposto_pro_labore', 'extrato_bancario');
  }

  // Renda Informal
  if (['Informal', 'Mista'].includes(answers.tipo_renda || '')) {
    req.push('extrato_bancario', 'fatura_cartao_credito');
    if (answers.trabalha_aplicativo) {
      req.push('declaracao_aplicativo_uber_99_ifood');
    }
  }

  // Renda MEI
  if (['MEI', 'Mista'].includes(answers.tipo_renda || '')) {
    req.push('extrato_bancario', 'cnpj_mei', 'contrato_social_mei', 'das_mei');
  }

  // Imposto de Renda
  if (answers.declara_ir) {
    req.push('declaracao_ir');
  }

  // FGTS
  if (answers.fara_uso_fgts) {
    req.push('extrato_fgts');
  }

  // Deduplicando
  return [...new Set(req)];
}

export function getDocumentName(type: DocumentType): string {
  const map: Record<DocumentType, string> = {
    identidade_rg_cnh: 'Identidade (RG) ou CNH',
    cpf_separado: 'CPF',
    certidao_nascimento: 'Certidão de Nascimento',
    certidao_casamento: 'Certidão de Casamento',
    certidao_casamento_divorcio: 'Certidão de Casamento (Averbada)',
    certidao_uniao_estavel: 'Escritura de União Estável',
    pacto_antenupcial: 'Pacto Antenupcial',
    comprovante_endereco: 'Comprovante de Endereço (até 60 dias)',
    comprovante_residencia_3anos: 'Comprovante de Residência (3 anos)',
    ctps_digital: 'Carteira de Trabalho Digital',
    contra_cheque: 'Contracheques (Últimos 2)',
    comprovante_imposto_pro_labore: 'Recolhimento Pró-Labore',
    declaracao_ir: 'Declaração do Imposto de Renda',
    extrato_bancario: 'Extratos Bancários (Últimos 6 meses)',
    fatura_cartao_credito: 'Faturas de Cartão (Últimos 3 meses)',
    declaracao_aplicativo_uber_99_ifood: 'Declaração de App (Uber/99/iFood)',
    cnpj_mei: 'Cartão CNPJ (MEI)',
    contrato_social_mei: 'Certificado MEI (CCMEI)',
    das_mei: 'Guias DAS (MEI)',
    extrato_fgts: 'Extrato do FGTS',
    certidao_nascimento_dependente: 'Certidão nasc. Dependente',
    comprovacao_responsabilidade_legal_dependente: 'Guarda/Registro Dependente',
    outros: 'Outros Documentos'
  };
  return map[type] || type;
}
