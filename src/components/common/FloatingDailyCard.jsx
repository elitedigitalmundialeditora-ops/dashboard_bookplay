import React, { useState } from 'react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { formatMoney } from '../../utils/formatters';
import { DollarSign, ChevronDown, ChevronUp, Clock } from 'lucide-react';

export function FloatingDailyCard() {
  const { totalHojeGeral, recebimentosHoje } = useData();
  const { currentUser, isGestor } = useAuth();
  const [minimized, setMinimized] = useState(false);

  const valorExibido = isGestor
    ? totalHojeGeral
    : (recebimentosHoje[currentUser?.id] || 0);

  const titulo = isGestor ? 'Total Hoje (Setor)' : 'Seu Recebido Hoje';

  return (
    <div style={{
      position: 'fixed',
      right: 20,
      bottom: 24,
      zIndex: 90,
      background: 'linear-gradient(135deg, #1E6DC3 0%, #0F3B6F 100%)',
      color: 'white',
      borderRadius: 18,
      boxShadow: '0 12px 35px rgba(15, 46, 82, 0.4)',
      border: '1px solid rgba(255, 255, 255, 0.25)',
      backdropFilter: 'blur(10px)',
      overflow: 'hidden',
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      minWidth: minimized ? 'auto' : 240
    }}>
      {/* Card Header */}
      <div 
        onClick={() => setMinimized(!minimized)}
        style={{
          padding: '10px 16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
          cursor: 'pointer',
          background: 'rgba(0,0,0,0.15)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Clock size={16} color="#93C5FD" />
          <span style={{ fontSize: '0.8rem', fontWeight: 700, letterSpacing: '0.3px', textTransform: 'uppercase' }}>
            {titulo}
          </span>
        </div>
        <button style={{ color: '#93C5FD', display: 'flex' }}>
          {minimized ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
      </div>

      {/* Card Body */}
      {!minimized && (
        <div style={{ padding: '14px 18px', textAlign: 'center' }}>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, letterSpacing: '-0.5px', color: '#FFFFFF' }}>
            {formatMoney(valorExibido)}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#BAE6FD', marginTop: 4 }}>
            Atualização instantânea em tempo real
          </div>
        </div>
      )}
    </div>
  );
}
