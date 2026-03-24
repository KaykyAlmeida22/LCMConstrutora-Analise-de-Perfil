import type { DocumentType, ValidationResult } from '../types';

// Fallback Rules for Expiry (measured in days)
const EXPIRY_RULES: Partial<Record<DocumentType, number>> = {
  comprovante_endereco: 60,
  contra_cheque: 60,
  extrato_bancario: 180,
};

export async function validateDocument(
  documentId: string,
  docType: DocumentType,
  fileUrl: string
): Promise<ValidationResult> {
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY;

  // Fallback to mock if no API Key is provided or if file is PDF (GPT-4V natively prefers images via URL)
  if (!apiKey || fileUrl.toLowerCase().endsWith('.pdf')) {
    console.warn('Usando validação simulada (Sem API Key ou Arquivo PDF incompatível com Vision direto).');
    return runMockValidation(documentId, docType);
  }

  try {
    const response = await fetch('/api/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `Você é um perito em análise de documentos brasileiros para processos de financiamento habitacional (MCMV).
            Seu objetivo é analisar a imagem fornecida (tipo esperado: ${docType}), extrair seus dados com alta precisão e validar sua autenticidade e validade.
            
            Retorne um JSON estrito no seguinte formato:
            {
              "confidence": <number 0 a 100 de confiança na leitura>,
              "qualityScore": <number 0 a 100 da qualidade visual da imagem>,
              "extractedData": { "chave1": "valor extraido", "chave2": "valor..." },
              "issues": [ "lista de problemas encontrados, se houver" ],
              "data_emissao": "DD/MM/YYYY (se encontrado, senão null)"
            }`
          },
          {
            role: 'user',
            content: [
              { type: 'text', text: 'Analise este documento.' },
              { type: 'image_url', image_url: { url: fileUrl } }
            ]
          }
        ],
        response_format: { 
          type: 'json_schema',
          json_schema: {
            name: 'document_validation_result',
            strict: true,
            schema: {
              type: 'object',
              properties: {
                confidence: { type: 'number', description: 'Confiança na leitura de 0 a 100' },
                qualityScore: { type: 'number', description: 'Qualidade visual da imagem de 0 a 100' },
                extractedData: { 
                  type: 'object', 
                  additionalProperties: false,
                  properties: {
                    nome: { type: ['string', 'null'] },
                    cpf: { type: ['string', 'null'] },
                    rg: { type: ['string', 'null'] },
                    orgao_emissor: { type: ['string', 'null'] },
                    endereco: { type: ['string', 'null'] },
                    renda_estimada: { type: ['string', 'null'] },
                    observacao: { type: ['string', 'null'] }
                  }
                },
                issues: { 
                  type: 'array', 
                  items: { type: 'string' },
                  description: 'Lista de problemas observados'
                },
                data_emissao: { type: ['string', 'null'], description: 'Data no formato DD/MM/YYYY' }
              },
              required: ['confidence', 'qualityScore', 'extractedData', 'issues', 'data_emissao'],
              additionalProperties: false
            }
          }
        },
        max_tokens: 1000,
        temperature: 0.1
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API Error: ${response.status}`);
    }

    const data = await response.json();
    const resultJson = JSON.parse(data.choices[0].message.content);

    let isValid = true;
    const finalIssues: string[] = resultJson.issues || [];

    if (resultJson.qualityScore < 50) {
      finalIssues.push('Qualidade da imagem muito baixa. Por favor, tire uma nova foto.');
      isValid = false;
    }
    if (resultJson.confidence < 75) {
      finalIssues.push('Baixa confiança na leitura do documento (possivelmente ilegível).');
      isValid = false;
    }

    let expiryCheck: ValidationResult['expiryCheck'] = undefined;
    const maxDays = EXPIRY_RULES[docType];
    
    if (maxDays && resultJson.data_emissao) {
       // Parse DD/MM/YYYY
       const parts = resultJson.data_emissao.split('/');
       if (parts.length === 3) {
         const emData = new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
         const now = new Date();
         const diffTime = Math.abs(now.getTime() - emData.getTime());
         const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
         
         const isExpired = diffDays > maxDays;
         expiryCheck = {
            isExpired,
            daysRemaining: isExpired ? 0 : maxDays - diffDays,
            message: isExpired 
               ? `Documento vencido. Emitido há ${diffDays} dias (Máximo permitido: ${maxDays} dias).`
               : `Documento válido. Emitido há ${diffDays} dias.`
         };

         if (isExpired) {
            finalIssues.push(expiryCheck.message);
            isValid = false;
         }
       }
    }

    return {
      documentId,
      confidence: resultJson.confidence || 0,
      isValid: finalIssues.length === 0 && isValid,
      issues: finalIssues,
      extractedData: { ...resultJson.extractedData, data_emissao_detectada: resultJson.data_emissao },
      qualityScore: resultJson.qualityScore || 0,
      expiryCheck
    };

  } catch (error) {
    console.error('Erro na validação de IA (OpenAI):', error);
    // Fallback if network or parsing fails
    return runMockValidation(documentId, docType);
  }
}

// === MOCK FALLBACK LOGIC ===
function runMockValidation(documentId: string, docType: DocumentType): ValidationResult {
  const confidence = Math.floor(Math.random() * 30) + 70;
  const qualityScore = Math.floor(Math.random() * 60) + 40;
  const issues: string[] = [];
  let isValid = true;

  if (qualityScore < 50) {
    issues.push('Qualidade da imagem muito baixa. (Mock)');
    isValid = false;
  }
  if (confidence < 75) {
    issues.push('Baixa confiança na leitura do documento. (Mock)');
    isValid = false;
  }

  let expiryCheck: ValidationResult['expiryCheck'] = undefined;
  const maxDays = EXPIRY_RULES[docType];
  
  if (maxDays) {
    const isExpired = Math.random() < 0.2;
    const daysRemaining = isExpired ? -Math.floor(Math.random() * 30) : Math.floor(Math.random() * maxDays);
    expiryCheck = {
      isExpired,
      daysRemaining: Math.abs(daysRemaining),
      message: isExpired
        ? `Documento vencido há ${Math.abs(daysRemaining)} dias. (Mock)`
        : `Documento dentro do prazo. (Mock)`,
    };
    if (isExpired) {
      issues.push(expiryCheck.message);
      isValid = false;
    }
  }

  return {
    documentId,
    confidence,isValid,issues,
    extractedData: { simulado: 'Sim', documento: docType },
    qualityScore,
    expiryCheck,
  };
}
