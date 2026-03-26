import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import { ArrowRight, AlertCircle, ShieldCheck } from 'lucide-react';

export default function Landing() {
  const navigate = useNavigate();
  const [cpf, setCpf] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isNewRegistration, setIsNewRegistration] = useState(false);

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
    setIsNewRegistration(false);
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    const cleanCpf = cpf.replace(/\D/g, '');
    if (cleanCpf.length !== 11) {
      setError('O CPF digitado está incompleto.');
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
        if (!isNewRegistration) {
           setIsNewRegistration(true);
           return;
        }

        const newCandidate = await api.createCandidate({
           nome_completo: 'Em Preenchimento',
           cpf: formatCPF(cleanCpf),
           telefone: '',
           endereco: '',
           municipio_projeto: 'Extrema'
        });
        
        if (newCandidate) {
            navigate(`/onboarding?id=${newCandidate.id}`);
        } else {
           setError('Problema ao iniciar cadastro. Tente de novo.');
        }
      }
    } catch (err) {
      console.error(err);
      setError('Não foi possível consultar seu CPF agora. Tente novamente.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{
      display: 'flex',
      minHeight: '100vh',
      background: '#ffffff',
    }}>

      {/* Left Side — Image Panel */}
      <div style={{
        width: '50%',
        minHeight: '100vh',
        position: 'relative',
        overflow: 'hidden',
        display: 'none',
      }}
        className="login-left-panel"
      >
        {/* Dark overlay with gradient */}
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(135deg, rgba(17, 24, 39, 0.92) 0%, rgba(17, 24, 39, 0.75) 50%, rgba(140, 198, 63, 0.6) 100%)',
          zIndex: 2,
        }} />

        {/* Background image */}
        <img
          src="https://images.unsplash.com/photo-1582408921715-18e7806365c1?w=1200&q=80"
          alt="Construção"
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            position: 'absolute',
            inset: 0,
            zIndex: 1,
          }}
        />

        {/* Content over image */}
        <div style={{
          position: 'relative',
          zIndex: 3,
          padding: '48px',
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
        }}>
          {/* Logo */}
          <div>
            <img src="/logo.png" alt="LCM Construtora" style={{ height: '48px', objectFit: 'contain' }} />
          </div>

          {/* Central branding */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', maxWidth: '400px' }}>
            <div style={{
              width: 52,
              height: 52,
              borderRadius: '14px',
              background: 'rgba(140, 198, 63, 0.2)',
              border: '1px solid rgba(140, 198, 63, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '24px',
            }}>
              <ShieldCheck size={26} style={{ color: 'var(--primary-400)' }} />
            </div>

            <h2 style={{
              fontSize: '2rem',
              fontWeight: 800,
              color: '#ffffff',
              lineHeight: 1.2,
              marginBottom: '16px',
              letterSpacing: '-0.02em',
            }}>
              Sua casa nova
              <br />
              <span style={{ color: 'var(--primary-400)' }}>começa aqui.</span>
            </h2>
            <p style={{
              fontSize: '0.95rem',
              color: 'rgba(255, 255, 255, 0.6)',
              lineHeight: 1.7,
              maxWidth: '360px',
            }}>
              Inicie seu cadastro ou consulte o status da sua inscrição no programa habitacional da LCM Construtora.
            </p>
          </div>

          {/* Footer stats */}
          <div style={{ display: 'flex', gap: '32px' }}>
            <div style={{ textAlign: 'center', fontSize: '0.8rem', color: 'rgba(255,255,255,0.6)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ShieldCheck size={16} /> 100% Protegido
            </div>
            <div style={{ textAlign: 'center', fontSize: '0.8rem', color: 'rgba(255,255,255,0.6)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ShieldCheck size={16} /> Validação por IA
            </div>
          </div>
        </div>
      </div>

      {/* Right Side — Login Form */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px 24px',
        background: 'var(--bg-secondary)',
        position: 'relative',
      }}>
        {/* Mobile-only logo header */}
        <div className="login-mobile-logo" style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          padding: '16px 24px',
          background: '#111827',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          boxShadow: 'var(--shadow-sm)',
          zIndex: 10,
        }}>
          <img src="/logo.png" alt="LCM" style={{ height: '32px', objectFit: 'contain' }} />
          <button 
            className="btn btn-ghost btn-sm" 
            style={{ 
              border: '1px solid rgba(255,255,255,0.2)', 
              borderRadius: 'var(--radius-full)', 
              color: 'rgba(255,255,255,0.7)',
              fontSize: '0.7rem',
            }}
            onClick={() => navigate('/admin/login')}
          >
            Equipe
          </button>
        </div>

        {/* Desktop Admin Link */}
        <div className="login-left-panel" style={{ position: 'absolute', top: '24px', right: '24px' }}>
          <button 
            className="btn btn-ghost btn-sm" 
            style={{ 
              borderRadius: 'var(--radius-full)', 
              color: 'var(--text-muted)',
              fontSize: '0.8rem',
            }}
            onClick={() => navigate('/admin/login')}
          >
            Área da Equipe
          </button>
        </div>

        <form
          onSubmit={handleLogin}
          style={{
            width: '100%',
            maxWidth: '380px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
          <div style={{ 
            display: 'inline-flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            width: 48, height: 48, 
            borderRadius: '12px', 
            background: 'rgba(140, 198, 63, 0.1)', 
            marginBottom: '20px',
          }} className="login-mobile-logo-hidden">
            <ShieldCheck size={24} style={{ color: 'var(--primary-600)' }} strokeWidth={1.5} />
          </div>

          <h2 style={{
            fontSize: '2rem',
            fontWeight: 800,
            color: 'var(--text-primary)',
            marginBottom: '6px',
            letterSpacing: '-0.02em',
            textAlign: 'center',
          }}>
            Bem-vindo
          </h2>
          <p style={{
            fontSize: '0.875rem',
            color: 'var(--text-muted)',
            marginBottom: '32px',
            textAlign: 'center',
          }}>
            Digite seu CPF para consultar ou iniciar cadastro
          </p>

          {/* Form Content */}
          <div className="card" style={{ width: '100%', padding: '32px', boxShadow: 'var(--shadow-lg)', border: '1px solid var(--border-default)' }}>
            <div className="form-group" style={{ marginBottom: '24px' }}>
              <label className="form-label" htmlFor="cpf" style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                CPF
              </label>
              <input
                id="cpf"
                className="form-input"
                placeholder="000.000.000-00"
                value={cpf}
                onChange={handleChange}
                style={{ fontSize: '1.0625rem', padding: '12px 14px', borderRadius: 'var(--radius-full)' }}
                required
              />
              <span className="form-help">Digite apenas os números</span>
            </div>

            {error && (
              <div className="alert alert-error" style={{ marginBottom: '16px' }}>
                <span className="alert-icon"><AlertCircle size={16} /></span>
                <span>{error}</span>
              </div>
            )}

            {isNewRegistration && !error && (
              <div className="alert alert-success" style={{ marginBottom: '16px' }}>
                <span className="alert-icon"><ShieldCheck size={16} /></span>
                <span>
                  <strong>CPF não encontrado.</strong> Clique em "Continuar" para iniciar.
                </span>
              </div>
            )}

            <button
              type="submit"
              className="btn btn-primary btn-lg"
              style={{ width: '100%', justifyContent: 'center', gap: '8px', borderRadius: 'var(--radius-full)' }}
              disabled={loading || cpf.length < 14}
            >
              {loading ? 'Carregando...' : 'Continuar'}
              {!loading && <ArrowRight size={18} />}
            </button>
          </div>

          <p style={{
            fontSize: '0.8125rem',
            color: 'var(--text-muted)',
            marginTop: '24px',
            textAlign: 'center',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}>
            <ShieldCheck size={14} style={{ color: 'var(--primary-600)' }} />
            Seus dados estão seguros conosco.
          </p>
        </form>
      </div>

      {/* Responsive CSS */}
      <style>{`
        @media (min-width: 768px) {
          .login-left-panel {
            display: block !important;
          }
          .login-mobile-logo {
            display: none !important;
          }
          .login-mobile-logo-hidden {
            display: flex !important;
          }
        }
        @media (max-width: 767px) {
          .login-left-panel {
            display: none !important;
          }
          .login-mobile-logo {
            display: flex !important;
          }
          .login-mobile-logo-hidden {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
}
