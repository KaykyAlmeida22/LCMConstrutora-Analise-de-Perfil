import type { DocumentType } from '../types';

interface ValidationResult {
  documentId: string;
  isValid: boolean;
  confidence: number;
  qualityScore: number;
  extractedData: any;
  issues: string[];
  expiryCheck?: {
    isExpired: boolean;
    daysRemaining: number;
    message: string;
  };
}

const DOC_TYPE_DESCRIPTIONS: Record<string, string> = {
  cpf:                                        'CPF — Cadastro de Pessoa Física. Documento de identificação fiscal.',
  rg_frente:                                  'RG (Frente) — Registro Geral, face frontal com foto e nome.',
  rg_verso:                                   'RG (Verso) — Registro Geral, face traseira com CPF e data de emissão.',
  cnh_frente:                                 'CNH (Frente) — Carteira Nacional de Habilitação, parte superior com foto.',
  cnh_verso:                                  'CNH (Verso) — Carteira Nacional de Habilitação, parte inferior com QR Code.',
  comprovante_residencia:                     'Comprovante de Residência — conta de luz, água ou telefone emitida nos últimos 90 dias.',
  certidao_nascimento:                        'Certidão de Nascimento — registro civil de nascimento.',
  certidao_casamento:                         'Certidão de Casamento — registro civil de casamento.',
  carteira_trabalho:                          'Carteira de Trabalho — páginas de identificação ou contrato de trabalho digital.',
  contracheque_1:                             'Contracheque (Mês 1) — holerite ou recibo de pagamento salarial recente.',
  contracheque_2:                             'Contracheque (Mês 2) — holerite ou recibo de pagamento salarial anterior.',
  declaracao_ir:                              'Declaração de Imposto de Renda — formulário completo enviado à Receita Federal.',
  extrato_fgts:                               'Extrato de FGTS — extrato de saldo do Fundo de Garantia emitido pela Caixa Econômica Federal.',
  certidao_nascimento_dependente:             'Certidão de Nascimento de Dependente — certidão de registro civil do dependente.',
  comprovacao_responsabilidade_legal_dependente: 'Guarda/Tutela — documento de responsabilidade legal sobre o dependente.',
  outros:                                     'Outros — qualquer outro documento de suporte.',
};

const EXPIRY_RULES: Partial<Record<DocumentType, number>> = {
  comprovante_endereco: 60,
};

export async function validateDocument(
  documentId: string,
  docType: DocumentType,
  fileUrl: string,
  options?: { isPdf?: boolean; imageDataUrl?: string }
): Promise<ValidationResult> {
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY;

  if (!apiKey) {
    console.warn('Sem API Key — usando validação simulada.');
    return runMockValidation(documentId, docType);
  }

  const docDescription = DOC_TYPE_DESCRIPTIONS[docType] ?? docType;
  const contentToAnalyze = options?.imageDataUrl || fileUrl;
  
  // Using GPT-4o for all visual analysis
  const model = 'gpt-4o';
  
  try {
    // Standard OpenAI Chat Completions API
    const response = await fetch('/api/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: `Você é um perito em documentos brasileiros para financiamento habitacional.
Analise a imagem enviada (que pode ser a primeira página de um PDF ou uma foto tirada pelo usuário).

TIPO ESPERADO: ${docDescription}

Ações:
1. Valide se o documento é do tipo correto.
2. Extraia Nome, CPF, RG e Data de Emissão.
3. Avalie qualidade e legibilidade (0-100).
4. Retorne APENAS um JSON plano com a estrutura:
{
  "confidence": number,
  "qualityScore": number,
  "isCorrectDocumentType": boolean,
  "extractedData": { "nome": string, "cpf": string, "rg": string },
  "issues": string[],
  "data_emissao": "DD/MM/YYYY" ou null
}`
              },
              {
                type: 'image_url',
                image_url: { url: contentToAnalyze }
              }
            ],
          }
        ],
        response_format: { type: 'json_object' }
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`OpenAI Error: ${response.status} - ${errText}`);
    }

    const data = await response.json();
    const rawContent = data.choices?.[0]?.message?.content || '{}';
    const resultJson = JSON.parse(rawContent);

    let isValid = resultJson.isCorrectDocumentType && resultJson.confidence > 75 && resultJson.qualityScore > 50;
    const issues = [...(resultJson.issues || [])];

    if (!resultJson.isCorrectDocumentType) {
      issues.push(`Documento não parece ser um ${docType.replace('_', ' ')}.`);
    }

    // Expiry check logic
    let expiryCheck: ValidationResult['expiryCheck'] = undefined;
    if (EXPIRY_RULES[docType] && resultJson.data_emissao) {
        const [day, month, year] = resultJson.data_emissao.split('/').map(Number);
        const issueDate = new Date(year, month - 1, day);
        const today = new Date();
        const diffTime = Math.abs(today.getTime() - issueDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        const limitDays = EXPIRY_RULES[docType]!;
        
        const isExpired = diffDays > limitDays;
        expiryCheck = {
            isExpired,
            daysRemaining: limitDays - diffDays,
            message: isExpired 
                ? `Documento expirado em ${diffDays - limitDays} dias (Limite: ${limitDays} dias).`
                : `Documento válido por mais ${limitDays - diffDays} dias.`
        };

        if (isExpired) {
            isValid = false;
            issues.push(expiryCheck.message);
        }
    }

    return {
      documentId,
      confidence: resultJson.confidence || 0,
      isValid: isValid && issues.length === 0,
      issues,
      extractedData: { ...resultJson.extractedData, data_emissao: resultJson.data_emissao },
      qualityScore: resultJson.qualityScore || 0,
      expiryCheck
    };

  } catch (error: any) {
    console.error('Erro na Responses API:', error);
    return runMockValidation(documentId, docType, `Erro: ${error.message}`);
  }
}

async function runMockValidation(id: string, _type: string, error?: string): Promise<ValidationResult> {
  await new Promise(r => setTimeout(r, 2000));
  return {
    documentId: id,
    isValid: !error,
    confidence: error ? 0 : 95,
    qualityScore: error ? 0 : 90,
    extractedData: {},
    issues: error ? [error] : [],
  };
}
