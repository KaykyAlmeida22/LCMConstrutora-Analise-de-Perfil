import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import LoadingSpinner from '../../components/shared/LoadingSpinner';
import { Lock, Mail, ShieldCheck } from 'lucide-react';

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rememberMe, setRememberMe] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !password) {
      setError('Por favor, preencha todos os campos.');
      return;
    }

    setLoading(true);
    setError(null);

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setLoading(false);

    if (signInError) {
      if (signInError.message.includes('Invalid login credentials')) {
        setError('E-mail ou senha inválidos.');
      } else {
        setError('Ocorreu um erro. Tente novamente.');
      }
    } else {
      navigate('/admin/dashboard');
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
          background: 'linear-gradient(135deg, rgba(17, 24, 39, 0.92) 0%, rgba(17, 24, 39, 0.75) 50%, rgba(93, 135, 39, 0.6) 100%)',
          zIndex: 2,
        }} />

        {/* Background image */}
        <img
          src="https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200&q=80"
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
              Análise de Crédito
              <br />
              <span style={{ color: 'var(--primary-400)' }}>Minha Casa, Minha Vida</span>
            </h2>
            <p style={{
              fontSize: '0.95rem',
              color: 'rgba(255, 255, 255, 0.6)',
              lineHeight: 1.7,
              maxWidth: '360px',
            }}>
              Plataforma segura para gestão e análise de candidatos ao programa habitacional federal.
            </p>
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
        {/* Mobile-only logo */}
        <div className="login-mobile-logo" style={{
          position: 'absolute',
          top: '24px',
          left: '24px',
          display: 'none',
        }}>
          <img src="/logo.png" alt="LCM" style={{ height: '36px', objectFit: 'contain' }} />
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
          <h2 style={{
            fontSize: '2rem',
            fontWeight: 800,
            color: 'var(--text-primary)',
            marginBottom: '6px',
            letterSpacing: '-0.02em',
          }}>
            Acessar Painel
          </h2>
          <p style={{
            fontSize: '0.875rem',
            color: 'var(--text-muted)',
            marginBottom: '32px',
          }}>
            Bem-vindo! Faça login para continuar
          </p>

          {/* Error */}
          {error && (
            <div style={{
              width: '100%',
              padding: '10px 14px',
              borderRadius: 'var(--radius-md)',
              background: '#fef2f2',
              border: '1px solid #fecaca',
              color: '#991b1b',
              fontSize: '0.8125rem',
              marginBottom: '20px',
            }}>
              {error}
            </div>
          )}

          {/* Divider */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            width: '100%',
            marginBottom: '24px',
          }}>
            <div style={{ flex: 1, height: '1px', background: 'var(--gray-200)' }} />
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
              credenciais corporativas
            </span>
            <div style={{ flex: 1, height: '1px', background: 'var(--gray-200)' }} />
          </div>

          {/* Email */}
          <div style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            background: 'transparent',
            border: '1.5px solid var(--gray-200)',
            height: '48px',
            borderRadius: 'var(--radius-full)',
            overflow: 'hidden',
            paddingLeft: '20px',
            gap: '10px',
            marginBottom: '16px',
            transition: 'border-color 0.15s ease',
          }}>
            <Mail size={16} style={{ color: 'var(--gray-400)', flexShrink: 0 }} />
            <input
              type="email"
              placeholder="E-mail corporativo"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              required
              style={{
                background: 'transparent',
                color: 'var(--text-primary)',
                outline: 'none',
                fontSize: '0.875rem',
                width: '100%',
                height: '100%',
                border: 'none',
                fontFamily: 'inherit',
              }}
            />
          </div>

          {/* Password */}
          <div style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            background: 'transparent',
            border: '1.5px solid var(--gray-200)',
            height: '48px',
            borderRadius: 'var(--radius-full)',
            overflow: 'hidden',
            paddingLeft: '20px',
            gap: '10px',
            transition: 'border-color 0.15s ease',
          }}>
            <Lock size={16} style={{ color: 'var(--gray-400)', flexShrink: 0 }} />
            <input
              type="password"
              placeholder="Senha"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              required
              style={{
                background: 'transparent',
                color: 'var(--text-primary)',
                outline: 'none',
                fontSize: '0.875rem',
                width: '100%',
                height: '100%',
                border: 'none',
                fontFamily: 'inherit',
              }}
            />
          </div>

          {/* Remember + Forgot */}
          <div style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginTop: '20px',
            color: 'var(--text-muted)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <input
                type="checkbox"
                id="remember"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                style={{ width: '16px', height: '16px', accentColor: 'var(--primary-600)', cursor: 'pointer' }}
              />
              <label htmlFor="remember" style={{ fontSize: '0.8125rem', cursor: 'pointer' }}>
                Lembrar de mim
              </label>
            </div>
            <button
              type="button"
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--primary-600)',
                fontSize: '0.8125rem',
                fontWeight: 500,
                cursor: 'pointer',
                textDecoration: 'underline',
                padding: 0,
              }}
              onClick={() => alert('Contate o administrador para redefinir sua senha.')}
            >
              Esqueceu a senha?
            </button>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            style={{
              marginTop: '28px',
              width: '100%',
              height: '48px',
              borderRadius: 'var(--radius-full)',
              color: '#ffffff',
              background: 'var(--primary-600)',
              border: 'none',
              fontSize: '0.9375rem',
              fontWeight: 600,
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1,
              transition: 'opacity 0.15s ease, background 0.15s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              fontFamily: 'inherit',
            }}
            onMouseEnter={e => { if (!loading) e.currentTarget.style.opacity = '0.9'; }}
            onMouseLeave={e => { if (!loading) e.currentTarget.style.opacity = '1'; }}
          >
            {loading ? <LoadingSpinner size="sm" /> : 'Acessar Painel'}
          </button>

          <p style={{
            fontSize: '0.8125rem',
            color: 'var(--text-muted)',
            marginTop: '20px',
            textAlign: 'center',
            lineHeight: 1.5,
          }}>
            Acesso exclusivo para colaboradores autorizados.
            <br />
            Todos os acessos são monitorados.
          </p>
        </form>
      </div>

      {/* Responsive CSS injected via style tag */}
      <style>{`
        @media (min-width: 768px) {
          .login-left-panel {
            display: block !important;
          }
          .login-mobile-logo {
            display: none !important;
          }
        }
        @media (max-width: 767px) {
          .login-left-panel {
            display: none !important;
          }
          .login-mobile-logo {
            display: block !important;
          }
        }
      `}</style>
    </div>
  );
}
