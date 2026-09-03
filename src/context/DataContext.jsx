import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '../api/supabase';
import { getDataHojeISO } from '../utils/dateHelpers';

const DataContext = createContext();

export function DataProvider({ children }) {
  const [loading, setLoading] = useState(true);
  const [usuarios, setUsuarios] = useState([]);
  const [metas, setMetas] = useState([]);
  const [equipes, setEquipes] = useState([]);
  const [metasEquipe, setMetasEquipe] = useState([]);
  const [configuracoes, setConfiguracoes] = useState({
    total_dias_uteis: 22,
    dias_passados: 0,
    meta_setor: 0
  });
  const [classes, setClasses] = useState([]);
  const [historico, setHistorico] = useState([]);
  const [recebimentosHoje, setRecebimentosHoje] = useState({});
  const [totalHojeGeral, setTotalHojeGeral] = useState(0);

  const mesAtual = new Date().getMonth() + 1;
  const anoAtual = new Date().getFullYear();

  // Carregamento inicial e manual
  const carregarTudo = useCallback(async () => {
    try {
      const [uRes, mRes, eRes, meRes, cRes, clRes, hRes] = await Promise.all([
        supabase.from('usuarios').select('*').order('nome'),
        supabase.from('metas').select('*').eq('mes', mesAtual).eq('ano', anoAtual),
        supabase.from('equipes').select('*').order('nome'),
        supabase.from('metas_equipe').select('*').eq('mes', mesAtual).eq('ano', anoAtual),
        supabase.from('configuracoes').select('*').order('id', { ascending: false }).limit(1),
        supabase.from('classes').select('*').order('nome'),
        supabase.from('historico').select('*').order('data_hora', { ascending: false }).limit(50)
      ]);

      if (uRes.data) setUsuarios(uRes.data);
      if (mRes.data) setMetas(mRes.data);
      if (eRes.data) setEquipes(eRes.data);
      if (meRes.data) setMetasEquipe(meRes.data);
      if (cRes.data && cRes.data[0]) setConfiguracoes(cRes.data[0]);
      if (clRes.data) setClasses(clRes.data);
      if (hRes.data) setHistorico(hRes.data);

      // Carregar recebimentos de hoje
      const dataHoje = getDataHojeISO();
      const rHojeRes = await supabase
        .from('recebimentos')
        .select('usuario_id, valor_recebido')
        .eq('data_pagamento', dataHoje);

      if (rHojeRes.data) {
        const mapa = {};
        let totalGeral = 0;
        for (const item of rHojeRes.data) {
          const uId = item.usuario_id;
          const val = Number(item.valor_recebido) || 0;
          mapa[uId] = (mapa[uId] || 0) + val;
          totalGeral += val;
        }
        setRecebimentosHoje(mapa);
        setTotalHojeGeral(totalGeral);
      }
    } catch (error) {
      console.error('Erro ao carregar dados do DataContext:', error);
    } finally {
      setLoading(false);
    }
  }, [mesAtual, anoAtual]);

  useEffect(() => {
    carregarTudo();

    // ============================================
    // CONFIGURAÇÃO SUPABASE REALTIME (INSTANTÂNEO)
    // ============================================
    const canal = supabase
      .channel('app-realtime-sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'metas' }, (payload) => {
        if (payload.eventType === 'INSERT') {
          setMetas(prev => [...prev.filter(m => m.id !== payload.new.id), payload.new]);
        } else if (payload.eventType === 'UPDATE') {
          setMetas(prev => prev.map(m => (m.id === payload.new.id || (m.usuario_id === payload.new.usuario_id && m.mes === payload.new.mes && m.ano === payload.new.ano)) ? payload.new : m));
        } else if (payload.eventType === 'DELETE') {
          setMetas(prev => prev.filter(m => m.id !== payload.old.id));
        }
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'configuracoes' }, (payload) => {
        if (payload.new) setConfiguracoes(payload.new);
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'usuarios' }, (payload) => {
        if (payload.eventType === 'INSERT') {
          setUsuarios(prev => [...prev, payload.new]);
        } else if (payload.eventType === 'UPDATE') {
          setUsuarios(prev => prev.map(u => u.id === payload.new.id ? payload.new : u));
        } else if (payload.eventType === 'DELETE') {
          setUsuarios(prev => prev.filter(u => u.id !== payload.old.id));
        }
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'equipes' }, () => {
        supabase.from('equipes').select('*').order('nome').then(res => res.data && setEquipes(res.data));
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'recebimentos' }, () => {
        // Ao importar novos recebimentos, recarrega os totais de hoje e metas
        carregarTudo();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(canal);
    };
  }, [carregarTudo]);

  // Funções de atualização direta
  const updateMetaRecord = async (usuarioId, dados) => {
    const metaExistente = metas.find(m => Number(m.usuario_id) === Number(usuarioId));
    let ok = false;

    if (metaExistente?.id) {
      const res = await supabase
        .from('metas')
        .update(dados)
        .eq('id', metaExistente.id)
        .select();
      ok = res.data && res.data.length > 0;
    }

    if (!ok) {
      const res = await supabase
        .from('metas')
        .update(dados)
        .eq('usuario_id', Number(usuarioId))
        .eq('mes', mesAtual)
        .eq('ano', anoAtual)
        .select();
      ok = res.data && res.data.length > 0;
    }

    if (!ok) {
      const maxId = metas.reduce((max, m) => (m.id && m.id > max ? m.id : max), 300);
      const res = await supabase.from('metas').insert({
        id: maxId + 1,
        usuario_id: Number(usuarioId),
        mes: mesAtual,
        ano: anoAtual,
        meta: 0,
        direto: 0,
        extra: 0,
        recebido: 0,
        por_fora_direto: 0,
        por_fora_extra: 0,
        ...dados
      }).select();
      ok = res.data && res.data.length > 0;
    }

    // Atualização otimista imediata na memória local
    if (ok) {
      setMetas(prev => {
        const idx = prev.findIndex(m => Number(m.usuario_id) === Number(usuarioId));
        if (idx >= 0) {
          const clone = [...prev];
          clone[idx] = { ...clone[idx], ...dados };
          return clone;
        }
        return [...prev, { usuario_id: Number(usuarioId), mes: mesAtual, ano: anoAtual, ...dados }];
      });
    }

    return ok;
  };

  const updateConfiguracoes = async (novasConfiguracoes) => {
    setConfiguracoes(prev => ({ ...prev, ...novasConfiguracoes }));
    const payload = {
      total_dias_uteis: Number(novasConfiguracoes.total_dias_uteis),
      dias_passados: Number(novasConfiguracoes.dias_passados),
      meta_setor: Number(novasConfiguracoes.meta_setor)
    };

    if (configuracoes.id) {
      await supabase.from('configuracoes').update(payload).eq('id', configuracoes.id);
    } else {
      const res = await supabase.from('configuracoes').insert(payload).select();
      if (res.data && res.data[0]) setConfiguracoes(res.data[0]);
    }
  };

  // Dias úteis e cálculos rápidos
  const totalDiasUteis = Number(configuracoes.total_dias_uteis) || 22;
  const diasPassados = Number(configuracoes.dias_passados) || 0;
  const diasRestantes = Math.max(0, totalDiasUteis - diasPassados);
  const metaSetor = Number(configuracoes.meta_setor) || 0;

  return (
    <DataContext.Provider value={{
      loading,
      usuarios,
      metas,
      equipes,
      metasEquipe,
      configuracoes,
      classes,
      historico,
      recebimentosHoje,
      totalHojeGeral,
      totalDiasUteis,
      diasPassados,
      diasRestantes,
      metaSetor,
      carregarTudo,
      updateMetaRecord,
      updateConfiguracoes,
      mesAtual,
      anoAtual
    }}>
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const context = useContext(DataContext);
  if (!context) throw new Error('useData deve ser usado dentro de DataProvider');
  return context;
}
