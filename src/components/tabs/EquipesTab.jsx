import React, { useMemo } from 'react';
import { useData } from '../../context/DataContext';
import { formatMoney, formatPercent, calcularAlcance } from '../../utils/formatters';
import { Briefcase, Users, UserCheck, AlertCircle } from 'lucide-react';

export function EquipesTab() {
  const { equipes, usuarios, metas, metasEquipe } = useData();

  const equipesInfo = useMemo(() => {
    return equipes.map(eq => {
      const metaObj = metasEquipe.find(m => m.equipe_id === eq.id);
      const metaValor = metaObj?.meta || 100000;

      const membros = usuarios.filter(u => u.equipe_id === eq.id && u.status === 'ativo');
      let totalRecebido = 0;

      for (const m of membros) {
        const metaUser = metas.find(x => Number(x.usuario_id) === Number(m.id));
        if (metaUser && metaUser.recebido) {
          totalRecebido += Number(metaUser.recebido) || 0;
        }
      }

      const responsavel = usuarios.find(u => u.equipe_id === eq.id && (u.cargo === 'supervisor' || u.cargo === 'gestor'));
      const alcance = calcularAlcance(metaValor, totalRecebido);

      return {
        ...eq,
        metaValor,
        totalRecebido,
        membrosCount: membros.length,
        responsavelNome: responsavel?.nome || 'Não definido',
        alcance
      };
    });
  }, [equipes, usuarios, metas, metasEquipe]);

  // Membros sem equipe vinculada
  const semEquipe = useMemo(() => {
    return usuarios.filter(u => (!u.equipe_id || u.equipe_id === '') && u.status === 'ativo');
  }, [usuarios]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Alerta de Membros sem Equipe se houver */}
      {semEquipe.length > 0 && (
        <div style={{
          background: '#FFFBEB',
          border: '1px solid #FDE68A',
          borderRadius: 12,
          padding: '14px 18px',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          color: '#92400E'
        }}>
          <AlertCircle size={20} color="#D97706" />
          <div style={{ fontSize: '0.9rem' }}>
            <strong>{semEquipe.length} operador(es) sem equipe vinculada:</strong>{' '}
            {semEquipe.map(u => u.nome).join(', ')}. Vincule-os para acompanhamento consolidado por equipe.
          </div>
        </div>
      )}

      {/* Grid de Equipes */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 18 }}>
        {equipesInfo.map(eq => (
          <div key={eq.id} className="card" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  background: '#EBF3FC',
                  color: '#1E6DC3',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Briefcase size={18} />
                </div>
                <div>
                  <h4 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#0F2E52' }}>
                    {eq.nome}
                  </h4>
                  <div style={{ fontSize: '0.75rem', color: '#64748B' }}>
                    Responsável: {eq.responsavelNome}
                  </div>
                </div>
              </div>
              <span className="badge badge-primary">{eq.membrosCount} membros</span>
            </div>

            <div style={{ background: '#F8FAFC', padding: 12, borderRadius: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                <span style={{ color: '#64748B' }}>Recebido / Meta</span>
                <strong style={{ color: '#0F2E52' }}>
                  {formatMoney(eq.totalRecebido)} / {formatMoney(eq.metaValor)}
                </strong>
              </div>
              <div className="progress-bar-container" style={{ marginTop: 8 }}>
                <div 
                  className="progress-bar-fill" 
                  style={{ 
                    width: `${Math.min(100, eq.alcance)}%`, 
                    background: eq.alcance >= 100 ? '#10B981' : '#1E6DC3' 
                  }} 
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 4 }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: eq.alcance >= 100 ? '#10B981' : '#1E6DC3' }}>
                  {formatPercent(eq.alcance)} alcançado
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
