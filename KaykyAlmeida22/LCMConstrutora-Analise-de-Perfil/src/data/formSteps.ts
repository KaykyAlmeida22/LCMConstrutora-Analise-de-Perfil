import type { FormStep } from '../types';

export const formSteps: FormStep[] = [
  {
    id: 'bloco1_moradia',
    title: 'Situação de Moradia',
    description: 'Informações sobre onde você mora atualmente.',
    questions: [
      {
        id: 'tipo_residencia',
        label: 'Sua residência é:',
        type: 'select',
        required: true,
        options: [
          { value: 'Propria_Quitada', label: 'Própria Quitada' },
          { value: 'Propria_Financiada', label: 'Própria Financiada' },
          { value: 'Alugada', label: 'Alugada' },
          { value: 'Com_Parentes', label: 'Mora com parentes/pais' },
          { value: 'Cedida', label: 'Cedida' },
          { value: 'Outros', label: 'Outros' }
        ],
      },
      {
        id: 'valor_aluguel',
        label: 'Valor do aluguel (R$):',
        type: 'number',
        required: true,
        conditionalOn: { field: 'tipo_residencia', value: 'Alugada' }
      },
      {
        id: 'teve_imovel_anterior',
        label: 'Já possuiu imóvel e vendeu?',
        type: 'boolean',
        required: true,
      },
      {
        id: 'venda_registrada_cartorio',
        label: 'A venda foi registrada no Cartório de Registro de Imóveis?',
        type: 'boolean',
        required: true,
        conditionalOn: { field: 'teve_imovel_anterior', value: true }
      }
    ],
  },
  {
    id: 'bloco2_escolaridade',
    title: 'Escolaridade',
    description: 'Nível de instrução educacional.',
    questions: [
      {
        id: 'escolaridade',
        label: 'Qual a sua escolaridade?',
        type: 'select',
        required: true,
        options: [
          { value: 'Segundo_Grau', label: 'Segundo Grau' },
          { value: 'Superior_Incompleto', label: 'Superior Incompleto' },
          { value: 'Pos_MBA', label: 'Pós/MBA' },
          { value: 'Superior_Completo', label: 'Superior Completo' },
          { value: 'Mestrado_Doutorado', label: 'Mestrado/Doutorado' }
        ],
      }
    ],
  },
  {
    id: 'bloco3_estado_civil',
    title: 'Estado Civil',
    description: 'Informações sobre estado civil e regime civil.',
    questions: [
      {
        id: 'estado_civil',
        label: 'Qual seu estado civil?',
        type: 'select',
        required: true,
        options: [
          { value: 'Solteiro', label: 'Solteiro(a)' },
          { value: 'Casado', label: 'Casado(a)' },
          { value: 'Divorciado', label: 'Divorciado(a)' },
          { value: 'Separado_Judicialmente', label: 'Separado(a) Judicialmente' },
          { value: 'Uniao_Estavel', label: 'União Estável' }
        ],
      },
      {
        id: 'regime_bens',
        label: 'Qual o regime de bens?',
        type: 'select',
        required: true,
        options: [
          { value: 'Comunhao_Parcial', label: 'Comunhão Parcial de Bens' },
          { value: 'Comunhao_Total', label: 'Comunhão Total de Bens' },
          { value: 'Separacao_Total', label: 'Separação Total de Bens' },
          { value: 'Pacto_Antenupcial', label: 'Possui Pacto Antenupcial' }
        ],
        conditionalOn: { field: 'estado_civil', value: 'Casado' }
      },
      {
        id: 'data_casamento',
        label: 'Qual foi a data do casamento?',
        type: 'date',
        required: true,
        conditionalOn: { field: 'estado_civil', value: 'Casado' }
      }
    ],
  },
  {
    id: 'bloco4_dependentes',
    title: 'Dependentes',
    description: 'Pessoas que dependem financeiramente e legalmente de você.',
    questions: [
      {
        id: 'tem_dependentes',
        label: 'Possui dependentes?',
        helpText: 'O dependente precisa ter parentesco e você precisa ser o responsável legal.',
        type: 'boolean',
        required: true,
      }
      // Arrays of dependentes will be handled by a specialized form array component later if tem_dependentes is true.
    ],
  },
  {
    id: 'bloco5_financiamentos',
    title: 'Financiamentos',
    description: 'Histórico de financiamentos e programas.',
    questions: [
      {
        id: 'tem_financiamento_habitacional',
        label: 'Possui financiamento habitacional / subsídio do governo (ex. MCMV anterior)?',
        type: 'boolean',
        required: true,
      },
      {
        id: 'data_contrato_habitacional',
        label: 'Qual foi a data do contrato do financiamento?',
        helpText: 'Utilizado para verificar a elegibilidade do subsídio.',
        type: 'date',
        required: true,
        conditionalOn: { field: 'tem_financiamento_habitacional', value: true }
      },
      {
        id: 'tem_financiamento_estudantil',
        label: 'Possui financiamento estudantil (FIES, PRAVALER ou similar)?',
        type: 'boolean',
        required: true,
      },
      {
        id: 'financiamento_estudantil_em_atraso',
        label: 'Existe alguma parcela em atraso do financiamento estudantil?',
        type: 'boolean',
        required: true,
        conditionalOn: { field: 'tem_financiamento_estudantil', value: true }
      }
    ]
  },
  {
    id: 'bloco6_auto',
    title: 'Mobilidade',
    description: 'Informações referentes a veículos motores.',
    questions: [
      {
        id: 'tem_veiculo',
        label: 'Possui automóvel ou moto no seu nome?',
        type: 'boolean',
        required: true,
      },
      {
        id: 'valor_mercado_veiculo',
        label: 'Valor de mercado estimado (Tabela FIPE - R$):',
        type: 'number',
        required: true,
        conditionalOn: { field: 'tem_veiculo', value: true }
      },
      {
        id: 'veiculo_financiado',
        label: 'Este veículo está financiado?',
        type: 'boolean',
        required: true,
        conditionalOn: { field: 'tem_veiculo', value: true }
      },
      {
        id: 'prestacao_veiculo',
        label: 'Qual o valor da prestação mensal (R$)?',
        type: 'number',
        required: true,
        conditionalOn: { field: 'veiculo_financiado', value: true }
      },
      {
        id: 'parcelas_restantes_veiculo',
        label: 'Faltam quantas parcelas?',
        type: 'number',
        required: true,
        conditionalOn: { field: 'veiculo_financiado', value: true }
      }
    ]
  },
  {
    id: 'bloco7_cartao_credito',
    title: 'Cartões',
    description: 'Informações sobre limites e gastos',
    questions: [
      {
        id: 'tem_cartao_credito',
        label: 'Possui cartão de crédito?',
        type: 'boolean',
        required: true,
      },
      {
        id: 'bandeira_cartao',
        label: 'Qual a bandeira ou banco emissor (ex: Nubank, Visa, Master)?',
        type: 'text',
        required: true,
        conditionalOn: { field: 'tem_cartao_credito', value: true }
      }
    ]
  },
  {
    id: 'bloco8_imoveis',
    title: 'Patrimônio',
    description: 'Resumo sobre outros imóveis declarados',
    questions: [
      {
        id: 'tem_imovel',
        label: 'Possui imóvel(s) em seu nome neste instante?',
        type: 'boolean',
        required: true,
      },
      {
        id: 'valor_mercado_imovel',
        label: 'Sabe estimar o valor de mercado atual geral dele(s) (R$)?',
        type: 'number',
        required: true,
        conditionalOn: { field: 'tem_imovel', value: true }
      }
    ]
  },
  {
    id: 'bloco9_imposto_banco',
    title: 'Imposto e Contas',
    description: 'Vínculos com a Receita e Bancos.',
    questions: [
      {
        id: 'declara_ir',
        label: 'Você declara Imposto de Renda?',
        type: 'boolean',
        required: true,
      },
      {
        id: 'tem_conta_corrente',
        label: 'Possui conta corrente em banco?',
        type: 'boolean',
        required: true,
      },
      {
        id: 'banco_conta_corrente',
        label: 'Qual o nome do seu banco principal?',
        type: 'text',
        required: true,
        conditionalOn: { field: 'tem_conta_corrente', value: true }
      },
      {
        id: 'limite_cheque_especial',
        label: 'Se tiver, qual seu limite do cheque especial (R$)? Pode deixar nulo',
        type: 'number',
        required: false,
        conditionalOn: { field: 'tem_conta_corrente', value: true }
      }
    ]
  },
  {
    id: 'bloco10_poupanca',
    title: 'Investimentos / Poupança',
    description: 'Verificação de acúmulo financeiro mínimo.',
    questions: [
      {
        id: 'tem_poupanca_aplicacao',
        label: 'Possui poupança ou outra aplicação financeira?',
        type: 'boolean',
        required: true,
      }
    ]
  },
  {
    id: 'bloco11_fgts_renda',
    title: 'FGTS e Perfil de Renda',
    description: 'Identificação final do perfil de renda.',
    questions: [
      {
        id: 'fara_uso_fgts',
        label: 'Você fará uso do FGTS para a compra?',
        type: 'boolean',
        required: true,
      },
      {
        id: 'comprova_36_meses_fgts',
        label: 'Tem pelo menos 36 meses de conta com recolhimento de FGTS (soma de todas as contas inativas e ativa)?',
        type: 'boolean',
        required: true,
        conditionalOn: { field: 'fara_uso_fgts', value: true }
      },
      {
        id: 'tipo_renda',
        label: 'Qual o tipo da sua ocupação / renda principal?',
        type: 'select',
        required: true,
        options: [
          { value: 'CLT', label: 'Trabalho com carteira assinada (CLT)' },
          { value: 'Pro-Labore', label: 'Empresário com Pró-labore formal' },
          { value: 'Informal', label: 'Autônomo/Informal (Livre, Uber, etc)' },
          { value: 'MEI', label: 'Sou prestador de serviço MEI ativo' },
          { value: 'Mista', label: 'Mista (Ex: Sou CLT mas sou MEI também)' }
        ]
      },
      {
        id: 'trabalha_aplicativo',
        label: 'Sua atividade autônoma envolve trabalho por aplicativo de plataforma (Uber, iFood, 99)?',
        type: 'boolean',
        required: true,
        conditionalOn: { field: 'tipo_renda', value: 'Informal' }
      }
    ]
  }
];
