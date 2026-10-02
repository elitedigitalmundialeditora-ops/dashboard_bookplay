// Utilitários de formatação financeira e numérica

export function formatMoney(val) {
  const num = Number(val) || 0;
  return num.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

export function parseMoneyToNumber(str) {
  if (typeof str === 'number') return isNaN(str) ? 0 : str;
  if (!str) return 0;
  
  // Limpa caracteres que não sejam dígitos, sinal ou separadores
  let s = String(str).trim();
  const isNegative = s.startsWith('-');
  s = s.replace(/[^0-9,.]/g, '');

  if (s.includes(',')) {
    s = s.replace(/\./g, '').replace(',', '.');
  } else if ((s.match(/\./g) || []).length > 1) {
    const lastDot = s.lastIndexOf('.');
    s = s.substring(0, lastDot).replace(/\./g, '') + '.' + s.substring(lastDot + 1);
  }

  const num = parseFloat(s) || 0;
  return isNegative ? -num : num;
}

export function formatPercent(val) {
  const num = Number(val) || 0;
  return `${num.toFixed(1)}%`;
}

export function getProjecaoColorHex(proj) {
  if (proj >= 100) return '#10B981'; // Verde sucesso
  if (proj >= 80) return '#3B82F6';  // Azul ótimo
  if (proj >= 60) return '#F59E0B';  // Âmbar atenção
  return '#EF4444';                  // Vermelho alerta
}

export function calcularProjecao(meta, recebido) {
  if (!meta || meta <= 0) return 0;
  return ((recebido || 0) / meta) * 100;
}

export function calcularAlcance(meta, recebido) {
  if (!meta || meta <= 0) return 0;
  return Math.min(100, ((recebido || 0) / meta) * 100);
}
