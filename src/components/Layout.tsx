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
      <aside className="sidebar" style={{ width: '140px' }}>
        <div className="sidebar-logo" style={{ width: '110px', height: '110px', overflow: 'hidden', padding: '12px', background: 'white', boxShadow: '0 8px 16px rgba(0,0,0,0.15)' }}>
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
        <header className="content-header" style={{ height: '220px', padding: '0 40px' }}>
          <div className="header-left" style={{ display: 'flex', alignItems: 'center' }}>
            <div style={{ height: '180px', width: 'auto', overflow: 'hidden' }}>
              <img src={logoImg} alt="ConsultPro - Nutrição e Esportes" style={{ height: '100%', objectFit: 'contain' }} />
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
