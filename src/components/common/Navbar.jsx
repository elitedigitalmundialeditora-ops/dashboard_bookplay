import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { 
  LayoutDashboard, 
  Users, 
  Briefcase, 
  ShieldCheck, 
  History, 
  PieChart, 
  Upload, 
  LogOut, 
  Sparkles,
  UserCheck
} from 'lucide-react';

export function Navbar({ activeTab, setActiveTab, onOpenImportar }) {
  const { currentUser, logout, isGestor, isSupervisor, login } = useAuth();
  const { usuarios } = useData();

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, visible: true },
    { id: 'visaoSetor', label: 'Visão do Setor', icon: PieChart, visible: true },
    { id: 'operadores', label: 'Operadores', icon: Users, visible: isGestor || isSupervisor },
    { id: 'equipes', label: 'Equipes', icon: Briefcase, visible: isGestor },
    { id: 'admin', label: 'Painel Admin', icon: ShieldCheck, visible: isGestor },
    { id: 'historico', label: 'Histórico', icon: History, visible: isGestor },
  ];

  return (
    <header style={{
      background: 'linear-gradient(135deg, #0F2E52 0%, #0F3B6F 100%)',
      color: 'white',
      borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
      boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
      position: 'sticky',
      top: 0,
      zIndex: 100
    }}>
      <div style={{
        maxWidth: 1440,
        margin: '0 auto',
        padding: '12px 20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 16
      }}>
        {/* Brand / Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 42,
            height: 42,
            borderRadius: 12,
            background: 'linear-gradient(135deg, #1E6DC3 0%, #3B82F6 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(30, 109, 195, 0.4)'
          }}>
            <Sparkles size={24} color="#FFF" />
          </div>
          <div>
            <h1 style={{ fontSize: '1.25rem', fontWeight: 800, letterSpacing: '-0.5px', lineHeight: 1.1 }}>
              Portal de Metas
            </h1>
            <span style={{ fontSize: '0.75rem', opacity: 0.8, color: '#93C5FD' }}>
              Gestão em Tempo Real
            </span>
          </div>
        </div>

        {/* User Info & Switcher */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          {isGestor && (
            <button
              onClick={onOpenImportar}
              className="btn"
              style={{
                background: 'rgba(255, 255, 255, 0.15)',
                color: '#FFF',
                border: '1px solid rgba(255, 255, 255, 0.25)',
                backdropFilter: 'blur(8px)',
                padding: '8px 14px',
                fontSize: '0.85rem'
              }}
            >
              <Upload size={16} /> Importar Relatório
            </button>
          )}

          {/* Quick User Switcher for Testing / Management */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(0,0,0,0.25)', padding: '6px 12px', borderRadius: 10 }}>
            <UserCheck size={16} color="#60A5FA" />
            <select
              value={currentUser?.id || ''}
              onChange={(e) => {
                const u = usuarios.find(x => String(x.id) === e.target.value);
                if (u) login(u);
              }}
              style={{
                background: 'transparent',
                color: 'white',
                border: 'none',
                outline: 'none',
                fontSize: '0.85rem',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              {usuarios.map(u => (
                <option key={u.id} value={u.id} style={{ color: '#0F172A' }}>
                  {u.nome} ({u.cargo})
                </option>
              ))}
            </select>
          </div>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            paddingLeft: 8,
            borderLeft: '1px solid rgba(255, 255, 255, 0.2)'
          }}>
            <span className={`badge ${isGestor ? 'badge-primary' : 'badge-success'}`} style={{ textTransform: 'uppercase' }}>
              {currentUser?.cargo || 'Visitante'}
            </span>
          </div>
        </div>
      </div>

      {/* Tabs Navigation Bar */}
      <nav style={{
        maxWidth: 1440,
        margin: '0 auto',
        padding: '0 20px',
        display: 'flex',
        gap: 6,
        overflowX: 'auto'
      }}>
        {navItems.filter(item => item.visible).map(item => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '12px 16px',
                fontSize: '0.9rem',
                fontWeight: 600,
                color: isActive ? '#FFFFFF' : '#94A3B8',
                borderBottom: isActive ? '3px solid #38BDF8' : '3px solid transparent',
                background: isActive ? 'rgba(255, 255, 255, 0.08)' : 'transparent',
                borderRadius: '8px 8px 0 0',
                transition: 'all 0.2s ease',
                whiteSpace: 'nowrap'
              }}
            >
              <Icon size={18} color={isActive ? '#38BDF8' : '#94A3B8'} />
              {item.label}
            </button>
          );
        })}
      </nav>
    </header>
  );
}
