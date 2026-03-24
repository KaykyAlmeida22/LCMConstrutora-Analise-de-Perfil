import type { FormStep } from '../types';

export const formSteps: FormStep[] = [
  {
    id: 'dados_pessoais',
    title: 'Dados Pessoais',
    description: 'Informações sobre seu estado civil e família.',
    questions: [
      {
        id: 'estadoCivil',
        label: 'Qual seu estado civil?',
        type: 'select',
        required: true,
        options: [
          { value: 'solteiro', label: 'Solteiro(a)' },
          { value: 'casado', label: 'Casado(a)' },
          { value: 'uniao_estavel', label: 'União Estável' },
          { value: 'divorciado', label: 'Divorciado(a)' },
          { value: 'viuvo', label: 'Viúvo(a)' },
        ],
      },
      {
        id: 'temDependentes',
        label: 'Você possui dependentes?',
        helpText: 'Filhos, enteados ou pessoas que dependam financeiramente de você.',
        type: 'boolean',
        required: true,
      },
      {
        id: 'quantosDependentes',
        label: 'Quantos dependentes?',
        type: 'number',
        required: true,
        conditionalOn: { field: 'temDependentes', value: true },
      },
      {
        id: 'dependenteComRenda',
        label: 'Algum dependente possui renda própria?',
        helpText: 'Mesmo com renda, pode ser aceito conforme regra municipal.',
        type: 'boolean',
        required: true,
        conditionalOn: { field: 'temDependentes', value: true },
      },
    ],
  },
  {
    id: 'moradia',
    title: 'Situação de Moradia',
    description: 'Informações sobre onde você mora atualmente.',
    questions: [
      {
        id: 'possuiImovel',
        label: 'Você possui algum imóvel em seu nome?',
        helpText: 'Ter imóvel pode inviabilizar o acesso ao programa.',
        type: 'boolean',
        required: true,
      },
      {
        id: 'tipoMoradia',
        label: 'Como é sua moradia atual?',
        type: 'select',
        required: true,
        options: [
          { value: 'aluguel', label: 'Aluguel' },
          { value: 'cedido', label: 'Cedido / Emprestado' },
          { value: 'proprio', label: 'Próprio (financiado)' },
          { value: 'irregular', label: 'Situação Irregular / Ocupação' },
        ],
      },
    ],
  },
  {
    id: 'renda',
    title: 'Informações de Renda',
    description: 'Informações sobre como você ganha dinheiro.',
    questions: [
      {
        id: 'tipoRenda',
        label: 'Como é sua renda principal?',
        type: 'select',
        required: true,
        options: [
          { value: 'formal', label: 'Trabalho com carteira assinada (CLT)' },
          { value: 'informal', label: 'Trabalho informal / autônomo' },
          { value: 'ambos', label: 'Tenho renda formal e informal' },
          { value: 'sem_renda', label: 'Não tenho renda no momento' },
        ],
      },
      {
        id: 'faixaRenda',
        label: 'Qual a faixa de renda familiar mensal?',
        helpText: 'Some a renda de todas as pessoas da família.',
        type: 'select',
        required: true,
        options: [
          { value: 'ate_2640', label: 'Até R$ 2.640,00' },
          { value: '2640_4400', label: 'De R$ 2.640,01 até R$ 4.400,00' },
          { value: '4400_8000', label: 'De R$ 4.400,01 até R$ 8.000,00' },
          { value: 'acima_8000', label: 'Acima de R$ 8.000,00' },
        ],
      },
    ],
  },
  {
    id: 'beneficios',
    title: 'Benefícios e Programas',
    description: 'Informações sobre benefícios governamentais.',
    questions: [
      {
        id: 'recebeuBeneficioHabitacional',
        label: 'Você já recebeu algum benefício habitacional do governo?',
        helpText: 'Se recebeu após 16/05/2005, o subsídio pode ser bloqueado.',
        type: 'boolean',
        required: true,
      },
      {
        id: 'dataBeneficio',
        label: 'Quando recebeu o benefício?',
        type: 'date',
        required: true,
        conditionalOn: { field: 'recebeuBeneficioHabitacional', value: true },
      },
      {
        id: 'recebeBolsaFamilia',
        label: 'Recebe Bolsa Família ou outro benefício social?',
        type: 'boolean',
        required: true,
      },
      {
        id: 'possuiFGTS',
        label: 'Possui FGTS (Fundo de Garantia)?',
        type: 'boolean',
        required: true,
      },
    ],
  },
  {
    id: 'narrativa',
    title: 'Conte sobre sua atividade',
    description: 'Descreva como você trabalha e ganha dinheiro. Isso ajuda na análise do seu cadastro.',
    questions: [
      {
        id: 'narrativaAtividade',
        label: 'Descreva com suas palavras o que você faz para ganhar dinheiro e como é sua rotina de trabalho.',
        helpText: 'Quanto mais detalhes, melhor. Exemplo: "Trabalho fazendo faxina em 3 casas por semana, ganho em média R$ 200 por faxina."',
        type: 'text',
        required: true,
      },
    ],
  },
];
