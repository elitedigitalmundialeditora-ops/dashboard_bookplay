import React, { useState, useMemo } from 'react';
import { useData } from '../../context/DataContext';
import { formatMoney, formatPercent, parseMoneyToNumber, getProjecaoColorHex } from '../../utils/formatters';
import { Modal } from '../common/Modal';
import { Search, Edit, Sliders, Filter, Check, Plus, UserPlus } from 'lucide-react';

export function OperadoresTab() {
  const { 
    usuarios, 
    metas, 
    equipes, 
    classes, 
    recebimentosHoje, 
    totalDiasUteis, 
    diasPassados,
    updateMetaRecord 
  } = useData();

  const [busca, setBusca] = useState('');
  const [equipeFiltro, setEquipeFiltro] = useState('');
  const [classeFiltro, setClasseFiltro] = useState('');

  // Modais de edição
  const [modalEdicaoOpen, setModalEdicaoOpen] = useState(false);
  const [operadorEditando, setOperadorEditando] = useState(null);
  const [novaMetaInput, setNovaMetaInput] = useState('');

  const [modalPorForaOpen, setModalPorForaOpen] = useState(false);
  const [operadorPorFora, setOperadorPorFora] = useState(null);
  const [porForaValorInput, setPorForaValorInput] = useState('');

  // Lista consolidada de operadores
  const operadoresProcessados = useMemo(() => {
    return usuarios
      .filter(u => u.status === 'ativo' && (u.cargo === 'operador' || u.cargo === 'elite' || u.cargo === 'supervisor'))
      .map(u => {
        const metaObj = metas.find(m => Number(m.usuario_id) === Number(u.id)) || {
          meta: 0,
          recebido: 0,
          direto: 0,
          extra: 0,
          por_fora_direto: 0,
          por_fora_extra: 0
        };

        const equipeNome = equipes.find(e => e.id === u.equipe_id)?.nome || 'Sem equipe';
        const hojeValor = recebimentosHoje[u.id] || 0;

        const proj = metaObj.meta > 0 
          ? (metaObj.recebido / (metaObj.meta / Math.max(totalDiasUteis, 1) * Math.max(diasPassados, 1))) * 100 
          : 0;

        return {
          ...u,
          meta: metaObj.meta || 0,
          recebido: metaObj.recebido || 0,
          direto: metaObj.direto || 0,
          extra: metaObj.extra || 0,
          por_fora_direto: metaObj.por_fora_direto || 0,
          por_fora_extra: metaObj.por_fora_extra || 0,
          equipeNome,
          hojeValor,
          projecao: proj
        };
      });
  }, [usuarios, metas, equipes, recebimentosHoje, totalDiasUteis, diasPassados]);

  // Filtros aplicados
  const operadoresFiltrados = useMemo(() => {
    return operadoresProcessados.filter(op => {
      const matchBusca = !busca || op.nome.toLowerCase().includes(busca.toLowerCase());
      const matchEquipe = !equipeFiltro || String(op.equipe_id) === String(equipeFiltro);
      const matchClasse = !classeFiltro || String(op.classe || '').toLowerCase() === String(classeFiltro).toLowerCase();
      return matchBusca && matchEquipe && matchClasse;
    });
  }, [operadoresProcessados, busca, equipeFiltro, classeFiltro]);

  // Salvar Edição de Meta Individual
  const handleSalvarEdicao = async () => {
    if (!operadorEditando) return;
    const metaNumerica = parseMoneyToNumber(novaMetaInput);
    await updateMetaRecord(operadorEditando.id, { meta: metaNumerica });
    setModalEdicaoOpen(false);
  };

  // Salvar Ajuste "Por Fora"
  const handleSalvarPorFora = async (tipo) => {
    if (!operadorPorFora) return;
    const val = parseMoneyToNumber(porForaValorInput);

    if (tipo === 'zerar') {
      await updateMetaRecord(operadorPorFora.id, {
        por_fora_direto: 0,
        por_fora_extra: 0
      });
    } else if (tipo === 'direto') {
      await updateMetaRecord(operadorPorFora.id, {
        por_fora_direto: val
      });
    } else if (tipo === 'extra') {
      await updateMetaRecord(operadorPorFora.id, {
        por_fora_extra: val
      });
    }
    setModalPorForaOpen(false);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Barra de Filtros */}
      <div className="card" style={{ display: 'flex', gap: 14, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ flex: 1, minWidth: 240, position: 'relative' }}>
          <Search size={18} color="#94A3B8" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="text"
            placeholder="Buscar por nome do operador..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="form-input"
            style={{ paddingLeft: 38, width: '100%' }}
          />
        </div>

        <select
          value={equipeFiltro}
          onChange={(e) => setEquipeFiltro(e.target.value)}
          className="form-input"
          style={{ minWidth: 160 }}
        >
          <option value="">Todas as Equipes</option>
          {equipes.map(eq => (
            <option key={eq.id} value={eq.id}>{eq.nome}</option>
          ))}
        </select>

        <select
          value={classeFiltro}
          onChange={(e) => setClasseFiltro(e.target.value)}
          className="form-input"
          style={{ minWidth: 160 }}
        >
          <option value="">Todas as Classes</option>
          {classes.map(c => (
            <option key={c.id || c.nome} value={c.nome}>{c.nome}</option>
          ))}
        </select>

        <span style={{ fontSize: '0.85rem', color: '#64748B', fontWeight: 600 }}>
          {operadoresFiltrados.length} operador(es)
        </span>
      </div>

      {/* Tabela de Operadores */}
      <div className="table-responsive">
        <table className="data-table">
          <thead>
            <tr>
              <th>Operador</th>
              <th>Classe</th>
              <th>Equipe</th>
              <th style={{ textAlign: 'right' }}>Meta</th>
              <th style={{ textAlign: 'right' }}>Recebido</th>
              <th style={{ textAlign: 'right' }}>Hoje</th>
              <th style={{ textAlign: 'right' }}>Projeção</th>
              <th style={{ textAlign: 'center' }}>Ações</th>
            </tr>
          </thead>
          <tbody>
            {operadoresFiltrados.map(op => {
              const projColor = getProjecaoColorHex(op.projecao);
              return (
                <tr key={op.id}>
                  <td>
                    <div style={{ fontWeight: 700, color: '#0F2E52' }}>{op.nome}</div>
                    <div style={{ fontSize: '0.75rem', color: '#64748B', textTransform: 'uppercase' }}>{op.cargo}</div>
                  </td>
                  <td>
                    <span className="badge badge-primary">{op.classe || 'N/A'}</span>
                  </td>
                  <td>
                    <span style={{ fontSize: '0.85rem', color: op.equipe_id ? '#334155' : '#B45309', fontWeight: 600 }}>
                      {op.equipeNome}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right', fontWeight: 700 }}>
                    {formatMoney(op.meta)}
                  </td>
                  <td style={{ textAlign: 'right', fontWeight: 800, color: '#059669' }}>
                    {formatMoney(op.recebido)}
                    {(op.por_fora_direto !== 0 || op.por_fora_extra !== 0) && (
                      <div style={{ fontSize: '0.7rem', color: '#6366F1' }}>
                        Ajuste: {formatMoney(op.por_fora_direto + op.por_fora_extra)}
                      </div>
                    )}
                  </td>
                  <td style={{ textAlign: 'right', fontWeight: 700, color: op.hojeValor > 0 ? '#1E6DC3' : '#94A3B8' }}>
                    {formatMoney(op.hojeValor)}
                  </td>
                  <td style={{ textAlign: 'right', fontWeight: 700, color: projColor }}>
                    {formatPercent(op.projecao)}
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <div style={{ display: 'inline-flex', gap: 6 }}>
                      <button
                        title="Editar Meta / Dados"
                        onClick={() => {
                          setOperadorEditando(op);
                          setNovaMetaInput(op.meta.toString());
                          setModalEdicaoOpen(true);
                        }}
                        style={{ padding: 6, borderRadius: 6, background: '#EFF6FF', color: '#1E6DC3' }}
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        title="Ajuste Por Fora"
                        onClick={() => {
                          setOperadorPorFora(op);
                          setPorForaValorInput('');
                          setModalPorForaOpen(true);
                        }}
                        style={{ padding: 6, borderRadius: 6, background: '#FEF3C7', color: '#D97706' }}
                      >
                        <Sliders size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Modal de Edição de Meta */}
      <Modal
        isOpen={modalEdicaoOpen}
        onClose={() => setModalEdicaoOpen(false)}
        title={`Editar Meta de ${operadorEditando?.nome}`}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="form-group">
            <label className="form-label">Meta Individual (R$)</label>
            <input
              type="text"
              value={novaMetaInput}
              onChange={(e) => setNovaMetaInput(e.target.value)}
              className="form-input"
              placeholder="Ex: 50.000,00"
            />
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 8 }}>
            <button className="btn btn-secondary" onClick={() => setModalEdicaoOpen(false)}>
              Cancelar
            </button>
            <button className="btn btn-primary" onClick={handleSalvarEdicao}>
              Salvar Instantaneamente
            </button>
          </div>
        </div>
      </Modal>

      {/* Modal de Ajuste Por Fora */}
      <Modal
        isOpen={modalPorForaOpen}
        onClose={() => setModalPorForaOpen(false)}
        title={`Ajuste "Por Fora": ${operadorPorFora?.nome}`}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ background: '#F8FAFC', padding: 12, borderRadius: 10, fontSize: '0.85rem' }}>
            <div>Ajuste Direto Atual: <strong>{formatMoney(operadorPorFora?.por_fora_direto || 0)}</strong></div>
            <div>Ajuste Extra Atual: <strong>{formatMoney(operadorPorFora?.por_fora_extra || 0)}</strong></div>
          </div>
          <div className="form-group">
            <label className="form-label">Valor da Correção (R$)</label>
            <input
              type="text"
              value={porForaValorInput}
              onChange={(e) => setPorForaValorInput(e.target.value)}
              className="form-input"
              placeholder="Digite o valor (use - para negativo)"
            />
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
            <button className="btn btn-danger" onClick={() => handleSalvarPorFora('zerar')}>
              Zerar Ajustes
            </button>
            <button className="btn btn-primary" onClick={() => handleSalvarPorFora('direto')}>
              Lançar Direto
            </button>
            <button className="btn btn-success" onClick={() => handleSalvarPorFora('extra')}>
              Lançar Extra
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
