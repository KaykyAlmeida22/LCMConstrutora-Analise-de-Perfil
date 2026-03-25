import { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { LayoutDashboard, Users, UserPlus, Home, Menu } from 'lucide-react';

export default function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();
  const { user, signOut } = useAuth();

  const handleLogout = async () => {
    await signOut();
    navigate('/admin/login');
  };

  return (
    <div className="layout-container">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="sidebar-overlay"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        {/* Logo Area */}
        <div style={{ padding: '24px 24px 0 24px', marginBottom: '32px' }}>
          <div
            style={{
              padding: '16px',
              borderRadius: '16px',
              background: 'var(--primary-600)',
              border: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
            }}
          >
            <img src="/logo.png" alt="LCM Construtora" style={{ height: '40px', objectFit: 'contain' }} />
          </div>
        </div>

        {/* Navigation */}
        <nav style={{ flex: 1, padding: '0 24px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Menu Principal
          </div>
          <NavLink
            to="/admin/dashboard"
            className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
            onClick={() => setSidebarOpen(false)}
          >
            <LayoutDashboard size={18} className="sidebar-link-icon" />
            Dashboard Geral
          </NavLink>
          <NavLink
            to="/admin/candidatos"
            className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
            onClick={() => setSidebarOpen(false)}
          >
            <Users size={18} className="sidebar-link-icon" />
            Candidatos
          </NavLink>
          <NavLink
            to="/admin/novo-candidato"
            className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
            onClick={() => setSidebarOpen(false)}
          >
            <UserPlus size={18} className="sidebar-link-icon" />
            Novo Cadastro
          </NavLink>

          <div style={{ marginTop: 'auto' }} />

          <NavLink
            to="/"
            className="sidebar-link"
            style={{ opacity: 0.7 }}
          >
            <Home size={18} className="sidebar-link-icon" />
            Área do Candidato
          </NavLink>
        </nav>

        {/* User / Logout */}
        <div className="sidebar-footer">
          <div style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
            <div style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
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
              <div style={{ overflow: 'hidden' }}>
                <div style={{ fontSize: '0.85rem', fontWeight: 600, whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>Analista de Crédito</div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>{user?.email || 'eq.lcm'}</div>
              </div>
            </div>
            
            <button
              className="btn btn-ghost"
              style={{ 
                width: '100%', 
                background: 'var(--bg-tertiary)', 
                color: 'var(--text-secondary)',
                borderRadius: '12px',
                padding: '10px'
              }}
              onClick={handleLogout}
            >
              Sair do Sistema
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="main-content">
        <header className="main-header">
          <button
            className="btn btn-ghost btn-icon"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            style={{ display: 'none' }}
            id="mobile-menu-btn"
          >
            <Menu size={20} />
          </button>
          <div className="main-header-title" id="page-title" />
          <div className="flex items-center gap-3">
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
            </div>
          </div>
        </header>

        <Outlet />
      </main>

      <style>{`
        @media (max-width: 1024px) {
          #mobile-menu-btn { display: flex !important; }
        }
      `}</style>
    </div>
  );
}
