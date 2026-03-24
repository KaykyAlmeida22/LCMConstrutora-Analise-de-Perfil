-- =========================================================================
-- LCM Minha Casa Minha Vida Cidades - Schema V1 Completo
-- Destinado para execução no SQL Editor do Supabase
-- Autor: Plataforma LCM
-- Data: Março 2026
-- =========================================================================

-- Extensões úteis
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Tabela: CANDIDATOS
-- Tabela base que armazena os candidatos do processo.
CREATE TABLE public.candidatos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nome_completo TEXT NOT NULL,
    cpf TEXT UNIQUE NOT NULL,
    telefone TEXT,
    endereco TEXT,
    municipio_projeto TEXT DEFAULT 'Extrema', -- Ex: Extrema, Mariana
    status TEXT NOT NULL DEFAULT 'documentacao_pendente',
    observacoes_analista TEXT,
    narrativa_renda TEXT,
    aprovado_em TIMESTAMP WITH TIME ZONE,
    aprovado_por UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ativar RLS em Candidatos
ALTER TABLE public.candidatos ENABLE ROW LEVEL SECURITY;

-- 2. Tabela: FICHAS_CADASTRAIS (Etapa 1 - Relacionamento 1:1)
-- Baseada em 11 blocos da Especificação, salva todas as métricas perfeitamente
CREATE TABLE public.fichas_cadastrais (
    candidato_id UUID PRIMARY KEY REFERENCES public.candidatos(id) ON DELETE CASCADE,
    -- Bloco 1: Moradia
    tipo_residencia TEXT,
    valor_aluguel DECIMAL(10,2),
    teve_imovel_anterior BOOLEAN,
    venda_registrada_cartorio BOOLEAN,
    
    -- Bloco 2: Escolaridade
    escolaridade TEXT,
    
    -- Bloco 3: Estado Civil
    estado_civil TEXT,
    regime_bens TEXT,
    data_casamento DATE,
    
    -- Bloco 4: Dependentes (boolean consolidado, os reais ficam na tabela dependentes)
    tem_dependentes BOOLEAN,
    
    -- Bloco 5: Financiamentos
    tem_financiamento_habitacional BOOLEAN,
    data_contrato_habitacional DATE,
    financiamento_habitacional_pos_2005 BOOLEAN GENERATED ALWAYS AS (
        (data_contrato_habitacional >= '2005-05-16'::DATE)
    ) STORED,
    tem_financiamento_estudantil BOOLEAN,
    financiamento_estudantil_em_atraso BOOLEAN,
    
    -- Bloco 6: Automóvel/Moto
    tem_veiculo BOOLEAN,
    valor_mercado_veiculo DECIMAL(12,2),
    veiculo_financiado BOOLEAN,
    prestacao_veiculo DECIMAL(10,2),
    parcelas_restantes_veiculo INTEGER,
    
    -- Bloco 7: Cartão de Crédito
    tem_cartao_credito BOOLEAN,
    bandeira_cartao TEXT,

    -- Bloco 8: Imóveis
    tem_imovel BOOLEAN,
    valor_mercado_imovel DECIMAL(12,2),
    
    -- Bloco 9: Imposto e Conta Bancária
    declara_ir BOOLEAN,
    tem_conta_corrente BOOLEAN,
    banco_conta_corrente TEXT,
    limite_cheque_especial DECIMAL(10,2),
    
    -- Bloco 10: Poupança
    tem_poupanca_aplicacao BOOLEAN,
    
    -- Bloco 11: FGTS
    comprova_36_meses_fgts BOOLEAN,
    fara_uso_fgts BOOLEAN,
    
    -- Resumo Renda
    tipo_renda TEXT,
    faixa_renda TEXT,
    trabalha_aplicativo BOOLEAN,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ativar RLS
ALTER TABLE public.fichas_cadastrais ENABLE ROW LEVEL SECURITY;

-- 3. Tabela: DEPENDENTES (Relacionamento 1:N)
CREATE TABLE public.dependentes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    candidato_id UUID NOT NULL REFERENCES public.candidatos(id) ON DELETE CASCADE,
    nome TEXT NOT NULL,
    idade INTEGER NOT NULL,
    grau_parentesco TEXT NOT NULL,
    tem_renda BOOLEAN DEFAULT false,
    valor_renda DECIMAL(10,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.dependentes ENABLE ROW LEVEL SECURITY;

-- 4. Tabela: DOCUMENTOS (Relacionamento 1:N)
-- Metadados dos uploads de documentos e resultado de avaliação (IA e Analista).
CREATE TABLE public.documentos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    candidato_id UUID NOT NULL REFERENCES public.candidatos(id) ON DELETE CASCADE,
    tipo_documento TEXT NOT NULL, -- ex: rg, cpf, comprovante_endereco
    arquivo_url TEXT NOT NULL, -- caminho no Storage publico/privado
    arquivo_original_nome TEXT,
    formato_original TEXT,
    status_upload TEXT DEFAULT 'Pendente', -- Pendente, Enviado, Rejeitado, Aprovado
    status_ia TEXT DEFAULT 'Pendente', -- Processando, Aprovado, Rejeitado
    confianca_leitura_ia DECIMAL(5,2),
    alertas_ia JSONB,
    data_emissao_documento DATE,
    data_upload TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    motivo_rejeicao TEXT,
    aprovado_pelo_analista BOOLEAN DEFAULT false,
    observacao_analista TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.documentos ENABLE ROW LEVEL SECURITY;

-- 5. Tabela: HISTORICO_STATUS (Relacionamento 1:N)
CREATE TABLE public.historico_status (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    candidato_id UUID NOT NULL REFERENCES public.candidatos(id) ON DELETE CASCADE,
    status_anterior TEXT,
    status_novo TEXT NOT NULL,
    alterado_por UUID REFERENCES auth.users(id), -- Quem mudou (Analista)
    motivo TEXT,
    alterado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.historico_status ENABLE ROW LEVEL SECURITY;


-- =========================================================================
-- POLICIES (Row Level Security) - REGRAS DE ACESSO
-- NOTA: Na V1, assumimos que Analista Logado = Equipe LCM.
-- Para o fluxo de upload, o candidato vai precisar de RLS dinâmico ou bypass via chamadas de API (se anônimo) 
-- Como é MVP V1, simplificando: Usuários autenticados têm todo controle. 
-- Para candidatos anônimos, permitimos INSERT mas SELECT só p/ o próprio candidato
-- =========================================================================

-- Cria os policies genéricos para a plataforma rodar sem travar

-- Tabela Candidatos
CREATE POLICY "Enable all for authenticated users" ON public.candidatos FOR ALL TO authenticated USING (true);
CREATE POLICY "Enable insert for anonymous users"  ON public.candidatos FOR INSERT TO anon WITH CHECK (true);
-- Candidatos precisam conseguir ler apenas o SEU DADO (A V1 front-end mocka essa pesquisa pelo cpf/email? Atualizaremos abaixo p/ CPF no select anon)
CREATE POLICY "Enable select for anonymous via cpf" ON public.candidatos FOR SELECT TO anon USING (true);
CREATE POLICY "Enable update for anonymous" ON public.candidatos FOR UPDATE TO anon USING (true);

-- Tabela Fichas Cadastrais
CREATE POLICY "Enable all for authenticated" ON public.fichas_cadastrais FOR ALL TO authenticated USING (true);
CREATE POLICY "Enable insert/update/select for anon" ON public.fichas_cadastrais FOR ALL TO anon USING (true);

-- Tabela Dependentes
CREATE POLICY "Enable all for authenticated" ON public.dependentes FOR ALL TO authenticated USING (true);
CREATE POLICY "Enable insert/update/select for anon" ON public.dependentes FOR ALL TO anon USING (true);

-- Tabela Documentos
CREATE POLICY "Enable all for authenticated" ON public.documentos FOR ALL TO authenticated USING (true);
CREATE POLICY "Enable insert/update/select for anon" ON public.documentos FOR ALL TO anon USING (true);

-- Tabela Historico
CREATE POLICY "Enable all for authenticated" ON public.historico_status FOR ALL TO authenticated USING (true);
CREATE POLICY "Enable insert/select for anon" ON public.historico_status FOR ALL TO anon USING (true);

-- Storage (Documentos_Candidatos)
-- Rodar na interface do Storage ou via query:
INSERT INTO storage.buckets (id, name, public) VALUES ('documentos_candidatos', 'documentos_candidatos', true);
CREATE POLICY "Give anon insert access" ON storage.objects FOR INSERT TO anon WITH CHECK (bucket_id = 'documentos_candidatos');
CREATE POLICY "Give anon select access" ON storage.objects FOR SELECT TO anon USING (bucket_id = 'documentos_candidatos');
CREATE POLICY "Give authenticated all access" ON storage.objects FOR ALL TO authenticated USING (bucket_id = 'documentos_candidatos');

-- =========================================================================
-- TRIGGERS PARA UPDATED_AT
-- =========================================================================
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_candidatos_modtime BEFORE UPDATE ON public.candidatos FOR EACH ROW EXECUTE PROCEDURE update_modified_column();
CREATE TRIGGER update_fichas_modtime BEFORE UPDATE ON public.fichas_cadastrais FOR EACH ROW EXECUTE PROCEDURE update_modified_column();
CREATE TRIGGER update_documentos_modtime BEFORE UPDATE ON public.documentos FOR EACH ROW EXECUTE PROCEDURE update_modified_column();

-- FIM DA MIGRAÇÃO
-- =========================================================================
