import type { DocumentType, ValidationResult } from '../types';

// Simulated time-based validation rules (in days)
const EXPIRY_RULES: Partial<Record<DocumentType, number>> = {
  comprovante_endereco: 60,
  contracheque: 60,
  extrato_bancario: 180,
};

function generateConfidence(): number {
  // Simulates OCR confidence between 70-99
  return Math.floor(Math.random() * 30) + 70;
}

function generateQualityScore(): number {
  // Simulates image quality between 40-100
  return Math.floor(Math.random() * 60) + 40;
}

function simulateExtractedData(docType: DocumentType): Record<string, string> {
  const baseData: Record<string, string> = {
    nome: 'Maria da Silva Santos',
    cpf: '123.456.789-00',
  };

  switch (docType) {
    case 'rg':
      return { ...baseData, rg: '12.345.678-9', data_nascimento: '15/03/1990' };
    case 'comprovante_endereco':
      return { ...baseData, endereco: 'Rua das Flores, 123 - Centro', cidade: 'São Paulo - SP' };
    case 'contracheque':
      return { ...baseData, salario_bruto: 'R$ 2.200,00', competencia: '02/2026' };
    case 'extrato_bancario':
      return { ...baseData, banco: 'Banco do Brasil', agencia: '1234', conta: '56789-0' };
    default:
      return baseData;
  }
}

/**
 * Simulates an AI validation pipeline:
 * 1. OCR extraction
 * 2. Consistency check
 * 3. Expiry validation
 * 4. Quality assessment
 */
export async function validateDocument(
  documentId: string,
  docType: DocumentType,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _fileUrl: string
): Promise<ValidationResult> {
  // Simulate processing delay
  await new Promise((resolve) => setTimeout(resolve, 1500 + Math.random() * 2000));

  const confidence = generateConfidence();
  const qualityScore = generateQualityScore();
  const issues: string[] = [];
  let isValid = true;

  // Quality check
  if (qualityScore < 50) {
    issues.push('Qualidade da imagem muito baixa. Por favor, tire uma nova foto com boa iluminação.');
    isValid = false;
  } else if (qualityScore < 65) {
    issues.push('Qualidade da imagem regular. Alguns dados podem não ser lidos corretamente.');
  }

  // Confidence check
  if (confidence < 75) {
    issues.push('Baixa confiança na leitura do documento. Verifique se o documento está legível.');
    isValid = false;
  }

  // Expiry check
  let expiryCheck: ValidationResult['expiryCheck'] = undefined;
  const maxDays = EXPIRY_RULES[docType];
  if (maxDays) {
    // Simulate: 20% chance document is expired
    const isExpired = Math.random() < 0.2;
    const daysRemaining = isExpired ? -Math.floor(Math.random() * 30) : Math.floor(Math.random() * maxDays);
    expiryCheck = {
      isExpired,
      daysRemaining: Math.abs(daysRemaining),
      message: isExpired
        ? `Documento vencido há ${Math.abs(daysRemaining)} dias. Máximo permitido: ${maxDays} dias.`
        : `Documento dentro do prazo. ${daysRemaining} dias restantes.`,
    };
    if (isExpired) {
      issues.push(expiryCheck.message);
      isValid = false;
    }
  }

  // RG expired alert (non-blocking)
  if (docType === 'rg' && Math.random() < 0.15) {
    issues.push('RG pode estar vencido. Verificação manual recomendada (não bloqueante).');
    // Not blocking: isValid stays true
  }

  return {
    documentId,
    confidence,
    isValid,
    issues,
    extractedData: simulateExtractedData(docType),
    qualityScore,
    expiryCheck,
  };
}
