import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import { ArrowLeft } from 'lucide-react';

export default function NewCandidate() {
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    nome_completo: '',
    cpf: '',
    telefone: '',
    endereco: '',
    municipio_projeto: 'Extrema',
  });

  function formatCPF(value: string): string {
    const digits = value.replace(/\D/g, '').slice(0, 11);
    if (digits.length <= 3) return digits;
    if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
    if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
    return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
  }

  function formatPhone(value: string): string {
    const digits = value.replace(/\D/g, '').slice(0, 11);
    if (digits.length <= 2) return digits;
    if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  }

  function handleChange(field: string, value: string) {
    if (field === 'cpf') value = formatCPF(value);
    if (field === 'telefone') value = formatPhone(value);
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.nome_completo.trim() || !form.cpf.trim()) return;
    setSaving(true);
    
    try {
      const candidate = await api.createCandidate({
        nome_completo: form.nome_completo.trim(),
        cpf: form.cpf.trim(),
        telefone: form.telefone.trim(),
        endereco: form.endereco.trim(),
        municipio_projeto: form.municipio_projeto,
      });

      if (candidate) {
        navigate(`/onboarding?id=${candidate.id}&admin=true`);
      } else {
        alert('Erro ao criar candidato. Verifique se o CPF já existe.');
      }
    } catch (err) {
      console.error(err);
      alert('Ocorreu um erro inesperado.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="animate-fadeIn" style={{ maxWidth: '640px' }}>
      <button
        className="btn btn-ghost btn-sm"
        onClick={() => navigate('/admin')}
        style={{ marginBottom: '16px', fontSize: '0.8rem' }}
      >
        <ArrowLeft size={14} /> Voltar
      </button>

      <h1 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '4px' }}>
        Novo Candidato
      </h1>
      <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '24px' }}>
        Cadastre as informações básicas para iniciar o processo.
      </p>

      <form onSubmit={handleSubmit} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div className="form-group">
          <label className="form-label">Nome Completo *</label>
          <input
            className="form-input"
            placeholder="Ex: Maria da Silva Santos"
            value={form.nome_completo}
            onChange={(e) => handleChange('nome_completo', e.target.value)}
            required
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <div className="form-group">
            <label className="form-label">CPF *</label>
            <input
              className="form-input"
              placeholder="000.000.000-00"
              value={form.cpf}
              onChange={(e) => handleChange('cpf', e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">Telefone</label>
            <input
              className="form-input"
              placeholder="(00) 00000-0000"
              value={form.telefone}
              onChange={(e) => handleChange('telefone', e.target.value)}
            />
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Endereço (Opcional)</label>
          <input
            className="form-input"
            placeholder="Rua, Número, Bairro..."
            value={form.endereco}
            onChange={(e) => handleChange('endereco', e.target.value)}
          />
        </div>

        <div className="form-group">
          <label className="form-label">Município do Projeto *</label>
          <select 
            className="form-input"
            value={form.municipio_projeto}
            onChange={(e) => handleChange('municipio_projeto', e.target.value)}
            required
          >
            <option value="Extrema">Extrema - MG</option>
          </select>
        </div>

        <div className="flex justify-between" style={{ marginTop: '8px' }}>
          <button type="button" className="btn btn-ghost" onClick={() => navigate('/admin')}>
            Cancelar
          </button>
          <button type="submit" className="btn btn-primary" disabled={saving || !form.nome_completo.trim() || !form.cpf.trim()}>
            {saving ? 'Cadastrando...' : 'Continuar para Ficha Cadastral →'}
          </button>
        </div>
      </form>
    </div>
  );
}
