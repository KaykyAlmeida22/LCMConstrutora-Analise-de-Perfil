# Plataforma LCM Construtora - Análise de Perfil

## 💻 Sobre a Plataforma

A Plataforma LCM é um sistema interno desenvolvido para a **LCM Construtora** com o objetivo de digitalizar, organizar e automatizar o processo de cadastro e coleta de documentos de candidatos ao programa **Minha Casa Minha Vida (MCMV)**. 

O sistema resolve problemas comuns no processo de financiamento, como recebimento de documentos ilegíveis, falta de padronização nas informações coletadas e validação manual demorada, otimizando o fluxo de trabalho da equipe de análise de crédito.

## ⚙️ Como Funciona (Funcionalidades)

O fluxo da plataforma é dinâmico e dividido em etapas claras para maximizar a assertividade:

1. **Ficha Pré-Cadastral Inteligente:** 
   Um formulário interativo de 11 blocos com perguntas estruturadas sobre o perfil do candidato (situação de moradia, estado civil, financiamentos anteriores, dependentes, informações de renda, entre outros).

2. **Coleta de Documentos Condicional:**
   Com base nas respostas da ficha pré-cadastral, a plataforma gera automaticamente a lista exata de documentos exigidos para aquele perfil específico. Por exemplo: se o candidato informar ser "CLT", o sistema solicitará o contracheque; se possuir renda "Informal", solicitará extratos bancários, faturas e a narrativa de renda.

3. **Validação Automática por Inteligência Artificial (IA):**
   Ao fazer o upload, a IA analisa os documentos em tempo real. Ela verifica a qualidade da imagem, averigua a consistência de dados (nome, CPF), valida prazos de vencimento (ex: comprovante de endereço com máximo de 60 dias) e gera alertas bloqueantes ou informativos automáticos no painel.

4. **Painel do Analista (Dashboard Central):**
   Interface administrativa abrangente na qual a equipe de crédito da LCM pode:
   - Gerenciar candidatos atráves de funil de status (*Documentação Pendente*, *Em Análise*, *Aprovado*, *Subsídio Bloqueado*).
   - Visualizar PDFs inline (sem necessidade de downloads constantes).
   - Aprovar ou rejeitar (solicitando correção) documento a documento individualmente.
   - Adicionar notas e narrativas de comprovação de renda.

5. **Regras de Negócios e Alertas Críticos:**
   O sistema incorpora regras rígidas da Caixa Econômica Federal e limites de subsídios, emitindo alertas automáticos (como detecção de financiamento habitacional pós-2005) para pautar a decisão do analista e reduzir a margem de erro.

## 🛠️ Stack e Tecnologias Utilizadas

A aplicação adota um padrão de excelência visual (*Premium Design, Dark Theme e Glassmorphism*) e arquitetura robusta:

### Core Tech Stack
*   **React (v19):** Biblioteca de construção de interfaces de usuário responsivas.
*   **TypeScript:** Tipagem estática rigorosa para garantir estabilidade e prevenção de bugs.
*   **Vite (v8):** Ferramenta de build super rápida habilitando Hot Module Replacement (HMR) performático.
*   **React Router DOM (v7):** Gerenciamento ágil das rotas de cadastro, onboarding e dashboard interno.
*   **Framer Motion:** Biblioteca avançada para criar animações fluidas e micro-interações dinâmicas pela interface.
*   **Lucide React:** Conjunto de ícones vetoriais profissionais empregados por toda a plataforma.

## 🔗 Integrações e Back-end

A robustez da plataforma é suportada por um ecossistema sólido no backend:

*   **Supabase (Backend-as-a-Service):**
    *   **PostgreSQL Database:** Banco de dados relacional para persistir candidatos, informações cadastrais (ficha), dependentes e status com consistência transacional profunda.
    *   **Autenticação:** Gerenciamento seguro de acesso, exclusivo para a equipe de analistas da LCM.
    *   **Storage (Buckets):** Armazenamento em nuvem otimizado e seguro para salvaguardar os PDFs e imagens anexadas pelos candidatos.

*   **Inteligência Artificial (OpenAI):** 
    *   Processamento inteligente de documentos via IA, oferecendo validação (OCR), análise de qualidade fotográfica (nitidez/enquadramento), cruzamento de dados textuais e checagens automáticas que evitam que documentação incorreta chegue sem filtro à mesa do analista.

---

> ⚠️ **Aviso Relevante:** *Este é um projeto de circulação e uso restrito, desenhado sob medida exclusivamente para o time interno da LCM Construtora.*
