# Plataforma LCM — Minha Casa Minha Vida
## Especificação Técnica e de Produto — V1

> **Documento de uso interno.** Baseado no briefing gerado a partir da reunião com Gleice Silva (Analista de Crédito — LCM Construtora). Este documento descreve todas as regras de negócio, dados a serem persistidos, fluxos e comportamentos esperados da plataforma.

---

## Sumário

1. [Visão Geral do Produto](#1-visão-geral-do-produto)
2. [Escopo da V1](#2-escopo-da-v1)
3. [Contexto e Público-Alvo](#3-contexto-e-público-alvo)
4. [Fluxo Geral da Plataforma](#4-fluxo-geral-da-plataforma)
5. [Etapa 1 — Ficha Pré-Cadastral](#5-etapa-1--ficha-pré-cadastral)
6. [Etapa 2 — Coleta de Documentos](#6-etapa-2--coleta-de-documentos)
7. [Validações Automáticas da IA](#7-validações-automáticas-da-ia)
8. [Painel do Analista](#8-painel-do-analista)
9. [Campo de Narrativa de Renda](#9-campo-de-narrativa-de-renda)
10. [Modelo de Dados](#10-modelo-de-dados)
11. [Regras Consolidadas de Documentos por Perfil](#11-regras-consolidadas-de-documentos-por-perfil)
12. [Prazos de Validade e Comportamento do Sistema](#12-prazos-de-validade-e-comportamento-do-sistema)
13. [Regras de Upload e Qualidade de Imagem](#13-regras-de-upload-e-qualidade-de-imagem)
14. [Glossário](#14-glossário)
15. [Roadmap Pós-V1](#15-roadmap-pós-v1)

---

## 1. Visão Geral do Produto

A Plataforma LCM é um sistema interno da LCM Construtora para digitalizar e organizar o processo de cadastro e coleta de documentos de candidatos ao programa **Minha Casa Minha Vida (MCMV)**.

**Problema que resolve:**
- Processo de validação de documentos 100% manual realizado pela analista de crédito Gleice Silva.
- Documentos chegam em péssima qualidade (fotos desfocadas, ilegíveis, com dedos na frente).
- Corretores não sabem quais documentos pedir em cada situação de perfil.
- Gleice perde tempo excessivo respondendo dúvidas repetitivas do time comercial.
- Ausência de padrão: cada corretor coleta informações de forma diferente.

**Usuários da V1:** exclusivamente a equipe interna da LCM (analistas de crédito).

---

## 2. Escopo da V1

### ✅ Está no escopo

| Funcionalidade | Descrição |
|---|---|
| Ficha pré-cadastral | Perguntas sim/não sobre o perfil do candidato |
| Coleta e upload de documentos | Upload condicional baseado nas respostas da ficha |
| Validação automática pela IA | Verificação de qualidade, prazo e consistência dos documentos |
| Painel do analista | Revisão, aprovação e gestão de status dos cadastros |
| Uso restrito | Apenas equipe interna LCM |

### ❌ Fora do escopo da V1

| Funcionalidade | Observação |
|---|---|
| Pesquisa cadastral em lote (CPFs) | Prevista para V2 |
| Contato via WhatsApp com candidatos | Previsto para V3/V4 |
| Bot / chatbot de atendimento | Previsto para V4 |
| Integração com CV CRM | Prevista para V2 |
| Acesso por corretores externos | Previsto para V3 |
| Acesso direto pelo candidato | Previsto para V3 |

---

## 3. Contexto e Público-Alvo

### Programa

- **Programa:** Minha Casa Minha Vida Cidades — modalidade com subsídio municipal adicional.
- **Projeto piloto:** Prefeitura de Extrema (MG).
- **Próximo município previsto:** Mariana (MG).

### Base de candidatos

- Base inicial: ~5.000 pessoas cadastradas pela Prefeitura de Extrema em planilha Excel.
- Dados disponíveis: nome, CPF, telefone e endereço.

### Critérios do programa

- **Renda máxima:** R$ 8.600,00 por família (teto da faixa local).
- **Exigência especial (projetos municipais):** candidato deve comprovar residência no município há mínimo 3 anos.
- **Critério de inelegibilidade ao subsídio:** ter sido beneficiário de subsídio habitacional a partir de 16/05/2005.
- **Único critério de reprovação definitiva:** não ter renda comprovável de forma alguma.

### O que NÃO reprova um candidato

Os itens abaixo NÃO são motivos de desclassificação definitiva:
- Ter empréstimo ativo.
- Ter financiamento de automóvel.
- Ter restrição de crédito (Serasa/SPC).
- Ter carro financiado.

> **Regra de ouro (Gleice):** "A CEF é banco de todos — deve analisar todos os casos. O que pode inviabilizar é o comprometimento de renda ser tão alto que a parcela do financiamento não caiba."

---

## 4. Fluxo Geral da Plataforma

```
[Analista interno LCM]
        │
        ▼
┌───────────────────────┐
│  ETAPA 1              │
│  Ficha Pré-Cadastral  │  ← Perguntas sim/não / múltipla escolha sobre o perfil
│  (Blocos 1 a 11)      │
└──────────┬────────────┘
           │ Respostas geram gatilhos condicionais
           ▼
┌───────────────────────┐
│  ETAPA 2              │
│  Coleta de Documentos │  ← Upload condicional baseado nas respostas da Etapa 1
│                       │
└──────────┬────────────┘
           │ Documentos enviados e validados pela IA
           ▼
┌───────────────────────┐
│  PAINEL DO ANALISTA   │  ← Revisão, aprovação e gestão de status
│                       │
└───────────────────────┘
```

---

## 5. Etapa 1 — Ficha Pré-Cadastral

### Filosofia da ficha (conforme Gleice)

- **Linguagem simples:** usar "Você tem empréstimo?" em vez de "Possui endividamento?".
- **Perguntas fechadas:** sim/não ou seleção de opções — sem campos de texto livre nesta etapa.
- **Projetada para o público mais vulnerável:** quem tiver mais instrução resolverá facilmente.
- **A ficha induz a resposta certa:** o analista não precisa adivinhar o que perguntar.

---

### BLOCO 1 — Situação de Moradia

#### Pergunta 1 — Tipo de residência atual

| Campo | Tipo | Opções |
|---|---|---|
| Sua residência é: | Seleção única | Própria Quitada / Própria Financiada / Alugada / Mora com parentes/pais / Cedida / Outros |
| Se "Alugada" — Valor do aluguel | Numérico (R$) | Campo obrigatório quando alugada |

**Dado a salvar:** `tipo_residencia` (enum), `valor_aluguel` (decimal, condicional)

#### Pergunta 2 — Imóvel anterior

| Campo | Tipo |
|---|---|
| Já possuiu imóvel e vendeu? | Sim / Não |
| Se "Sim" — A venda foi registrada no Cartório de Registro de Imóveis? | Sim / Não |

**Regras de negócio:**
- Quem já teve imóvel e vendeu: verificar se a venda foi registrada em cartório (regularização).
- Ter imóvel em nome próprio **pode** inviabilizar acesso ao MCMV — verificar normativo da CEF.

**Dados a salvar:** `teve_imovel_anterior` (boolean), `venda_registrada_cartorio` (boolean, condicional)

---

### BLOCO 2 — Escolaridade

#### Pergunta 3

| Campo | Tipo | Opções |
|---|---|---|
| Escolaridade | Seleção única | Segundo Grau / Superior Incompleto / Pós/MBA / Superior Completo / Mestrado/Doutorado |

> **Contexto:** ajuda a calibrar a linguagem do atendimento. Não é critério eliminatório.

**Dado a salvar:** `escolaridade` (enum)

---

### BLOCO 3 — Estado Civil

#### Pergunta 4

| Estado Civil | Documento gerado na Etapa 2 | Campos adicionais |
|---|---|---|
| Solteiro(a) | Certidão de Nascimento | — |
| Casado(a) | Certidão de Casamento | Data do casamento (obrigatório) |
| Divorciado(a) | Certidão de Casamento com averbação de divórcio | — |
| Separado(a) Judicialmente | Certidão de Casamento com averbação / sentença judicial | — |
| Comunhão Parcial de Bens | Certidão de Casamento + Pacto Antenupcial (se aplicável) | — |
| Comunhão Total de Bens | Certidão de Casamento (regime consta na certidão) | — |
| Separação Total | Certidão de Casamento com pacto de separação total | — |
| União Estável | Escritura/Certidão de União Estável | — |
| Possui Pacto Antenupcial | Certidão de Casamento + Documento do Pacto Antenupcial | — |

**Regras de negócio — Regime de Bens:**
- Os regimes (Comunhão Parcial, Comunhão Total, Separação Total, Pacto Antenupcial) impactam como o imóvel será registrado — o sistema deve capturar essa informação.
- Em caso de casamento, **sempre** registrar a data do casamento (campo adicional obrigatório).

**Dados a salvar:** `estado_civil` (enum), `regime_bens` (enum, condicional), `data_casamento` (date, condicional)

---

### BLOCO 4 — Dependentes

#### Pergunta 5

| Campo | Tipo | Regra |
|---|---|---|
| Possui dependentes? | Sim / Não | — |
| Quantidade de dependentes | Numérico | Obrigatório se "Sim" |
| Idade de cada dependente | Numérico (por dependente) | Obrigatório se "Sim" |
| O dependente possui renda? | Sim / Não (por dependente) | — |
| Valor da renda do dependente | Decimal R$ (por dependente) | Obrigatório se renda = Sim |
| Grau de parentesco | Seleção (tabela CEF) | Seguir tabela normativa da CEF (até 3º grau, com responsabilidade legal) |

**Regras de negócio:**

- **Regra CEF:** dependente COM renda NÃO é considerado dependente para fins de habilitação.
- **Regra MCMV Cidades (municipal):** dependente com renda é aceito, **desde que** a soma das rendas não ultrapasse o teto da faixa do programa (R$ 8.600,00).
- Ser **responsável legal** é obrigatório — sobrinha com pai e mãe vivos NÃO pode ser dependente.
- Filho acima de 18 anos **pode** ser dependente, mas deve aparecer na declaração de IR.
- Ter dependentes **aumenta o subsídio** no MCMV Social — é vantagem capturar essa informação.
- A tabela de graus de parentesco da CEF deve ser implementada como validação no campo.

**Dados a salvar:** `tem_dependentes` (boolean), por dependente: `nome_dependente`, `idade_dependente`, `grau_parentesco`, `dependente_tem_renda` (boolean), `renda_dependente` (decimal)

---

### BLOCO 5 — Financiamentos Existentes

#### Pergunta 6 — Financiamento Habitacional

| Campo | Tipo | Regra |
|---|---|---|
| Possui financiamento habitacional? | Sim / Não | — |
| Se "Sim" — Data do contrato | Date | Verificar se é após 16/05/2005 |

**⚠️ ALERTA CRÍTICO — Subsídio Habitacional:**
- Quem já foi beneficiário de subsídio habitacional com contrato **a partir de 16/05/2005** NÃO tem mais direito ao subsídio do MCMV.
- Esta pergunta é **eliminatória em relação ao subsídio**.
- O sistema deve emitir **alerta vermelho visível** ao analista quando essa condição for detectada.
- **Não bloqueia o processo**, mas o analista precisa ser informado imediatamente.
- Status do cadastro passa para "Subsídio Bloqueado" — processo pode continuar sem subsídio.

#### Pergunta 7 — Financiamento Estudantil (ex: FIES)

| Campo | Tipo |
|---|---|
| Possui financiamento estudantil? | Sim / Não |
| Se "Sim" — Existe alguma parcela em atraso? | Sim / Não |

**Dados a salvar:** `tem_financiamento_habitacional` (boolean), `data_contrato_habitacional` (date, condicional), `financiamento_habitacional_pos_2005` (boolean, calculado), `tem_financiamento_estudantil` (boolean), `financiamento_estudantil_em_atraso` (boolean, condicional)

---

### BLOCO 6 — Automóvel / Moto

| Campo | Tipo |
|---|---|
| Possui automóvel ou moto? | Sim / Não |
| Valor de mercado (R$) | Numérico — referência: tabela FIPE |
| Está financiado? | Sim / Não |
| Valor da prestação mensal (R$) | Numérico (condicional) |
| Faltam quantas parcelas? | Numérico (condicional) |

**Dados a salvar:** `tem_veiculo` (boolean), `valor_mercado_veiculo` (decimal), `veiculo_financiado` (boolean), `prestacao_veiculo` (decimal), `parcelas_restantes_veiculo` (integer)

---

### BLOCO 7 — Cartão de Crédito

| Campo | Tipo | Opções |
|---|---|---|
| Possui cartão de crédito? | Sim / Não | — |
| Bandeira | Seleção | Visa / Master / Outros |

**Uso:** para candidatos com renda informal ou mista, o extrato do cartão de crédito pode ser solicitado na Etapa 2 para cruzar com o nível de gastos versus renda declarada.

**Dados a salvar:** `tem_cartao_credito` (boolean), `bandeira_cartao` (enum, condicional)

---

### BLOCO 8 — Imóveis

| Campo | Tipo |
|---|---|
| Possui imóvel(s)? | Sim / Não |
| Valor de mercado (R$) | Numérico (condicional) |

**Dados a salvar:** `tem_imovel` (boolean), `valor_mercado_imovel` (decimal, condicional)

---

### BLOCO 9 — Imposto de Renda e Conta Bancária

#### Pergunta 11 — Imposto de Renda

| Campo | Tipo |
|---|---|
| Declara Imposto de Renda? | Sim / Não |

**Automação futura (V4):** verificar se declarou IR pesquisando o CPF no portal de Restituição da Receita Federal.

#### Pergunta 13 — Conta Corrente

| Campo | Tipo |
|---|---|
| Possui conta corrente? | Sim / Não |
| Se "Sim" — Nome do banco | Texto |
| Limite do cheque especial (R$) | Numérico (condicional) |

**Dados a salvar:** `declara_ir` (boolean), `tem_conta_corrente` (boolean), `banco_conta_corrente` (string), `limite_cheque_especial` (decimal)

---

### BLOCO 10 — Poupança / Aplicação Financeira

#### Pergunta 12

| Campo | Tipo |
|---|---|
| Possui poupança ou outra aplicação financeira? | Sim / Não |

**Dado a salvar:** `tem_poupanca_aplicacao` (boolean)

---

### BLOCO 11 — FGTS

#### Pergunta 14

| Campo | Tipo | Regra |
|---|---|---|
| Pelo menos um dos proponentes comprova 36 meses de recolhimento do FGTS? | Sim / Não | 36 meses é requisito para uso do saldo |

#### Pergunta 15

| Campo | Tipo |
|---|---|
| Fará uso do FGTS? | Sim / Não |

**Regra de negócio:** Se responder "Sim" para uso do FGTS → solicitar extrato do FGTS na Etapa 2 (deve comprovar mínimo 36 meses de recolhimento por pelo menos um dos proponentes).

**Dados a salvar:** `comprova_36_meses_fgts` (boolean), `fara_uso_fgts` (boolean)

---

## 6. Etapa 2 — Coleta de Documentos

A plataforma solicita condicionalmente os documentos corretos com base nas respostas da Etapa 1.

### Tabela completa de documentos

| Documento | Condição de Solicitação | Regras e Observações |
|---|---|---|
| **Identidade / CNH** | TODOS os candidatos (obrigatório) | Aceitar RG físico, digital ou CNH. RG/CNH vencidos são aceitos pela CEF — plataforma emite ALERTA (não bloqueio). O nome deve ser validado contra todos os outros documentos. |
| **CPF** | Quando o RG não contiver o CPF | RGs antigos podem não ter o CPF — solicitar documento separado de CPF nesse caso. |
| **Certidão de Estado Civil** | TODOS os candidatos (obrigatório) | Solteiro → Certidão de Nascimento. Casado → Certidão de Casamento. União Estável → Escritura de União Estável. Divorciado → Certidão com averbação de divórcio. |
| **Comprovante de Endereço** | TODOS os candidatos (obrigatório) | Emissão máxima: 60 dias. Deve estar no **nome do candidato** (obrigatório para projetos municipais como Extrema). Tipos aceitos: água, luz, telefone, gás, condomínio. |
| **Comprovante de Residência (3 anos)** | Projetos municipais com subsídio local (Extrema, Mariana etc.) | Comprovar que mora no município há mínimo 3 anos. Aceitos: conta de concessionária antiga, extrato bancário de 3 anos, histórico escolar, contrato de aluguel com reconhecimento de firma no ano de referência, declaração de cadastro nas Unidades de Saúde, comprovante de matrícula escolar. |
| **CTPS — Carteira de Trabalho** | Renda formal (CLT ou Pró-Labore) | **Obrigatório ser a versão DIGITAL** (app do Governo Federal). Plataforma deve exibir pop-up/tutorial ensinando como baixar e usar o app da Carteira de Trabalho Digital. |
| **Contra-cheque** | Renda formal (CLT ou Pró-Labore) | Emissão máxima: 60 dias. A IA deve ler e validar a data. Se Pró-Labore: também solicitar comprovante de recolhimento de imposto do Pró-Labore. |
| **Imposto de Renda** | Candidatos que declararam IR (Bloco 9) | Solicitar cópia da última declaração. Verificar automaticamente via consulta à Receita Federal. |
| **Extratos Bancários** | Renda informal, mista, MEI ou Pró-Labore com renda real diferente do declarado | Últimos **6 meses**. **Todas as contas** do candidato. Não obrigatório para CLT puro. Finalidade: verificar se gastos condizem com renda declarada. |
| **Despesas (cartão de crédito / faturas)** | Renda informal ou mista | Últimos **3 meses**. Solicitar fatura do cartão de crédito e/ou outras despesas fixas. Serve para cruzar nível de gastos versus renda declarada e "construir a narrativa" do candidato. |
| **Cadastro Uber / 99 / iFood** | Candidatos que trabalham com aplicativos de transporte/entrega | Solicitar declaração emitida pelo próprio aplicativo. Deve conter: data de ingresso, pontuação/avaliação e média de ganhos mensais. Credibiliza a renda informal. |
| **MEI — Documentos** | Candidatos MEI (Microempreendedor Individual) | Solicitar: CNPJ + Contrato Social + DAS (guia de recolhimento mensal). Verificar se CNPJ está ativo e se enquadra como MEI. Verificar regularidade do DAS. |
| **Extrato FGTS** | Candidatos que marcaram "Sim" para uso do FGTS (Bloco 11) | Solicitar extrato do FGTS que comprove mínimo 36 meses de recolhimento por pelo menos um dos proponentes. |
| **Documentos do Dependente** | Candidatos com dependentes (Bloco 4) | Consultar tabela normativa da CEF para verificar grau de parentesco elegível. Solicitar certidão de nascimento do dependente + comprovação de responsabilidade legal. Se dependente tiver renda: informar valor. |

---

## 7. Validações Automáticas da IA

### 7.1 Consistência de dados entre documentos

| Dado | Regra de Validação |
|---|---|
| **Nome** | Nome no RG/CNH deve bater com certidão de estado civil, contracheque, comprovante de endereço e todos os demais. Alertar divergência (ex: mulher que casou e mudou de nome — tratar como ALERTA, não bloqueio). |
| **CPF** | Número do CPF deve ser idêntico em todos os documentos que o contenham. |
| **Data de nascimento** | Verificar consistência entre todos os documentos que contenham a data. |
| **Endereço** | Para projetos municipais: validar que o endereço no comprovante corresponde ao município do programa. |

### 7.2 Validações de prazo

| Documento | Regra de Prazo | Comportamento |
|---|---|---|
| Comprovante de endereço | Emissão máxima: 60 dias | **BLOQUEANTE** — solicitar documento mais recente |
| Contra-cheque | Emissão máxima: 60 dias | **BLOQUEANTE** — solicitar documento mais recente |
| Extratos bancários | Devem cobrir os últimos 6 meses | **BLOQUEANTE** se incompleto |
| Despesas / cartão de crédito | Últimos 3 meses | **BLOQUEANTE** se incompleto |
| RG / CNH vencido | Sem prazo pela CEF | **ALERTA** (não bloqueio) — exibir aviso ao analista, não impede o processo |
| Carteira de Trabalho | Deve ser versão digital | **ALERTA** se for física (não bloqueante) |
| Certidão de estado civil | Sem prazo de validade | — |

### 7.3 Validações de legibilidade

- Avaliar qualidade mínima da imagem ao receber o upload.
- Informar **grau de confiança** na leitura do documento (ex: "Documento lido com 94% de confiança").
- Se confiança abaixo de threshold definido: **rejeitar automaticamente** e solicitar novo envio com mensagem amigável.
- Mensagem padrão ao rejeitar: *"Esta imagem está difícil de ler. Por favor, tire uma nova foto com boa iluminação e sem cobrir partes do documento."*

### 7.4 Alerta de subsídio bloqueado (crítico)

- Se `financiamento_habitacional_pos_2005 = true`: exibir **alerta vermelho** imediato no painel do analista.
- Texto sugerido: "⚠️ ATENÇÃO: Este candidato foi beneficiário de subsídio habitacional após 16/05/2005 e não tem direito ao subsídio do MCMV. O processo pode continuar, mas sem subsídio."
- Status do candidato muda para "Subsídio Bloqueado".

---

## 8. Painel do Analista

O painel é a interface principal da equipe de crédito da LCM. Deve ser **simples, objetivo e funcional**.

### 8.1 Funcionalidades obrigatórias

1. **Lista de candidatos** cadastrados com status visível em destaque.
2. **Filtro por status** (ver tabela de status abaixo).
3. **Visão detalhada do candidato** (ao clicar): exibir todas as respostas da ficha + documentos anexados + alertas da IA.
4. **Visualizador de PDF embutido** — abrir documentos diretamente no painel (PDF viewer inline).
5. **Aprovação ou solicitação de correção por documento** — individualmente, documento a documento.
6. **Campo de observações/comentários** — o analista pode adicionar notas por candidato.
7. **Botão de aprovação final** do cadastro completo.
8. **Indicação de documentos faltantes** — mostrar claramente quais itens ainda estão pendentes.

### 8.2 Status dos cadastros

| Status | Descrição | Cor sugerida |
|---|---|---|
| **Documentação Pendente** | Candidato ainda não enviou todos os documentos. Indicar quais estão faltando. | Amarelo |
| **Em Análise** | Todos os documentos foram enviados — analista está revisando. | Azul |
| **Aguardando Correção** | Analista identificou problema e pediu reenvio de documento específico. | Laranja |
| **Aprovado** | Cadastro completo e aprovado pelo analista. | Verde |
| **Subsídio Bloqueado** | Candidato preencheu critérios que impedem o subsídio (ex: financiamento habitacional após 16/05/2005). Processo pode continuar sem subsídio. | Vermelho claro |
| **Sem Renda Comprovável** | Único critério de reprovação definitiva. Candidato não consegue comprovar renda de forma alguma. | Vermelho escuro |

### 8.3 Regra de reprovação definitiva

> **Regra de Gleice:** A ÚNICA forma de desclassificação definitiva é a pessoa não ter renda comprovável. Ter empréstimo, financiamento de carro, restrição de crédito, carro financiado: **NÃO desclassifica**.

---

## 9. Campo de Narrativa de Renda

### Quando é obrigatório

Campo obrigatório para candidatos com **renda informal ou mista**.

### Propósito

- Ajuda o analista a "contar a história" do candidato ao banco.
- Sem o campo, o analista terá que ligar e perguntar de qualquer forma.
- Gleice: *"Já provei muitas pessoas que contaram uma boa história. Eu sempre tenho que ajudá-las a contar uma boa história."*

### Texto sugerido pela Gleice para exibir ao candidato/analista

> *"Estamos quase no final! Faça um breve relato da sua atividade. Exemplo: trabalho como confeiteira em casa, vendo pelos aplicativos X e Y desde 2020, com renda média de R$ X por mês."*

### Exemplos de renda informal que devem ser contemplados

- Confeitaria em casa
- Loja virtual
- Aplicativos de entrega (iFood, Rappi etc.)
- Trabalho informal após horário de CLT

**Dado a salvar:** `narrativa_renda` (text, obrigatório quando renda_informal = true ou renda_mista = true)

---

## 10. Modelo de Dados

### Entidade: `candidato`

| Campo | Tipo | Descrição |
|---|---|---|
| `id` | UUID | Identificador único |
| `nome_completo` | string | Nome completo |
| `cpf` | string | CPF (apenas dígitos) |
| `telefone` | string | Telefone de contato |
| `endereco` | string | Endereço completo |
| `municipio_projeto` | string | Município do projeto (ex: Extrema, Mariana) |
| `status` | enum | Status atual do cadastro |
| `created_at` | datetime | Data de criação do registro |
| `updated_at` | datetime | Data da última atualização |
| `observacoes_analista` | text | Campo livre para notas do analista |
| `narrativa_renda` | text | Descrição livre da atividade/fonte de renda informal |
| `aprovado_em` | datetime | Data de aprovação final |
| `aprovado_por` | UUID (ref. usuário) | Analista que aprovou |

### Entidade: `ficha_cadastral` (Etapa 1)

| Campo | Tipo | Bloco |
|---|---|---|
| `candidato_id` | UUID FK | — |
| `tipo_residencia` | enum | Bloco 1 |
| `valor_aluguel` | decimal | Bloco 1 |
| `teve_imovel_anterior` | boolean | Bloco 1 |
| `venda_registrada_cartorio` | boolean | Bloco 1 |
| `escolaridade` | enum | Bloco 2 |
| `estado_civil` | enum | Bloco 3 |
| `regime_bens` | enum | Bloco 3 |
| `data_casamento` | date | Bloco 3 |
| `tem_dependentes` | boolean | Bloco 4 |
| `tem_financiamento_habitacional` | boolean | Bloco 5 |
| `data_contrato_habitacional` | date | Bloco 5 |
| `financiamento_habitacional_pos_2005` | boolean (calculado) | Bloco 5 |
| `tem_financiamento_estudantil` | boolean | Bloco 5 |
| `financiamento_estudantil_em_atraso` | boolean | Bloco 5 |
| `tem_veiculo` | boolean | Bloco 6 |
| `valor_mercado_veiculo` | decimal | Bloco 6 |
| `veiculo_financiado` | boolean | Bloco 6 |
| `prestacao_veiculo` | decimal | Bloco 6 |
| `parcelas_restantes_veiculo` | integer | Bloco 6 |
| `tem_cartao_credito` | boolean | Bloco 7 |
| `bandeira_cartao` | enum | Bloco 7 |
| `tem_imovel` | boolean | Bloco 8 |
| `valor_mercado_imovel` | decimal | Bloco 8 |
| `declara_ir` | boolean | Bloco 9 |
| `tem_conta_corrente` | boolean | Bloco 9 |
| `banco_conta_corrente` | string | Bloco 9 |
| `limite_cheque_especial` | decimal | Bloco 9 |
| `tem_poupanca_aplicacao` | boolean | Bloco 10 |
| `comprova_36_meses_fgts` | boolean | Bloco 11 |
| `fara_uso_fgts` | boolean | Bloco 11 |
| `tipo_renda` | enum | Calculado: CLT / Pro-Labore / Informal / MEI / Mista |
| `trabalha_aplicativo` | boolean | Calculado a partir das respostas |

### Entidade: `dependente`

| Campo | Tipo |
|---|---|
| `id` | UUID |
| `candidato_id` | UUID FK |
| `nome` | string |
| `idade` | integer |
| `grau_parentesco` | enum (tabela CEF) |
| `tem_renda` | boolean |
| `valor_renda` | decimal |

### Entidade: `documento`

| Campo | Tipo | Descrição |
|---|---|---|
| `id` | UUID | — |
| `candidato_id` | UUID FK | — |
| `tipo_documento` | enum | Ver lista de tipos abaixo |
| `arquivo_url` | string | URL do arquivo convertido para PDF |
| `arquivo_original_nome` | string | Nome original do arquivo enviado |
| `formato_original` | enum | PDF / JPEG / PNG / outro |
| `status_upload` | enum | Pendente / Enviado / Rejeitado / Aprovado |
| `status_ia` | enum | Pendente / Processando / Aprovado / Rejeitado |
| `confianca_leitura_ia` | decimal (0–100) | % de confiança da IA na leitura |
| `alertas_ia` | JSON | Lista de alertas gerados pela IA |
| `data_emissao_documento` | date | Extraída pela IA |
| `data_upload` | datetime | — |
| `motivo_rejeicao` | text | Motivo de rejeição (se rejeitado) |
| `aprovado_pelo_analista` | boolean | — |
| `observacao_analista` | text | Nota do analista sobre o documento |

### Tipos de documento (enum `tipo_documento`)

- `identidade_rg_cnh`
- `cpf_separado`
- `certidao_nascimento`
- `certidao_casamento`
- `certidao_casamento_divorcio`
- `certidao_uniao_estavel`
- `pacto_antenupcial`
- `comprovante_endereco`
- `comprovante_residencia_3anos`
- `ctps_digital`
- `contra_cheque`
- `comprovante_imposto_pro_labore`
- `declaracao_ir`
- `extrato_bancario`
- `fatura_cartao_credito`
- `declaracao_aplicativo_uber_99_ifood`
- `cnpj_mei`
- `contrato_social_mei`
- `das_mei`
- `extrato_fgts`
- `certidao_nascimento_dependente`
- `comprovacao_responsabilidade_legal_dependente`
- `outros`

### Entidade: `usuario` (equipe interna LCM)

| Campo | Tipo |
|---|---|
| `id` | UUID |
| `nome` | string |
| `email` | string |
| `cargo` | string |
| `ativo` | boolean |
| `created_at` | datetime |

### Entidade: `historico_status`

| Campo | Tipo |
|---|---|
| `id` | UUID |
| `candidato_id` | UUID FK |
| `status_anterior` | enum |
| `status_novo` | enum |
| `alterado_por` | UUID FK (usuario) |
| `alterado_em` | datetime |
| `motivo` | text |

---

## 11. Regras Consolidadas de Documentos por Perfil

### Por tipo de renda

| Tipo de Renda | Documentos Obrigatórios |
|---|---|
| **Renda CLT (formal)** | Identidade + Certidão de estado civil + Comprovante de endereço (60d) + CTPS Digital + Contracheque (60d) |
| **Renda Pró-Labore** | Idem CLT + Comprovante de recolhimento de imposto do Pró-Labore + Extrato bancário 6 meses |
| **Renda Informal** | Identidade + Certidão + Comprovante de endereço + Extrato bancário 6 meses (todas as contas) + Despesas 3 meses + Campo de narrativa |
| **Trabalhador de Aplicativo** | Idem Informal + Declaração do aplicativo (Uber/99/iFood com data de ingresso, avaliação e média de ganhos) |
| **MEI** | Idem Informal + CNPJ + Contrato Social + DAS |
| **Renda Mista** | Documentos de cada tipo se acumulam |

### Por situação adicional

| Situação | Documentos adicionais |
|---|---|
| Declara IR | + Cópia da última declaração de IR |
| Usa FGTS | + Extrato do FGTS (mín. 36 meses de recolhimento) |
| Com Dependente | + Certidão de nascimento do dependente + Comprovação de responsabilidade legal |
| Projeto Municipal (Extrema, Mariana etc.) | + Comprovante de residência de 3 anos atrás (concessionária, extrato bancário, histórico escolar, declaração UBS ou matrícula escolar) |

---

## 12. Prazos de Validade e Comportamento do Sistema

| Documento | Prazo / Regra | Comportamento do sistema |
|---|---|---|
| Comprovante de endereço | Máximo 60 dias da data de emissão | **BLOQUEANTE** — impede aprovação |
| Contracheque | Máximo 60 dias da data de emissão | **BLOQUEANTE** — impede aprovação |
| Extratos bancários | Últimos 6 meses | **BLOQUEANTE** se incompleto |
| Despesas / cartão de crédito | Últimos 3 meses | **BLOQUEANTE** se incompleto |
| RG / CNH vencido | Sem prazo pela CEF | **ALERTA** amarelo — não impede o processo |
| Carteira de Trabalho | Deve ser digital | **ALERTA** se física — não impede o processo |
| Certidão de estado civil | Sem prazo de validade | — |

---

## 13. Regras de Upload e Qualidade de Imagem

### Formatos aceitos

- PDF, JPEG, PNG, foto de celular.

### Processamento obrigatório

- Converter **tudo** para PDF antes de salvar no sistema (referência de ferramenta: iLovePDF ou equivalente via API).

### Rejeição automática por qualidade

- Se a foto estiver borrada, escura ou com dedo na frente: **rejeitar com mensagem amigável** e instrução de como refazer.
- Mensagem padrão: *"Esta imagem está difícil de ler. Por favor, tire uma nova foto com boa iluminação e sem cobrir partes do documento."*
- Critério de Gleice: *"Se você consegue ler bem a foto, eu também consigo."*

### UX de digitalização (pop-ups educativos)

- **Pop-up ao solicitar cada documento:** "Dica: use o CamScanner ou a função de digitalização do seu celular para uma imagem mais clara."
- **Sugestão de app:** CamScanner (gratuito) ou função nativa de scan do celular.
- **Tutorial de Carteira de Trabalho Digital:** exibir pop-up/tutorial ensinando como baixar e usar o app gov.br da Carteira de Trabalho Digital — esta instrução deve aparecer sempre que o documento CTPS for solicitado.

> **Contexto:** Gleice faz treinamento presencial com corretores ensinando a tirar fotos de documentos. A plataforma deve digitalizar esse treinamento nos pop-ups e tutoriais.

---

## 14. Glossário

| Termo | Significado |
|---|---|
| **MCMV** | Minha Casa Minha Vida — programa habitacional do Governo Federal |
| **MCMV Cidades** | Modalidade com subsídio municipal adicional, exige residência mínima no município |
| **CEF / Caixa** | Caixa Econômica Federal — banco que financia o programa |
| **CV CRM** | Sistema de gestão comercial utilizado pela LCM Construtora (integração prevista para V2) |
| **Pró-Labore** | Remuneração mensal do sócio de empresa. Exige comprovação de recolhimento de imposto. |
| **MEI** | Microempreendedor Individual — CNPJ com regime simplificado de tributação |
| **DAS** | Documento de Arrecadação do Simples — guia mensal de pagamento do MEI |
| **Renda Mista** | Combinação de renda formal (CLT/Pró-Labore) com renda informal |
| **Normativo da Caixa** | Manual de normas da CEF que regula todos os processos de financiamento MCMV |
| **Ficha Pré-Cadastral** | Formulário de perguntas sim/não criado por Gleice para padronizar a coleta de perfil do candidato |
| **CamScanner** | App gratuito para digitalizar documentos com qualidade via celular |
| **FGTS** | Fundo de Garantia do Tempo de Serviço — pode ser usado para abater o financiamento |
| **Subsídio** | Desconto concedido pelo governo no valor do imóvel — candidato não pode ter sido beneficiário de subsídio habitacional após 16/05/2005 |
| **Pesquisa Cadastral** | Consulta de restrições de crédito (Serasa, SPC, BACEN) do CPF — prevista para V2 |

---

## 15. Roadmap Pós-V1

| Prioridade | Funcionalidade | Descrição |
|---|---|---|
| **V2** | Pesquisa Cadastral em Lote (via API) | Importar base de CPFs (~5.000 da Prefeitura de Extrema) e rodar consulta automatizada de restrições de crédito (Serasa/SPC/BACEN). Retornar status por CPF (tem restrição: Sim/Não) com valor e data. Implementar via API de bureau de crédito (ex: Serasa Experian, Boa Vista). Reduz semanas de trabalho manual para minutos. |
| **V2** | Integração com CV CRM | Após aprovação final pelo analista, enviar automaticamente todos os dados e documentos para o CV CRM da LCM. Elimina dupla digitação. |
| **V3** | Acesso por Corretores | Abrir a plataforma para corretores inserirem dados dos clientes diretamente. QR Code / link enviável por WhatsApp. |
| **V3** | Acesso Direto pelo Candidato | Candidato preenche a ficha e sobe documentos por conta própria via link/QR Code. |
| **V4** | Chatbot WhatsApp | Bot para tirar dúvidas dos corretores sobre documentação e regras do MCMV — alivia Gleice de responder perguntas repetitivas. |
| **V4** | Verificação de IR via Receita Federal | Automação da consulta ao portal de restituição da Receita Federal para verificar se o candidato declarou IR. |

### Nota sobre a Pesquisa Cadastral (alto valor, V2)

- A LCM tem ~5.000 CPFs cadastrados que precisam de pesquisa cadastral antes do contato comercial.
- Hoje isso é feito **manualmente** — demora semanas.
- Uma integração via API de bureau de crédito rodaria isso em **minutos**.
- Resultado esperado por CPF: Tem restrição (Sim/Não) + Valor da restrição + Data.
- Quem tem restrição alta: equipe analisa e decide se inviabiliza o negócio antes de gastar tempo com o candidato.
- Esta funcionalidade pode ser vendida como **add-on de alto valor** para a LCM na V2.

---

*Documento gerado a partir do Briefing de Produto V1 — LCM Plataforma Minha Casa Minha Vida. Baseado na reunião com Gleice Silva (Analista de Crédito — LCM Construtora). Todas as regras, citações e informações da reunião foram preservadas.*
