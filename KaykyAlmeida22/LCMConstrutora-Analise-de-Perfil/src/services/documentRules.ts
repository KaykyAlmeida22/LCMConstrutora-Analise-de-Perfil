import type { DocumentType, FormAnswers } from '../types';

/**
 * Determines which documents are required based on form answers.
 * This is the conditional logic engine.
 */
export function getRequiredDocuments(answers: FormAnswers): DocumentType[] {
  const required: DocumentType[] = [];

  // Always required
  required.push('rg', 'cpf', 'comprovante_endereco');

  // State civil docs
  if (answers.estadoCivil === 'solteiro') {
    required.push('certidao_nascimento');
  } else if (answers.estadoCivil === 'casado') {
    required.push('certidao_casamento');
  } else if (answers.estadoCivil === 'uniao_estavel') {
    required.push('comprovante_estado_civil');
  } else if (answers.estadoCivil === 'divorciado') {
    required.push('certidao_casamento'); // averbada
  } else if (answers.estadoCivil === 'viuvo') {
    required.push('certidao_casamento');
  }

  // Dependents
  if (answers.temDependentes) {
    required.push('certidao_dependentes');
  }

  // Income docs
  if (answers.tipoRenda === 'formal') {
    required.push('contracheque', 'ctps', 'extrato_bancario');
  } else if (answers.tipoRenda === 'informal') {
    required.push('extrato_bancario');
  } else if (answers.tipoRenda === 'ambos') {
    required.push('contracheque', 'ctps', 'extrato_bancario');
  }
  // sem_renda → no income docs, but will be flagged

  // Income range
  if (answers.faixaRenda === '4400_8000' || answers.faixaRenda === 'acima_8000') {
    required.push('declaracao_ir');
  }

  // Property ownership → needs negative certificate
  if (!answers.possuiImovel) {
    required.push('certidao_negativa_imovel');
  }

  // Generic renda proof
  if (answers.tipoRenda !== 'sem_renda') {
    required.push('comprovante_renda');
  }

  // Deduplicate
  return [...new Set(required)];
}
