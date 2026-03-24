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
    const { dependentes, ...fichaData } = answers;
    
    // Save Ficha
    const { error: fichaError } = await supabase
      .from('fichas_cadastrais')
      .upsert({ candidato_id: id, ...fichaData });

    if (fichaError) {
      console.error('Error saving form answers:', fichaError);
      return undefined;
    }

    // Save Dependents
    if (dependentes && dependentes.length > 0) {
      // Clear old dependents first
      await supabase.from('dependentes').delete().eq('candidato_id', id);
      const depsWithCandidateId = dependentes.map(dep => ({ ...dep, candidato_id: id }));
      await supabase.from('dependentes').insert(depsWithCandidateId);
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
