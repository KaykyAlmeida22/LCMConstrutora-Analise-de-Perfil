import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import { Building2, ArrowRight, AlertCircle, ShieldCheck } from 'lucide-react';

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
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden' }}>
      
      {/* Background Orbs Effect */}
      <div style={{
         position: 'absolute', top: '-10%', left: '-10%', width: '50vw', height: '50vw',
         background: 'radial-gradient(circle, rgba(59, 130, 246, 0.08) 0%, rgba(0,0,0,0) 70%)',
         zIndex: 0, pointerEvents: 'none'
      }} />
      <div style={{
         position: 'absolute', bottom: '-20%', right: '-10%', width: '60vw', height: '60vw',
         background: 'radial-gradient(circle, rgba(99, 102, 241, 0.05) 0%, rgba(0,0,0,0) 70%)',
         zIndex: 0, pointerEvents: 'none'
      }} />

      {/* Navbar Minimalist */}
      <header
        style={{
          padding: '24px 32px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: '1px solid var(--border-default)',
          background: 'rgba(8, 11, 18, 0.65)',
          backdropFilter: 'blur(20px)',
          zIndex: 10
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: '12px',
              background: 'linear-gradient(135deg, var(--primary-600), var(--primary-800))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              boxShadow: 'var(--shadow-sm), inset 0 1px 1px rgba(255,255,255,0.2)',
              border: '1px solid rgba(255,255,255,0.05)'
            }}
          >
            <Building2 size={22} strokeWidth={1.5} />
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: '1.05rem', letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>LCM Construtora</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 500 }}>Minha Casa Minha Vida</div>
          </div>
        </div>
        <button 
          className="btn btn-ghost btn-sm" 
          style={{ border: '1px solid var(--border-default)', borderRadius: '99px', padding: '6px 16px', fontSize: '0.8rem' }}
          onClick={() => navigate('/admin/login')}
        >
          Acesso Analista
        </button>
      </header>

      {/* Hero Section */}
      <main style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', zIndex: 10 }}>
        <div style={{ maxWidth: '440px', width: '100%', textAlign: 'center' }}>
          
          <div style={{ 
            display: 'inline-flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            width: 72, height: 72, 
            borderRadius: '20px', 
            background: 'var(--bg-tertiary)', 
            border: '1px solid var(--border-default)',
            marginBottom: '24px',
            boxShadow: 'var(--shadow-lg)'
          }}>
            <ShieldCheck size={36} className="text-primary-400" strokeWidth={1.5} />
          </div>
          
          <h1 style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: '16px', lineHeight: 1.15, letterSpacing: '-0.03em' }}>
            Acesso ao <span className="text-primary-400">Portal</span>
          </h1>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '40px', fontSize: '1rem', lineHeight: 1.6 }}>
            Acompanhe o status da sua inscrição, preencha sua ficha cadastral e envie seus documentos de forma rápida e segura.
          </p>

          <form
            className="card-glass animate-slideUp"
            style={{ 
              padding: '40px', 
              textAlign: 'left', 
              border: '1px solid var(--border-default)',
              boxShadow: '0 24px 64px -16px rgba(0,0,0,0.6)',
              background: 'var(--bg-card)',
              borderRadius: '24px'
            }}
            onSubmit={handleLogin}
          >
            <h2 style={{ fontSize: '1.3rem', fontWeight: 700, marginBottom: '8px', letterSpacing: '-0.02em' }}>
              Acesse sua área
            </h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '28px' }}>
              Digite seu CPF para consultar ou iniciar seu cadastro.
            </p>

            <div className="form-group" style={{ marginBottom: '28px' }}>
              <label className="form-label" htmlFor="cpf" style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                CPF do Titular
              </label>
              <input
                id="cpf"
                className="form-input"
                placeholder="000.000.000-00"
                value={cpf}
                onChange={handleChange}
                style={{ fontSize: '1.15rem', padding: '16px', borderRadius: '12px', background: 'var(--bg-secondary)' }}
                required
              />
            </div>

            {error && (
              <div className="alert alert-error" style={{ marginBottom: '24px', borderRadius: '12px' }}>
                <span className="alert-icon"><AlertCircle size={18} /></span>
                <span style={{ fontSize: '0.85rem' }}>{error}</span>
              </div>
            )}

            <button
              type="submit"
              className="btn btn-primary btn-lg"
              style={{ width: '100%', padding: '16px', borderRadius: '12px', justifyContent: 'center', gap: '12px' }}
              disabled={loading || cpf.length < 14}
            >
              <span style={{ fontSize: '1.05rem', fontWeight: 600 }}>{loading ? 'Consultando...' : 'Acessar Portal'}</span>
              {!loading && <ArrowRight size={20} />}
            </button>
          </form>
          
          <div style={{ textAlign: 'center', marginTop: '32px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Ambiente seguro e criptografado. Suas informações estão protegidas.
          </div>
        </div>
      </main>
    </div>
  );
}
