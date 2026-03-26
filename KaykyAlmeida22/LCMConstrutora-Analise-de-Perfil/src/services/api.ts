import { supabase } from '../lib/supabase';
import type { Candidate, FormAnswers, Document } from '../types';

export const api = {
  // === CANDIDATOS ===
  
  async getCandidates(): Promise<Candidate[]> {
    const { data, error } = await supabase
      .from('candidatos')
      .select(`
        *,
        fichas_cadastrais (*),
        documentos(*),
        dependentes(*)
      `)
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('Error fetching candidates:', error);
      return [];
    }
    return data as Candidate[];
  },

  async uploadFile(candidateId: string, file: File, path: string): Promise<string | null> {
    const { data, error } = await supabase.storage
      .from('documentos_candidatos')
      .upload(`${candidateId}/${path}`, file, {
        upsert: true
      });

    if (error) {
      console.error('Error uploading file:', error);
      return null;
    }

    const { data: { publicUrl } } = supabase.storage
      .from('documentos_candidatos')
      .getPublicUrl(data.path);

    return publicUrl;
  },

  async getCandidate(id: string): Promise<Candidate | undefined> {
    const { data, error } = await supabase
      .from('candidatos')
      .select(`
        *,
        fichas_cadastrais (*),
        documentos (*),
        dependentes (*)
      `)
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching candidate:', error);
      return undefined;
    }
    return data as Candidate;
  },

  async createCandidate(data: Omit<Candidate, 'id' | 'created_at' | 'updated_at' | 'status'>): Promise<Candidate | undefined> {
    const { data: result, error } = await supabase
      .from('candidatos')
      .insert({ ...data, status: 'documentacao_pendente' })
      .select()
      .single();

    if (error) {
      console.error('Error creating candidate:', error);
      return undefined;
    }
    return result as Candidate;
  },

  async updateCandidate(id: string, updates: Partial<Candidate>): Promise<Candidate | undefined> {
    const { data, error } = await supabase
      .from('candidatos')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating candidate:', error);
      return undefined;
    }
    return data as Candidate;
  },

  async updateStatus(id: string, status: string, analystId?: string, reason?: string): Promise<Candidate | undefined> {
    // Also save to history
    await supabase.from('historico_status').insert({
      candidato_id: id,
      status_novo: status,
      alterado_por: analystId,
      motivo: reason
    });

    return this.updateCandidate(id, { status });
  },

  // === FICHAS CADASTRAIS ===

  async saveFormAnswers(id: string, answers: FormAnswers): Promise<Candidate | undefined> {
    const { 
        dependentes, 
        financiamento_habitacional_pos_2005, 
        nome_completo,
        cpf,
        telefone,
        endereco,
        municipio_projeto,
        narrativa_renda,
        candidato_id,
        created_at,
        updated_at,
        ...restFichaData 
    } = answers as any;
    
    // Explicit list of allowed columns for fichas_cadastrais to prevent any PG errors
    const allowedFichaColumns = [
        'tipo_residencia', 'valor_aluguel', 'teve_imovel_anterior', 'venda_registrada_cartorio',
        'escolaridade', 'estado_civil', 'regime_bens', 'data_casamento', 'tem_dependentes',
        'tem_financiamento_habitacional', 'data_contrato_habitacional', 'tem_financiamento_estudantil',
        'financiamento_estudantil_em_atraso', 'tem_veiculo', 'valor_mercado_veiculo',
        'veiculo_financiado', 'prestacao_veiculo', 'parcelas_restantes_veiculo',
        'tem_cartao_credito', 'bandeira_cartao', 'tem_imovel', 'valor_mercado_imovel',
        'declara_ir', 'tem_conta_corrente', 'banco_conta_corrente', 'limite_cheque_especial',
        'tem_poupanca_aplicacao', 'comprova_36_meses_fgts', 'fara_uso_fgts',
        'tipo_renda', 'faixa_renda', 'trabalha_aplicativo'
    ];

    const fichaData: any = { candidato_id: id };
    allowedFichaColumns.forEach(col => {
        if (restFichaData[col] !== undefined) {
            fichaData[col] = restFichaData[col];
        }
    });

    // Convert empty strings to null for DATE fields
    const sanitizeDate = (val: string | undefined | null) => val === '' ? null : val;
    if (fichaData.data_casamento !== undefined) fichaData.data_casamento = sanitizeDate(fichaData.data_casamento);
    if (fichaData.data_contrato_habitacional !== undefined) fichaData.data_contrato_habitacional = sanitizeDate(fichaData.data_contrato_habitacional);
    
    // 1. Save Ficha
    const { error: fichaError } = await supabase
      .from('fichas_cadastrais')
      .upsert(fichaData);

    if (fichaError) {
      console.error('Error saving ficha:', fichaError);
      return undefined;
    }

    // 2. Sync core candidate data
    const candidateData = {
        nome_completo,
        cpf,
        telefone,
        endereco,
        municipio_projeto,
        narrativa_renda
    };

    // Filter candidate update to only existing values
    const cleanedCandidateData = Object.fromEntries(
        Object.entries(candidateData).filter(([_, v]) => v !== undefined)
    );

    if (Object.keys(cleanedCandidateData).length > 0) {
        const { error: candError } = await supabase.from('candidatos').update(cleanedCandidateData).eq('id', id);
        if (candError) {
          console.error('Error updating candidate core data:', candError);
          // We continue but log it
        }
    }

    // 3. Save Dependents
    if (dependentes && Array.isArray(dependentes)) {
      // Clear old dependents first
      await supabase.from('dependentes').delete().eq('candidato_id', id);
      if (dependentes.length > 0) {
        const depsWithCandidateId = dependentes.map(dep => {
            const { id: depId, created_at: dCa, ...restDep } = dep as any;
            return { ...restDep, candidato_id: id };
        });
        await supabase.from('dependentes').insert(depsWithCandidateId);
      }
    }

    return this.updateCandidate(id, { status: 'documentacao_pendente' });
  },

  // === DOCUMENTOS ===

  async addDocument(doc: Partial<Document>): Promise<Document | undefined> {
    const { data, error } = await supabase
      .from('documentos')
      .insert(doc)
      .select()
      .single();

    if (error) {
      console.error('Error adding document:', error);
      return undefined;
    }
    return data as Document;
  },

  async updateDocument(docId: string, updates: Partial<Document>): Promise<Document | undefined> {
    const { data, error } = await supabase
      .from('documentos')
      .update(updates)
      .eq('id', docId)
      .select()
      .single();

    if (error) {
      console.error('Error updating document:', error);
      return undefined;
    }
    return data as Document;
  },

  // === ESTAÍSTICAS (Dashboard) ===

  async getStats(): Promise<Record<string, number>> {
    const stats: Record<string, number> = {
      documentacao_pendente: 0,
      em_analise: 0,
      aguardando_correcao: 0,
      aprovado: 0,
      subsidio_bloqueado: 0,
      sem_renda_comprovavel: 0,
    };

    const { data, error } = await supabase
      .from('candidatos')
      .select('status');

    if (error) {
      console.error('Error fetching stats:', error);
      return stats;
    }

    data.forEach(c => {
      if (stats[c.status] !== undefined) {
        stats[c.status]++;
      } else {
        stats[c.status] = 1;
      }
    });

    return stats;
  }
};
