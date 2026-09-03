import React, { useMemo } from 'react';
import { useData } from '../../context/DataContext';
import { formatMoney, formatPercent, getProjecaoColorHex } from '../../utils/formatters';
import { Trophy, Users, AlertTriangle, CheckCircle2 } from 'lucide-react';

export function VisaoSetorTab() {
  const { 
    usuarios, 
    metas, 
    equipes, 
    metaSetor, 
    totalDiasUteis, 
    diasPassados,
    mesAtual,
    anoAtual
  } = useData();

  const dadosSetor = useMemo(() => {
    let totalRecebido = 0;
    const equipesRanking = [];

    // 1. Processa cada equipe
    for (const eq of equipes) {
      let totalEquipe = 0;
      const membros = usuarios.filter(u => u.equipe_id === eq.id && u.status === 'ativo');

      for (const m of membros) {
        const metaM = metas.find(x => Number(x.usuario_id) === Number(m.id));
        if (metaM && metaM.recebido) {
          totalEquipe += Number(metaM.recebido) || 0;
          totalRecebido += Number(metaM.recebido) || 0;
        }
      }

      const responsavel = usuarios.find(u => u.equipe_id === eq.id && (u.cargo === 'supervisor' || u.cargo === 'gestor'));

      equipesRanking.push({
        id: eq.id,
        nome: eq.nome,
        total: totalEquipe,
        membrosCount: membros.length,
        responsavel: responsavel?.nome || 'Não definido'
      });
    }

    // 2. Processa membros sem equipe (para nunca haver divergência)
    const semEquipe = usuarios.filter(u => (!u.equipe_id || u.equipe_id === '') && u.status === 'ativo');
    let totalSemEquipe = 0;

    for (const m of semEquipe) {
      const metaM = metas.find(x => Number(x.usuario_id) === Number(m.id));
      if (metaM && metaM.recebido) {
        totalSemEquipe += Number(metaM.recebido) || 0;
        totalRecebido += Number(metaM.recebido) || 0;
      }
    }

    if (semEquipe.length > 0) {
      equipesRanking.push({
        id: 'sem_equipe',
        nome: 'Sem Equipe Vinculada',
        total: totalSemEquipe,
        membrosCount: semEquipe.length,
        responsavel: 'Operadores Independentes',
        isAviso: true
      });
    }

    // Ordenar ranking por total decrescente
    equipesRanking.sort((a, b) => b.total - a.total);

    const esperadoAteHoje = totalDiasUteis > 0 ? (metaSetor / totalDiasUteis) * diasPassados : 0;
    const diferenca = totalRecebido - esperadoAteHoje;
    const projecao = metaSetor > 0 ? (totalRecebido / (metaSetor / Math.max(totalDiasUteis, 1) * Math.max(diasPassados, 1))) * 100 : 0;
    const falta = Math.max(0, metaSetor - totalRecebido);

    return {
      totalRecebido,
      equipesRanking,
      esperadoAteHoje,
      diferenca,
      projecao,
      falta
    };
  }, [usuarios, metas, equipes, metaSetor, totalDiasUteis, diasPassados]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* 5 Cards do Setor em Destaque */}
      <div className="metrics-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
        <div className="metric-card">
          <div className="metric-title">Meta do Setor</div>
          <div className="metric-value">{formatMoney(metaSetor)}</div>
          <div className="metric-sub">Meta global do mês</div>
        </div>

        <div className="metric-card" style={{ borderLeft: '4px solid #1E6DC3' }}>
          <div className="metric-title">Recebido Atual</div>
          <div className="metric-value" style={{ color: '#1E6DC3' }}>
            {formatMoney(dadosSetor.totalRecebido)}
          </div>
          <div className="metric-sub">100% dos operadores ativos</div>
        </div>

        <div className="metric-card">
          <div className="metric-title">Falta para a Meta</div>
          <div className="metric-value" style={{ color: dadosSetor.falta === 0 ? '#10B981' : '#F59E0B' }}>
            {dadosSetor.falta === 0 ? 'Meta Atingida!' : formatMoney(dadosSetor.falta)}
          </div>
          <div className="metric-sub">Restante do mês</div>
        </div>

        <div className="metric-card">
          <div className="metric-title">Projeção Setor</div>
          <div className="metric-value" style={{ color: getProjecaoColorHex(dadosSetor.projecao) }}>
            {formatPercent(dadosSetor.projecao)}
          </div>
          <div className="metric-sub">Linear por dias úteis</div>
        </div>

        <div className="metric-card" style={{ borderLeft: `4px solid ${dadosSetor.diferenca >= 0 ? '#10B981' : '#EF4444'}` }}>
          <div className="metric-title">Diferença vs Esperado</div>
          <div className="metric-value" style={{ color: dadosSetor.diferenca >= 0 ? '#059669' : '#DC2626' }}>
            {dadosSetor.diferenca >= 0 ? '+' : ''} {formatMoney(dadosSetor.diferenca)}
          </div>
          <div className="metric-sub">
            {dadosSetor.diferenca >= 0 ? 'Acima da régua projetada' : 'Abaixo da régua projetada'}
          </div>
        </div>
      </div>

      {/* Ranking das Equipes */}
      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Trophy size={22} color="#F59E0B" />
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0F2E52' }}>
              Ranking das Equipes por Recebimento
            </h3>
          </div>
          <span className="badge badge-primary">
            {dadosSetor.equipesRanking.length} Grupos Cadastrados
          </span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {dadosSetor.equipesRanking.map((item, idx) => (
            <div
              key={item.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '16px 20px',
                borderRadius: 12,
                background: item.isAviso ? '#FFFBEB' : '#F8FAFC',
                border: item.isAviso ? '1px solid #FDE68A' : '1px solid #E2E8F0',
                transition: 'transform 0.15s ease'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <div style={{
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  background: idx === 0 ? '#FEF3C7' : '#E2E8F0',
                  color: idx === 0 ? '#B45309' : '#475569',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 800,
                  fontSize: '1rem'
                }}>
                  {idx + 1}º
                </div>
                <div>
                  <h4 style={{ fontSize: '1rem', fontWeight: 700, color: item.isAviso ? '#92400E' : '#0F2E52' }}>
                    {item.nome}
                  </h4>
                  <div style={{ fontSize: '0.8rem', color: '#64748B', display: 'flex', gap: 12, marginTop: 2 }}>
                    <span>Responsável: <strong>{item.responsavel}</strong></span>
                    <span>•</span>
                    <span>{item.membrosCount} membro(s)</span>
                  </div>
                </div>
              </div>

              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: item.isAviso ? '#B45309' : '#1E6DC3' }}>
                  {formatMoney(item.total)}
                </div>
                <div style={{ fontSize: '0.75rem', color: '#64748B' }}>
                  {metaSetor > 0 ? `${formatPercent((item.total / metaSetor) * 100)} do setor` : ''}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
