import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, Settings, Search, Bell, User as UserIcon, LogOut, Sun, Moon } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useNavigate } from 'react-router-dom';

import logoImg from '../assets/logo.png';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const location = useLocation();
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const navItems = [
    { path: '/dashboard', label: 'Dashboard', icon: <LayoutDashboard size={28} /> },
    { path: '/pacientes', label: 'Pacientes', icon: <Users size={28} /> },
    { path: '/settings', label: 'Settings', icon: <Settings size={28} /> },
  ];

  return (
    <div className="app-layout">
      <aside className="sidebar" style={{ width: '120px' }}>
        <div className="sidebar-logo" style={{ width: '80px', height: '80px', overflow: 'hidden', padding: '10px', background: 'white', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
          <img src={logoImg} alt="ConsultPro Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
        </div>

        <nav className="nav-menu">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`nav-item ${location.pathname === item.path ? 'active' : ''}`}
            >
              {item.icon}
            </Link>
          ))}
        </nav>

        <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '16px', alignItems: 'center' }}>
          <button 
            onClick={toggleTheme} 
            className="nav-item" 
            style={{ background: 'none', border: 'none', cursor: 'pointer' }}
            title={theme === 'light' ? 'Ativar Modo Escuro' : 'Ativar Modo Claro'}
          >
            {theme === 'light' ? <Moon size={28} /> : <Sun size={28} />}
          </button>

          <button 
            onClick={handleSignOut} 
            className="nav-item" 
            style={{ background: 'none', border: 'none', cursor: 'pointer' }}
            title="Sair"
          >
             <LogOut size={28} />
          </button>
        </div>
      </aside>

      <main className="main-content">
        <header className="content-header" style={{ height: '180px' }}>
          <div className="header-left" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ width: '60px', height: '60px', borderRadius: '12px', overflow: 'hidden', background: 'white', padding: '6px', boxShadow: '0 4px 12px rgba(0,0,0,0.2)' }}>
              <img src={logoImg} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
            </div>
            <div className="logo" style={{ color: 'white', marginBottom: 0, fontSize: '2rem', justifyContent: 'flex-start', fontWeight: 900 }}>
              ConsultPro
            </div>
          </div>

          <div className="header-right">
            <div className="header-search">
              <Search size={18} />
              <input type="text" placeholder="Buscar pacientes..." />
            </div>

            <div className="header-actions">
              <button className="header-icon-btn">
                <Bell size={20} />
              </button>
              <button className="header-icon-btn">
                <UserIcon size={20} />
              </button>
            </div>
          </div>
        </header>
        
        <div className="content-body">
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;
