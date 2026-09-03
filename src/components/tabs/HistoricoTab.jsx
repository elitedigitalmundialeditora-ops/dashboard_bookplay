import React from 'react';
import { useData } from '../../context/DataContext';
import { History, Clock, User, FileText } from 'lucide-react';

export function HistoricoTab() {
  const { historico } = useData();

  return (
    <div className="card">
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
        <History size={22} color="#1E6DC3" />
        <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0F2E52' }}>
          Histórico de Atividades e Auditoria
        </h3>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {historico.map((h, idx) => (
          <div
            key={h.id || idx}
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: 14,
              padding: '14px 18px',
              borderRadius: 10,
              background: '#F8FAFC',
              border: '1px solid #E2E8F0'
            }}
          >
            <div style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              background: '#EBF3FC',
              color: '#1E6DC3',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              <FileText size={16} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '0.9rem', fontWeight: 600, color: '#0F2E52' }}>
                {h.descricao}
              </div>
              <div style={{ display: 'flex', gap: 14, fontSize: '0.75rem', color: '#64748B', marginTop: 4 }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <User size={12} /> {h.usuario || 'Sistema'}
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Clock size={12} /> {new Date(h.data_hora).toLocaleString('pt-BR')}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
