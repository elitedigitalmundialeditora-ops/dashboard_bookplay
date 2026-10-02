import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import { supabase, registrarHistorico } from '../../api/supabase';
import { useData } from '../../context/DataContext';
import { Modal } from '../common/Modal';
import { converterDataExcel } from '../../utils/dateHelpers';
import { formatMoney } from '../../utils/formatters';
import { UploadCloud, CheckCircle2, AlertCircle, FileSpreadsheet } from 'lucide-react';

export function ImportarModal({ isOpen, onClose, onToast }) {
  const { usuarios, metas, mesAtual, anoAtual, carregarTudo, updateMetaRecord } = useData();
  const [processando, setProcessando] = useState(false);
  const [progresso, setProgresso] = useState({ mensagem: '', atual: 0, total: 0 });

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setProcessando(true);
    setProgresso({ mensagem: 'Lendo arquivo Excel...', atual: 0, total: 100 });

    try {
      const dataBuffer = await file.arrayBuffer();
      const workbook = XLSX.read(dataBuffer, { type: 'array' });
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
      const rawRows = XLSX.utils.sheet_to_json(firstSheet, { defval: '' });

      if (rawRows.length === 0) {
        alert('A planilha está vazia!');
        setProcessando(false);
        return;
      }

      setProgresso({ mensagem: 'Mapeando registros e operadores...', atual: 10, total: 100 });

      // Mapa de operadores por nome normalizado
      const userMap = new Map();
      usuarios.forEach(u => {
        userMap.set(u.nome.trim().toLowerCase(), u);
        if (u.login) userMap.set(u.login.trim().toLowerCase(), u);
      });

      const todosRegistros = [];
      const totaisPorUsuario = new Map();

      for (const row of rawRows) {
        // Encontrar operador
        const opNome = row['Operador'] || row['operador'] || row['Nome'] || row['OPERADOR'] || '';
        const opUser = userMap.get(String(opNome).trim().toLowerCase());

        if (!opUser) continue; // Pula se não encontrar operador cadastrado

        const valor = parseFloat(
          String(row['Valor Recebido'] || row['Valor'] || row['valor_recebido'] || 0)
            .replace(/[^\d,-]/g, '')
            .replace(',', '.')
        ) || 0;

        const dataStr = converterDataExcel(row['Data Pagamento'] || row['Data'] || row['data_pagamento']);
        const tipoComissao = String(row['Tipo Comissão'] || row['tipo_comissao'] || 'DIRETO').toUpperCase();
        const isDireto = tipoComissao.includes('DIRETO');

        todosRegistros.push({
          usuario_id: opUser.id,
          operador_nome: opUser.nome,
          cliente: row['Cliente'] || row['cliente'] || '',
          nr_documento: String(row['Documento'] || row['nr_documento'] || ''),
          parcela: String(row['Parcela'] || row['parcela'] || '1/1'),
          data_pagamento: dataStr || new Date().toISOString().split('T')[0],
          valor_recebido: valor,
          tipo_comissao: tipoComissao,
          direto: isDireto ? valor : 0,
          extra: isDireto ? 0 : valor,
          mes: mesAtual,
          ano: anoAtual
        });

        // Acumula nos totais do usuário
        if (!totaisPorUsuario.has(opUser.id)) {
          totaisPorUsuario.set(opUser.id, { direto: 0, extra: 0, recebido: 0 });
        }
        const acc = totaisPorUsuario.get(opUser.id);
        if (isDireto) acc.direto += valor;
        else acc.extra += valor;
        acc.recebido += valor;
      }

      // Limpar recebimentos anteriores do mês para os operadores importados
      setProgresso({ mensagem: 'Atualizando base de recebimentos...', atual: 30, total: 100 });
      const userIds = Array.from(totaisPorUsuario.keys());

      for (const uid of userIds) {
        await supabase
          .from('recebimentos')
          .delete()
          .eq('usuario_id', uid)
          .eq('mes', mesAtual)
          .eq('ano', anoAtual);
      }

      // Inserção em lotes de 200 no Supabase
      const BATCH_SIZE = 200;
      let totalSalvos = 0;
      for (let i = 0; i < todosRegistros.length; i += BATCH_SIZE) {
        const batch = todosRegistros.slice(i, i + BATCH_SIZE);
        const res = await supabase.from('recebimentos').insert(batch);
        if (!res.error) totalSalvos += batch.length;

        const perc = Math.min(85, 30 + Math.round((i / todosRegistros.length) * 55));
        setProgresso({
          mensagem: `Gravando registros (${Math.min(i + BATCH_SIZE, todosRegistros.length)} / ${todosRegistros.length})...`,
          atual: perc,
          total: 100
        });
      }

      // Atualiza metas de cada operador
      setProgresso({ mensagem: 'Sincronizando totais das metas...', atual: 90, total: 100 });
      for (const [uid, acc] of totaisPorUsuario.entries()) {
        await updateMetaRecord(uid, {
          direto: acc.direto,
          extra: acc.extra,
          recebido: acc.recebido
        });
      }

      await registrarHistorico(
        'importacao',
        `Importação realizada: ${totaisPorUsuario.size} operadores, ${totalSalvos} registros processados.`
      );

      await carregarTudo();
      setProgresso({ mensagem: 'Concluído com sucesso!', atual: 100, total: 100 });

      if (onToast) {
        onToast(`Importação concluída: ${totalSalvos} registros para ${totaisPorUsuario.size} operadores!`);
      }

      setTimeout(() => {
        setProcessando(false);
        onClose();
      }, 1200);

    } catch (err) {
      console.error('Erro na importação:', err);
      alert('Erro ao importar arquivo Excel. Verifique o console.');
      setProcessando(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Importar Relatório de Recebimentos">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 18, textAlign: 'center' }}>
        <div style={{
          border: '2px dashed #CBD5E1',
          borderRadius: 14,
          padding: '36px 20px',
          background: '#F8FAFC',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 12,
          cursor: 'pointer'
        }}>
          <UploadCloud size={48} color="#1E6DC3" />
          <div>
            <h4 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#0F2E52' }}>
              Selecione sua planilha de controle
            </h4>
            <p style={{ fontSize: '0.8rem', color: '#64748B', marginTop: 4 }}>
              Formatos suportados: .xlsx, .xls ou .csv
            </p>
          </div>
          <input
            type="file"
            accept=".xlsx,.xls,.csv"
            onChange={handleFileUpload}
            disabled={processando}
            style={{ marginTop: 8 }}
          />
        </div>

        {processando && (
          <div style={{ background: '#EFF6FF', padding: 16, borderRadius: 12, border: '1px solid #BFDBFE' }}>
            <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#1E6DC3', marginBottom: 8 }}>
              {progresso.mensagem}
            </div>
            <div className="progress-bar-container">
              <div className="progress-bar-fill" style={{ width: `${progresso.atual}%`, background: '#1E6DC3' }} />
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
