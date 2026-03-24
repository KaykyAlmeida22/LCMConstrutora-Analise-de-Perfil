import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../../services/mockDatabase';

export default function Landing() {
  const navigate = useNavigate();
  const [cpf, setCpf] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  function formatCPF(value: string): string {
    const digits = value.replace(/\D/g, '').slice(0, 11);
    if (digits.length <= 3) return digits;
    if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
    if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
    return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setCpf(formatCPF(e.target.value));
    setError('');
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    const cleanCpf = cpf.replace(/\D/g, '');
    if (cleanCpf.length !== 11) {
      setError('Por favor, informe um CPF válido.');
      return;
    }

    setLoading(true);
    // Find candidate by CPF
    const candidates = await db.getCandidates();
    const candidate = candidates.find((c) => c.cpf.replace(/\D/g, '') === cleanCpf);
    setLoading(false);

    if (candidate) {
      if (!candidate.formAnswers) {
        navigate(`/onboarding?id=${candidate.id}`);
      } else {
        navigate(`/upload?id=${candidate.id}`);
      }
    } else {
      setError('CPF não encontrado. Se você ainda não tem cadastro, será inserido em breve.');
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Navbar Minimalist */}
      <header
        style={{
          padding: '24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: '1px solid var(--border-default)',
          background: 'rgba(15, 23, 42, 0.8)',
          backdropFilter: 'blur(12px)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: '8px',
              background: 'linear-gradient(135deg, var(--primary-500), var(--primary-700))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1rem',
              fontWeight: 800,
              color: 'white',
            }}
          >
            LCM
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: '1rem' }}>LCM Construtora</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Minha Casa Minha Vida</div>
          </div>
        </div>
        <button className="btn btn-ghost btn-sm" onClick={() => navigate('/admin/login')}>
          Acesso Restrito
        </button>
      </header>

      {/* Hero Section */}
      <main style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
        <div style={{ maxWidth: '480px', width: '100%', textAlign: 'center' }}>
          <div style={{ fontSize: '3rem', marginBottom: '16px' }}>🏠</div>
          <h1 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '16px', lineHeight: 1.2 }}>
            Acesso ao <span style={{ color: 'var(--primary-400)' }}>Portal do Candidato</span>
          </h1>
          <p style={{ color: 'var(--text-muted)', marginBottom: '40px', fontSize: '1.05rem' }}>
            Acompanhe o status da sua inscrição, preencha sua ficha cadastral e envie seus documentos de forma rápida e segura.
          </p>

          <form
            className="card-glass"
            style={{ padding: '32px', textAlign: 'left', borderTop: '4px solid var(--primary-500)' }}
            onSubmit={handleLogin}
          >
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '24px' }}>
              Acesse sua área
            </h2>

            <div className="form-group" style={{ marginBottom: '24px' }}>
              <label className="form-label" htmlFor="cpf">Informe seu CPF</label>
              <input
                id="cpf"
                className="form-input"
                placeholder="000.000.000-00"
                value={cpf}
                onChange={handleChange}
                style={{ fontSize: '1.1rem', padding: '16px' }}
                required
              />
            </div>

            {error && (
              <div className="alert alert-error" style={{ marginBottom: '24px' }}>
                <span className="alert-icon">❌</span>
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              className="btn btn-primary btn-lg"
              style={{ width: '100%', padding: '16px' }}
              disabled={loading || cpf.length < 14}
            >
              {loading ? 'Consultando...' : 'Entrar →'}
            </button>
            <div style={{ textAlign: 'center', marginTop: '16px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Apenas candidatos convidados têm acesso a este portal.
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
