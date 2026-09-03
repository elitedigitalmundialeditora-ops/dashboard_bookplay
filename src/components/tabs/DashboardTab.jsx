import React, { useMemo } from 'react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { 
  formatMoney, 
  formatPercent, 
  calcularProjecao, 
  getProjecaoColorHex 
} from '../../utils/formatters';
import { 
  Target, 
  TrendingUp, 
  DollarSign, 
  Calendar, 
  AlertCircle,
  Award,
  Zap
} from 'lucide-react';

export function DashboardTab() {
  const { 
    usuarios, 
    metas, 
    totalDiasUteis, 
    diasPassados, 
    diasRestantes, 
    metaSetor 
  } = useData();
  const { currentUser, isGestor } = useAuth();

  // Cálculos do Dashboard do Gestor
  const metrics = useMemo(() => {
    const usuariosAtivos = usuarios.filter(u => u.status === 'ativo');

    let totalRecebido = 0;
    let totalDireto = 0;
    let totalExtra = 0;
    let totalPorFora = 0;

    // Se for operador, filtra apenas os seus dados
    if (!isGestor && currentUser) {
      const userMeta = metas.find(m => Number(m.usuario_id) === Number(currentUser.id));
      if (userMeta) {
        totalRecebido = userMeta.recebido || 0;
        totalDireto = userMeta.direto || 0;
        totalExtra = userMeta.extra || 0;
        totalPorFora = (userMeta.por_fora_direto || 0) + (userMeta.por_fora_extra || 0);
      }
    } else {
      for (const u of usuariosAtivos) {
        const m = metas.find(meta => Number(meta.usuario_id) === Number(u.id));
        if (m) {
          totalRecebido += Number(m.recebido) || 0;
          totalDireto += Number(m.direto) || 0;
          totalExtra += Number(m.extra) || 0;
          totalPorFora += (Number(m.por_fora_direto) || 0) + (Number(m.por_fora_extra) || 0);
        }
      }
    }

    const target = isGestor 
      ? metaSetor 
      : (metas.find(m => Number(m.usuario_id) === Number(currentUser?.id))?.meta || 0);

    const esperadoAteHoje = totalDiasUteis > 0 ? (target / totalDiasUteis) * diasPassados : 0;
    const projecaoPercent = target > 0 ? (totalRecebido / (target / Math.max(totalDiasUteis, 1) * Math.max(diasPassados, 1))) * 100 : 0;
    const faltaParaMeta = Math.max(0, target - totalRecebido);
    const mediaDiariaAtual = diasPassados > 0 ? totalRecebido / diasPassados : 0;
    const metaDiariaNecessaria = diasRestantes > 0 ? faltaParaMeta / diasRestantes : 0;
    const alcanceMeta = target > 0 ? (totalRecebido / target) * 100 : 0;

    return {
      totalRecebido,
      totalDireto,
      totalExtra,
      totalPorFora,
      target,
      esperadoAteHoje,
      projecaoPercent,
      faltaParaMeta,
      mediaDiariaAtual,
      metaDiariaNecessaria,
      alcanceMeta
    };
  }, [usuarios, metas, totalDiasUteis, diasPassados, diasRestantes, metaSetor, isGestor, currentUser]);

  const projecaoColor = getProjecaoColorHex(metrics.projecaoPercent);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Banner de Dias Úteis */}
      <div className="dias-uteis-banner">
        <div className="dias-uteis-stat">
          <div className="num">{diasPassados}</div>
          <div className="label">Dias Passados</div>
        </div>
        <div style={{ width: 1, height: 40, background: 'rgba(255,255,255,0.2)' }} />
        <div className="dias-uteis-stat">
          <div className="num">{diasRestantes}</div>
          <div className="label">Dias Restantes</div>
        </div>
        <div style={{ width: 1, height: 40, background: 'rgba(255,255,255,0.2)' }} />
        <div className="dias-uteis-stat">
          <div className="num">{totalDiasUteis}</div>
          <div className="label">Total Dias Úteis</div>
        </div>
      </div>

      {/* Grid de Métricas Principais */}
      <div className="metrics-grid">
        {/* Meta */}
        <div className="metric-card">
          <div className="metric-title">{isGestor ? 'Meta do Setor' : 'Sua Meta'}</div>
          <div className="metric-value">{formatMoney(metrics.target)}</div>
          <div className="metric-sub">Planejado para o mês</div>
          <div className="progress-bar-container">
            <div 
              className="progress-bar-fill" 
              style={{ width: `${Math.min(100, metrics.alcanceMeta)}%`, background: '#3B82F6' }} 
            />
          </div>
        </div>

        {/* Recebido Atual */}
        <div className="metric-card" style={{ borderLeft: '4px solid #10B981' }}>
          <div className="metric-title">Recebido Atual</div>
          <div className="metric-value" style={{ color: '#059669' }}>
            {formatMoney(metrics.totalRecebido)}
          </div>
          <div className="metric-sub">
            Direto: {formatMoney(metrics.totalDireto)} | Extra: {formatMoney(metrics.totalExtra)}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#10B981', fontWeight: 700, marginTop: 4 }}>
            {formatPercent(metrics.alcanceMeta)} da meta atingida
          </div>
        </div>

        {/* Projeção */}
        <div className="metric-card" style={{ borderLeft: `4px solid ${projecaoColor}` }}>
          <div className="metric-title">Projeção de Fechamento</div>
          <div className="metric-value" style={{ color: projecaoColor }}>
            {formatPercent(metrics.projecaoPercent)}
          </div>
          <div className="metric-sub">
            {metrics.projecaoPercent >= 100 ? 'No ritmo para bater a meta!' : 'Necessário acelerar o ritmo'}
          </div>
        </div>

        {/* Falta para Meta */}
        <div className="metric-card">
          <div className="metric-title">Falta para a Meta</div>
          <div className="metric-value" style={{ color: metrics.faltaParaMeta === 0 ? '#10B981' : '#F59E0B' }}>
            {metrics.faltaParaMeta === 0 ? 'Meta Superada!' : formatMoney(metrics.faltaParaMeta)}
          </div>
          <div className="metric-sub">
            Meta Diária: {formatMoney(metrics.metaDiariaNecessaria)}/dia
          </div>
        </div>

        {/* Média Diária Atual */}
        <div className="metric-card">
          <div className="metric-title">Média Diária Realizada</div>
          <div className="metric-value" style={{ color: '#1E6DC3' }}>
            {formatMoney(metrics.mediaDiariaAtual)}
          </div>
          <div className="metric-sub">
            Baseado em {diasPassados} dias úteis
          </div>
        </div>
      </div>

      {/* Destaque e Mensagem Motivacional */}
      <div className="card" style={{
        background: 'linear-gradient(135deg, #FFFFFF 0%, #F8FAFC 100%)',
        borderLeft: '4px solid #1E6DC3',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 16
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{
            width: 48,
            height: 48,
            borderRadius: 14,
            background: '#EBF3FC',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Zap size={24} color="#1E6DC3" />
          </div>
          <div>
            <h4 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#0F2E52' }}>
              Status da Operação
            </h4>
            <p style={{ fontSize: '0.85rem', color: '#64748B' }}>
              {metrics.totalRecebido >= metrics.esperadoAteHoje
                ? `Operação está R$ ${formatMoney(metrics.totalRecebido - metrics.esperadoAteHoje)} acima do esperado para o dia útil ${diasPassados}!`
                : `Atenção: Operação está R$ ${formatMoney(metrics.esperadoAteHoje - metrics.totalRecebido)} abaixo da régua linear ideal.`}
            </p>
          </div>
        </div>
        <div className="badge badge-primary" style={{ padding: '8px 16px', fontSize: '0.85rem' }}>
          Sincronização em Tempo Real Ativa
        </div>
      </div>
    </div>
  );
}
