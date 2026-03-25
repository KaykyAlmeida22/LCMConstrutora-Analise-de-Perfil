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
      setError('O CPF digitado está incompleto. Verifique os números e tente novamente.');
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
           nome_completo: 'Candidato em Preenchimento',
           cpf: formatCPF(cleanCpf),
           telefone: '',
           endereco: '',
           municipio_projeto: 'Extrema'
        });
        
        if (newCandidate) {
            navigate(`/onboarding?id=${newCandidate.id}`);
        } else {
           setError('Tivemos um problema ao iniciar seu cadastro. Tente de novo.');
        }
      }
    } catch (err) {
      console.error(err);
      setError('Não conseguimos consultar seu CPF agora. Tente de novo em alguns instantes.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden' }}>
      
      {/* Background Orbs Effect */}
      <div style={{
         position: 'absolute', top: '-10%', left: '-10%', width: '50vw', height: '50vw',
         background: 'radial-gradient(circle, rgba(140, 198, 63, 0.15) 0%, rgba(255,255,255,0) 70%)',
         zIndex: 0, pointerEvents: 'none'
      }} />
      <div style={{
         position: 'absolute', bottom: '-20%', right: '-10%', width: '60vw', height: '60vw',
         background: 'radial-gradient(circle, rgba(140, 198, 63, 0.1) 0%, rgba(255,255,255,0) 70%)',
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
          background: '#1a2a0e',
          backdropFilter: 'blur(20px)',
          zIndex: 10
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <img 
            src="/logo.png" 
            alt="LCM Construtora" 
            style={{ height: '52px', objectFit: 'contain' }} 
          />
        </div>
        <button 
          className="btn btn-ghost btn-sm" 
          style={{ border: '1px solid rgba(255,255,255,0.35)', borderRadius: '99px', padding: '6px 16px', fontSize: '0.8rem', color: 'rgba(255,255,255,0.85)' }}
          onClick={() => navigate('/admin/login')}
        >
          Área da Equipe
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
            <ShieldCheck size={36} style={{ color: 'var(--primary-600)' }} strokeWidth={1.5} />
          </div>
          
          <h1 style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: '16px', lineHeight: 1.15, letterSpacing: '-0.03em' }}>
            Bem-vindo à <span style={{ color: 'var(--primary-600)' }}>LCM</span>
          </h1>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '40px', fontSize: '1rem', lineHeight: 1.6 }}>
            Consulte sua inscrição ou comece seu cadastro para conquistar a casa própria. Tudo de forma fácil e segura.
          </p>

          <form
            className="card-glass animate-slideUp"
            style={{ 
              padding: '40px', 
              textAlign: 'left', 
              border: '1px solid var(--border-default)',
              boxShadow: '0 24px 64px -16px rgba(0,0,0,0.1)',
              background: 'var(--bg-card)',
              borderRadius: '24px'
            }}
            onSubmit={handleLogin}
          >
            <h2 style={{ fontSize: '1.3rem', fontWeight: 700, marginBottom: '8px', letterSpacing: '-0.02em' }}>
              Digite seu CPF para começar
            </h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '28px' }}>
              Nós vamos encontrar o seu cadastro ou guiar você pelos próximos passos.
            </p>

            <div className="form-group" style={{ marginBottom: '28px' }}>
              <label className="form-label" htmlFor="cpf" style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Seu CPF
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
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '8px' }}>
                Digite apenas os números do seu CPF
              </div>
            </div>

            {error && (
              <div className="alert alert-error" style={{ marginBottom: '24px', borderRadius: '12px' }}>
                <span className="alert-icon"><AlertCircle size={18} /></span>
                <span style={{ fontSize: '0.85rem' }}>{error}</span>
              </div>
            )}

            {isNewRegistration && !error && (
              <div className="alert alert-info" style={{ marginBottom: '24px', borderRadius: '12px', background: 'rgba(140, 198, 63, 0.1)', border: '1px solid rgba(140, 198, 63, 0.2)', color: 'var(--text-primary)', display: 'flex', alignItems: 'flex-start', gap: '12px', padding: '16px' }}>
                <ShieldCheck size={20} style={{ color: 'var(--primary-600)', flexShrink: 0, marginTop: '2px' }} />
                <span style={{ fontSize: '0.9rem', lineHeight: 1.5 }}>
                  <strong>CPF não encontrado.</strong> Pode ficar tranquilo, clique em "Continuar" para darmos início ao seu cadastro agora mesmo.
                </span>
              </div>
            )}

            <button
              type="submit"
              className="btn btn-primary btn-lg"
              style={{ width: '100%', padding: '16px', borderRadius: '12px', justifyContent: 'center', gap: '12px' }}
              disabled={loading || cpf.length < 14}
            >
              <span style={{ fontSize: '1.05rem', fontWeight: 600 }}>{loading ? 'Carregando...' : 'Continuar'}</span>
              {!loading && <ArrowRight size={20} />}
            </button>
          </form>
          
          <div style={{ textAlign: 'center', marginTop: '24px', fontSize: '0.85rem', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)' }}>
              <ShieldCheck size={16} style={{ color: 'var(--primary-600)' }} />
              <span>Seus dados são protegidos e utilizados apenas para análise do programa.</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
