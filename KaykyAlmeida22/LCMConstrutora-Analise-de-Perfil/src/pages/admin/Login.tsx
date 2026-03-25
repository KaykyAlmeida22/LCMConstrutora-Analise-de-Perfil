import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import LoadingSpinner from '../../components/shared/LoadingSpinner';
import { BackgroundPaths } from '../../components/ui/BackgroundPaths';

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
        setError('E-mail corporativo ou senha inválidos.');
      } else {
        setError('Ocorreu um erro ao tentar acessar. Tente novamente.');
      }
    } else {
      // Login successful
      navigate('/admin/dashboard');
    }
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        color: '#1a1a1a', // Adjusting specifically for this bright UI card
      }}
    >
      {/* Animated LCM Background */}
      <BackgroundPaths />

      {/* Top Left Logo */}
      <div
        style={{
          position: 'absolute',
          top: '32px',
          left: '40px',
        }}
      >
        <img src="/logo.png" alt="LCM Construtora" style={{ height: '48px', objectFit: 'contain' }} />
      </div>

      {/* Login Card */}
      <div
        style={{
          background: '#ffffff',
          borderRadius: '16px',
          padding: '48px 40px',
          width: '100%',
          maxWidth: '460px',
          boxShadow: '0 20px 40px -10px rgba(0, 0, 0, 0.1)',
          border: '1px solid #e2e8f0',
          position: 'relative',
          zIndex: 1,
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a', marginBottom: '8px', lineHeight: 1.2 }}>
            Análise de Crédito LCM
          </h1>
          <p style={{ color: '#475569', fontSize: '0.95rem', lineHeight: 1.5 }}>
            (<strong>Uso Restrito</strong>)
          </p>
        </div>

        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {error && (
            <div
              style={{
                backgroundColor: '#fee2e2',
                color: '#b91c1c',
                padding: '12px 16px',
                borderRadius: '8px',
                fontSize: '0.9rem',
                fontWeight: 500,
              }}
            >
              {error}
            </div>
          )}

          <div>
            <label
              style={{
                display: 'block',
                fontWeight: 700,
                fontSize: '0.9rem',
                color: '#1e293b',
                marginBottom: '8px',
              }}
            >
              E-mail Corporativo
            </label>
            <div style={{ position: 'relative' }}>
              <div
                style={{
                  position: 'absolute',
                  left: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: '#94a3b8',
                }}
              >
                <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <input
                type="email"
                placeholder="ex: nome@lcmconstrutora.com.br"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px 12px 12px 40px',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  fontSize: '0.95rem',
                  outline: 'none',
                  transition: 'border-color 0.2s',
                  color: '#0f172a',
                  backgroundColor: '#ffffff',
                }}
                disabled={loading}
              />
            </div>
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <label
                style={{
                  fontWeight: 700,
                  fontSize: '0.9rem',
                  color: '#1e293b',
                }}
              >
                Senha
              </label>
              <button
                type="button"
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--primary-600)',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  padding: 0,
                }}
                onClick={() => alert('Contate o administrador do sistema para redefinir sua senha.')}
              >
                Esqueci a senha
              </button>
            </div>
            <div style={{ position: 'relative' }}>
              <div
                style={{
                  position: 'absolute',
                  left: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: '#94a3b8',
                }}
              >
                <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <input
                type="password"
                placeholder="Sua senha corporativa"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px 12px 12px 40px',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  fontSize: '0.95rem',
                  outline: 'none',
                  transition: 'border-color 0.2s',
                  color: '#0f172a',
                  backgroundColor: '#ffffff',
                }}
                disabled={loading}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              marginTop: '12px',
              width: '100%',
              padding: '14px',
              backgroundColor: 'var(--primary-600)',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontWeight: 700,
              fontSize: '1rem',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.8 : 1,
              transition: 'background-color 0.2s',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              boxShadow: '0 4px 12px rgba(140, 198, 63, 0.3)'
            }}
          >
            {loading ? <LoadingSpinner size="sm" /> : 'Acessar Painel do Analista \u2192'}
          </button>
        </form>

        <div style={{ marginTop: '32px', textAlign: 'center' }}>
          <p style={{ fontSize: '0.8rem', color: '#64748b', lineHeight: 1.5, marginBottom: '16px' }}>
            Este acesso é exclusivo para colaboradores autorizados da equipe de
            crédito LCM. Todos os acessos são monitorados.
          </p>
          <a
            href="#"
            style={{
              fontSize: '0.85rem',
              color: 'var(--primary-600)',
              textDecoration: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
            }}
          >
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Ajuda para acesso
          </a>
        </div>
      </div>
    </div>
  );
}
