import { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { LayoutDashboard, Users, UserPlus, Home, Menu, LogOut, ChevronLeft } from 'lucide-react';

export default function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const navigate = useNavigate();
  const { user, signOut } = useAuth();

  const handleLogout = async () => {
    await signOut();
    navigate('/admin/login');
  };

  const navItems = [
    { to: '/admin/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/admin/candidatos', icon: Users, label: 'Candidatos' },
    { to: '/admin/novo-candidato', icon: UserPlus, label: 'Novo Cadastro' },
  ];

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
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''} ${sidebarCollapsed ? 'collapsed' : ''}`}>
        {/* Logo */}
        <div style={{
          padding: sidebarCollapsed ? '20px 12px' : '20px 16px',
          marginBottom: '8px',
          transition: 'padding var(--transition-base)'
        }}>
          <div style={{
            padding: sidebarCollapsed ? '10px' : '12px 16px',
            borderRadius: 'var(--radius-lg)',
            background: 'var(--primary-700)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <img src="/logo.png" alt="LCM" style={{ height: '32px', objectFit: 'contain' }} />
          </div>
        </div>

        {/* Section label */}
        <div className="sidebar-text" style={{
          fontSize: '0.6875rem',
          fontWeight: 600,
          color: 'rgba(255,255,255,0.35)',
          padding: '0 20px',
          marginBottom: '8px',
          textTransform: 'uppercase',
          letterSpacing: '0.08em'
        }}>
          Menu
        </div>

        {/* Navigation */}
        <nav style={{ flex: 1, padding: '0 12px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
          {navItems.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
              onClick={() => window.innerWidth <= 1024 && setSidebarOpen(false)}
            >
              <item.icon size={18} className="sidebar-link-icon" />
              <span className="sidebar-text">{item.label}</span>
            </NavLink>
          ))}

          <div style={{ flex: 1 }} />

          <NavLink
            to="/"
            className="sidebar-link"
            style={{ marginTop: 'auto', opacity: 0.6 }}
          >
            <Home size={18} className="sidebar-link-icon" />
            <span className="sidebar-text">Portal do Candidato</span>
          </NavLink>
        </nav>

        {/* User / Logout */}
        <div className="sidebar-footer" style={{ padding: sidebarCollapsed ? '16px 8px' : '16px' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            marginBottom: '12px',
            justifyContent: sidebarCollapsed ? 'center' : 'flex-start'
          }}>
            <div style={{
              width: 32,
              height: 32,
              borderRadius: '50%',
              background: 'var(--primary-700)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '0.75rem',
              fontWeight: 700,
              color: 'white',
              flexShrink: 0
            }}>
              AC
            </div>
            <div className="sidebar-footer-text" style={{ overflow: 'hidden', minWidth: 0 }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                Analista
              </div>
              <div style={{ fontSize: '0.6875rem', color: 'var(--sidebar-text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {user?.email || 'eq.lcm'}
              </div>
            </div>
          </div>

          <button
            style={{
              width: '100%',
              padding: '8px',
              borderRadius: 'var(--radius-md)',
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.08)',
              color: 'var(--sidebar-text)',
              fontSize: '0.8rem',
              fontWeight: 500,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              transition: 'background var(--transition-fast)'
            }}
            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.1)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.06)')}
            onClick={handleLogout}
          >
            <LogOut size={14} />
            {!sidebarCollapsed && 'Sair'}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className={`main-content ${sidebarCollapsed ? 'expanded' : ''}`}>
        <header className="main-header">
          <div className="flex items-center gap-3">
            <button
              className="btn btn-ghost btn-icon"
              onClick={() => {
                if (window.innerWidth <= 1024) {
                  setSidebarOpen(!sidebarOpen);
                } else {
                  setSidebarCollapsed(!sidebarCollapsed);
                }
              }}
              style={{ color: 'var(--text-muted)' }}
            >
              {sidebarCollapsed ? <Menu size={18} /> : <ChevronLeft size={18} />}
            </button>
          </div>

          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 500 }}>
            {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
          </div>
        </header>

        <div className="main-body">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
