import React, { useState, useEffect } from 'react';
import { useData } from '../../context/DataContext';
import { formatMoney, parseMoneyToNumber } from '../../utils/formatters';
import { Settings, Calendar, Target, Layers, Save, CheckCircle2 } from 'lucide-react';

export function AdminTab({ onToast }) {
  const { 
    totalDiasUteis, 
    diasPassados, 
    metaSetor, 
    classes, 
    usuarios, 
    updateConfiguracoes, 
    updateMetaRecord 
  } = useData();

  const [inputTotalDias, setInputTotalDias] = useState(totalDiasUteis.toString());
  const [inputDiasPassados, setInputDiasPassados] = useState(diasPassados.toString());
  const [inputMetaSetor, setInputMetaSetor] = useState(metaSetor.toString());
  const [metasClasse, setMetasClasse] = useState({});
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    setInputTotalDias(totalDiasUteis.toString());
    setInputDiasPassados(diasPassados.toString());
    setInputMetaSetor(metaSetor.toString());
  }, [totalDiasUteis, diasPassados, metaSetor]);

  const handleSalvarConfigGerais = async (e) => {
    e.preventDefault();
    setSalvando(true);
    try {
      const totalD = parseInt(inputTotalDias, 10);
      const passadosD = parseInt(inputDiasPassados, 10);
      const metaS = parseMoneyToNumber(inputMetaSetor);

      if (isNaN(totalD) || totalD <= 0) {
        alert('Informe um total de dias úteis válido!');
        setSalvando(false);
        return;
      }

      await updateConfiguracoes({
        total_dias_uteis: totalD,
        dias_passados: passadosD,
        meta_setor: metaS
      });

      if (onToast) onToast('Configurações salvas e propagadas em tempo real!');
    } catch (err) {
      console.error(err);
      alert('Erro ao salvar configurações.');
    } finally {
      setSalvando(false);
    }
  };

  const handleDefinirMetaClasse = async (classeNome) => {
    const valor = parseMoneyToNumber(metasClasse[classeNome] || '');
    if (isNaN(valor) || valor < 0) return;

    const operadoresDaClasse = usuarios.filter(
      u => String(u.classe || '').trim().toLowerCase() === String(classeNome || '').trim().toLowerCase() &&
           u.status === 'ativo'
    );

    for (const op of operadoresDaClasse) {
      await updateMetaRecord(op.id, { meta: valor });
    }

    if (onToast) onToast(`Meta de ${formatMoney(valor)} aplicada para ${operadoresDaClasse.length} membros da classe ${classeNome}!`);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Configurações de Dias Úteis e Setor */}
      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
          <Settings size={22} color="#1E6DC3" />
          <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0F2E52' }}>
            Parâmetros Gerais do Mês
          </h3>
        </div>

        <form onSubmit={handleSalvarConfigGerais} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
          <div className="form-group">
            <label className="form-label">Total de Dias Úteis</label>
            <input
              type="number"
              value={inputTotalDias}
              onChange={(e) => setInputTotalDias(e.target.value)}
              className="form-input"
              min="1"
              max="31"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Dias Úteis Passados</label>
            <input
              type="number"
              value={inputDiasPassados}
              onChange={(e) => setInputDiasPassados(e.target.value)}
              className="form-input"
              min="0"
              max={inputTotalDias}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Meta Global do Setor (R$)</label>
            <input
              type="text"
              value={inputMetaSetor}
              onChange={(e) => setInputMetaSetor(e.target.value)}
              className="form-input"
              placeholder="Ex: 2.638.000,00"
            />
          </div>

          <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
            <button type="submit" className="btn btn-primary" disabled={salvando}>
              <Save size={16} /> {salvando ? 'Salvando...' : 'Salvar Alterações em Tempo Real'}
            </button>
          </div>
        </form>
      </div>

      {/* Metas por Classe */}
      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
          <Layers size={22} color="#1E6DC3" />
          <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0F2E52' }}>
            Definição em Massa por Classe
          </h3>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
          {classes.map(c => {
            const qtdMembros = usuarios.filter(
              u => String(u.classe || '').trim().toLowerCase() === String(c.nome || '').trim().toLowerCase() &&
                   u.status === 'ativo'
            ).length;

            return (
              <div key={c.id || c.nome} style={{
                background: '#F8FAFC',
                border: '1px solid #E2E8F0',
                borderRadius: 12,
                padding: 16,
                display: 'flex',
                flexDirection: 'column',
                gap: 12
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: 800, color: '#0F2E52', fontSize: '1rem' }}>
                    Classe {c.nome}
                  </span>
                  <span className="badge badge-primary">{qtdMembros} operador(es)</span>
                </div>

                <div style={{ display: 'flex', gap: 8 }}>
                  <input
                    type="text"
                    placeholder="Meta individual (R$)"
                    value={metasClasse[c.nome] || ''}
                    onChange={(e) => setMetasClasse({ ...metasClasse, [c.nome]: e.target.value })}
                    className="form-input"
                    style={{ flex: 1 }}
                  />
                  <button
                    onClick={() => handleDefinirMetaClasse(c.nome)}
                    className="btn btn-primary"
                    style={{ padding: '8px 14px' }}
                  >
                    Aplicar
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
