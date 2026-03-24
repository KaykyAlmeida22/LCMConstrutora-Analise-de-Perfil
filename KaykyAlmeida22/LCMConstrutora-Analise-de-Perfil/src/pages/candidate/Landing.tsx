import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../services/api';

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
    try {
      // Find candidate by CPF
      const candidates = await api.getCandidates();
      const candidate = candidates.find((c) => c.cpf.replace(/\D/g, '') === cleanCpf);
      
      if (candidate) {
        const hasFicha = Array.isArray(candidate.fichas_cadastrais) 
            ? candidate.fichas_cadastrais.length > 0
            : !!candidate.fichas_cadastrais;
            
        if (!hasFicha) {
          navigate(`/onboarding?id=${candidate.id}`);
        } else {
          navigate(`/upload?id=${candidate.id}`);
        }
      } else {
        // Here we could implement the self-registration flow
        // but for now, since you want 'everyone' to be able to do it,
        // we can create an empty candidate on the fly if not found.
        const newCandidate = await api.createCandidate({
           nome_completo: 'Candidato em Preenchimento',
           cpf: formatCPF(cleanCpf),
           telefone: '',
           endereco: '',
           municipio_projeto: 'Extrema'
        });
        
        if (newCandidate) {
            navigate(`/onboarding?id=${newCandidate.id}`);
        } else {
           setError('Erro ao criar seu cadastro. Tente novamente.');
        }
      }
    } catch (err) {
      console.error(err);
      setError('Ocorreu um erro ao consultar seu CPF. Tente novamente mais tarde.');
    } finally {
      setLoading(false);
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
        <button className="btn btn-primary btn-sm" onClick={() => navigate('/admin/login')}>
          Acesso Analista
        </button>
      </header>

      {/* Hero Section */}
      <main style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
        <div style={{ maxWidth: '480px', width: '100%', textAlign: 'center' }}>
          <div style={{ fontSize: '3rem', marginBottom: '16px' }}>🏠</div>
          <h1 style={{ fontSize: '2.25rem', fontWeight: 800, marginBottom: '16px', lineHeight: 1.1 }}>
            Acesso ao <span className="text-gradient">Portal do Candidato</span>
          </h1>
          <p style={{ color: 'var(--text-muted)', marginBottom: '40px', fontSize: '1.05rem', lineHeight: 1.6 }}>
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
              {loading ? 'Consultando...' : 'Entrar Agora →'}
            </button>
            <div style={{ textAlign: 'center', marginTop: '16px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Acesso livre para preenchimento da etapa inicial do Processo MCMV.
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
