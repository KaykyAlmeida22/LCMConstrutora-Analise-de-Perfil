import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../../services/mockDatabase';

export default function NewCandidate() {
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    nome: '',
    cpf: '',
    telefone: '',
    email: '',
    dataNascimento: '',
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
    if (digits.length <= 2) return `(${digits}`;
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
    if (!form.nome.trim() || !form.cpf.trim()) return;
    setSaving(true);
    const candidate = await db.createCandidate({
      nome: form.nome.trim(),
      cpf: form.cpf.trim(),
      telefone: form.telefone.trim(),
      email: form.email.trim(),
      dataNascimento: form.dataNascimento,
      formAnswers: null,
    });
    setSaving(false);
    navigate(`/admin/candidato/${candidate.id}`);
  }

  return (
    <div className="animate-fadeIn" style={{ maxWidth: '700px' }}>
      <button
        className="btn btn-ghost btn-sm"
        onClick={() => navigate('/admin')}
        style={{ marginBottom: '16px' }}
      >
        ← Voltar
      </button>

      <h1 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '4px' }}>
        Novo Candidato
      </h1>
      <p className="text-muted" style={{ marginBottom: '32px' }}>
        Cadastre as informações básicas do candidato ao programa MCMV.
      </p>

      <form onSubmit={handleSubmit} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div className="form-group">
          <label className="form-label" htmlFor="nome">Nome Completo *</label>
          <input
            id="nome"
            className="form-input"
            placeholder="Ex: Maria da Silva Santos"
            value={form.nome}
            onChange={(e) => handleChange('nome', e.target.value)}
            required
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div className="form-group">
            <label className="form-label" htmlFor="cpf">CPF *</label>
            <input
              id="cpf"
              className="form-input"
              placeholder="000.000.000-00"
              value={form.cpf}
              onChange={(e) => handleChange('cpf', e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="dataNascimento">Data de Nascimento</label>
            <input
              id="dataNascimento"
              className="form-input"
              type="date"
              value={form.dataNascimento}
              onChange={(e) => handleChange('dataNascimento', e.target.value)}
            />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div className="form-group">
            <label className="form-label" htmlFor="telefone">Telefone</label>
            <input
              id="telefone"
              className="form-input"
              placeholder="(00) 00000-0000"
              value={form.telefone}
              onChange={(e) => handleChange('telefone', e.target.value)}
            />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="email">Email</label>
            <input
              id="email"
              className="form-input"
              type="email"
              placeholder="email@exemplo.com"
              value={form.email}
              onChange={(e) => handleChange('email', e.target.value)}
            />
          </div>
        </div>

        <div className="flex justify-between" style={{ marginTop: '12px' }}>
          <button type="button" className="btn btn-ghost" onClick={() => navigate('/admin')}>
            Cancelar
          </button>
          <button type="submit" className="btn btn-primary btn-lg" disabled={saving || !form.nome.trim() || !form.cpf.trim()}>
            {saving ? 'Cadastrando...' : '✅ Cadastrar Candidato'}
          </button>
        </div>
      </form>
    </div>
  );
}
