import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://ixcetrrvpfftdtqtyqzc.supabase.co';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_6VS5n2YTfnQPS_NFaPyOeQ_CT0a7YVf';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  realtime: {
    params: {
      eventsPerSecond: 20
    }
  }
});

// Helpers de auditoria
export async function registrarHistorico(acao, descricao, usuario = 'Sistema') {
  try {
    await supabase.from('historico').insert({
      acao,
      descricao,
      usuario,
      data_hora: new Date().toISOString()
    });
  } catch (e) {
    console.warn('Erro ao registrar histórico:', e);
  }
}
