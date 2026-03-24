import { NavLink, Outlet } from 'react-router-dom';
import { useState } from 'react';

export default function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="app-layout">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="modal-overlay"
          style={{ zIndex: 45 }}
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <div className="sidebar-logo-icon">LCM</div>
            <div>
              <div className="sidebar-logo-text">LCM Construtora</div>
              <div className="sidebar-logo-sub">Plataforma MCMV</div>
            </div>
          </div>
        </div>

        <nav className="sidebar-nav">
          <NavLink
            to="/admin"
            end
            className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
            onClick={() => setSidebarOpen(false)}
          >
            <span className="sidebar-link-icon">📊</span>
            Painel Geral
          </NavLink>
          <NavLink
            to="/admin/candidatos"
            className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
            onClick={() => setSidebarOpen(false)}
          >
            <span className="sidebar-link-icon">👥</span>
            Candidatos
          </NavLink>
          <NavLink
            to="/admin/novo-candidato"
            className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
            onClick={() => setSidebarOpen(false)}
          >
            <span className="sidebar-link-icon">➕</span>
            Novo Cadastro
          </NavLink>

          <div style={{ marginTop: 'auto' }} />

          <NavLink
            to="/"
            className="sidebar-link"
            style={{ opacity: 0.7 }}
          >
            <span className="sidebar-link-icon">🏠</span>
            Área do Candidato
          </NavLink>
        </nav>

        <div className="sidebar-footer">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, var(--primary-600), var(--primary-400))',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.85rem',
                fontWeight: 700,
                color: 'white',
              }}
            >
              AC
            </div>
            <div>
              <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>Analista de Crédito</div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>LCM Construtora</div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main */}
      <main className="main-content">
        <header className="main-header">
          <button
            className="btn btn-ghost btn-icon"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            style={{ display: 'none' }}
            id="mobile-menu-btn"
          >
            ☰
          </button>
          <div className="main-header-title" id="page-title" />
          <div className="flex items-center gap-3">
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
            </div>
          </div>
        </header>
        <div className="main-body animate-fadeIn">
          <Outlet />
        </div>
      </main>

      <style>{`
        @media (max-width: 1024px) {
          #mobile-menu-btn { display: flex !important; }
        }
      `}</style>
    </div>
  );
}
