// Utilitários de manipulação e conversão de datas (Excel e sistema)

export function converterDataExcel(valor) {
  if (!valor || valor === '') return null;

  // Se for número (formato serial do Excel - dias desde 01/01/1900)
  if (typeof valor === 'number') {
    const utcMs = Math.round((valor - 25569) * 86400000);
    const data = new Date(utcMs);
    if (!isNaN(data.getTime()) && data.getUTCFullYear() > 2000 && data.getUTCFullYear() < 2100) {
      const ano = data.getUTCFullYear();
      const mes = String(data.getUTCMonth() + 1).padStart(2, '0');
      const dia = String(data.getUTCDate()).padStart(2, '0');
      return `${ano}-${mes}-${dia}`;
    }
    return null;
  }

  // Se for string
  if (typeof valor === 'string') {
    const str = valor.trim();

    // 1. PRIORIDADE: Formato brasileiro (DD/MM/YYYY)
    const matchBR = str.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
    if (matchBR) {
      const dia = String(matchBR[1]).padStart(2, '0');
      const mes = String(matchBR[2]).padStart(2, '0');
      const ano = matchBR[3];
      return `${ano}-${mes}-${dia}`;
    }

    // 2. Formato ISO (YYYY-MM-DD)
    const matchISO = str.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
    if (matchISO) {
      const ano = matchISO[1];
      const mes = String(matchISO[2]).padStart(2, '0');
      const dia = String(matchISO[3]).padStart(2, '0');
      return `${ano}-${mes}-${dia}`;
    }

    // 3. Fallback com Date
    const d = new Date(str);
    if (!isNaN(d.getTime()) && d.getFullYear() > 2000 && d.getFullYear() < 2100) {
      const ano = d.getFullYear();
      const mes = String(d.getMonth() + 1).padStart(2, '0');
      const dia = String(d.getDate()).padStart(2, '0');
      return `${ano}-${mes}-${dia}`;
    }
  }

  return null;
}

export function formatarDataBR(dataStr) {
  if (!dataStr) return '';
  const match = String(dataStr).match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (match) {
    return `${match[3]}/${match[2]}/${match[1]}`;
  }
  return dataStr;
}

export function getDataHojeISO() {
  const now = new Date();
  const ano = now.getFullYear();
  const mes = String(now.getMonth() + 1).padStart(2, '0');
  const dia = String(now.getDate()).padStart(2, '0');
  return `${ano}-${mes}-${dia}`;
}
