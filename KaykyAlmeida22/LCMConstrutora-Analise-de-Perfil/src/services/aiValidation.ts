import type { DocumentType, ValidationResult } from '../types';

// Expiry rules (days)
const EXPIRY_RULES: Partial<Record<DocumentType, number>> = {
  comprovante_endereco: 60,
  contra_cheque: 60,
  extrato_bancario: 180,
};

// Human-readable descriptions aligned with DocumentType union
const DOC_TYPE_DESCRIPTIONS: Record<string, string> = {
  identidade_rg_cnh:                          'RG ou CNH — documento de identidade com foto, nome, data de nascimento e número do documento.',
  cpf_separado:                               'CPF — cartão ou documento com o número de CPF emitido pela Receita Federal.',
  certidao_nascimento:                        'Certidão de Nascimento — documento de registro civil de nascimento emitido por cartório.',
  certidao_casamento:                         'Certidão de Casamento — documento de registro civil de casamento emitido por cartório.',
  certidao_casamento_divorcio:                'Certidão de Casamento com Divórcio Averbado — certidão de casamento com averbação de divórcio.',
  certidao_uniao_estavel:                     'Certidão de União Estável — documento declaratório de união estável em cartório.',
  pacto_antenupcial:                          'Pacto Antenupcial — contrato registrado em cartório com regime de bens do casamento.',
  comprovante_endereco:                       'Comprovante de Residência — conta de água, luz, gás, telefone/internet ou extrato bancário com endereço residencial.',
  comprovante_residencia_3anos:               'Comprovante de Residência dos últimos 3 anos — documentos que atestem residência por 3 anos no endereço.',
  ctps_digital:                               'Carteira de Trabalho (CTPS) — carteira de trabalho física ou digital com vínculos empregatícios.',
  contra_cheque:                              'Holerite / Contra-cheque — documento emitido por empregador com salário bruto, descontos e valor líquido.',
  comprovante_imposto_pro_labore:             'Comprovante de Imposto sobre Pró-Labore — documento de recolhimento de imposto sobre remuneração de sócio.',
  declaracao_ir:                              'Declaração de Imposto de Renda — declaração anual de IRPF da Receita Federal ou recibo de entrega.',
  extrato_bancario:                           'Extrato Bancário — extrato de conta corrente ou poupança emitido por banco com movimentações.',
  fatura_cartao_credito:                      'Fatura de Cartão de Crédito — fatura mensal de cartão de crédito com nome do titular e valor.',
  declaracao_aplicativo_uber_99_ifood:        'Declaração de Renda de Aplicativo (Uber, 99, iFood etc.) — comprovante emitido pelo app com ganhos do motorista/entregador.',
  cnpj_mei:                                   'CNPJ MEI — comprovante de inscrição de Microempreendedor Individual na Receita Federal.',
  contrato_social_mei:                        'Contrato Social / DASN MEI — documentos societários ou declaração anual do MEI.',
  das_mei:                                    'DAS MEI — guia de pagamento mensal do Simples Nacional para MEI (PGMEI).',
  extrato_fgts:                               'Extrato de FGTS — extrato de saldo do Fundo de Garantia emitido pela Caixa Econômica Federal.',
  certidao_nascimento_dependente:             'Certidão de Nascimento de Dependente — certidão de registro civil do dependente (filho, tutelado etc.).',
  comprovacao_responsabilidade_legal_dependente: 'Documento de Responsabilidade Legal do Dependente — guarda, tutela ou adoção do dependente.',
  outros:                                     'Outro Documento — documento de suporte não classificado nas categorias anteriores.',
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
  const isPdf = options?.isPdf ?? false;
  const model = isPdf ? 'gpt-5.4' : 'gpt-4o';
  // Use base64 data URL if provided (from PDF rendering or image), otherwise use the storage URL
  const imageUrl = options?.imageDataUrl || fileUrl;

  try {
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
            role: 'system',
            content: `Você é um perito em análise de documentos brasileiros para processos de financiamento habitacional (MCMV).

TIPO DE DOCUMENTO ESPERADO: ${docDescription}

TAREFA OBRIGATÓRIA:
1. Analise o documento enviado.
2. Verifique PRIMEIRO se o conteúdo do documento corresponde ao tipo esperado acima.
   - Se NÃO corresponder, defina isCorrectDocumentType=false e adicione um issue claro, como:
     "Documento incorreto: esperado ${docDescription.split('—')[0].trim()}, mas o arquivo enviado não é esse tipo de documento."
   - Se corresponder, defina isCorrectDocumentType=true.
3. Avalie a qualidade visual e legibilidade.
4. Extraia os dados disponíveis.
5. Retorne APENAS o JSON conforme o schema solicitado, sem texto adicional.`
          },
          {
            role: 'user',
            content: [
              { type: 'text', text: `Analise este documento. Tipo esperado: ${docType}` },
               { type: 'image_url', image_url: { url: imageUrl } }
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
                confidence:            { type: 'number', description: 'Confiança na leitura de 0 a 100' },
                qualityScore:          { type: 'number', description: 'Qualidade visual da imagem de 0 a 100' },
                isCorrectDocumentType: { type: 'boolean', description: 'true se o documento corresponde ao tipo esperado' },
                extractedData: {
                  type: 'object',
                  additionalProperties: false,
                  properties: {
                    nome:            { type: ['string', 'null'] },
                    cpf:             { type: ['string', 'null'] },
                    rg:              { type: ['string', 'null'] },
                    orgao_emissor:   { type: ['string', 'null'] },
                    endereco:        { type: ['string', 'null'] },
                    renda_estimada:  { type: ['string', 'null'] },
                    observacao:      { type: ['string', 'null'] },
                  },
                  required: ['nome', 'cpf', 'rg', 'orgao_emissor', 'endereco', 'renda_estimada', 'observacao']
                },
                issues: {
                  type: 'array',
                  items: { type: 'string' },
                  description: 'Lista de problemas. Deve incluir mensagem de tipo errado se isCorrectDocumentType=false.',
                },
                data_emissao: { type: ['string', 'null'], description: 'Data no formato DD/MM/YYYY ou null' },
              },
              required: ['confidence', 'qualityScore', 'isCorrectDocumentType', 'extractedData', 'issues', 'data_emissao'],
              additionalProperties: false,
            },
          },
        },
        max_tokens: 1200,
        temperature: 0.1,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API Error: ${response.status}`);
    }

    const data = await response.json();
    const resultJson = JSON.parse(data.choices[0].message.content);

    const finalIssues: string[] = [...(resultJson.issues || [])];
    let isValid = true;

    // Reject wrong document type immediately
    if (!resultJson.isCorrectDocumentType) {
      isValid = false;
      if (!finalIssues.some(i => i.toLowerCase().includes('incorreto') || i.toLowerCase().includes('documento'))) {
        finalIssues.push(`Documento incorreto: o arquivo enviado não corresponde ao tipo esperado (${docDescription.split('—')[0].trim()}).`);
      }
    }

    if (resultJson.qualityScore < 50) {
      finalIssues.push('Qualidade da imagem muito baixa. Por favor, envie uma versão mais nítida.');
      isValid = false;
    }
    if (resultJson.confidence < 75) {
      finalIssues.push('Baixa confiança na leitura (documento possivelmente ilegível ou com má iluminação).');
      isValid = false;
    }

    let expiryCheck: ValidationResult['expiryCheck'] = undefined;
    const maxDays = EXPIRY_RULES[docType];

    if (maxDays && resultJson.data_emissao) {
      const parts = resultJson.data_emissao.split('/');
      if (parts.length === 3) {
        const emData = new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
        const now = new Date();
        const diffDays = Math.ceil(Math.abs(now.getTime() - emData.getTime()) / (1000 * 60 * 60 * 24));
        const isExpired = diffDays > maxDays;
        expiryCheck = {
          isExpired,
          daysRemaining: isExpired ? 0 : maxDays - diffDays,
          message: isExpired
            ? `Documento vencido. Emitido há ${diffDays} dias (máximo permitido: ${maxDays} dias).`
            : `Documento válido. Emitido há ${diffDays} dias.`,
        };
        if (isExpired) {
          finalIssues.push(expiryCheck.message);
          isValid = false;
        }
      }
    }

    return {
      documentId,
      confidence: resultJson.confidence ?? 0,
      isValid: finalIssues.length === 0 && isValid,
      issues: finalIssues,
      extractedData: { ...resultJson.extractedData, data_emissao_detectada: resultJson.data_emissao },
      qualityScore: resultJson.qualityScore ?? 0,
      expiryCheck,
    };

  } catch (error: any) {
    console.error('Erro na validação de IA (OpenAI):', error);
    return runMockValidation(documentId, docType, `Erro de conexão com a IA: ${error.message || error}`);
  }
}

// === MOCK FALLBACK (only when no API key or network error) ===
function runMockValidation(documentId: string, docType: DocumentType, customError?: string): ValidationResult {
  return {
    documentId,
    confidence: 0,
    isValid: false,
    issues: [customError || `Erro na verificação automática (${docType}): IA indisponível ou desconfigurada.`],
    extractedData: { erro: customError || 'Sem conexão com a IA (OpenAI)' },
    qualityScore: 0,
    expiryCheck: undefined,
  };
}
