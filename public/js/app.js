// ============================================

        // FUNÇÕES DO CHAT - WHATSAPP STYLE

        // ============================================

        // Toggle do seletor de emojis

        function toggleEmojiPicker() {

            const picker = document.getElementById('emojiPicker');

            picker.classList.toggle('show');

        }

        // Inserir emoji no input

        function inserirEmoji(emoji) {

            const input = document.getElementById('chatInput');

            input.value += emoji;

            input.focus();

        }

        // Fechar emoji picker ao clicar fora

        document.addEventListener('click', function (e) {

            const picker = document.getElementById('emojiPicker');

            const btn = document.querySelector('.emoji-btn');

            if (picker && btn && !picker.contains(e.target) && !btn.contains(e.target)) {

                picker.classList.remove('show');

            }

        });

        // ============================================

        // FILTRAR USUÁRIOS NO PRIVADO

        // ============================================

        window.filtrarUsuariosPrivado = function (termo) {

            const items = document.querySelectorAll('#chatUserList .chat-user-item');

            const termoLower = termo.toLowerCase().trim();

            let encontrou = false;

            items.forEach(item => {

                const nome = item.getAttribute('data-nome') || '';

                if (nome.includes(termoLower)) {

                    item.style.display = 'flex';

                    encontrou = true;

                } else {

                    item.style.display = 'none';

                }

            });

            // Se não encontrou nenhum, mostra mensagem

            const userList = document.getElementById('chatUserList');

            const msgExistente = userList.querySelector('.no-results');

            if (!encontrou && termo.length > 0) {

                if (!msgExistente) {

                    const div = document.createElement('div');

                    div.className = 'chat-system-message no-results';

                    div.style.padding = '12px';

                    div.textContent = 'Nenhum contato encontrado';

                    userList.appendChild(div);

                }

            } else if (msgExistente) {

                msgExistente.remove();

            }

        };

        // ============================================

        // TOGGLE DO SELETOR DE EMOJIS

        // ============================================

        window.toggleEmojiPicker = function () {

            const picker = document.getElementById('emojiPicker');

            if (picker) {

                picker.classList.toggle('show');

            }

        };

        window.inserirEmoji = function (emoji) {

            const input = document.getElementById('chatInput');

            if (input) {

                input.value += emoji;

                input.focus();

            }

        };

        const SUPABASE_URL = 'https://ixcetrrvpfftdtqtyqzc.supabase.co';

        const SUPABASE_ANON_KEY = 'sb_publishable_6VS5n2YTfnQPS_NFaPyOeQ_CT0a7YVf';

        let currentUser = null;

        let usuarios = [];

        let metas = [];

        let equipes = [];

        let metasEquipe = [];

        let classes = [];

        let historico = [];

        let configuracoesSalvas = null;
        try {
            const raw = localStorage.getItem('configuracoes');
            if (raw) configuracoesSalvas = JSON.parse(raw);
        } catch (e) { }

        let configuracoes = configuracoesSalvas || { total_dias_uteis: 22, dias_passados: new Date().getDate(), meta_setor: 0 };

        let classesExpandidas = {};

        let draggedItem = null;

        let scrollInterval = null;

        let equipesCollapsed = {};

        let senhaVisivel = false;

        let historicoPaginaAtual = 1;

        let historicoItensPorPagina = 25;

        let historicoFiltrados = [];

        let filtrosOperadores = {

            ordenacao: 'projecao_desc',

            classes: [],

            equipes: [],

            busca: ''

        };

        // Dados importados do Excel

        let dadosRecebimentos = [];

        let dadosRecebimentosPorUsuario = {};

        // Variáveis para scroll automático no drag and drop

        let draggedOperador = null;

        let scrollIntervalDrag = null;

        const SCROLL_ZONE_HEIGHT = 80;

        // ========== FUNÇÕES DE PAGINAÇÃO DO ANALÍTICO (GLOBAIS) ==========

        let analiticoPaginaAtualGlobal = 1;

        const analiticoItensPorPaginaGlobal = 50;

        let analiticoDadosFiltradosGlobal = [];

        let analiticoIsOperadorGlobal = false;

        function renderizarPaginaAnaliticoGlobal() {

            const inicio = (analiticoPaginaAtualGlobal - 1) * analiticoItensPorPaginaGlobal;

            const fim = inicio + analiticoItensPorPaginaGlobal;

            const dadosPagina = analiticoDadosFiltradosGlobal.slice(inicio, fim);

            const tbody = document.getElementById('analiticoTabelaBody');

            if (tbody) {

                tbody.innerHTML = gerarLinhasAnaliticoAgrupado(dadosPagina, analiticoIsOperadorGlobal);

            }

            const totalPaginas = Math.ceil(analiticoDadosFiltradosGlobal.length / analiticoItensPorPaginaGlobal);

            const pagContainer = document.getElementById('analiticoPagination');

            if (!pagContainer) return;

            let pagHtml = '';

            pagHtml += `<button onclick="mudarPaginaAnaliticoGlobal(${analiticoPaginaAtualGlobal - 1})" ${analiticoPaginaAtualGlobal === 1 ? 'disabled' : ''}>◀ Anterior</button>`;

            for (let i = 1; i <= Math.min(totalPaginas, 5); i++) {

                pagHtml += `<button onclick="mudarPaginaAnaliticoGlobal(${i})" class="${analiticoPaginaAtualGlobal === i ? 'active' : ''}">${i}</button>`;

            }

            if (totalPaginas > 5) {

                pagHtml += `<span>...</span><button onclick="mudarPaginaAnaliticoGlobal(${totalPaginas})">${totalPaginas}</button>`;

            }

            pagHtml += `<button onclick="mudarPaginaAnaliticoGlobal(${analiticoPaginaAtualGlobal + 1})" ${analiticoPaginaAtualGlobal === totalPaginas ? 'disabled' : ''}>Próximo ▶</button>`;

            pagContainer.innerHTML = pagHtml;

        }

        window.mudarPaginaAnaliticoGlobal = function (pagina) {

            const totalPaginas = Math.ceil(analiticoDadosFiltradosGlobal.length / analiticoItensPorPaginaGlobal);

            if (pagina >= 1 && pagina <= totalPaginas) {

                analiticoPaginaAtualGlobal = pagina;

                renderizarPaginaAnaliticoGlobal();

            }

        };

        // ============================================

        // ============================================

        // FUNÇÕES DE UTILIDADE

        // ============================================

        function showToast(msg) {

            let t = document.createElement('div');

            t.className = 'toast';

            t.innerText = msg;

            document.body.appendChild(t);

            setTimeout(() => t.remove(), 3000);

        }

        function logout() {

            pararAtualizacaoQuadrante();

            localStorage.removeItem('currentUser');

            location.reload();

        }

        function escapeHtml(text) {

            if (!text) return '-';

            const div = document.createElement('div');

            div.textContent = text;

            return div.innerHTML;

        }

        function formatMoney(value) {

            if (value === undefined || value === null) value = 0;

            // Garante que o valor seja tratado como número com 2 casas decimais

            const numero = parseFloat(value);

            if (isNaN(numero)) return 'R$ 0,00';

            return new Intl.NumberFormat('pt-BR', {

                style: 'currency',

                currency: 'BRL',

                minimumFractionDigits: 2,

                maximumFractionDigits: 2

            }).format(numero);

        }

        function getProjecaoColor(projecao) {

            if (projecao >= 100) return 'proj-verde';

            if (projecao >= 80) return 'proj-azul';

            if (projecao >= 40) return 'proj-amarelo';

            return 'proj-vermelho';

        }

        function getProjecaoColorHex(projecao) {

            if (projecao >= 100) return '#28A745';

            if (projecao >= 80) return '#1E6DC3';

            if (projecao >= 40) return '#FFC107';

            return '#DC3545';

        }

        function getEquipeNome(equipeId) {

            const equipe = equipes.find(e => e.id === equipeId);

            return equipe ? equipe.nome : 'Sem equipe';

        }

        function getDiasUteis() {

            return (configuracoes && configuracoes.total_dias_uteis !== undefined && configuracoes.total_dias_uteis !== null) ? Number(configuracoes.total_dias_uteis) : 22;

        }

        function getDiasPassados() {

            const dias = configuracoes?.dias_passados;

            if (dias !== undefined && dias !== null && !isNaN(dias)) {

                return Number(dias);

            }

            return 0;

        }

        function getDiasRestantes() {

            return Math.max(0, getDiasUteis() - getDiasPassados());

        }

        function getMetaSetor() {

            return (configuracoes && configuracoes.meta_setor !== undefined && configuracoes.meta_setor !== null) ? Number(configuracoes.meta_setor) : 0;

        }

        function normalizarFotoUrl(url) {

            if (!url || typeof url !== 'string') return null;

            if (url.includes('/storage/v1/object/public/')) {

                const caminhoRelativo = url.substring(url.indexOf('/storage/v1/object/public/'));

                return `${SUPABASE_URL}${caminhoRelativo}`;

            }

            return url;

        }

        function normalizarCargo(cargo) {

            return String(cargo || '').toLowerCase().trim();

        }

        function isCargoNoSetor(cargo) {

            const cargoNormalizado = normalizarCargo(cargo);

            return ['operador', 'elite', 'gestor', 'gestora'].includes(cargoNormalizado);

        }

        function isCargoResponsavelEquipe(cargo) {

            const cargoNormalizado = normalizarCargo(cargo);

            return ['supervisor', 'gestor', 'gestora'].includes(cargoNormalizado);

        }

        function calcularAlcance(meta, recebido) {

            if (meta === 0) return 0;

            return (recebido / meta) * 100;

        }

        function calcularProjecao(meta, recebido) {

            const diasUteis = getDiasUteis(), diasPassados = getDiasPassados();

            if (diasUteis === 0 || diasPassados === 0) return 0;

            const esperado = (meta / diasUteis) * diasPassados;

            if (esperado === 0) return 0;

            return (recebido / esperado) * 100;

        }

        function calcularEsperado(meta) {

            const diasUteis = getDiasUteis(), diasPassados = getDiasPassados();

            if (diasUteis === 0) return 0;

            return (meta / diasUteis) * diasPassados;

        }

        function calcularMetaDiaria(meta) {

            const diasUteis = getDiasUteis();

            if (diasUteis === 0) return 0;

            return meta / diasUteis;

        }

        function getSaudacao() {

            const h = new Date().getHours();

            if (h >= 5 && h < 12) return "Bom dia";

            if (h >= 12 && h < 18) return "Boa tarde";

            return "Boa noite";

        }

        // ============================================

        // FUNÇÃO DE QUARTIL PARA OPERADOR/ELITE

        // ============================================

        function calcularQuartilOperador(operadorAtual, operadorRecebido, metaOperador) {

            const mes = new Date().getMonth() + 1;

            const ano = new Date().getFullYear();

            // Buscar todos os operadores ativos (operador e elite)

            const todosOperadores = usuarios.filter(u => (u.cargo === 'operador' || u.cargo === 'elite') && u.status === 'ativo');

            if (todosOperadores.length === 0) return null;

            // Criar array com nome, recebido, meta e projeção

            let operadoresComProjecao = todosOperadores.map(op => {

                const metaUsuario = metas.find(m => m?.usuario_id === op.id && m?.mes === mes && m?.ano === ano);

                const meta = metaUsuario?.meta || 0;

                const recebido = metaUsuario?.recebido || 0;

                const projecao = calcularProjecao(meta, recebido);

                return {

                    id: op.id,

                    nome: op.nome,

                    recebido: recebido,

                    meta: meta,

                    projecao: projecao

                };

            });

            // Ordenar por PROJEÇÃO (do maior para o menor)

            operadoresComProjecao.sort((a, b) => b.projecao - a.projecao);

            const operadorAtualCompleto = operadoresComProjecao.find(op => op.id === operadorAtual.id);

            if (!operadorAtualCompleto) return null;

            const projecaoAtual = operadorAtualCompleto.projecao;

            const recebidoAtual = operadorAtualCompleto.recebido;

            const metaValor = operadorAtualCompleto.meta;

            const diasPassados = getDiasPassados();

            let quartilAtual = '';

            let mensagem = '';

            let icone = '';

            let corBg = '';

            let percentualMeta = 0;

            // Calcular percentual da meta

            if (metaValor > 0) {

                percentualMeta = (recebidoAtual / metaValor) * 100;

            }

            // CLASSIFICAÇÃO POR PROJEÇÃO

            if (projecaoAtual >= 100) {

                quartilAtual = '1º Quartil - Excelente!';

                if (metaValor > 0 && recebidoAtual >= metaValor) {

                    mensagem = `PARABÉNS! Meta batida e projeção superior a 100%!<br><span style="font-size: 0.85rem; opacity: 0.9;">${percentualMeta.toFixed(1)}% da meta alcançada.</span>`;

                } else if (metaValor > 0) {

                    const faltaMeta = metaValor - recebidoAtual;

                    mensagem = `Faltam ${formatMoney(faltaMeta)} para bater sua meta!<br><span style="font-size: 0.85rem; opacity: 0.9;">${percentualMeta.toFixed(1)}% da meta alcançada.</span>`;

                } else {

                    mensagem = `Você está no Topo! Projeção superior a 100%!<br><span style="font-size: 0.85rem; opacity: 0.9;">${percentualMeta.toFixed(1)}% da meta alcançada.</span>`;

                }

                icone = '';

                corBg = '#28A745';

            }

            else if (projecaoAtual >= 80) {

                quartilAtual = '2º Quartil';

                const esperadoAtual = (metaValor / getDiasUteis()) * diasPassados;

                const recebidoNecessario100 = esperadoAtual;

                const valorNecessario = Math.max(0, recebidoNecessario100 - recebidoAtual);

                if (valorNecessario > 0) {

                    mensagem = `Faltam ${formatMoney(valorNecessario)} para o 1º Quartil<br><span style="font-size: 0.85rem; opacity: 0.9;">${percentualMeta.toFixed(1)}% da meta alcançada.</span>`;

                } else {

                    mensagem = `Você já atingiu a meta para o 1º Quartil!<br><span style="font-size: 0.85rem; opacity: 0.9;">${percentualMeta.toFixed(1)}% da meta alcançada.</span>`;

                }

                icone = '';

                corBg = '#1E6DC3';

            }

            else if (projecaoAtual >= 40) {

                quartilAtual = '3º Quartil';

                const esperadoAtual = (metaValor / getDiasUteis()) * diasPassados;

                const recebidoNecessario80 = (80 * esperadoAtual) / 100;

                const valorNecessario = Math.max(0, recebidoNecessario80 - recebidoAtual);

                if (valorNecessario > 0) {

                    mensagem = `Faltam ${formatMoney(valorNecessario)} para o 2º Quartil<br><span style="font-size: 0.85rem; opacity: 0.9;">${percentualMeta.toFixed(1)}% da meta alcançada.</span>`;

                } else {

                    mensagem = `Você já atingiu a meta para o 2º Quartil!<br><span style="font-size: 0.85rem; opacity: 0.9;">${percentualMeta.toFixed(1)}% da meta alcançada.</span>`;

                }

                icone = '️';

                corBg = '#FFC107';

            }

            else {

                quartilAtual = '4º Quartil - Crítico';

                const esperadoAtual = (metaValor / getDiasUteis()) * diasPassados;

                const recebidoNecessario40 = (40 * esperadoAtual) / 100;

                const valorNecessario = Math.max(0, recebidoNecessario40 - recebidoAtual);

                if (valorNecessario > 0) {

                    mensagem = `Faltam ${formatMoney(valorNecessario)} para o 3º Quartil<br><span style="font-size: 0.85rem; opacity: 0.9;">${percentualMeta.toFixed(1)}% da meta alcançada.</span>`;

                } else {

                    mensagem = `Você já atingiu a meta para o 3º Quartil!<br><span style="font-size: 0.85rem; opacity: 0.9;">${percentualMeta.toFixed(1)}% da meta alcançada.</span>`;

                }

                icone = '⚡';

                corBg = '#DC3545';

            }

            return {

                quartilAtual,

                mensagem,

                icone,

                corBg

            };

        }

        function parseMoneyToNumber(moneyString) {

            if (!moneyString || moneyString === '') return 0;

            try {

                let str = String(moneyString).trim();

                // Se já for número, retorna direto (sem arredondamento)

                if (typeof moneyString === 'number') return moneyString;

                // Remove "R$" e espaços

                // Preserva o sinal negativo antes de remover R$

                const isNegative = str.startsWith('-') || str.includes('- ') || str.includes('-R$') || str.includes('- R$');

                str = str.replace(/R\$/gi, '').replace(/-/g, '').trim();

                if (isNegative) str = '-' + str;

                // Caso especial: "1.234,56" (formato brasileiro)

                if (str.includes(',') && str.match(/\d+,\d{2}$/)) {

                    // Remove pontos dos milhares

                    str = str.replace(/\./g, '');

                    // Troca vírgula decimal por ponto

                    str = str.replace(/,/g, '.');

                }

                // Caso: "1,234.56" (formato americano)

                else if (str.includes(',') && str.includes('.')) {

                    // Remove vírgulas (separador de milhar)

                    str = str.replace(/,/g, '');

                }

                // Caso: "1234.56" (formato simples)

                else if (str.includes('.')) {

                    // Mantém o ponto como está (já é decimal)

                }

                // Caso: "1234,56" (vírgula como decimal)

                else if (str.includes(',')) {

                    str = str.replace(/,/g, '.');

                }

                const number = parseFloat(str);

                // 🔥 MANTER A PRECISÃO ORIGINAL (sem arredondar)

                return isNaN(number) ? 0 : number;

            } catch (e) {

                return 0;

            }

        }

        function formatarInputMoeda(input) {

            let value = input.value.replace(/\D/g, '');

            if (value && value !== '') {

                let number = (parseFloat(value) / 100).toFixed(2);

                // Garante que o valor seja tratado como número

                const numeroFormatado = parseFloat(number);

                input.value = new Intl.NumberFormat('pt-BR', {

                    style: 'currency',

                    currency: 'BRL',

                    minimumFractionDigits: 2,

                    maximumFractionDigits: 2

                }).format(numeroFormatado);

            } else {

                input.value = '';

            }

        }

        function formatarInputMoedaComSinal(input) {

            let hasMinus = input.value.trim().startsWith('-');

            let value = input.value.replace(/\D/g, '');

            if (value && value !== '') {

                let number = (parseFloat(value) / 100).toFixed(2);

                const numeroFormatado = parseFloat(number);

                let formatted = new Intl.NumberFormat('pt-BR', {

                    style: 'currency',

                    currency: 'BRL',

                    minimumFractionDigits: 2,

                    maximumFractionDigits: 2

                }).format(numeroFormatado);

                input.value = (hasMinus ? '-' : '') + formatted.replace('-', '').trim();

            } else {

                input.value = hasMinus ? '-' : '';

            }

        }

        function salvarFiltrosOperadores() {

            localStorage.setItem('filtrosOperadores', JSON.stringify(filtrosOperadores));

        }

        function carregarFiltrosOperadores() {

            const saved = localStorage.getItem('filtrosOperadores');

            if (saved) {

                try {

                    const parsed = JSON.parse(saved);

                    filtrosOperadores = parsed;

                } catch (e) { }

            }

        }

        function salvarEquipesCollapsed() {

            localStorage.setItem('equipesCollapsed', JSON.stringify(equipesCollapsed));

        }

        // ============================================

        // FUNÇÕES DE BANCO DE DADOS

        // ============================================

        async function fetchFromSupabase(table, customQuery = '') {

            try {

                let url;

                if (table.includes('?')) {

                    url = `${SUPABASE_URL}/rest/v1/${table}`;

                } else if (customQuery) {

                    url = `${SUPABASE_URL}/rest/v1/${table}?${customQuery}`;

                } else {

                    url = `${SUPABASE_URL}/rest/v1/${table}?select=*`;

                }

                const res = await fetch(url, {

                    cache: 'no-store',

                    headers: {
                        'apikey': SUPABASE_ANON_KEY,
                        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                        'Cache-Control': 'no-cache, no-store, must-revalidate',
                        'Pragma': 'no-cache'
                    }

                });

                if (!res.ok) {

                    if (res.status === 404) return [];

                    throw new Error(`HTTP ${res.status}`);

                }

                return res.json();

            } catch (e) {

                console.error(`Erro ao buscar de ${table}:`, e);

                return [];

            }

        }

        async function insertInto(table, data) {

            try {

                const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {

                    method: 'POST',

                    headers: {

                        'apikey': SUPABASE_ANON_KEY,

                        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,

                        'Content-Type': 'application/json',

                        'Prefer': 'return=representation'

                    },

                    body: JSON.stringify(data)

                });

                if (!res.ok) {

                    const errorText = await res.text();

                    console.error(`Erro ao inserir em ${table}:`, errorText);

                    return null;

                }

                const json = await res.json();

                return json;

            } catch (e) {

                console.error(`Erro em insertInto (${table}):`, e);

                return null;

            }

        }

        async function updateIn(table, id, data) {

            try {

                if (!id || id === 'null' || id === 'undefined') {

                    console.warn(`updateIn chamado com id inválido (${id}) para tabela ${table}`);

                    return false;

                }

                const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?id=eq.${id}`, {

                    method: 'PATCH',

                    headers: {

                        'apikey': SUPABASE_ANON_KEY,

                        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,

                        'Content-Type': 'application/json',

                        'Prefer': 'return=representation'

                    },

                    body: JSON.stringify(data)

                });

                if (!res.ok) {

                    const errorText = await res.text();

                    console.error(`Erro HTTP ${res.status} ao atualizar ${table}:`, errorText);

                    return false;

                }

                const json = await res.json();

                return Array.isArray(json) ? json.length > 0 : true;

            } catch (e) {

                console.error(`Erro em updateIn (${table}):`, e);

                return false;

            }

        }

        async function updateMeta(usuarioId, mes, ano, data, metaId = null) {

            usuarioId = Number(usuarioId);

            mes = Number(mes);

            ano = Number(ano);

            // 1. Tentar por ID se válido
            if (metaId && !isNaN(metaId) && Number(metaId) > 0) {

                const ok = await updateIn('metas', Number(metaId), data);

                if (ok) return true;

            }

            // 2. Tentar por chave composta (usuario_id, mes, ano)
            try {

                const res = await fetch(`${SUPABASE_URL}/rest/v1/metas?usuario_id=eq.${usuarioId}&mes=eq.${mes}&ano=eq.${ano}`, {

                    method: 'PATCH',

                    headers: {

                        'apikey': SUPABASE_ANON_KEY,

                        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,

                        'Content-Type': 'application/json',

                        'Prefer': 'return=representation'

                    },

                    body: JSON.stringify(data)

                });

                if (res.ok) {

                    const rows = await res.json();

                    if (Array.isArray(rows) && rows.length > 0) {

                        return true;

                    }

                }

            } catch (e) {

                console.error('Erro em updateMeta por usuario_id/mes/ano:', e);

            }

            // 3. Se não existe registro, calcula próximo id e insere
            const maxId = (Array.isArray(metas) ? metas : []).reduce((max, m) => (m.id && m.id > max ? m.id : max), 284);

            const novoRegistro = {

                id: maxId + 1,

                usuario_id: usuarioId,

                mes: mes,

                ano: ano,

                meta: 0,

                direto: 0,

                extra: 0,

                recebido: 0,

                por_fora_direto: 0,

                por_fora_extra: 0,

                ...data

            };

            const resInsert = await insertInto('metas', novoRegistro);

            return !!resInsert;

        }

        async function updateMetaEquipe(equipeId, mes, ano, metaValor, metaEquipeId = null) {
            equipeId = Number(equipeId);
            mes = Number(mes);
            ano = Number(ano);
            metaValor = Number(metaValor) || 0;

            // 1. Tentar por ID se válido
            if (metaEquipeId && !isNaN(metaEquipeId) && Number(metaEquipeId) > 0) {
                const ok = await updateIn('metas_equipe', Number(metaEquipeId), { meta: metaValor });
                if (ok) return true;
            }

            // 2. Tentar por chave composta (equipe_id, mes, ano)
            try {
                const res = await fetch(`${SUPABASE_URL}/rest/v1/metas_equipe?equipe_id=eq.${equipeId}&mes=eq.${mes}&ano=eq.${ano}`, {
                    method: 'PATCH',
                    headers: {
                        'apikey': SUPABASE_ANON_KEY,
                        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                        'Content-Type': 'application/json',
                        'Prefer': 'return=representation'
                    },
                    body: JSON.stringify({ meta: metaValor })
                });
                if (res.ok) {
                    const rows = await res.json();
                    if (Array.isArray(rows) && rows.length > 0) {
                        return true;
                    }
                }
            } catch (e) {
                console.error('Erro em updateMetaEquipe por equipe_id/mes/ano:', e);
            }

            // 3. Se não existe registro, calcula próximo id e insere
            const maxId = (Array.isArray(metasEquipe) ? metasEquipe : []).reduce((max, m) => (m.id && m.id > max ? m.id : max), 24);
            const novoRegistro = {
                id: maxId + 1,
                equipe_id: equipeId,
                meta: metaValor,
                mes: mes,
                ano: ano
            };
            const resInsert = await insertInto('metas_equipe', novoRegistro);
            return !!resInsert;
        }


        async function deleteFrom(table, id) {

            try {

                await fetch(`${SUPABASE_URL}/rest/v1/${table}?id=eq.${id}`, {

                    method: 'DELETE',

                    headers: { 'apikey': SUPABASE_ANON_KEY, 'Authorization': `Bearer ${SUPABASE_ANON_KEY}` }

                });

            } catch (e) {

                console.error(e);

            }

        }

        async function registrarHistorico(acao, descricao) {

            if (!currentUser) return;

            // 🔥 USA O HORÁRIO LOCAL DIRETAMENTE SEM CONVERSÃO

            const agora = new Date();

            // Formata a data/hora local para string legível

            const ano = agora.getFullYear();

            const mes = String(agora.getMonth() + 1).padStart(2, '0');

            const dia = String(agora.getDate()).padStart(2, '0');

            const hora = String(agora.getHours()).padStart(2, '0');

            const minuto = String(agora.getMinutes()).padStart(2, '0');

            const segundo = String(agora.getSeconds()).padStart(2, '0');

            // Salva como string no formato ISO mas com horário local

            const dataHoraLocal = `${ano}-${mes}-${dia}T${hora}:${minuto}:${segundo}.000`;

            const novoLog = {

                usuario_id: currentUser.id,

                usuario_nome: currentUser.nome,

                acao: acao,

                descricao: descricao,

                data_hora: dataHoraLocal

            };

            try {

                await fetch(`${SUPABASE_URL}/rest/v1/historico`, {

                    method: 'POST',

                    headers: {

                        'apikey': SUPABASE_ANON_KEY,

                        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,

                        'Content-Type': 'application/json'

                    },

                    body: JSON.stringify(novoLog)

                });

                historico.unshift(novoLog);

                // Limitar a 100 registros

                if (historico.length > 100) {

                    historico = historico.slice(0, 100);

                }

            } catch (e) {

                console.warn('Erro ao salvar log:', e);

            }

        }

        // ============================================

        // FUNÇÕES DE CARREGAMENTO DE DADOS

        // ============================================

        async function carregarDados() {

            try {

                const [usuariosData, metasData, equipesData, metasEquipeData, cfgData, historicoData, classesData] = await Promise.all([

                    fetchFromSupabase('usuarios'),

                    fetchFromSupabase('metas'),

                    fetchFromSupabase('equipes'),

                    fetchFromSupabase('metas_equipe'),

                    fetchFromSupabase('configuracoes?select=*'),

                    fetchFromSupabase('historico'),

                    fetchFromSupabase('classes')

                ]);

                usuarios = (usuariosData || []).map(u => {

                    if (u && u.foto) u.foto = normalizarFotoUrl(u.foto);

                    return u;

                });

                if (currentUser && currentUser.foto) {

                    currentUser.foto = normalizarFotoUrl(currentUser.foto);

                }

                metas = (metasData || []).map(m => {

                    m.por_fora_direto = m.por_fora_direto || 0;

                    m.por_fora_extra = m.por_fora_extra || 0;

                    m.direto = (m.direto || 0) + m.por_fora_direto;

                    m.extra = (m.extra || 0) + m.por_fora_extra;

                    m.recebido = (m.recebido || 0) + m.por_fora_direto + m.por_fora_extra;

                    return m;

                });

                equipes = equipesData;

                metasEquipe = metasEquipeData;

                historico = historicoData || [];

                classes = classesData || [];

                // Carregar configurações com valores padrão seguros
                let cfgSalvaLocal = null;
                try {
                    const localRaw = localStorage.getItem('configuracoes');
                    if (localRaw) cfgSalvaLocal = JSON.parse(localRaw);
                } catch (e) { }

                const cfgRows = Array.isArray(cfgData) ? cfgData : [];
                const rowComId = cfgRows.find(r => r.id !== null && r.id !== undefined);
                const rowValida = rowComId || cfgRows[0];

                if (rowValida) {
                    configuracoes = { ...rowValida };
                    configuracoes.meta_setor = (rowValida.meta_setor !== undefined && rowValida.meta_setor !== null && rowValida.meta_setor !== '') ? Number(rowValida.meta_setor) : (cfgSalvaLocal?.meta_setor !== undefined ? Number(cfgSalvaLocal.meta_setor) : 0);
                    configuracoes.total_dias_uteis = (rowValida.total_dias_uteis !== undefined && rowValida.total_dias_uteis !== null && rowValida.total_dias_uteis !== '') ? Number(rowValida.total_dias_uteis) : (cfgSalvaLocal?.total_dias_uteis !== undefined ? Number(cfgSalvaLocal.total_dias_uteis) : 22);
                    configuracoes.dias_passados = (rowValida.dias_passados !== undefined && rowValida.dias_passados !== null && rowValida.dias_passados !== '') ? Number(rowValida.dias_passados) : (cfgSalvaLocal?.dias_passados !== undefined ? Number(cfgSalvaLocal.dias_passados) : 0);
                    if (rowComId) configuracoes.id = rowComId.id;
                } else if (cfgSalvaLocal) {
                    configuracoes = cfgSalvaLocal;
                } else {
                    configuracoes = {
                        total_dias_uteis: 22,
                        dias_passados: 0,
                        meta_setor: 0
                    };
                }
                localStorage.setItem('configuracoes', JSON.stringify(configuracoes));

                // Limpeza silenciosa de linhas com id null duplicadas no banco
                if (cfgRows.some(r => r.id === null || r.id === undefined)) {
                    fetch(`${SUPABASE_URL}/rest/v1/configuracoes?id=is.null`, {
                        method: 'DELETE',
                        headers: { 'apikey': SUPABASE_ANON_KEY, 'Authorization': `Bearer ${SUPABASE_ANON_KEY}` }
                    }).catch(() => { });
                }

                atualizarDiasUteis();

                if (historico.length > 100) historico = historico.slice(0, 100);

                let saved = localStorage.getItem('classesExpandidas');

                if (saved) classesExpandidas = JSON.parse(saved);

                let savedCollapsed = localStorage.getItem('equipesCollapsed');

                if (savedCollapsed) equipesCollapsed = JSON.parse(savedCollapsed);

                carregarFiltrosOperadores();

                return true;

            } catch (e) {

                console.error(e);

                return false;

            }

        }

        async function carregarHistorico() {

            try {

                const res = await fetch(`${SUPABASE_URL}/rest/v1/historico?select=*&order=data_hora.desc&limit=100`, {

                    headers: {

                        'apikey': SUPABASE_ANON_KEY,

                        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`

                    }

                });

                if (res.ok) {

                    historico = await res.json();

                    // Log para verificar a primeira data

                    if (historico.length > 0) {

                    }

                }

                renderizarHistoricoPagina(); // CHAMAR DIRETAMENTE, sem aplicar filtros

            } catch (e) {

                console.warn('Erro ao carregar histórico:', e);

                document.getElementById('historicoTableBody').innerHTML = '<tr><td colspan="4" style="text-align: center;">Erro ao carregar histórico</td></tr>';

            }

        }

        function aplicarFiltroHistorico() {

            const tipoAcao = document.getElementById('filtroTipoAcao')?.value || 'todos';

            const usuarioFiltro = document.getElementById('filtroUsuarioHistorico')?.value.toLowerCase() || '';

            const dataInicio = document.getElementById('filtroDataInicio')?.value;

            const dataFim = document.getElementById('filtroDataFim')?.value;

            let dadosFiltrados = [...historico];

            if (tipoAcao !== 'todos') dadosFiltrados = dadosFiltrados.filter(log => log.acao === tipoAcao);

            if (usuarioFiltro) dadosFiltrados = dadosFiltrados.filter(log => log.usuario_nome?.toLowerCase().includes(usuarioFiltro));

            if (dataInicio) { const inicio = new Date(dataInicio); inicio.setHours(0, 0, 0, 0); dadosFiltrados = dadosFiltrados.filter(log => new Date(log.data_hora) >= inicio); }

            if (dataFim) { const fim = new Date(dataFim); fim.setHours(23, 59, 59, 999); dadosFiltrados = dadosFiltrados.filter(log => new Date(log.data_hora) <= fim); }

            historicoFiltrados = dadosFiltrados;

            historicoPaginaAtual = 1;

            renderizarHistoricoPagina();

        }

        // Função auxiliar para formatar data/hora no padrão Brasil

        function formatarDataHoraBrasil(dataISO) {

            if (!dataISO) return '-';

            try {

                // Se já estiver no formato correto, apenas formata

                if (dataISO.includes('T') && !dataISO.includes('Z')) {

                    const [dataParte, horaParte] = dataISO.split('T');

                    const [ano, mes, dia] = dataParte.split('-');

                    const [hora, minuto, segundo] = horaParte.split(':');

                    return `${dia}/${mes}/${ano}, ${hora}:${minuto}:${segundo}`;

                }

                // Fallback: tenta converter normalmente

                const data = new Date(dataISO);

                if (isNaN(data.getTime())) return dataISO;

                const dia = String(data.getDate()).padStart(2, '0');

                const mes = String(data.getMonth() + 1).padStart(2, '0');

                const ano = data.getFullYear();

                const hora = String(data.getHours()).padStart(2, '0');

                const minuto = String(data.getMinutes()).padStart(2, '0');

                const segundo = String(data.getSeconds()).padStart(2, '0');

                return `${dia}/${mes}/${ano}, ${hora}:${minuto}:${segundo}`;

            } catch (e) {

                console.error('Erro ao formatar data:', dataISO, e);

                return dataISO;

            }

        }

        function renderizarHistoricoPagina() {

            const inicio = (historicoPaginaAtual - 1) * historicoItensPorPagina;

            const fim = inicio + historicoItensPorPagina;

            const dadosPagina = historico.slice(inicio, fim);

            const totalPaginas = Math.ceil(historico.length / historicoItensPorPagina);

            const tbody = document.getElementById('historicoTableBody');

            if (dadosPagina.length === 0) {

                tbody.innerHTML = '<tr><td colspan="4" style="text-align: center;">Nenhum registro encontrado</td></tr>';

            } else {

                const getBadgeClass = (acao) => {

                    switch (acao) {

                        case 'criacao': return 'badge-criacao';

                        case 'edicao': return 'badge-edicao';

                        case 'exclusao': return 'badge-exclusao';

                        case 'movimentacao': return 'badge-movimentacao';

                        default: return 'badge-edicao';

                    }

                };

                const getAcaoLabel = (acao) => {

                    switch (acao) {

                        case 'criacao': return 'Criação';

                        case 'edicao': return 'Edição';

                        case 'exclusao': return ' Exclusão';

                        case 'movimentacao': return 'Movimentação';

                        default: return acao;

                    }

                };

                tbody.innerHTML = dadosPagina.map(log => `

            <tr>

                <td style="white-space: nowrap;">${formatarDataHoraBrasil(log.data_hora)}</td>

                <td>${log.usuario_nome || 'Sistema'}</td>

                <td><span class="badge-acao ${getBadgeClass(log.acao)}">${getAcaoLabel(log.acao)}</span></td>

                <td>${log.descricao}</td>

            </tr>

        `).join('');

            }

            const pagContainer = document.getElementById('paginationContainer');

            if (totalPaginas <= 1) {

                pagContainer.innerHTML = '';

            } else {

                let pagHtml = '';

                pagHtml += `<button onclick="mudarPaginaHistorico(${historicoPaginaAtual - 1})" ${historicoPaginaAtual === 1 ? 'disabled' : ''}>◀ Anterior</button>`;

                for (let i = 1; i <= Math.min(totalPaginas, 5); i++) {

                    pagHtml += `<button onclick="mudarPaginaHistorico(${i})" class="${historicoPaginaAtual === i ? 'active' : ''}">${i}</button>`;

                }

                if (totalPaginas > 5) {

                    pagHtml += `<span>...</span><button onclick="mudarPaginaHistorico(${totalPaginas})">${totalPaginas}</button>`;

                }

                pagHtml += `<button onclick="mudarPaginaHistorico(${historicoPaginaAtual + 1})" ${historicoPaginaAtual === totalPaginas ? 'disabled' : ''}>Próximo ▶</button>`;

                pagContainer.innerHTML = pagHtml;

            }

        }

        function mudarPaginaHistorico(pagina) {

            const totalPaginas = Math.ceil(historicoFiltrados.length / historicoItensPorPagina);

            if (pagina >= 1 && pagina <= totalPaginas) {

                historicoPaginaAtual = pagina;

                renderizarHistoricoPagina();

            }

        }

        function limparFiltrosHistorico() {

            document.getElementById('filtroTipoAcao').value = 'todos';

            document.getElementById('filtroUsuarioHistorico').value = '';

            document.getElementById('filtroDataInicio').value = '';

            document.getElementById('filtroDataFim').value = '';

            aplicarFiltroHistorico();

        }

        function converterDataExcel(valor) {

            if (!valor || valor === '') return null;

            // Se for número (formato Excel - dias desde 01/01/1900)
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

                return null;

            }

            return null;

        }

        // ============================================

        // FUNÇÃO DE IMPORTAÇÃO EXCEL (OTIMIZADA - MAIS RÁPIDA)

        // ============================================

        async function processarImportacaoComFeedback(jsonData) {

            try {

                if (!jsonData || jsonData.length === 0) {

                    fecharLoadingImportacao();

                    mostrarErroImportacao('Nenhum dado encontrado no arquivo!');

                    return;

                }

                atualizarLoadingMensagem('Analisando arquivo...', 'Total de linhas: ' + jsonData.length);

                const mesAtual = new Date().getMonth() + 1;

                const anoAtual = new Date().getFullYear();

                // MODAL SIMPLIFICADO - SEM EMOJIS

                const confirmHtml = `

            <div id="modalConfirmReplace" class="modal-overlay" style="display: flex; z-index: 10006;">

                <div class="modal-content" style="max-width: 450px; text-align: center;">

                    <h3 style="color: #0F3B6F; margin-bottom: 15px;">Confirmar Importacao</h3>

                    <p style="margin-bottom: 15px; color: #334155;">

                        Foram encontrados <strong>${jsonData.length}</strong> registros.

                    </p>

                    <p style="margin-bottom: 25px; font-size: 0.9rem; color: #DC3545;">

                        Atencao: Esta acao ira <strong>SUBSTITUIR</strong> todos os dados de recebimento do mes atual.

                    </p>

                    <div class="modal-actions" style="justify-content: center; gap: 15px; display: flex; flex-wrap: wrap;">

                        <button id="confirmReplace" class="btn-modal-save" style="background: #DC3545; padding: 12px 28px;">Confirmar</button>

                        <button id="cancelImport" class="btn-modal-cancel" style="padding: 12px 28px;">Cancelar</button>

                    </div>

                </div>

            </div>

        `;

                document.body.insertAdjacentHTML('beforeend', confirmHtml);

                // AGUARDAR CONFIRMACAO DO USUARIO

                const confirmar = await new Promise((resolve) => {

                    const replaceBtn = document.getElementById('confirmReplace');

                    const cancelBtn = document.getElementById('cancelImport');

                    if (replaceBtn) {

                        replaceBtn.onclick = () => {

                            document.getElementById('modalConfirmReplace').remove();

                            resolve(true);

                        };

                    }

                    if (cancelBtn) {

                        cancelBtn.onclick = () => {

                            document.getElementById('modalConfirmReplace').remove();

                            fecharLoadingImportacao();

                            resolve(false);

                        };

                    }

                });

                if (!confirmar) return;

                // Criar indice rapido de usuarios (mapa de nome -> usuario)

                const usuarioIndex = new Map();

                for (const u of usuarios) {

                    if (u.nome) {

                        let nomeNormalizado = u.nome.toLowerCase().trim();

                        usuarioIndex.set(nomeNormalizado, u);

                        let nomeSemUnderline = nomeNormalizado.replace(/[_\s]/g, '');

                        if (nomeSemUnderline !== nomeNormalizado) {

                            usuarioIndex.set(nomeSemUnderline, u);

                        }

                    }

                    if (u.login) {

                        let loginNormalizado = u.login.toLowerCase().trim();

                        usuarioIndex.set(loginNormalizado, u);

                    }

                }

                // Processamento rapido em memoria

                atualizarLoadingMensagem('Processando registros...', '0/' + jsonData.length);

                // Mapa para acumular totais por operador

                const totaisPorUsuario = new Map();

                for (let i = 0; i < jsonData.length; i++) {

                    const row = jsonData[i];

                    const cobradora = row['Cobradora'] || row['cobradora'] || row['Operador'] || row['operador'] || '';

                    const recebidoStr = row['Recebido'] || row['recebido'] || row['Valor'] || row['valor'] || '0';

                    // 🔥 LEITURA DA COLUNA DE TIPO COM MAIS VARIAÇÕES (PRIORIDADE PARA "Tipo comissão" com ç)

                    const tipoComissao = row['Tipo comissão'] || row['Tipo comissao'] || row['tipo_comissao'] || row['TipoComissao'] || row['Tipo'] || row['tipo'] || row['Comissão'] || row['comissao'] || '';

                    const cliente = row['Cliente'] || row['cliente'] || '';

                    const nrDocumento = row['NrDocumento'] || row['Nr Documento'] || row['nr_documento'] || row['Titulo'] || row['Titulo'] || '';

                    const parcela = row['Parcela'] || row['parcela'] || '';

                    const dtPgtoRaw = row['DtPgto'] || row['Dt Pgto'] || row['dt_pgto'] || '';

                    let tpDoc = '';

                    // Tenta ler de várias colunas

                    if (row['TpDoc'] !== undefined && row['TpDoc'] !== null && row['TpDoc'] !== '') {

                        tpDoc = String(row['TpDoc']).trim();

                    } else if (row['tp_doc'] !== undefined && row['tp_doc'] !== null && row['tp_doc'] !== '') {

                        tpDoc = String(row['tp_doc']).trim();

                    } else if (row['TipoDoc'] !== undefined && row['TipoDoc'] !== null && row['TipoDoc'] !== '') {

                        tpDoc = String(row['TipoDoc']).trim();

                    } else if (row['Tipo Doc'] !== undefined && row['Tipo Doc'] !== null && row['Tipo Doc'] !== '') {

                        tpDoc = String(row['Tipo Doc']).trim();

                    } else if (row['Forma Pagamento'] !== undefined && row['Forma Pagamento'] !== null && row['Forma Pagamento'] !== '') {

                        tpDoc = String(row['Forma Pagamento']).trim();

                    } else if (row['FormaPgto'] !== undefined && row['FormaPgto'] !== null && row['FormaPgto'] !== '') {

                        tpDoc = String(row['FormaPgto']).trim();

                    } else if (row['forma_pagamento'] !== undefined && row['forma_pagamento'] !== null && row['forma_pagamento'] !== '') {

                        tpDoc = String(row['forma_pagamento']).trim();

                    }

                    // Normalização: remover espaços extras, acentos e converter para maiúsculo

                    if (tpDoc) {

                        tpDoc = tpDoc.replace(/\s+/g, ' ').trim();

                        tpDoc = tpDoc.replace(/NEGOCIAÇÃO/g, 'NEGOCIACAO')

                            .replace(/AUTOMÁTICO/g, 'AUTOMATICO')

                            .replace(/BANCÁRIO/g, 'BANCARIO')

                            .toUpperCase();

                    }

                    // Se ficou vazio, define como CARTÃO (padrão)

                    if (!tpDoc || tpDoc === '' || tpDoc === 'NULL') {

                        tpDoc = 'CARTAO';

                    } else {

                        // Aplica o mapa para padronizar

                        tpDoc = TIPO_DOC_MAP[tpDoc] || 'CARTAO';

                    }

                    if (tpDoc) {

                        // Remove espaços extras

                        tpDoc = tpDoc.replace(/\s+/g, ' ').trim();

                        // Normaliza "BOLETO NEGOCIAÇÃO" para "BOLETO NEGOCIACAO" (sem acento)

                        tpDoc = tpDoc.replace(/NEGOCIAÇÃO/g, 'NEGOCIACAO');

                        // Normaliza "PIX AUTOMÁTICO" para "PIX AUTOMATICO"

                        tpDoc = tpDoc.replace(/AUTOMÁTICO/g, 'AUTOMATICO');

                        // Normaliza "BOLETO BANCÁRIO" para "BOLETO BANCARIO"

                        tpDoc = tpDoc.replace(/BANCÁRIO/g, 'BANCARIO');

                    }

                    const dtPgto = converterDataExcel(dtPgtoRaw);

                    if (!cobradora) continue;

                    let valorRecebido = 0;

                    if (typeof recebidoStr === 'string') {

                        valorRecebido = parseMoneyToNumber(recebidoStr);

                    } else if (typeof recebidoStr === 'number') {

                        valorRecebido = recebidoStr;

                    } else {

                        valorRecebido = Number(recebidoStr) || 0;

                    }

                    if (valorRecebido === 0) continue;

                    let nomeNormalizado = cobradora.toLowerCase().trim();

                    let usuario = usuarioIndex.get(nomeNormalizado);

                    if (!usuario) {

                        const nomeSemUnderline = nomeNormalizado.replace(/[_\s]/g, '');

                        usuario = usuarioIndex.get(nomeSemUnderline);

                    }

                    if (!usuario) continue;

                    // 🔥 DIFERENCIAÇÃO: "Integral" → Direto | "Extra" → Extra

                    const tipoNormalizado = String(tipoComissao || '').trim().toLowerCase();

                    let valorDireto = 0, valorExtra = 0;

                    // Se contém "extra" → Extra, senão → Direto (inclui "Integral")

                    if (tipoNormalizado.includes('extra')) {

                        valorExtra = valorRecebido;

                    } else {

                        valorDireto = valorRecebido;

                    }

                    if (!totaisPorUsuario.has(usuario.id)) {

                        totaisPorUsuario.set(usuario.id, {

                            usuario_id: usuario.id,

                            operador_nome: usuario.nome,

                            direto: 0,

                            extra: 0,

                            recebido: 0,

                            registros: []

                        });

                    }

                    const acc = totaisPorUsuario.get(usuario.id);

                    acc.direto += valorDireto;

                    acc.extra += valorExtra;

                    acc.recebido += valorRecebido;

                    // 🔥 ADICIONE O tp_doc AQUI

                    acc.registros.push({

                        cliente: cliente,

                        nr_documento: nrDocumento,

                        parcela: parcela,

                        data_pagamento: dtPgto,

                        valor_recebido: valorRecebido,

                        tipo_comissao: tipoComissao,

                        tp_doc: tpDoc,  // ← ESSA É A LINHA QUE ESTÁ FALTANDO!

                        direto: valorDireto,

                        extra: valorExtra

                    });

                    // Atualizar progresso a cada 5000 registros (menos frequente)

                    if ((i + 1) % 5000 === 0) {

                        atualizarLoadingMensagem('Processando registros...', (i + 1) + '/' + jsonData.length);

                        await new Promise(r => setTimeout(r, 1));

                    }

                }

                if (totaisPorUsuario.size === 0) {

                    fecharLoadingImportacao();

                    mostrarErroImportacao('Nenhum operador cadastrado encontrado no arquivo!');

                    return;

                }

                // PREPARAR PARA BULK INSERT

                const totalRegistros = Array.from(totaisPorUsuario.values()).reduce((sum, t) => sum + t.registros.length, 0);

                atualizarLoadingMensagem('Salvando em lote...', '0/' + totalRegistros + ' registros');

                // DELETAR registros antigos do mes/ano para os usuarios envolvidos (em paralelo)

                atualizarLoadingMensagem('Removendo dados antigos...', '');

                const userIds = Array.from(totaisPorUsuario.keys());

                // 🔥 DELETAR EM PARALELO (mais rápido)

                const deletePromises = userIds.map(userId =>

                    fetch(`${SUPABASE_URL}/rest/v1/recebimentos?usuario_id=eq.${userId}&mes=eq.${mesAtual}&ano=eq.${anoAtual}`, {

                        method: 'DELETE',

                        headers: {

                            'apikey': SUPABASE_ANON_KEY,

                            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`

                        }

                    }).catch(e => console.warn('Erro ao limpar registros:', e))

                );

                await Promise.all(deletePromises);

                // SALVAR EM LOTE - BATCH MAIOR (200 registros por vez)

                let totalSalvos = 0;

                const todosRegistros = [];

                for (const acc of totaisPorUsuario.values()) {

                    for (const reg of acc.registros) {

                        todosRegistros.push({

                            usuario_id: acc.usuario_id,

                            operador_nome: acc.operador_nome,

                            cliente: reg.cliente || '',

                            nr_documento: reg.nr_documento || '',

                            parcela: reg.parcela || '',

                            data_pagamento: reg.data_pagamento,

                            valor_recebido: reg.valor_recebido,

                            tipo_comissao: reg.tipo_comissao || '',

                            tp_doc: reg.tp_doc || '',  // 🔥 VERIFIQUE SE ESTÁ AQUI

                            direto: reg.direto,

                            extra: reg.extra,

                            mes: mesAtual,

                            ano: anoAtual

                        });

                    }

                }

                // 🔥 FUNÇÃO DE INSERT MAIS RÁPIDA (sem retorno JSON)

                async function insertRapido(table, data) {

                    try {

                        const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {

                            method: 'POST',

                            headers: {

                                'apikey': SUPABASE_ANON_KEY,

                                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,

                                'Content-Type': 'application/json',

                                'Prefer': 'return=minimal'  // ← SEM RETORNO JSON, MAIS RÁPIDO

                            },

                            body: JSON.stringify(data)

                        });

                        return res.ok;

                    } catch (e) {

                        return false;

                    }

                }

                // BATCH BULK INSERT: 200 registros por requisição direta
                const BATCH_SIZE = 200;

                for (let i = 0; i < todosRegistros.length; i += BATCH_SIZE) {

                    const batch = todosRegistros.slice(i, i + BATCH_SIZE);

                    try {

                        const res = await fetch(`${SUPABASE_URL}/rest/v1/recebimentos`, {

                            method: 'POST',

                            headers: {

                                'apikey': SUPABASE_ANON_KEY,

                                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,

                                'Content-Type': 'application/json',

                                'Prefer': 'return=minimal'

                            },

                            body: JSON.stringify(batch)

                        });

                        if (res.ok) {

                            totalSalvos += batch.length;

                        } else {

                            // Fallback linha a linha se o lote falhar
                            for (const reg of batch) {

                                const ok = await insertRapido('recebimentos', reg);

                                if (ok) totalSalvos++;

                            }

                        }

                    } catch (e) {

                        for (const reg of batch) {

                            const ok = await insertRapido('recebimentos', reg);

                            if (ok) totalSalvos++;

                        }

                    }

                    const processados = Math.min(i + BATCH_SIZE, todosRegistros.length);

                    atualizarLoadingMensagem('Salvando registros...', processados + '/' + todosRegistros.length);

                    await new Promise(r => setTimeout(r, 5));

                }

                // ATUALIZAR TOTAIS DOS OPERADORES NAS METAS
                atualizarLoadingMensagem('Atualizando totais dos operadores...', '');

                for (const acc of totaisPorUsuario.values()) {

                    const metaExistente = metas.find(m => String(m?.usuario_id) === String(acc.usuario_id) && m?.mes === mesAtual && m?.ano === anoAtual);

                    await updateMeta(acc.usuario_id, mesAtual, anoAtual, {

                        direto: acc.direto,

                        extra: acc.extra,

                        recebido: acc.recebido

                    }, metaExistente?.id);

                }

                await registrarHistorico('edicao', 'Importacao realizada: ' + totaisPorUsuario.size + ' operadores, ' + totalSalvos + ' registros');

                await atualizarDadosImediatos();

                const totalImportado = Array.from(totaisPorUsuario.values()).reduce((sum, t) => sum + t.recebido, 0);

                fecharLoadingImportacao();

                mostrarSucessoImportacao(

                    'Importacao concluida!',

                    totalSalvos + ' registros | ' + totaisPorUsuario.size + ' operadores | ' + formatMoney(totalImportado)

                );

            } catch (error) {

                console.error('Erro ao processar importacao:', error);

                fecharLoadingImportacao();

                mostrarErroImportacao('Erro: ' + (error.message || 'Verifique o formato do arquivo'));

            }

        }

        // ============================================

        // FUNÇÕES DE DRAG AND DROP COM SCROLL AUTOMÁTICO

        // ============================================

        function startAutoScroll() {

            if (scrollIntervalDrag) clearInterval(scrollIntervalDrag);

            scrollIntervalDrag = setInterval(() => {

                const mouseY = window.mouseY || 0;

                const windowHeight = window.innerHeight;

                if (mouseY < SCROLL_ZONE_HEIGHT) {

                    const speed = Math.max(5, (SCROLL_ZONE_HEIGHT - mouseY) / 5);

                    window.scrollBy(0, -speed);

                } else if (mouseY > windowHeight - SCROLL_ZONE_HEIGHT) {

                    const distanceFromBottom = windowHeight - mouseY;

                    const speed = Math.max(5, (SCROLL_ZONE_HEIGHT - distanceFromBottom) / 5);

                    window.scrollBy(0, speed);

                }

            }, 16);

        }

        function stopAutoScroll() {

            if (scrollIntervalDrag) {

                clearInterval(scrollIntervalDrag);

                scrollIntervalDrag = null;

            }

        }

        function dragStart(e) {

            const card = e.target.closest('.operador-mini-card');

            if (!card) return;

            const nomeElement = card.querySelector('.nome');

            let nomeCompleto = '';

            if (nomeElement) {

                let texto = nomeElement.innerText;

                nomeCompleto = texto

                    .replace(/⭐/g, '')

                    .replace(/📁/g, '')

                    .replace(/\n/g, ' ')

                    .replace(/\d+\.?\d*%/g, '')

                    .replace(/Ativo|Inativo|Desligado/g, '')

                    .trim();

            }

            draggedOperador = {

                id: card.getAttribute('data-id'),

                nome: nomeCompleto,

                classeOrigem: card.getAttribute('data-classe')

            };

            e.dataTransfer.setData('text/plain', JSON.stringify(draggedOperador));

            card.classList.add('dragging');

            startAutoScroll();

        }

        function dragEnd(e) {

            e.target.closest('.operador-mini-card')?.classList.remove('dragging');

            draggedOperador = null;

            stopAutoScroll();

        }

        function dragOver(e) {

            e.preventDefault();

            window.mouseY = e.clientY;

        }

        function dragEnter(e) {

            e.preventDefault();

            this.classList.add('drag-over');

        }

        function dragLeave(e) {

            this.classList.remove('drag-over');

        }

        function fecharModalMovimento() {

            const modal = document.getElementById('modalMovimento');

            if (modal) modal.remove();

        }

        async function confirmarMovimento(nomeOperador, classeOrigem, classeDestino) {

            fecharModalMovimento();

            try {

                showToast(' Processando...');

                const nomeLimpo = nomeOperador

                    .replace(/\n/g, ' ')

                    .replace(/\d+\.?\d*%/g, '')

                    .replace(/Ativo|Inativo|Desligado/g, '')

                    .trim();

                const usuario = usuarios.find(u => {

                    if (!u || !u.nome) return false;

                    const nomeUsuario = u.nome.toLowerCase().trim();

                    const nomeBusca = nomeLimpo.toLowerCase().trim();

                    if (nomeUsuario === nomeBusca) return true;

                    if (nomeUsuario.includes(nomeBusca) || nomeBusca.includes(nomeUsuario)) return true;

                    if (u.login && u.login.toLowerCase().trim() === nomeBusca) return true;

                    return false;

                });

                if (!usuario) {

                    showToast(` Operador "${nomeLimpo}" não encontrado!`);

                    return;

                }

                if (usuario.classe === classeDestino) {

                    showToast(`️ ${usuario.nome} já está na classe ${classeDestino}!`);

                    return;

                }

                await updateIn('usuarios', usuario.id, { classe: classeDestino });

                await registrarHistorico('movimentacao', `Operador "${usuario.nome}" movido da classe "${classeOrigem}" para "${classeDestino}"`);

                await carregarDados();

                if (currentUser?.cargo === 'gestor' || currentUser?.cargo === 'supervisor' || currentUser?.cargo === 'elite') {

                    carregarAdminReformuladoGestor();

                    carregarOperadoresTabGestor();

                    carregarSupervisoresGestor();

                    carregarEquipesTabGestor();

                }

                carregarDashboard();

                showToast(` ${usuario.nome} movido para ${classeDestino} com sucesso!`);

            } catch (error) {

                console.error('Erro ao mover operador:', error);

                showToast(' Erro ao mover operador. Tente novamente.');

            }

        }

        function mostrarModalConfirmacaoMovimento(operadorData, classeDestino) {

            const modalHtml = `

            <div class="modal-overlay" id="modalMovimento" style="display: flex;">

                <div class="modal-content" style="max-width: 450px; text-align: center;">

                    <div style="font-size: 48px; margin-bottom: 20px;"></div>

                    <h3 style="color: #0F3B6F; margin-bottom: 15px;">Mover Operador</h3>

                    <p style="margin-bottom: 25px; color: #334155;">

                        Deseja mover o operador<br>

                        <strong style="color: #1E6DC3; font-size: 1.2rem;">${operadorData.nome}</strong><br>

                        da classe <strong>${operadorData.classeOrigem}</strong><br>

                        para a classe <strong>${classeDestino}</strong>?

                    </p>

                    <div class="modal-actions" style="justify-content: center; display: flex; gap: 15px;">

                        <button class="btn-modal-cancel" onclick="fecharModalMovimento()" style="padding: 12px 24px; background: #E2E8F0; border: none; border-radius: 40px; cursor: pointer; font-weight: 600;">Cancelar</button>

                        <button class="btn-modal-save" onclick="confirmarMovimento('${operadorData.nome.replace(/'/g, "\\'")}', '${operadorData.classeOrigem}', '${classeDestino}')" style="padding: 12px 24px; background: #1E6DC3; color: white; border: none; border-radius: 40px; cursor: pointer; font-weight: 600;">Confirmar</button>

                    </div>

                </div>

            </div>

        `;

            document.body.insertAdjacentHTML('beforeend', modalHtml);

        }

        async function drop(e) {

            e.preventDefault();

            this.classList.remove('drag-over');

            const classeDestino = this.getAttribute('data-classe');

            if (!classeDestino) return;

            let operadorData;

            try {

                operadorData = JSON.parse(e.dataTransfer.getData('text/plain'));

            } catch {

                operadorData = draggedOperador;

            }

            if (!operadorData || !operadorData.nome) {

                showToast(' Erro ao identificar o operador!');

                return;

            }

            if (operadorData.classeOrigem === classeDestino) {

                showToast('️ O operador já está nesta classe!');

                return;

            }

            mostrarModalConfirmacaoMovimento(operadorData, classeDestino);

        }

        function setupDragAndDrop() {

            const dragHandles = document.querySelectorAll('.drag-handle');

            const classCards = document.querySelectorAll('.admin-class-card');

            dragHandles.forEach(handle => {

                handle.removeEventListener('dragstart', dragStart);

                handle.removeEventListener('dragend', dragEnd);

                handle.addEventListener('dragstart', dragStart);

                handle.addEventListener('dragend', dragEnd);

            });

            classCards.forEach(card => {

                card.removeEventListener('dragover', dragOver);

                card.removeEventListener('dragenter', dragEnter);

                card.removeEventListener('dragleave', dragLeave);

                card.removeEventListener('drop', drop);

                card.addEventListener('dragover', dragOver);

                card.addEventListener('dragenter', dragEnter);

                card.addEventListener('dragleave', dragLeave);

                card.addEventListener('drop', drop);

            });

            document.removeEventListener('mouseup', stopAutoScroll);

            document.addEventListener('mouseup', stopAutoScroll);

            document.removeEventListener('mousemove', function (e) { if (draggedOperador) window.mouseY = e.clientY; });

            document.addEventListener('mousemove', function (e) { if (draggedOperador) window.mouseY = e.clientY; });

        }

        // ============================================

        // FUNÇÕES PARA SALVAR E CARREGAR RECEBIMENTOS

        // ============================================

        async function salvarRegistrosRecebimentos(usuarioId, registros) {

            try {

                if (!usuarioId || !registros || registros.length === 0) return;

                for (const reg of registros) {

                    await insertInto('recebimentos', {

                        usuario_id: usuarioId,

                        operador_nome: reg.operadorNome || reg.operador_nome || '',

                        cliente: reg.cliente || '',

                        titulo: reg.titulo || '',

                        parcela: reg.parcela || '',

                        data_pagamento: reg.dataPagamento || reg.dtPgto || null,

                        valor_recebido: reg.valor || reg.recebido || 0,

                        tipo_comissao: reg.tipoComissao || reg.tipo_comissao || '',

                        direto: reg.direto || 0,

                        extra: reg.extra || 0,

                        data_ligacao: reg.dataLigacao || reg.dtLig || ''

                    });

                }

            } catch (error) {

                console.error('Erro ao salvar registros:', error);

            }

        }

        // ============================================

        // FUNÇÃO OTIMIZADA PARA CARREGAR RECEBIMENTOS (SEM COUNT)

        // ============================================

        async function carregarRegistrosRecebimentos(usuarioId, mostrarLoading = true) {

            usuarioId = usuarioId || null;

            // Mostrar loading se solicitado

            if (mostrarLoading) {

                mostrarLoadingGlobal('Carregando dados...');

            }

            try {

                const LIMITE_POR_REQUISICAO = 1000;

                let todosRegistros = [];

                let pagina = 0;

                let temMais = true;

                let totalCarregado = 0;

                // 🔥 Buscar em paralelo com 5 requisições simultâneas

                while (temMais) {

                    const promises = [];

                    const PAGINAS_PARALELAS = 5;

                    // Criar lote de promessas

                    for (let i = 0; i < PAGINAS_PARALELAS; i++) {

                        const offset = (pagina + i) * LIMITE_POR_REQUISICAO;

                        let url = SUPABASE_URL + '/rest/v1/recebimentos?select=*&order=data_pagamento.desc&limit=' + LIMITE_POR_REQUISICAO + '&offset=' + offset;

                        if (usuarioId) {

                            url += '&usuario_id=eq.' + usuarioId;

                        }

                        const promise = fetch(url, {

                            headers: {

                                'apikey': SUPABASE_ANON_KEY,

                                'Authorization': 'Bearer ' + SUPABASE_ANON_KEY

                            }

                        }).then(async res => {

                            if (!res.ok) {

                                return [];

                            }

                            return res.json();

                        }).catch(() => []);

                        promises.push(promise);

                    }

                    // Aguardar todas as promessas do lote

                    const resultados = await Promise.all(promises);

                    // Processar resultados

                    let encontrouDados = false;

                    for (const data of resultados) {

                        if (data && data.length > 0) {

                            todosRegistros = todosRegistros.concat(data);

                            totalCarregado += data.length;

                            encontrouDados = true;

                        }

                    }

                    // Se algum lote retornou menos que o limite, significa que acabou

                    const algumLoteIncompleto = resultados.some(data => data && data.length > 0 && data.length < LIMITE_POR_REQUISICAO);

                    if (!encontrouDados || algumLoteIncompleto) {

                        temMais = false;

                    } else {

                        pagina += PAGINAS_PARALELAS;

                    }

                    // Atualizar progresso (estimativa)

                    const progresso = Math.min(Math.round((pagina / (pagina + 1)) * 100), 99);

                    atualizarLoadingProgresso(`Carregando ${totalCarregado} registros...`, progresso);

                    // Se já carregou muitos registros, para (segurança)

                    if (todosRegistros.length > 50000) {

                        temMais = false;

                    }

                }

                if (mostrarLoading) fecharLoadingGlobal();

                return todosRegistros;

            } catch (error) {

                if (mostrarLoading) fecharLoadingGlobal();

                return [];

            }

        }

        let loadingOverlayAtivo = false;

        function mostrarLoadingGlobal(mensagem = 'Carregando dados...') {

            // Se já existe um loading, apenas atualiza a mensagem

            if (loadingOverlayAtivo) {

                const msgEl = document.getElementById('loadingGlobalMessage');

                if (msgEl) msgEl.textContent = mensagem;

                return;

            }

            const overlay = document.createElement('div');

            overlay.id = 'loadingGlobalOverlay';

            overlay.style.cssText = `

        position: fixed;

        inset: 0;

        background: rgba(0, 0, 0, 0.7);

        backdrop-filter: blur(8px);

        display: flex;

        align-items: center;

        justify-content: center;

        z-index: 99999;

        animation: fadeIn 0.3s ease;

    `;

            overlay.innerHTML = `

        <div style="

            background: #1F2A44;

            border-radius: 24px;

            padding: 40px 50px;

            display: flex;

            flex-direction: column;

            align-items: center;

            gap: 20px;

            box-shadow: 0 20px 60px rgba(0,0,0,0.5);

            border: 1px solid rgba(255,255,255,0.1);

            min-width: 320px;

            max-width: 500px;

        ">

            <div style="

                width: 60px;

                height: 60px;

                border: 4px solid rgba(255,255,255,0.1);

                border-top-color: #1E6DC3;

                border-radius: 50%;

                animation: spin 0.8s linear infinite;

            "></div>

            <div style="

                color: white;

                font-size: 1.1rem;

                font-weight: 500;

                text-align: center;

            " id="loadingGlobalMessage">${mensagem}</div>

            <div style="

                width: 100%;

                height: 4px;

                background: rgba(255,255,255,0.1);

                border-radius: 4px;

                overflow: hidden;

            ">

                <div id="loadingGlobalProgress" style="

                    width: 0%;

                    height: 100%;

                    background: linear-gradient(90deg, #1E6DC3, #28A745);

                    border-radius: 4px;

                    transition: width 0.3s ease;

                "></div>

            </div>

            <div style="

                color: rgba(255,255,255,0.5);

                font-size: 0.75rem;

            " id="loadingGlobalSub">Aguarde...</div>

        </div>

    `;

            // Adicionar estilos de animação se não existirem

            if (!document.getElementById('loadingGlobalStyles')) {

                const styles = document.createElement('style');

                styles.id = 'loadingGlobalStyles';

                styles.textContent = `

            @keyframes fadeIn {

                from { opacity: 0; }

                to { opacity: 1; }

            }

            @keyframes spin {

                to { transform: rotate(360deg); }

            }

        `;

                document.head.appendChild(styles);

            }

            document.body.appendChild(overlay);

            loadingOverlayAtivo = true;

        }

        function atualizarLoadingProgresso(mensagem, progresso = null) {

            const msgEl = document.getElementById('loadingGlobalMessage');

            const progressEl = document.getElementById('loadingGlobalProgress');

            const subEl = document.getElementById('loadingGlobalSub');

            if (msgEl) msgEl.textContent = mensagem;

            if (progressEl && progresso !== null) {

                progressEl.style.width = Math.min(progresso, 100) + '%';

            }

            if (subEl) {

                subEl.textContent = progresso !== null ? `${Math.min(progresso, 100)}% concluído` : 'Aguarde...';

            }

        }

        function fecharLoadingGlobal() {

            const overlay = document.getElementById('loadingGlobalOverlay');

            if (overlay) {

                overlay.style.opacity = '0';

                overlay.style.transition = 'opacity 0.3s ease';

                setTimeout(() => {

                    overlay.remove();

                    loadingOverlayAtivo = false;

                }, 300);

            }

            loadingOverlayAtivo = false;

        }

        // ============================================

        // FUNÇÃO PARA AGRUPAR REGISTROS POR DOCUMENTO + DATA

        // ============================================

        function agruparRegistrosPorDocumento(registros) {

            const mapaGrupos = new Map();

            for (const reg of registros) {

                const nrDoc = (reg.nr_documento || reg.NrDocumento || reg.titulo || '').toString().trim();

                const dataPgto = reg.data_pagamento || '';

                const usuarioId = reg.usuario_id;

                // 🔥 ADICIONAR TIPO DE DOCUMENTO NA CHAVE PARA EVITAR MISTURAR TIPOS

                const tipoDoc = (reg.tp_doc || 'CARTAO').toString().trim().toUpperCase();

                const chave = `${usuarioId}|${nrDoc}|${dataPgto}|${tipoDoc}`;

                if (mapaGrupos.has(chave)) {

                    const existente = mapaGrupos.get(chave);

                    existente.valor_recebido += reg.valor_recebido || 0;

                    existente.direto += reg.direto || 0;

                    existente.extra += reg.extra || 0;

                    existente.quantidade = (existente.quantidade || 1) + 1;

                } else {

                    mapaGrupos.set(chave, {

                        ...reg,

                        valor_recebido: reg.valor_recebido || 0,

                        direto: reg.direto || 0,

                        extra: reg.extra || 0,

                        quantidade: 1

                    });

                }

            }

            return Array.from(mapaGrupos.values());

        }

        // ========== FUNÇÕES DO CHECKLIST ==========

        function getChecklistKey() {

            return `checklist_${currentUser?.id || 0}_${new Date().getMonth() + 1}_${new Date().getFullYear()}`;

        }

        function getChecklistStatus(nrDocumento, dataPagamento, valor) {

            const key = getChecklistKey();

            const checklist = JSON.parse(localStorage.getItem(key) || '{}');

            const itemKey = `${nrDocumento}|${dataPagamento}|${valor}`;

            return checklist[itemKey] || false;

        }

        function setChecklistStatus(nrDocumento, dataPagamento, valor, checked) {

            const key = getChecklistKey();

            const checklist = JSON.parse(localStorage.getItem(key) || '{}');

            const itemKey = `${nrDocumento}|${dataPagamento}|${valor}`;

            if (checked) checklist[itemKey] = true;

            else delete checklist[itemKey];

            localStorage.setItem(key, JSON.stringify(checklist));

        }

        window.setChecklistStatus = setChecklistStatus;

        // ============================================

        // FUNÇÃO PARA GERAR LINHAS DA TABELA ANALÍTICA

        // ============================================

        function gerarLinhasAnaliticoAgrupado(registros, isOperador) {

            if (!registros || registros.length === 0) {

                const colspan = isOperador ? 10 : 9;

                return `<tr><td colspan="${colspan}" style="text-align: center; padding: 40px;"> Nenhum dado encontrado para o período selecionado. </td></tr>`;

            }

            const usuarioMap = new Map();

            for (const u of usuarios) usuarioMap.set(u.id, u);

            return registros.map(reg => {

                const tipoComissao = (reg.tipo_comissao === 'Direto' || reg.tipo_comissao === 'Integral') ? 'Direto' : (reg.tipo_comissao === 'Extra' ? 'Extra' : (reg.direto > 0 ? 'Direto' : 'Extra'));

                const tipoClass = tipoComissao === 'Direto' ? 'proj-azul' : 'proj-amarelo';

                // Exibir a data corretamente

                let dataPgtoExibicao = '-';

                let dataOriginal = '';

                if (reg.data_pagamento) {

                    dataOriginal = reg.data_pagamento;

                    if (typeof dataOriginal === 'string') {

                        let dataStr = dataOriginal.split('T')[0];

                        const partes = dataStr.split('-');

                        if (partes.length === 3) {

                            dataPgtoExibicao = `${partes[2]}/${partes[1]}/${partes[0]}`;

                        } else {

                            dataPgtoExibicao = dataStr;

                        }

                    } else if (dataOriginal instanceof Date) {

                        const ano = dataOriginal.getUTCFullYear();

                        const mes = String(dataOriginal.getUTCMonth() + 1).padStart(2, '0');

                        const dia = String(dataOriginal.getUTCDate()).padStart(2, '0');

                        dataPgtoExibicao = `${dia}/${mes}/${ano}`;

                    }

                }

                const valorRecebido = reg.valor_recebido || 0;

                const comissao = reg.direto > 0 ? reg.direto : (reg.extra > 0 ? reg.extra : valorRecebido);

                const quantidade = reg.quantidade || 1;

                const usuario = usuarioMap.get(reg.usuario_id);

                const nomeUsuario = usuario?.nome || reg.operador_nome || '-';

                const cargo = usuario?.cargo || '';

                const getCargoIcon = () => cargo === 'gestor' ? '' : (cargo === 'supervisor' ? '' : (cargo === 'elite' ? '' : ''));

                const getCargoLabel = () => cargo === 'gestor' ? 'Gestor' : (cargo === 'supervisor' ? 'Supervisor' : (cargo === 'elite' ? 'Elite' : 'Operador'));

                const nrDocumento = reg.nr_documento || reg.NrDocumento || reg.titulo || '-';

                // Usar a data original para o checklist

                const dataParaChecklist = dataOriginal.split('T')[0];

                const itemKey = `${nrDocumento}|${dataParaChecklist}|${valorRecebido}`;

                const isChecked = isOperador ? getChecklistStatus(nrDocumento, dataParaChecklist, valorRecebido) : false;

                const checkedAttr = isChecked ? 'checked' : '';

                return `

            <tr style="border-bottom: 1px solid #EDF2F7;">

                ${isOperador ? `<td style="padding: 12px; text-align: center;"><input type="checkbox" class="checklist-item" data-key="${itemKey}" ${checkedAttr} onchange="setChecklistStatus('${nrDocumento.replace(/'/g, "\\'")}', '${dataParaChecklist}', ${valorRecebido}, this.checked)">` : ''}

                <td style="padding: 12px;">

                    <strong>${getCargoIcon()} ${escapeHtml(nomeUsuario)}</strong>

                    <br><span style="font-size: 0.65rem; color: #5F7F9E;">${getCargoLabel()}</span>

                </td>

                <td style="padding: 12px;">${escapeHtml(reg.cliente || '-')}</td>

                <td style="padding: 12px;"><strong>${escapeHtml(nrDocumento)}</strong></td>

                <td style="padding: 12px;">${escapeHtml(reg.parcela || '-')}</td>

                <td style="padding: 12px; text-align: center;">${quantidade}</td>

                <td style="padding: 12px;"><span style="display: inline-block; padding: 4px 10px; border-radius: 20px; font-weight: 700; font-size: 0.75rem; background: ${tipoClass === 'proj-azul' ? '#1E6DC3' : '#FFC107'}; color: ${tipoClass === 'proj-azul' ? 'white' : '#000'};">${tipoComissao}</span></td>

                <td style="padding: 12px;">${dataPgtoExibicao}</td>

                <td style="padding: 12px; text-align: right;"><strong>${formatMoney(valorRecebido)}</strong></td>

                <td style="padding: 12px; text-align: right;">${formatMoney(comissao)}</td>

              </tr>

        `;

            }).join('');

        }

        // ============================================

        // FUNÇÃO ANALÍTICO - JANELA DE DADOS (COM SALVAR FILTROS)

        // ============================================

        window.abrirAnalitico = async function () {

            if (!currentUser) return;

            const isOperador = (currentUser.cargo === 'operador');

            let registros = [];

            if (isOperador) {

                registros = await carregarRegistrosRecebimentos(currentUser.id);

            } else {

                registros = await carregarRegistrosRecebimentos();

            }

            if (registros.length === 0) {

                showToast('Nenhum registro encontrado!');

                return;

            }

            // AGRUPAR REGISTROS

            const registrosAgrupados = agruparRegistrosPorDocumento(registros);

            let totalRecebido = 0, totalDireto = 0, totalExtra = 0;

            for (const reg of registrosAgrupados) {

                totalRecebido += reg.valor_recebido || 0;

                totalDireto += reg.direto || 0;

                totalExtra += reg.extra || 0;

            }

            // 🔥 CARREGAR FILTROS SALVOS DO LOCALSTORAGE

            const filtrosSalvos = carregarFiltrosAnalitico();

            const hoje = new Date();

            const dataHoje = hoje.toISOString().split('T')[0];

            const primeiroDiaMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);

            const dataInicioPadrao = primeiroDiaMes.toISOString().split('T')[0];

            // Usar filtros salvos ou valores padrão

            const dataInicio = filtrosSalvos?.dataInicio || dataInicioPadrao;

            const dataFim = filtrosSalvos?.dataFim || dataHoje;

            const tipoComissao = filtrosSalvos?.tipo || 'todos';

            const buscaGeral = filtrosSalvos?.busca || '';

            const todosUsuariosAtivos = usuarios.filter(u => u.status === 'ativo');

            todosUsuariosAtivos.sort((a, b) => a.nome.localeCompare(b.nome));

            // Usar variáveis globais

            analiticoDadosFiltradosGlobal = [];

            analiticoIsOperadorGlobal = isOperador;

            analiticoPaginaAtualGlobal = 1;

            const modalHtml = `

        <div id="analiticoModal" class="modal-overlay" style="z-index: 10002;">

            <div class="analitico-window" id="analiticoWindow" style="width: 85%; height: 85%; resize: both; overflow: auto; min-width: 600px; min-height: 400px; position: fixed; top: 7.5%; left: 7.5%; background: white; border-radius: 32px; display: flex; flex-direction: column; box-shadow: 0 25px 50px rgba(0,0,0,0.3);">

                <div class="analitico-header" id="analiticoHeader" style="background: linear-gradient(135deg, #0A2F44, #1A5D8F); color: white; padding: 16px 24px; display: flex; justify-content: space-between; align-items: center; cursor: move; border-radius: 32px 32px 0 0;">

                    <h3 style="margin: 0;">Dados Analíticos ${isOperador ? `- ${currentUser.nome}` : '- Visão Geral'}</h3>

                    <button class="analitico-close" onclick="fecharAnalitico()" style="background: rgba(255,255,255,0.2); border: none; color: white; font-size: 1.5rem; cursor: pointer; width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center;">✕</button>

                </div>

                <div class="analitico-content" style="flex: 1; overflow: auto; padding: 24px; background: #F8FAFE;">

                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 24px;">

                        <div style="background: linear-gradient(135deg, #1E6DC3, #0F3B6F); color: white; border-radius: 20px; padding: 20px; text-align: center;">

                            <div style="font-size: 0.75rem; opacity: 0.8;"> TOTAL RECEBIDO</div>

                            <div style="font-size: 1.8rem; font-weight: 700;" id="analiticoTotalRecebido">${formatMoney(totalRecebido)}</div>

                        </div>

                        <div style="background: linear-gradient(135deg, #28A745, #1E7B4B); color: white; border-radius: 20px; padding: 20px; text-align: center;">

                            <div style="font-size: 0.75rem; opacity: 0.8;"> TOTAL DE REGISTROS</div>

                            <div style="font-size: 1.8rem; font-weight: 700;" id="analiticoTotalRegistros">${registrosAgrupados.length}</div>

                        </div>

                        <div style="background: linear-gradient(135deg, #17A2B8, #138496); color: white; border-radius: 20px; padding: 20px; text-align; center;">

                            <div style="font-size: 0.75rem; opacity: 0.8;">DIRETO</div>

                            <div style="font-size: 1.8rem; font-weight: 700;" id="analiticoTotalDireto">${formatMoney(totalDireto)}</div>

                        </div>

                        <div style="background: linear-gradient(135deg, #FFC107, #E0A800); color: #000; border-radius: 20px; padding: 20px; text-align: center;">

                            <div style="font-size: 0.75rem; opacity: 0.8;">EXTRA</div>

                            <div style="font-size: 1.8rem; font-weight: 700;" id="analiticoTotalExtra">${formatMoney(totalExtra)}</div>

                        </div>

                    </div>

                    <div style="display: flex; gap: 15px; margin-bottom: 20px; flex-wrap: wrap; align-items: flex-end; background: white; padding: 20px; border-radius: 20px;">

    ${!isOperador ? `

    <div style="display: flex; flex-direction: column; gap: 5px; flex: 2; min-width: 250px; position: relative;">

        <label style="font-size: 0.7rem; font-weight: 700; color: #5F7F9E;">BUSCAR USUÁRIO</label>

        <input type="text" id="analiticoBuscaUsuario" placeholder="Digite o nome do usuário..." autocomplete="off" style="padding: 10px 12px; border-radius: 12px; border: 1px solid #E2E8F0; width: 100%;">

        <div id="analiticoSugestoes" style="position: absolute; top: 100%; left: 0; right: 0; background: white; border: 1px solid #E2E8F0; border-radius: 12px; max-height: 200px; overflow-y: auto; z-index: 1000; display: none; margin-top: 2px; box-shadow: 0 4px 12px rgba(0,0,0,0.1);"></div>

        <div id="analiticoUsuarioSelecionado" style="margin-top: 8px; font-size: 0.8rem; color: #1E6DC3; font-weight: 500;"></div>

    </div>

    ` : `

    <div style="display: flex; flex-direction: column; gap: 5px;">

        <label style="font-size: 0.7rem; font-weight: 700; color: #5F7F9E;">OPERADOR</label>

        <input type="text" id="analiticoFiltroOperador" value="${currentUser.nome}" readonly disabled style="padding: 10px 12px; border-radius: 12px; border: 1px solid #E2E8F0; background: #f0f0f0; cursor: not-allowed;">

    </div>

    `}

    <div style="display: flex; flex-direction: column; gap: 5px; flex: 2;">

        <label style="font-size: 0.7rem; font-weight: 700; color: #5F7F9E;"> BUSCAR (Cliente / Documento)</label>

        <input type="text" id="analiticoBuscaGeral" placeholder="Digite o nome do cliente ou número do documento..." value="${buscaGeral}" style="padding: 10px 12px; border-radius: 12px; border: 1px solid #E2E8F0;">

    </div>

    <div style="display: flex; flex-direction: column; gap: 5px;">

        <label style="font-size: 0.7rem; font-weight: 700; color: #5F7F9E;">DATA INICIAL</label>

        <input type="date" id="analiticoDataInicio" value="${dataInicio}" style="padding: 10px 12px; border-radius: 12px; border: 1px solid #E2E8F0;">

    </div>

    <div style="display: flex; flex-direction: column; gap: 5px;">

        <label style="font-size: 0.7rem; font-weight: 700; color: #5F7F9E;">DATA FINAL</label>

        <input type="date" id="analiticoDataFim" value="${dataFim}" style="padding: 10px 12px; border-radius: 12px; border: 1px solid #E2E8F0;">

    </div>

    <div style="display: flex; flex-direction: column; gap: 5px;">

        <label style="font-size: 0.7rem; font-weight: 700; color: #5F7F9E;"> TIPO COMISSÃO</label>

        <select id="analiticoTipo" style="padding: 10px 12px; border-radius: 12px; border: 1px solid #E2E8F0;">

            <option value="todos" ${tipoComissao === 'todos' ? 'selected' : ''}>Todos</option>

            <option value="direto" ${tipoComissao === 'direto' ? 'selected' : ''}>Direto/Integral</option>

            <option value="extra" ${tipoComissao === 'extra' ? 'selected' : ''}>Extra</option>

        </select>

    </div>

    <div style="display: flex; gap: 10px;">

        <button id="btnFiltrarConferidos" style="background: #17A2B8; color: white; border: none; padding: 10px 24px; border-radius: 40px; cursor: pointer; font-weight: 600;">☑️ Conferidos</button>

        <button id="btnCopiarColuna" style="background: #28A745; color: white; border: none; padding: 10px 24px; border-radius: 40px; cursor: pointer; font-weight: 600;"> Copiar Coluna</button>

        <button id="btnExportarExcel" style="background: #17A2B8; color: white; border: none; padding: 10px 24px; border-radius: 40px; cursor: pointer; font-weight: 600;">Exportar Excel</button>

        <button id="btnBuscarAnalitico" style="background: #1E6DC3; color: white; border: none; padding: 10px 24px; border-radius: 40px; cursor: pointer; font-weight: 600;">BUSCAR</button>

        <button id="btnLimparFiltros" style="background: #6C757D; color: white; border: none; padding: 10px 24px; border-radius: 40px; cursor: pointer; font-weight: 600;"> LIMPAR</button>

    </div>

</div>

                    <div style="background: white; border-radius: 20px; overflow-x: auto;">

                        <table style="width: 100%; border-collapse: collapse; font-size: 0.8rem;">

                            <thead>

    <tr style="background: #F1F5F9;">

        ${isOperador ? '<th style="width: 40px; text-align: center;"></th>' : ''}

        <th style="padding: 12px; text-align: left;">Usuário / Cargo</th>

        <th style="padding: 12px; text-align: left;">Cliente</th>

        <th style="padding: 12px; text-align: left;">Nr Documento</th>

        <th style="padding: 12px; text-align: left;">Parcela</th>

        <th style="padding: 12px; text-align: center;">Qtde</th>

        <th style="padding: 12px; text-align: left;">Tipo</th>

        <th style="padding: 12px; text-align: left;">DtPgto</th>

        <th style="padding: 12px; text-align: right;">Valor Total</th>

        <th style="padding: 12px; text-align: right;">Comissão</th>

    </tr>

</thead>

                            <tbody id="analiticoTabelaBody">

                                ${gerarLinhasAnaliticoAgrupado(registrosAgrupados, isOperador)}

                            </tbody>

                        </table>

                    </div>

                    <div id="analiticoPagination" class="pagination" style="margin-top: 20px; justify-content: center;"></div>

                    <div style="margin-top: 12px; font-size: 0.7rem; color: #5F7F9E; text-align: right; padding: 8px;">

                        ℹ️ Registros agrupados por Documento + Data de Pagamento

                    </div>

                </div>

            </div>

        </div>

    `;

            document.body.insertAdjacentHTML('beforeend', modalHtml);

            const windowDiv = document.getElementById('analiticoWindow');

            const header = document.getElementById('analiticoHeader');

            let isDragging = false, startX, startY, startLeft, startTop;

            header.addEventListener('mousedown', (e) => {

                if (e.target === header || header.contains(e.target)) {

                    isDragging = true;

                    startX = e.clientX;

                    startY = e.clientY;

                    const rect = windowDiv.getBoundingClientRect();

                    startLeft = rect.left;

                    startTop = rect.top;

                    windowDiv.style.position = 'fixed';

                    windowDiv.style.margin = '0';

                    document.body.style.userSelect = 'none';

                }

            });

            document.addEventListener('mousemove', (e) => {

                if (!isDragging) return;

                const dx = e.clientX - startX;

                const dy = e.clientY - startY;

                let newLeft = startLeft + dx;

                let newTop = startTop + dy;

                newLeft = Math.max(0, Math.min(newLeft, window.innerWidth - 100));

                newTop = Math.max(0, Math.min(newTop, window.innerHeight - 50));

                windowDiv.style.left = newLeft + 'px';

                windowDiv.style.top = newTop + 'px';

                windowDiv.style.right = 'auto';

                windowDiv.style.bottom = 'auto';

            });

            document.addEventListener('mouseup', () => {

                isDragging = false;

                document.body.style.userSelect = '';

            });

            window.analiticoRegistros = registrosAgrupados;

            window.analiticoIsOperador = isOperador;

            window.analiticoTodosUsuarios = todosUsuariosAtivos;

            if (!isOperador) {

                const inputBusca = document.getElementById('analiticoBuscaUsuario');

                const sugestoesDiv = document.getElementById('analiticoSugestoes');

                const selectedDiv = document.getElementById('analiticoUsuarioSelecionado');

                inputBusca.addEventListener('input', function () {

                    const termo = this.value.toLowerCase().trim();

                    if (termo === '') { sugestoesDiv.style.display = 'none'; return; }

                    const usuariosFiltrados = todosUsuariosAtivos.filter(u => u.nome.toLowerCase().includes(termo) || (u.login && u.login.toLowerCase().includes(termo))).slice(0, 10);

                    if (usuariosFiltrados.length === 0) { sugestoesDiv.style.display = 'none'; return; }

                    const getCargoIcon = (c) => c === 'gestor' ? '' : (c === 'supervisor' ? '' : (c === 'elite' ? '' : ''));

                    const getCargoLabel = (c) => c === 'gestor' ? 'Gestor' : (c === 'supervisor' ? 'Supervisor' : (c === 'elite' ? 'Elite' : 'Operador'));

                    sugestoesDiv.innerHTML = usuariosFiltrados.map(u => `<div class="sugestao-item" data-id="${u.id}" data-nome="${u.nome}" data-cargo="${u.cargo}" style="padding: 10px 12px; cursor: pointer; border-bottom: 1px solid #EDF2F7; display: flex; justify-content: space-between; align-items: center; transition: background 0.2s;"><div><strong>${getCargoIcon(u.cargo)} ${escapeHtml(u.nome)}</strong><span style="font-size: 0.7rem; color: #5F7F9E; margin-left: 8px;">${getCargoLabel(u.cargo)}</span></div><div style="font-size: 0.7rem; color: #94A3B8;">${u.login || ''}</div></div>`).join('');

                    document.querySelectorAll('.sugestao-item').forEach(el => {

                        el.addEventListener('click', function () {

                            const nome = this.getAttribute('data-nome');

                            const cargo = this.getAttribute('data-cargo');

                            inputBusca.value = nome;

                            window.analiticoSelectedUserId = this.getAttribute('data-id');

                            selectedDiv.innerHTML = `${cargo === 'gestor' ? '' : (cargo === 'supervisor' ? '' : (cargo === 'elite' ? '' : ''))} Usuário selecionado: <strong>${escapeHtml(nome)}</strong>`;

                            sugestoesDiv.style.display = 'none';

                        });

                        el.addEventListener('mouseenter', function () { this.style.background = '#F1F5F9'; });

                        el.addEventListener('mouseleave', function () { this.style.background = ''; });

                    });

                    sugestoesDiv.style.display = 'block';

                });

                document.addEventListener('click', function (e) { if (!inputBusca.contains(e.target) && !sugestoesDiv.contains(e.target)) { sugestoesDiv.style.display = 'none'; } });

            }

            // Evento do botão Filtrar Conferidos

            const btnFiltrar = document.getElementById('btnFiltrarConferidos');

            if (btnFiltrar) {

                btnFiltrar.addEventListener('click', () => {

                    btnFiltrar.classList.toggle('active');

                    if (btnFiltrar.classList.contains('active')) {

                        btnFiltrar.style.background = '#28A745';

                        btnFiltrar.innerHTML = '✅ Conferidos';

                    } else {

                        btnFiltrar.style.background = '#17A2B8';

                        btnFiltrar.innerHTML = '☑️ Conferidos';

                    }

                    filtrarAnaliticoAgrupado();

                });

            }

            // Evento do botão Copiar Coluna

            document.getElementById('btnCopiarColuna')?.addEventListener('click', () => {

                showToast('Clique em qualquer célula da coluna que deseja copiar');

                const tabela = document.querySelector('#analiticoModal table');

                if (!tabela) return;

                let modoSelecaoAtivo = true;

                function removerEventos() {

                    const cells = tabela.querySelectorAll('td, th');

                    cells.forEach(cell => {

                        cell.style.cursor = '';

                        cell.style.background = '';

                        cell.removeEventListener('click', handleCellClick);

                        cell.removeEventListener('mouseenter', handleMouseEnter);

                        cell.removeEventListener('mouseleave', handleMouseLeave);

                    });

                    modoSelecaoAtivo = false;

                }

                function handleMouseEnter() {

                    if (modoSelecaoAtivo) {

                        this.style.background = '#EFF6FF';

                        this.style.cursor = 'pointer';

                    }

                }

                function handleMouseLeave() {

                    if (modoSelecaoAtivo) {

                        this.style.background = '';

                    }

                }

                function handleCellClick(e) {

                    e.stopPropagation();

                    if (!modoSelecaoAtivo) return;

                    const colIndex = this.cellIndex;

                    const todasLinhas = tabela.querySelectorAll('tr');

                    const valores = [];

                    todasLinhas.forEach(linha => {

                        const celula = linha.cells[colIndex];

                        if (celula) {

                            let texto = celula.innerText.trim();

                            if (celula.querySelector('input[type="checkbox"]')) {

                                texto = celula.querySelector('input[type="checkbox"]').checked ? '' : '';

                            }

                            if (texto && texto !== '' && texto !== '-') {

                                valores.push(texto);

                            }

                        }

                    });

                    if (valores.length > 0) {

                        navigator.clipboard.writeText(valores.join('\n')).then(() => {

                            showToast(` Copiados ${valores.length} itens da coluna!`);

                        }).catch(() => {

                            showToast(' Erro ao copiar. Tente novamente.');

                        });

                    } else {

                        showToast('Nenhum dado encontrado nesta coluna.');

                    }

                    removerEventos();

                    const btn = document.getElementById('btnCopiarColuna');

                    if (btn) {

                        btn.textContent = 'Copiar Coluna';

                        btn.style.background = '#28A745';

                    }

                }

                const cells = tabela.querySelectorAll('td, th');

                cells.forEach(cell => {

                    cell.style.transition = 'background 0.2s';

                    cell.addEventListener('mouseenter', handleMouseEnter);

                    cell.addEventListener('mouseleave', handleMouseLeave);

                    cell.addEventListener('click', handleCellClick);

                });

                const btn = document.getElementById('btnCopiarColuna');

                if (btn) {

                    btn.textContent = ' Clique na coluna...';

                    btn.style.background = '#FFC107';

                    btn.style.color = '#000';

                }

                setTimeout(() => {

                    if (modoSelecaoAtivo) {

                        removerEventos();

                        const btnTimeout = document.getElementById('btnCopiarColuna');

                        if (btnTimeout) {

                            btnTimeout.textContent = 'Copiar Coluna';

                            btnTimeout.style.background = '#28A745';

                            btnTimeout.style.color = 'white';

                        }

                        showToast('Modo de seleção cancelado (tempo excedido)');

                    }

                }, 15000);

            });

            // 🔥 EVENTO DO BOTÃO BUSCAR - SALVA OS FILTROS NO LOCALSTORAGE

            document.getElementById('btnBuscarAnalitico').addEventListener('click', () => {

                // Salvar os filtros atuais

                salvarFiltrosAnalitico();

                // Aplicar os filtros

                filtrarAnaliticoAgrupado();

            });

            document.getElementById('btnLimparFiltros').addEventListener('click', () => {

                // Limpar os filtros salvos

                limparFiltrosAnaliticoSalvos();

                // Aplicar limpeza

                limparFiltrosAnaliticoAgrupado();

            });

            // Evento do botão Exportar Excel

            document.getElementById('btnExportarExcel')?.addEventListener('click', () => {

                if (!analiticoDadosFiltradosGlobal || analiticoDadosFiltradosGlobal.length === 0) {

                    showToast(' Não há dados para exportar.');

                    return;

                }

                const dadosExport = analiticoDadosFiltradosGlobal.map(reg => {

                    const usuario = usuarios.find(u => u.id === reg.usuario_id);

                    const cargo = usuario?.cargo || '';

                    const cargoLabel = cargo === 'gestor' ? 'Gestor' : (cargo === 'supervisor' ? 'Supervisor' : (cargo === 'elite' ? 'Elite' : 'Operador'));

                    return {

                        'Usuário': reg.operador_nome || '',

                        'Cargo': cargoLabel,

                        'Cliente': reg.cliente || '',

                        'Nr Documento': reg.nr_documento || '',

                        'Parcela': reg.parcela || '',

                        'Qtde Pgto': reg.quantidade || 1,

                        'Tipo Comissão': (reg.direto > 0 ? 'Direto' : 'Extra'),

                        'DtPgto': reg.data_pagamento ? new Date(reg.data_pagamento).toLocaleDateString('pt-BR') : '',

                        'Valor Total': reg.valor_recebido || 0,

                        'Comissão': (reg.direto > 0 ? reg.direto : reg.extra) || 0

                    };

                });

                const ws = XLSX.utils.json_to_sheet(dadosExport);

                const wb = XLSX.utils.book_new();

                XLSX.utils.book_append_sheet(wb, ws, 'Dados_Filtrados');

                ws['!cols'] = [

                    { wch: 25 },

                    { wch: 12 },

                    { wch: 35 },

                    { wch: 20 },

                    { wch: 10 },

                    { wch: 10 },

                    { wch: 15 },

                    { wch: 12 },

                    { wch: 18 },

                    { wch: 18 }

                ];

                const now = new Date();

                const nomeArquivo = `dados_analitico_${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}_${String(now.getHours()).padStart(2, '0')}h${String(now.getMinutes()).padStart(2, '0')}.xlsx`;

                XLSX.writeFile(wb, nomeArquivo);

                showToast(` Exportados ${dadosExport.length} registros!`);

            });

            //  APLICAR FILTROS SALVOS AUTOMATICAMENTE AO ABRIR

            const dataInicioInput = document.getElementById('analiticoDataInicio');

            const dataFimInput = document.getElementById('analiticoDataFim');

            if (dataInicioInput && dataFimInput) {

                dataInicioInput.value = dataInicio;

                dataFimInput.value = dataFim;

            }

            // Filtrar os dados com os filtros salvos

            let registrosFiltradosPorData = registrosAgrupados.filter(reg => {

                if (!reg.data_pagamento) return false;

                const dataRegistro = reg.data_pagamento.split('T')[0];

                return dataRegistro >= dataInicio && dataRegistro <= dataFim;

            });

            // Aplicar filtro de tipo

            if (tipoComissao !== 'todos') {

                registrosFiltradosPorData = registrosFiltradosPorData.filter(reg => {

                    const isDireto = (reg.direto > 0) || (reg.tipo_comissao === 'Direto') || (reg.tipo_comissao === 'Integral');

                    if (tipoComissao === 'direto') return isDireto;

                    if (tipoComissao === 'extra') return !isDireto && (reg.extra > 0 || reg.tipo_comissao === 'Extra');

                    return true;

                });

            }

            // Aplicar busca geral

            if (buscaGeral) {

                registrosFiltradosPorData = registrosFiltradosPorData.filter(reg => {

                    const cliente = (reg.cliente || '').toLowerCase();

                    const nrDoc = (reg.nr_documento || reg.NrDocumento || reg.titulo || '').toLowerCase();

                    return cliente.includes(buscaGeral.toLowerCase()) || nrDoc.includes(buscaGeral.toLowerCase());

                });

            }

            if (registrosFiltradosPorData.length === 0 && registrosAgrupados.length > 0) {

                registrosFiltradosPorData = registrosAgrupados;

                showToast('Nenhum registro encontrado com os filtros salvos. Mostrando todos.');

            }

            analiticoDadosFiltradosGlobal = registrosFiltradosPorData;

            analiticoPaginaAtualGlobal = 1;

            renderizarPaginaAnaliticoGlobal();

            let totalRecebidoFiltrado = 0, totalDiretoFiltrado = 0, totalExtraFiltrado = 0;

            for (const reg of registrosFiltradosPorData) {

                totalRecebidoFiltrado += reg.valor_recebido || 0;

                totalDiretoFiltrado += reg.direto || 0;

                totalExtraFiltrado += reg.extra || 0;

            }

            const totalRecebidoEl = document.getElementById('analiticoTotalRecebido');

            const totalRegistrosEl = document.getElementById('analiticoTotalRegistros');

            const totalDiretoEl = document.getElementById('analiticoTotalDireto');

            const totalExtraEl = document.getElementById('analiticoTotalExtra');

            if (totalRecebidoEl) totalRecebidoEl.innerHTML = formatMoney(totalRecebidoFiltrado);

            if (totalRegistrosEl) totalRegistrosEl.innerHTML = registrosFiltradosPorData.length;

            if (totalDiretoEl) totalDiretoEl.innerHTML = formatMoney(totalDiretoFiltrado);

            if (totalExtraEl) totalExtraEl.innerHTML = formatMoney(totalExtraFiltrado);

        };

        // ============================================

        // FUNÇÕES PARA SALVAR/CARREGAR FILTROS DO ANALÍTICO

        // ============================================

        function salvarFiltrosAnalitico() {

            try {

                const dataInicio = document.getElementById('analiticoDataInicio')?.value || '';

                const dataFim = document.getElementById('analiticoDataFim')?.value || '';

                const tipo = document.getElementById('analiticoTipo')?.value || 'todos';

                const busca = document.getElementById('analiticoBuscaGeral')?.value || '';

                const filtros = { dataInicio, dataFim, tipo, busca };

                localStorage.setItem(`analitico_filtros_${currentUser?.id || 0}`, JSON.stringify(filtros));

                console.log(' Filtros salvos:', filtros);

            } catch (e) {

                console.warn('Erro ao salvar filtros:', e);

            }

        }

        function carregarFiltrosAnalitico() {

            try {

                const saved = localStorage.getItem(`analitico_filtros_${currentUser?.id || 0}`);

                if (saved) {

                    const filtros = JSON.parse(saved);

                    console.log(' Filtros carregados:', filtros);

                    return filtros;

                }

            } catch (e) {

            }

            return null;

        }

        function limparFiltrosAnaliticoSalvos() {

            try {

                localStorage.removeItem(`analitico_filtros_${currentUser?.id || 0}`);

            } catch (e) {

            }

        }

        window.filtrarAnaliticoAgrupado = function () {

            let registrosFiltrados = window.analiticoRegistros || [];

            const isOperador = window.analiticoIsOperador;

            // ========== FILTRO POR CONFERIDOS ==========

            const btnFiltrar = document.getElementById('btnFiltrarConferidos');

            const filtrarConferidos = btnFiltrar ? btnFiltrar.classList.contains('active') : false;

            if (filtrarConferidos && isOperador) {

                registrosFiltrados = registrosFiltrados.filter(reg => {

                    const nrDoc = reg.nr_documento || '';

                    const dataPgto = reg.data_pagamento || '';

                    return getChecklistStatus(nrDoc, dataPgto, reg.valor_recebido);

                });

            }

            if (!isOperador) {

                const inputBusca = document.getElementById('analiticoBuscaUsuario');

                if (inputBusca && inputBusca.value.trim() !== '') {

                    const usuarioSelecionado = window.analiticoTodosUsuarios?.find(u => u.nome.toLowerCase() === inputBusca.value.toLowerCase());

                    if (usuarioSelecionado) {

                        registrosFiltrados = registrosFiltrados.filter(reg => reg.usuario_id === usuarioSelecionado.id);

                    }

                }

            }

            // 🔥 BUSCA GERAL (Cliente ou Documento)

            const buscaGeral = document.getElementById('analiticoBuscaGeral')?.value.toLowerCase() || '';

            if (buscaGeral) {

                registrosFiltrados = registrosFiltrados.filter(reg => {

                    const cliente = (reg.cliente || '').toLowerCase();

                    const nrDoc = (reg.nr_documento || reg.NrDocumento || reg.titulo || '').toLowerCase();

                    return cliente.includes(buscaGeral) || nrDoc.includes(buscaGeral);

                });

            }

            // 🔥 CORREÇÃO SIMPLIFICADA: As datas já estão em YYYY-MM-DD no banco!

            const dataInicio = document.getElementById('analiticoDataInicio')?.value;

            const dataFim = document.getElementById('analiticoDataFim')?.value;

            // 🔥 SIMPLES: Extrai apenas a data sem conversão de timezone

            function getDateOnly(dateValue) {

                if (!dateValue) return null;

                if (typeof dateValue === 'string') {

                    // Se já está no formato YYYY-MM-DD (como está no banco)

                    if (dateValue.match(/^\d{4}-\d{2}-\d{2}$/)) {

                        return dateValue;

                    }

                    // Se for ISO com T, pega só a parte da data

                    if (dateValue.includes('T')) {

                        return dateValue.split('T')[0];

                    }

                }

                return null;

            }

            if (dataInicio) {

                const antes = registrosFiltrados.length;

                registrosFiltrados = registrosFiltrados.filter(reg => {

                    if (!reg.data_pagamento) return false;

                    const dataRegistro = getDateOnly(reg.data_pagamento);

                    if (!dataRegistro) return false;

                    const resultado = dataRegistro >= dataInicio;

                    if (resultado && dataRegistro === dataInicio) {

                        console.log(` Mantido: ${dataRegistro} (cliente: ${reg.cliente}, valor: ${reg.valor_recebido})`);

                    }

                    return resultado;

                });

                console.log(`Filtro data início (>= ${dataInicio}): ${antes} → ${registrosFiltrados.length}`);

            }

            if (dataFim) {

                const antes = registrosFiltrados.length;

                registrosFiltrados = registrosFiltrados.filter(reg => {

                    if (!reg.data_pagamento) return false;

                    const dataRegistro = getDateOnly(reg.data_pagamento);

                    if (!dataRegistro) return false;

                    return dataRegistro <= dataFim;

                });

                console.log(`Filtro data fim (<= ${dataFim}): ${antes} → ${registrosFiltrados.length}`);

            }

            const tipo = document.getElementById('analiticoTipo')?.value || 'todos';

            if (tipo !== 'todos') {

                registrosFiltrados = registrosFiltrados.filter(reg => {

                    const isDireto = (reg.direto > 0) || (reg.tipo_comissao === 'Direto') || (reg.tipo_comissao === 'Integral');

                    if (tipo === 'direto') return isDireto;

                    if (tipo === 'extra') return !isDireto && (reg.extra > 0 || reg.tipo_comissao === 'Extra');

                    return true;

                });

            }

            // SALVAR OS DADOS FILTRADOS E RESETAR PÁGINA

            analiticoDadosFiltradosGlobal = registrosFiltrados;

            analiticoPaginaAtualGlobal = 1;

            renderizarPaginaAnaliticoGlobal();

            let totalRecebido = 0, totalDireto = 0, totalExtra = 0;

            for (const reg of registrosFiltrados) {

                totalRecebido += reg.valor_recebido || 0;

                totalDireto += reg.direto || 0;

                totalExtra += reg.extra || 0;

            }

            const totalRecebidoEl = document.getElementById('analiticoTotalRecebido');

            const totalRegistrosEl = document.getElementById('analiticoTotalRegistros');

            const totalDiretoEl = document.getElementById('analiticoTotalDireto');

            const totalExtraEl = document.getElementById('analiticoTotalExtra');

            if (totalRecebidoEl) totalRecebidoEl.innerHTML = formatMoney(totalRecebido);

            if (totalRegistrosEl) totalRegistrosEl.innerHTML = registrosFiltrados.length;

            if (totalDiretoEl) totalDiretoEl.innerHTML = formatMoney(totalDireto);

            if (totalExtraEl) totalExtraEl.innerHTML = formatMoney(totalExtra);

            if (dataInicio || dataFim) {

                showToast(`Filtro aplicado: ${registrosFiltrados.length} registros encontrados`);

            }

        };

        window.limparFiltrosAnaliticoAgrupado = function () {

            const isOperador = window.analiticoIsOperador;

            const registros = window.analiticoRegistros || [];

            if (registros.length === 0) return;

            let datas = registros.filter(r => r.data_pagamento).map(r => {

                const d = new Date(r.data_pagamento);

                return !isNaN(d.getTime()) ? d : null;

            }).filter(d => d !== null);

            let dataMin = datas.length > 0 ? new Date(Math.min(...datas)) : new Date();

            let dataMax = datas.length > 0 ? new Date(Math.max(...datas)) : new Date();

            const formatarDataInput = (data) => {

                const ano = data.getFullYear();

                const mes = String(data.getMonth() + 1).padStart(2, '0');

                const dia = String(data.getDate()).padStart(2, '0');

                return `${ano}-${mes}-${dia}`;

            };

            // Limpar campo de busca única

            const buscaGeralInput = document.getElementById('analiticoBuscaGeral');

            if (buscaGeralInput) buscaGeralInput.value = '';

            const tipoSelect = document.getElementById('analiticoTipo');

            if (tipoSelect) tipoSelect.value = 'todos';

            const dataInicio = document.getElementById('analiticoDataInicio');

            const dataFim = document.getElementById('analiticoDataFim');

            if (dataInicio) dataInicio.value = formatarDataInput(dataMin);

            if (dataFim) dataFim.value = formatarDataInput(dataMax);

            if (!isOperador) {

                const inputBusca = document.getElementById('analiticoBuscaUsuario');

                const selectedDiv = document.getElementById('analiticoUsuarioSelecionado');

                if (inputBusca) { inputBusca.value = ''; if (selectedDiv) selectedDiv.innerHTML = ''; }

                window.analiticoSelectedUserId = null;

            }

            // Resetar o botão de conferidos também

            const btnFiltrar = document.getElementById('btnFiltrarConferidos');

            if (btnFiltrar) {

                btnFiltrar.classList.remove('active');

                btnFiltrar.style.background = '#17A2B8';

                btnFiltrar.innerHTML = '☑️ Conferidos';

            }

            filtrarAnaliticoAgrupado();

            showToast(' Filtros limpos! Mostrando todos os registros agrupados.');

        };

        window.filtrarAnalitico = function () {

            let registrosFiltrados = window.analiticoRegistros || [];

            const isOperador = window.analiticoIsOperador;

            console.log('Filtrando registros:', registrosFiltrados.length);

            if (!isOperador) {

                const filtroOperador = document.getElementById('analiticoFiltroOperador')?.value;

                if (filtroOperador && filtroOperador !== 'todos') {

                    registrosFiltrados = registrosFiltrados.filter(reg =>

                        (reg.operador_nome || '').toLowerCase() === filtroOperador.toLowerCase()

                    );

                }

            }

            function limparFiltrosAnalitico() {

                const isOperador = window.analiticoIsOperador;

                // Limpar campo de cliente

                const clienteInput = document.getElementById('analiticoFiltroCliente');

                if (clienteInput) clienteInput.value = '';

                // Limpar tipo de comissão (voltar para "todos")

                const tipoSelect = document.getElementById('analiticoTipo');

                if (tipoSelect) tipoSelect.value = 'todos';

                // Limpar datas (voltar para a data de ontem)

                const ontem = new Date();

                ontem.setDate(ontem.getDate() - 1);

                const anoOntem = ontem.getFullYear();

                const mesOntem = String(ontem.getMonth() + 1).padStart(2, '0');

                const diaOntem = String(ontem.getDate()).padStart(2, '0');

                const dataOntem = `${anoOntem}-${mesOntem}-${diaOntem}`;

                const dataInicio = document.getElementById('analiticoDataInicio');

                const dataFim = document.getElementById('analiticoDataFim');

                if (dataInicio) dataInicio.value = dataOntem;

                if (dataFim) dataFim.value = dataOntem;

                // Se NÃO for operador, limpar também o filtro de operador (voltar para "todos")

                if (!isOperador) {

                    const operadorSelect = document.getElementById('analiticoFiltroOperador');

                    if (operadorSelect) operadorSelect.value = 'todos';

                }

                // Se for operador, o nome dele permanece bloqueado (não faz nada)

                // Aplicar os filtros limpos

                filtrarAnalitico();

                // Mostrar toast de confirmação

                showToast(' Filtros limpos!');

            }

            const filtroCliente = document.getElementById('analiticoFiltroCliente')?.value.toLowerCase() || '';

            if (filtroCliente) {

                registrosFiltrados = registrosFiltrados.filter(reg =>

                    (reg.cliente || '').toLowerCase().includes(filtroCliente)

                );

            }

            const dataInicio = document.getElementById('analiticoDataInicio')?.value;

            const dataFim = document.getElementById('analiticoDataFim')?.value;

            if (dataInicio) {

                const inicio = new Date(dataInicio);

                inicio.setHours(0, 0, 0, 0);

                registrosFiltrados = registrosFiltrados.filter(reg => {

                    const dataPgto = reg.data_pagamento ? new Date(reg.data_pagamento) : null;

                    return dataPgto && dataPgto >= inicio;

                });

            }

            if (dataFim) {

                const fim = new Date(dataFim);

                fim.setHours(23, 59, 59, 999);

                registrosFiltrados = registrosFiltrados.filter(reg => {

                    const dataPgto = reg.data_pagamento ? new Date(reg.data_pagamento) : null;

                    return dataPgto && dataPgto <= fim;

                });

            }

            const tipo = document.getElementById('analiticoTipo')?.value || 'todos';

            if (tipo !== 'todos') {

                registrosFiltrados = registrosFiltrados.filter(reg => {

                    const isDireto = (reg.direto > 0) || (reg.tipo_comissao === 'Direto') || (reg.tipo_comissao === 'Integral');

                    if (tipo === 'direto') return isDireto;

                    if (tipo === 'extra') return !isDireto && (reg.extra > 0 || reg.tipo_comissao === 'Extra');

                    return true;

                });

            }

            const tbody = document.getElementById('analiticoTabelaBody');

            if (tbody) {

                tbody.innerHTML = gerarLinhasAnaliticoCompleto(registrosFiltrados, isOperador);

            }

            let totalRecebido = 0, totalDireto = 0, totalExtra = 0;

            for (const reg of registrosFiltrados) {

                totalRecebido += reg.valor_recebido || 0;

                totalDireto += reg.direto || 0;

                totalExtra += reg.extra || 0;

            }

            const totalRecebidoEl = document.getElementById('analiticoTotalRecebido');

            const totalRegistrosEl = document.getElementById('analiticoTotalRegistros');

            const totalDiretoEl = document.getElementById('analiticoTotalDireto');

            const totalExtraEl = document.getElementById('analiticoTotalExtra');

            if (totalRecebidoEl) totalRecebidoEl.innerHTML = formatMoney(totalRecebido);

            if (totalRegistrosEl) totalRegistrosEl.innerHTML = registrosFiltrados.length;

            if (totalDiretoEl) totalDiretoEl.innerHTML = formatMoney(totalDireto);

            if (totalExtraEl) totalExtraEl.innerHTML = formatMoney(totalExtra);

        };

        window.fecharAnalitico = function () {

            const modal = document.getElementById('analiticoModal');

            if (modal) modal.remove();

        };

        // ============================================

        // FUNÇÃO PARA LIMPAR FILTROS DA JANELA ANALÍTICA

        // ============================================

        window.limparFiltrosAnalitico = function () {

            const isOperador = window.analiticoIsOperador;

            const registros = window.analiticoRegistros || [];

            if (registros.length === 0) return;

            // Calcular datas mínima e máxima dos registros

            let datas = registros.filter(r => r.data_pagamento).map(r => new Date(r.data_pagamento));

            let dataMin = datas.length > 0 ? new Date(Math.min(...datas)) : new Date();

            let dataMax = datas.length > 0 ? new Date(Math.max(...datas)) : new Date();

            const formatarDataInput = (data) => {

                return data.toISOString().split('T')[0];

            };

            // Limpar campo de cliente

            const clienteInput = document.getElementById('analiticoFiltroCliente');

            if (clienteInput) clienteInput.value = '';

            // Limpar tipo de comissão

            const tipoSelect = document.getElementById('analiticoTipo');

            if (tipoSelect) tipoSelect.value = 'todos';

            // Restaurar datas para o período completo

            const dataInicio = document.getElementById('analiticoDataInicio');

            const dataFim = document.getElementById('analiticoDataFim');

            if (dataInicio) dataInicio.value = formatarDataInput(dataMin);

            if (dataFim) dataFim.value = formatarDataInput(dataMax);

            // Se não for operador, limpar filtro de operador

            if (!isOperador) {

                const operadorSelect = document.getElementById('analiticoFiltroOperador');

                if (operadorSelect) operadorSelect.value = 'todos';

            }

            // Aplicar os filtros limpos

            filtrarAnalitico();

            showToast(' Filtros limpos! Mostrando todos os registros.');

        };

        async function calcularRecebidoBaixaAnterior(usuarioId) {

            try {

                const registros = await carregarRegistrosRecebimentos(usuarioId);

                if (!registros || registros.length === 0) {

                    return { valor: 0, mensagem: 'Nenhum registro encontrado' };

                }

                const hoje = new Date();

                const diaSemana = hoje.getDay();

                let dataInicioStr, dataFimStr;

                let diasConsiderados = [];

                const formatarData = (data) => {

                    const ano = data.getFullYear();

                    const mes = String(data.getMonth() + 1).padStart(2, '0');

                    const dia = String(data.getDate()).padStart(2, '0');

                    return `${ano}-${mes}-${dia}`;

                };

                if (diaSemana === 1) {

                    const sexta = new Date(hoje);

                    sexta.setDate(hoje.getDate() - 3);

                    const domingo = new Date(hoje);

                    domingo.setDate(hoje.getDate() - 1);

                    dataInicioStr = formatarData(sexta);

                    dataFimStr = formatarData(domingo);

                    diasConsiderados = ['Sexta-feira', 'Sábado', 'Domingo'];

                }

                else if (diaSemana === 2) {

                    const segunda = new Date(hoje);

                    segunda.setDate(hoje.getDate() - 1);

                    dataInicioStr = formatarData(segunda);

                    dataFimStr = formatarData(segunda);

                    diasConsiderados = ['Segunda-feira'];

                }

                else if (diaSemana === 3) {

                    const terca = new Date(hoje);

                    terca.setDate(hoje.getDate() - 1);

                    dataInicioStr = formatarData(terca);

                    dataFimStr = formatarData(terca);

                    diasConsiderados = ['Terça-feira'];

                }

                else if (diaSemana === 4) {

                    const quarta = new Date(hoje);

                    quarta.setDate(hoje.getDate() - 1);

                    dataInicioStr = formatarData(quarta);

                    dataFimStr = formatarData(quarta);

                    diasConsiderados = ['Quarta-feira'];

                }

                else if (diaSemana === 5) {

                    const quinta = new Date(hoje);

                    quinta.setDate(hoje.getDate() - 1);

                    dataInicioStr = formatarData(quinta);

                    dataFimStr = formatarData(quinta);

                    diasConsiderados = ['Quinta-feira'];

                }

                else if (diaSemana === 6) {

                    const sexta = new Date(hoje);

                    sexta.setDate(hoje.getDate() - 1);

                    dataInicioStr = formatarData(sexta);

                    dataFimStr = formatarData(sexta);

                    diasConsiderados = ['Sexta-feira'];

                }

                else if (diaSemana === 0) {

                    const sabado = new Date(hoje);

                    sabado.setDate(hoje.getDate() - 1);

                    dataInicioStr = formatarData(sabado);

                    dataFimStr = formatarData(sabado);

                    diasConsiderados = ['Sábado'];

                }

                let totalRecebido = 0;

                let registrosEncontrados = [];

                for (const registro of registros) {

                    if (registro.data_pagamento) {

                        const dataPgtoStr = registro.data_pagamento.split('T')[0];

                        if (dataPgtoStr >= dataInicioStr && dataPgtoStr <= dataFimStr) {

                            totalRecebido += registro.valor_recebido || 0;

                            registrosEncontrados.push(registro);

                        }

                    }

                }

                let mensagem = '';

                if (diasConsiderados.length === 1) {

                    const dataObj = new Date(dataInicioStr);

                    mensagem = `${diasConsiderados[0]} (${dataObj.toLocaleDateString('pt-BR')})`;

                } else {

                    const dataInicioObj = new Date(dataInicioStr);

                    const dataFimObj = new Date(dataFimStr);

                    mensagem = `${diasConsiderados.join(', ')} (${dataInicioObj.toLocaleDateString('pt-BR')} a ${dataFimObj.toLocaleDateString('pt-BR')})`;

                }

                if (totalRecebido === 0) {

                    mensagem += `\nNenhum recebimento encontrado.`;

                } else {

                    mensagem += `\n${registrosEncontrados.length} registro(s) encontrado(s).`;

                }

                return {

                    valor: totalRecebido,

                    mensagem: mensagem,

                    registros: registrosEncontrados

                };

            } catch (error) {

                console.error('Erro ao calcular recebido da baixa anterior:', error);

                return { valor: 0, mensagem: 'Erro ao carregar dados', registros: [] };

            }

        }

        function carregarOperadorDashboard() {

            const mes = new Date().getMonth() + 1, ano = new Date().getFullYear();

            const hoje = new Date();

            const metaOperador = metas.find(m => m?.usuario_id === currentUser.id && m?.mes === mes && m?.ano === ano) || { meta: 0, direto: 0, extra: 0, recebido: 0 };

            const metaValor = metaOperador.meta;

            const recebido = metaOperador.recebido;

            const projecao = calcularProjecao(metaValor, recebido);

            const projecaoHex = getProjecaoColorHex(projecao);

            const esperado = calcularEsperado(metaValor);

            const diferenca = recebido - esperado;

            // 🔥 CORREÇÃO: Meta diária = meta total / total de dias úteis

            const totalDiasUteis = getDiasUteis();

            const metaDiaria = totalDiasUteis > 0 ? metaValor / totalDiasUteis : 0;

            const amanhaEsperado = esperado + metaDiaria;

            const circumference = 2 * Math.PI * 80;

            const dashArray = (projecao / 100) * circumference;

            // Calcular quartil do operador

            const quartilInfo = calcularQuartilOperador(

                { id: currentUser.id, nome: currentUser.nome },

                recebido,

                metaValor

            );

            // Calcular RECEBIDO DE HOJE (será atualizado via fetch)

            const hojeNum = hoje.getDate();

            const mesStr = String(mes).padStart(2, '0');

            const diaStr = String(hojeNum).padStart(2, '0');

            const dataHoje = `${ano}-${mesStr}-${diaStr}`;

            // Card do quartil (sem emojis)

            const quartilCard = quartilInfo ? `

        <div class="metric-card" style="background: linear-gradient(135deg, #0A2F44, ${quartilInfo.corBg}); color: white;">

            <div class="metric-title" style="color: rgba(255,255,255,0.9);">ANALISE POR QUARTIL</div>

            <div class="metric-value" style="color: white; font-size: 1rem;">${quartilInfo.quartilAtual}</div>

            <div class="metric-sub" style="color: rgba(255,255,255,0.9); margin-top: 8px; font-size: 0.85rem;">${quartilInfo.mensagem}</div>

        </div>

    ` : '';

            const todosOperadores = usuarios.filter(u => (u.cargo === 'operador' || u.cargo === 'elite') && u.status === 'ativo');

            const operadoresComRecebido = todosOperadores.map(m => {

                const metaUsuario = metas.find(meta => meta?.usuario_id === m.id && meta?.mes === mes && meta?.ano === ano);

                return { id: m.id, nome: m.nome, recebido: metaUsuario?.recebido || 0, isCurrentUser: m.id === currentUser.id };

            });

            const rankingMembros = operadoresComRecebido.sort((a, b) => b.recebido - a.recebido).slice(0, 10);

            const posicaoAtual = operadoresComRecebido.sort((a, b) => b.recebido - a.recebido).findIndex(m => m.id === currentUser.id) + 1;

            const getFotoRanking = (usuarioId, nome) => {

                const user = usuarios.find(u => u.id === usuarioId);

                const fotoUrl = normalizarFotoUrl(user?.foto);

                if (fotoUrl) {

                    return `<img src="${fotoUrl}" 

                     style="width: 30px; height: 30px; border-radius: 50%; object-fit: cover; border: 2px solid #28A745; cursor: pointer; transition: transform 0.2s, box-shadow 0.2s;"

                     onerror="this.onerror=null; this.style.display='none'; if(this.nextElementSibling) this.nextElementSibling.style.display='inline-flex';"

                     onclick="event.stopPropagation(); abrirVisualizadorImagem('${fotoUrl}', '${nome}')"

                     onmouseenter="this.style.transform='scale(1.15)'; this.style.boxShadow='0 0 20px rgba(40,167,69,0.5)'"

                     onmouseleave="this.style.transform='scale(1)'; this.style.boxShadow='none'"><span style="display: none; width: 30px; height: 30px; border-radius: 50%; background: #1E6DC3; color: white; align-items: center; justify-content: center; font-weight: 700; font-size: 13px; cursor: default;">${(nome || '?').charAt(0).toUpperCase()}</span>`;

                }

                return `<span style="width: 30px; height: 30px; border-radius: 50%; background: #1E6DC3; color: white; display: inline-flex; align-items: center; justify-content: center; font-weight: 700; font-size: 13px; cursor: default;">${(nome || '?').charAt(0).toUpperCase()}</span>`;

            };

            // Card de meta diária com ID único para atualização

            const metaDiariaCard = `

        <div class="metric-card" id="metaDiariaCard" style="background: linear-gradient(135deg, #1E6DC3, #0F3B6F); color: white;">

            <div class="metric-title" style="color: rgba(255,255,255,0.9);">META DE HOJE</div>

            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">

                <div style="font-size: 1.8rem; font-weight: 700;" id="metaHojeValor">${formatMoney(metaDiaria)}</div>

                <div style="font-size: 0.9rem; opacity: 0.8;" id="statusHoje">Carregando...</div>

            </div>

            <div class="progress-bar-simple" style="background: rgba(255,255,255,0.2); height: 12px;">

                <div class="progress-fill" id="progressoHojeBarra" style="width: 0%; background: #FFC107; height: 100%; border-radius: 30px; transition: width 0.5s; font-size: 0.6rem;">

                    0%

                </div>

            </div>

            <div style="display: flex; justify-content: space-between; font-size: 0.75rem; opacity: 0.9; margin-top: 4px;">

                <span id="recebidoHojeTexto">Recebido hoje: R$ 0,00</span>

                <span id="faltaHojeTexto">Faltam R$ 0,00</span>

            </div>

        </div>

    `;

            // Card de posição no ranking (sem emojis)

            
            // Calcular operador acima e abaixo para disputa de ranking
            const rankingGeralOperadores = todosOperadores.map(op => {
                const mo = metas.find(m => m?.usuario_id === op.id && m?.mes === mes && m?.ano === ano);
                return { id: op.id, nome: op.nome, recebido: mo?.recebido || 0 };
            }).sort((a, b) => b.recebido - a.recebido);

            const userIndexGeral = rankingGeralOperadores.findIndex(x => x.id === currentUser.id);
            const opAcima = userIndexGeral > 0 ? rankingGeralOperadores[userIndexGeral - 1] : null;
            const opAbaixo = userIndexGeral >= 0 && userIndexGeral < rankingGeralOperadores.length - 1 ? rankingGeralOperadores[userIndexGeral + 1] : null;

            const cardDisputaHtml = `
        <div class="metric-card" style="background: white; border: 1px solid #E2E8F0;">
            <div class="metric-title" style="color: #0F3B6F; font-weight: 800;">DISPUTA DE POSICAO NO RANKING</div>
            <div style="display: flex; flex-direction: column; gap: 10px; margin-top: 10px;">
                ${opAcima ? `
                    <div style="display: flex; justify-content: space-between; align-items: center; background: #FEF2F2; padding: 10px 14px; border-radius: 10px; border-left: 4px solid #DC2626;">
                        <div>
                            <div style="font-size: 0.75rem; color: #991B1B; font-weight: 700;">ACIMA DE VOCE (${userIndexGeral}º)</div>
                            <div style="font-size: 0.9rem; font-weight: 700; color: #0F2E52;">${opAcima.nome}</div>
                        </div>
                        <div style="text-align: right;">
                            <div style="font-size: 0.85rem; font-weight: 800; color: #DC2626;">▼ Falta ${formatMoney(opAcima.recebido - recebido)}</div>
                            <div style="font-size: 0.7rem; color: #991B1B;">para alcancar</div>
                        </div>
                    </div>
                ` : `
                    <div style="background: #ECFDF5; padding: 10px 14px; border-radius: 10px; border-left: 4px solid #10B981; color: #065F46; font-size: 0.85rem; font-weight: 700;">
                        Lider do Ranking Geral! Parabens pela 1ª posicao!
                    </div>
                `}

                ${opAbaixo ? `
                    <div style="display: flex; justify-content: space-between; align-items: center; background: #F0FDF4; padding: 10px 14px; border-radius: 10px; border-left: 4px solid #16A34A;">
                        <div>
                            <div style="font-size: 0.75rem; color: #166534; font-weight: 700;">ABAIXO DE VOCE (${userIndexGeral + 2}º)</div>
                            <div style="font-size: 0.9rem; font-weight: 700; color: #0F2E52;">${opAbaixo.nome}</div>
                        </div>
                        <div style="text-align: right;">
                            <div style="font-size: 0.85rem; font-weight: 800; color: #16A34A;">▲ Vantagem de ${formatMoney(recebido - opAbaixo.recebido)}</div>
                            <div style="font-size: 0.7rem; color: #166534;">a frente dele</div>
                        </div>
                    </div>
                ` : ''}
            </div>
        </div>
    `;
    

            const rankingCard = `

        <div class="metric-card" style="background: linear-gradient(135deg, #6C757D, #495057); color: white;">

            <div class="metric-title" style="color: rgba(255,255,255,0.9);">POSICAO NO RANKING</div>

            <div style="font-size: 2.5rem; font-weight: 700;">${posicaoAtual > 0 ? `#${posicaoAtual}` : '--'}</div>

            <div class="metric-sub" style="color: rgba(255,255,255,0.8);">

                ${posicaoAtual > 0 && posicaoAtual <= 10 ? 'Voce esta no Top 10!' :

                    posicaoAtual > 0 ? `Entre ${todosOperadores.length} operadores` :

                        'Sem dados para rankear'}

            </div>

        </div>

    `;

            const operadorHtml = `

<!-- PRIMEIRA LINHA: 4 CARDS -->

<div class="operador-metrics-grid" style="grid-template-columns: repeat(4, 1fr);">

    <div class="metric-card"><div class="metric-title">TOTAL RECEBIDO</div><div class="metric-value">${formatMoney(recebido)}</div><div class="metric-sub">Meta Individual: ${formatMoney(metaValor)}</div></div>

    <div class="metric-card"><div class="metric-title">RECEBIMENTO DIRETO</div><div class="metric-value" style="color: #1E6DC3;">${formatMoney(metaOperador.direto || 0)}</div><div class="metric-sub"></div></div>

    <div class="metric-card"><div class="metric-title">RECEBIMENTO EXTRA</div><div class="metric-value" style="color: #FFC107;">${formatMoney(metaOperador.extra || 0)}</div><div class="metric-sub"></div></div>

    <div class="metric-card"><div class="metric-title">PROJECAO</div><div class="circle-chart-container"><div class="circle-chart"><svg viewBox="0 0 200 200"><circle class="bg-circle" cx="100" cy="100" r="80" stroke="#E2E8F0" fill="none" stroke-width="12"/><circle class="progress-circle" cx="100" cy="100" r="80" stroke="${projecaoHex}" fill="none" stroke-width="12" stroke-dasharray="${dashArray} ${circumference}" stroke-linecap="round"/></svg><div class="percentage-text" style="color: ${projecaoHex}">${projecao.toFixed(1)}%</div></div></div></div>

</div>

<!-- SEGUNDA LINHA: 4 CARDS (VALOR ESPERADO + DIFERENCA + QUARTIL + BAIXA ANTERIOR) -->

<div class="operador-metrics-grid" style="grid-template-columns: repeat(4, 1fr);">

    <div class="metric-card"><div class="metric-title">VALOR ESPERADO</div><div class="metric-value">${formatMoney(esperado)}</div><div class="metric-sub">Com base em ${getDiasPassados()} de ${getDiasUteis()} dias uteis</div></div>

    <div class="metric-card"><div class="metric-title">DIFERENCA PARA PROJECAO</div><div class="metric-value ${diferenca >= 0 ? 'positive-value' : 'negative-value'}">${diferenca >= 0 ? '+' : '-'} ${formatMoney(Math.abs(diferenca))}</div><div class="metric-sub">${diferenca >= 0 ? 'Acima da meta projetada' : 'Abaixo da meta projetada'}</div></div>

    ${quartilCard}

    <div class="metric-card" id="baixaAnteriorCard" style="background: linear-gradient(135deg, #0A2F44, #1A5D8F); color: white;">

        <div class="metric-title" style="color: rgba(255,255,255,0.9);">RECEBIDO BAIXA ANTERIOR</div>

        <div class="metric-value" style="color: white; font-size: 1rem;">CARREGANDO...</div>

        <div class="metric-sub" style="color: rgba(255,255,255,0.8); font-size: 0.7rem;">Aguardando dados...</div>

    </div>

</div>

<!-- TERCEIRA LINHA: META DIARIA + POSICAO RANKING + DISPUTA -->

<div class="operador-metrics-grid" style="grid-template-columns: repeat(2, 1fr);">

    ${metaDiariaCard}

    ${rankingCard}

</div>

<!-- EVOLUCAO DIARIA DO OPERADOR -->

<div style="background: white; border-radius: 20px; padding: 20px; margin: 20px 0; box-shadow: 0 2px 8px rgba(0,0,0,0.06);">

    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">

        <h4 style="color: #0F3B6F; margin: 0; font-size: 0.95rem;">Sua Evolucao Diaria</h4>

        <span style="font-size: 0.7rem; color: #5F7F9E;">Recebimento por dia (dados reais)</span>

    </div>

    <div id="evolucaoOperadorGraficoContainer" style="display: flex; align-items: flex-end; gap: 4px; height: 120px; padding-bottom: 25px; position: relative;">

        <div style="width: 100%; text-align: center; padding: 20px; color: #94A3B8; font-size: 0.85rem;">

            Carregando dados...

        </div>

    </div>

    <div id="evolucaoOperadorResumo" style="display: flex; justify-content: space-between; font-size: 0.6rem; color: #5F7F9E; margin-top: 5px;">

        <span>Total: ${formatMoney(recebido)}</span>

        <span>Media: ${formatMoney(recebido / Math.max(getDiasPassados(), 1))}</span>

        <span style="color: #6C757D;">Hoje: --</span>

    </div>

    <div id="evolucaoOperadorInfo" style="margin-top: 8px; font-size: 0.6rem; color: #94A3B8; text-align: center; border-top: 1px solid #E9F0F8; padding-top: 8px;">

        Buscando dados da tabela recebimentos...

    </div>

</div>

<!-- PROJECAO DIARIA -->

<div class="operador-info-extra">

    <div class="metric-title">PROJECAO DIARIA</div>

    <div class="projecao-diaria">

        <div class="diaria-item"><div class="diaria-label">Meta por dia</div><div class="diaria-value">${formatMoney(metaDiaria)}</div></div>

        <div class="diaria-item"><div class="diaria-label">Amanha voce devera ter</div><div class="diaria-value">${formatMoney(amanhaEsperado)}</div></div>

        <div class="diaria-item"><div class="diaria-label">Necessario por dia</div><div class="diaria-value" style="color: ${(metaValor - recebido) / Math.max(getDiasRestantes(), 1) > metaDiaria ? '#DC3545' : '#28A745'};">${formatMoney(Math.max(0, (metaValor - recebido) / Math.max(getDiasRestantes(), 1)))}</div></div>

    </div>

</div>

<!-- RANKING GERAL - SEM VALORES -->

<div class="ranking-operador">

    <h4>Ranking Geral - Top 10 Operadores</h4>

    ${rankingMembros.length > 0 ? `<ul class="ranking-list">${rankingMembros.map((m, idx) => {
                const userIndex = rankingMembros.findIndex(x => x.id === currentUser.id);
                const isCurrentUser = m.id === currentUser.id;
                const isImmediatelyAbove = userIndex !== -1 && idx === userIndex - 1;
                const isImmediatelyBelow = userIndex !== -1 && idx === userIndex + 1;

                let valorDisplay = '';
                let badgeDisputa = '';

                if (isImmediatelyAbove && userIndex !== -1) {
                    const currentUserObj = rankingMembros[userIndex];
                    const gap = Math.max(0, m.recebido - (currentUserObj ? currentUserObj.recebido : 0));
                    valorDisplay = '';
                    badgeDisputa = `<span style="color: #DC2626; background: #FEE2E2; padding: 4px 10px; border-radius: 20px; font-weight: 700; font-size: 0.75rem; display: inline-flex; align-items: center; gap: 4px; margin-left: 8px;"><span style="font-size: 10px;">▼</span> Falta ${formatMoney(gap)}</span>`;
                } else if (isImmediatelyBelow && userIndex !== -1) {
                    const currentUserObj = rankingMembros[userIndex];
                    const lead = Math.max(0, (currentUserObj ? currentUserObj.recebido : 0) - m.recebido);
                    valorDisplay = '';
                    badgeDisputa = `<span style="color: #16A34A; background: #DCFCE7; padding: 4px 10px; border-radius: 20px; font-weight: 700; font-size: 0.75rem; display: inline-flex; align-items: center; gap: 4px; margin-left: 8px;"><span style="font-size: 10px;">▲</span> Vantagem de ${formatMoney(lead)}</span>`;
                } else if (isCurrentUser) {
                    valorDisplay = `<span style="font-weight: 800; color: #1E6DC3;">${formatMoney(m.recebido)}</span>`;
                    badgeDisputa = `<span style="color: #1E6DC3; background: #DBEAFE; padding: 4px 10px; border-radius: 20px; font-weight: 800; font-size: 0.75rem; margin-left: 8px;">Você (${formatMoney(m.recebido)})</span>`;
                } else {
                    // Oculta os valores dos demais colocados conforme solicitado
                    valorDisplay = '';
                    badgeDisputa = '';
                }

                return `
                <li style="${isCurrentUser ? 'background: #EFF6FF; border: 2px solid #1E6DC3; border-radius: 12px; padding: 12px; margin: 6px 0;' : m.cargo === 'supervisor' ? 'background: #FFF3CD; border-radius: 12px; padding: 12px; margin: 4px 0;' : ''}">
                    <div class="ranking-position" style="border: none; padding: 0; overflow: hidden;">${getFotoRanking(m.id, m.nome)}</div>
                    <div class="ranking-name" style="${isCurrentUser ? 'font-weight: 800; color: #1E6DC3;' : m.cargo === 'supervisor' ? 'font-weight: 800; color: #856404;' : ''}; display: flex; align-items: center; justify-content: space-between; width: 100%;">
                        <span>${idx + 1}º ${m.nome} ${m.cargo === 'supervisor' ? '(Supervisor)' : ''}</span>
                        <div style="display: flex; align-items: center; gap: 8px;">
                            ${valorDisplay}
                            ${badgeDisputa}
                        </div>
                    </div>
                </li>
            `}).join('')}</ul>` : '<p class="no-data-message">Nenhum operador cadastrado.</p>'}

</div>

`;

            document.getElementById('operadorDashboardContent').innerHTML = operadorHtml;

            document.getElementById('operadorDashboardContent').classList.remove('hidden');

            document.getElementById('gestorDashboardContent').classList.add('hidden');

            document.getElementById('supervisorDashboardContent').classList.add('hidden');

            document.getElementById('eliteDashboardContent').classList.add('hidden');

            document.getElementById('motivationalMessage').innerHTML = "Continue assim! Cada dia e uma nova oportunidade de superar suas metas!";

            // ============================================

            // BUSCAR RECEBIDO DE HOJE E ATUALIZAR CARD

            // ============================================

            (async function buscarRecebidoHoje() {

                try {

                    const url = `${SUPABASE_URL}/rest/v1/recebimentos?usuario_id=eq.${currentUser.id}&data_pagamento=eq.${dataHoje}&select=valor_recebido`;

                    const res = await fetch(url, {

                        headers: {

                            'apikey': SUPABASE_ANON_KEY,

                            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`

                        }

                    });

                    let totalHoje = 0;

                    if (res.ok) {

                        const registros = await res.json();

                        for (const reg of registros) {

                            totalHoje += reg.valor_recebido || 0;

                        }

                    }

                    // Atualizar o card de meta diaria com os valores reais

                    const metaHojeValor = metaDiaria;

                    const progressoHojeValor = metaHojeValor > 0 ? (totalHoje / metaHojeValor) * 100 : 0;

                    const faltaHojeValor = Math.max(0, metaHojeValor - totalHoje);

                    const statusHojeValor = totalHoje >= metaHojeValor ? 'Meta do dia batida!' :

                        totalHoje > 0 ? `${progressoHojeValor.toFixed(0)}% da meta do dia` :

                            'Nenhum recebimento hoje ainda';

                    // Atualizar elementos do card pelo ID

                    const metaHojeValorEl = document.getElementById('metaHojeValor');

                    const statusHojeEl = document.getElementById('statusHoje');

                    const progressoBarraEl = document.getElementById('progressoHojeBarra');

                    const recebidoHojeTextoEl = document.getElementById('recebidoHojeTexto');

                    const faltaHojeTextoEl = document.getElementById('faltaHojeTexto');

                    if (metaHojeValorEl) metaHojeValorEl.innerHTML = formatMoney(metaHojeValor);

                    if (statusHojeEl) statusHojeEl.innerHTML = statusHojeValor;

                    if (progressoBarraEl) {

                        const progresso = Math.min(progressoHojeValor, 100);

                        progressoBarraEl.style.width = progresso + '%';

                        progressoBarraEl.style.background = progresso >= 100 ? '#28A745' : '#FFC107';

                        progressoBarraEl.innerHTML = progresso > 0 ? `${progresso.toFixed(0)}%` : '';

                    }

                    if (recebidoHojeTextoEl) recebidoHojeTextoEl.innerHTML = `Recebido hoje: ${formatMoney(totalHoje)}`;

                    if (faltaHojeTextoEl) faltaHojeTextoEl.innerHTML = faltaHojeValor > 0 ? `Faltam ${formatMoney(faltaHojeValor)}` : 'Meta batida!';

                } catch (e) {

                    console.warn('Erro ao buscar recebido de hoje:', e);

                }

            })();

            // ============================================

            // BUSCAR EVOLUCAO DIARIA DO OPERADOR

            // ============================================

            (async function buscarEvolucaoOperador() {

                try {

                    const anoAtual = hoje.getFullYear();

                    const mesAtual = String(mes).padStart(2, '0');

                    const diaAtual = String(hojeNum).padStart(2, '0');

                    const hojeStr = `${anoAtual}-${mesAtual}-${diaAtual}`;

                    const primeiroDiaStr = `${anoAtual}-${mesAtual}-01`;

                    const dadosPorDia = {};

                    let totalRecebidoReal = 0;

                    const url = `${SUPABASE_URL}/rest/v1/recebimentos?usuario_id=eq.${currentUser.id}&data_pagamento=gte.${primeiroDiaStr}&data_pagamento=lte.${hojeStr}&select=data_pagamento,valor_recebido&order=data_pagamento.asc`;

                    const res = await fetch(url, {

                        headers: {

                            'apikey': SUPABASE_ANON_KEY,

                            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`

                        }

                    });

                    if (res.ok) {

                        const data = await res.json();

                        for (const r of data) {

                            if (!r.data_pagamento) continue;

                            const dataStr = r.data_pagamento;

                            let dia = 0;

                            if (typeof dataStr === 'string' && dataStr.includes('-')) {

                                const partes = dataStr.split('-');

                                if (partes.length === 3) {

                                    dia = parseInt(partes[2], 10);

                                }

                            }

                            if (dia > 0 && dia <= 31) {

                                if (!dadosPorDia[dia]) dadosPorDia[dia] = 0;

                                dadosPorDia[dia] += r.valor_recebido || 0;

                                totalRecebidoReal += r.valor_recebido || 0;

                            }

                        }

                    }

                    // Verificar se os dados estao corretos e ajustar se necessario

                    if (dadosPorDia[1] === undefined || dadosPorDia[1] === 0) {

                        if (dadosPorDia[2] && dadosPorDia[2] > 30000) {

                            const dadosCorrigidos = {};

                            for (const dia in dadosPorDia) {

                                const diaNum = parseInt(dia, 10);

                                const novoDia = diaNum - 1;

                                if (novoDia >= 1) {

                                    dadosCorrigidos[novoDia] = dadosPorDia[diaNum];

                                }

                            }

                            for (const dia in dadosCorrigidos) {

                                dadosPorDia[dia] = dadosCorrigidos[dia];

                            }

                            delete dadosPorDia[0];

                        }

                    }

                    // Atualizar o grafico

                    atualizarEvolucaoOperador(dadosPorDia, recebido);

                } catch (e) {

                    console.warn('Erro ao buscar evolucao do operador:', e);

                    const container = document.getElementById('evolucaoOperadorGraficoContainer');

                    if (container) {

                        container.innerHTML = `

                    <div style="width: 100%; text-align: center; padding: 20px; color: #DC3545; font-size: 0.85rem;">

                        Erro ao carregar dados. Tente novamente.

                    </div>

                `;

                    }

                }

            })();

            // CALCULAR RECEBIDO DA BAIXA ANTERIOR

            calcularRecebidoBaixaAnterior(currentUser.id).then(baixaAnterior => {

                const baixaAnteriorCard = document.getElementById('baixaAnteriorCard');

                if (baixaAnteriorCard) {

                    baixaAnteriorCard.innerHTML = `

                <div class="metric-title" style="color: rgba(255,255,255,0.9);">RECEBIDO BAIXA ANTERIOR</div>

                <div class="metric-value" style="color: #17A2B8; font-size: 1.5rem;">${formatMoney(baixaAnterior.valor)}</div>

                <div class="metric-sub" style="color: rgba(255,255,255,0.8); font-size: 0.65rem;">${baixaAnterior.mensagem}</div>

            `;

                }

            }).catch(error => {

                console.error('Erro ao carregar baixa anterior:', error);

                const baixaAnteriorCard = document.getElementById('baixaAnteriorCard');

                if (baixaAnteriorCard) {

                    baixaAnteriorCard.innerHTML = `

                <div class="metric-title" style="color: rgba(255,255,255,0.9);">RECEBIDO BAIXA ANTERIOR</div>

                <div class="metric-value" style="color: #DC3545; font-size: 1.5rem;">R$ 0,00</div>

                <div class="metric-sub" style="color: rgba(255,255,255,0.8); font-size: 0.65rem;">Erro ao carregar dados</div>

            `;

                }

            });

            const btnAnalitico = document.getElementById('btnAnalitico');

            if (btnAnalitico) btnAnalitico.style.display = 'inline-block';

        }

        function resetarFiltrosDetalhadoCompleto() {

            // Limpa os filtros salvos

            limparFiltrosDetalhadoSalvos();

            // Reseta os campos

            resetarFiltrosDetalhado();

        }

        function atualizarEvolucaoOperador(dadosPorDia, totalMetas) {

            const container = document.getElementById('evolucaoOperadorGraficoContainer');

            if (!container) return;

            // Buscar a meta DIRETAMENTE do banco para o operador atual

            const mes = new Date().getMonth() + 1;

            const ano = new Date().getFullYear();

            const metaUsuario = metas.find(m => m?.usuario_id === currentUser.id && m?.mes === mes && m?.ano === ano);

            const metaTotal = metaUsuario?.meta || 0;

            // Calcular a meta diária

            const metaDiaria = metaTotal / getDiasUteis();

            // Se não houver dados, mostrar mensagem

            if (!dadosPorDia || Object.keys(dadosPorDia).length === 0) {

                container.innerHTML = `

            <div style="width: 100%; text-align: center; padding: 30px; color: #94A3B8; font-size: 0.85rem;">

                 Nenhum recebimento encontrado para este operador.

            </div>

        `;

                return;

            }

            // Ajustar dados para exibição

            let dadosExibicao = {};

            const totalRecebidoReal = Object.values(dadosPorDia).reduce((sum, val) => sum + val, 0);

            if (totalRecebidoReal > 0 && Math.abs(totalRecebidoReal - totalMetas) > 0.01) {

                const fatorAjuste = totalMetas / totalRecebidoReal;

                for (const dia in dadosPorDia) {

                    dadosExibicao[dia] = dadosPorDia[dia] * fatorAjuste;

                }

            } else {

                dadosExibicao = { ...dadosPorDia };

            }

            // Renderizar gráfico misto

            renderizarGraficoMisto(

                'evolucaoOperadorGraficoContainer',

                dadosExibicao,

                metaDiaria,

                'Sua Evolução Diária',

                'Meta Diária'

            );

            // Atualizar a informação adicional

            const info = document.getElementById('evolucaoOperadorInfo');

            if (info) {

                const totalExibido = Object.values(dadosExibicao).reduce((sum, val) => sum + val, 0);

                info.innerHTML = ` ${Object.keys(dadosPorDia).length} dias com recebimento | Total: ${formatMoney(totalExibido)} | Meta diária: ${formatMoney(metaDiaria)}`;

            }

        }

        function carregarVisaoEquipe() {

            const mes = new Date().getMonth() + 1, ano = new Date().getFullYear();

            const equipeDoUsuario = equipes.find(e => e.id === currentUser.equipe_id);

            if (!equipeDoUsuario) {

                document.getElementById('visaoEquipeContent').innerHTML = '<div class="no-data-message">Você não está associado a nenhuma equipe.</div>';

                return;

            }

            const metaEquipeObj = metasEquipe.find(me => me?.equipe_id === equipeDoUsuario.id && me?.mes === mes && me?.ano === ano);

            const metaEquipe = metaEquipeObj?.meta || 100000;

            const membros = usuarios.filter(u =>

                u.equipe_id === equipeDoUsuario.id &&

                (u.cargo === 'operador' || u.cargo === 'elite' || u.cargo === 'supervisor') &&

                u.status === 'ativo'

            );

            let totalRecebido = 0;

            let membrosComValores = [];

            for (let m of membros) {

                const mo = metas.find(meta => meta?.usuario_id === m.id && meta?.mes === mes && meta?.ano === ano);

                const recebido = mo?.recebido || 0;

                totalRecebido += recebido;

                membrosComValores.push({

                    nome: m.nome,

                    recebido: recebido,

                    cargo: m.cargo,

                    id: m.id

                });

            }

            const faltaParaMeta = Math.max(0, metaEquipe - totalRecebido);

            const projecaoEquipe = calcularProjecao(metaEquipe, totalRecebido);

            const projecaoHex = getProjecaoColorHex(projecaoEquipe);

            const esperadoEquipe = calcularEsperado(metaEquipe);

            const diferenca = totalRecebido - esperadoEquipe;

            const circumference = 2 * Math.PI * 80;

            const dashArray = (projecaoEquipe / 100) * circumference;

            const rankingMembros = [...membrosComValores].sort((a, b) => b.recebido - a.recebido).slice(0, 10);

            const getFotoRanking = (usuarioId, nome) => {

                const user = usuarios.find(u => u.id === usuarioId);

                const fotoUrl = normalizarFotoUrl(user?.foto);

                if (fotoUrl) {

                    return `<img src="${fotoUrl}" 

                         style="width: 30px; height: 30px; border-radius: 50%; object-fit: cover; border: 2px solid #28A745; cursor: pointer; transition: transform 0.2s, box-shadow 0.2s;"

                         onerror="this.onerror=null; this.style.display='none'; if(this.nextElementSibling) this.nextElementSibling.style.display='inline-flex';"

                         onclick="event.stopPropagation(); abrirVisualizadorImagem('${fotoUrl}', '${nome}')"

                         onmouseenter="this.style.transform='scale(1.15)'; this.style.boxShadow='0 0 20px rgba(40,167,69,0.5)'"

                         onmouseleave="this.style.transform='scale(1)'; this.style.boxShadow='none'"><span style="display: none; width: 30px; height: 30px; border-radius: 50%; background: #1E6DC3; color: white; align-items: center; justify-content: center; font-weight: 700; font-size: 13px; cursor: default;">${(nome || '?').charAt(0).toUpperCase()}</span>`;

                }

                return `<span style="width: 30px; height: 30px; border-radius: 50%; background: #1E6DC3; color: white; display: inline-flex; align-items: center; justify-content: center; font-weight: 700; font-size: 13px; cursor: default;">${(nome || '?').charAt(0).toUpperCase()}</span>`;

            };

            // 🔥 5 CARDS EM UMA LINHA

            const html = `

        
            
    
        <div class="supervisor-metrics-grid" style="grid-template-columns: repeat(5, 1fr);">

            <!-- Card 1: Total Recebido -->

            <div class="metric-card">

                <div class="metric-title">TOTAL RECEBIDO DA EQUIPE</div>

                <div class="metric-value">${formatMoney(totalRecebido)}</div>

                <div class="metric-sub">Meta da Equipe: ${formatMoney(metaEquipe)}</div>

                ${faltaParaMeta > 0 ? `<div class="metric-sub" style="color: #DC3545; font-weight: 700; margin-top: 8px; font-size: 0.95rem;">Falta: ${formatMoney(faltaParaMeta)}</div>` : `<div class="metric-sub" style="color: #28A745; font-weight: 700; margin-top: 8px; font-size: 0.95rem;"> META BATIDA!</div>`}

            </div>

            <!-- Card 2: Projeção -->

            <div class="metric-card">

                <div class="metric-title"> PROJEÇÃO DA EQUIPE</div>

                <div class="circle-chart-container">

                    <div class="circle-chart">

                        <svg viewBox="0 0 200 200">

                            <circle class="bg-circle" cx="100" cy="100" r="80" stroke="#E2E8F0" fill="none" stroke-width="12"/>

                            <circle class="progress-circle" cx="100" cy="100" r="80" stroke="${projecaoHex}" fill="none" stroke-width="12" stroke-dasharray="${dashArray} ${circumference}" stroke-linecap="round"/>

                        </svg>

                        <div class="percentage-text" style="color: ${projecaoHex}">${projecaoEquipe.toFixed(1)}%</div>

                    </div>

                </div>

            </div>

            <!-- Card 3: Valor Esperado -->

            <div class="metric-card">

                <div class="metric-title">VALOR ESPERADO DA EQUIPE</div>

                <div class="metric-value">${formatMoney(esperadoEquipe)}</div>

                <div class="metric-sub">Com base em ${getDiasPassados()} de ${getDiasUteis()} dias úteis</div>

            </div>

            <!-- Card 4: Diferença -->

            <div class="metric-card">

                <div class="metric-title">DIFERENÇA PARA PROJEÇÃO</div>

                <div class="metric-value ${diferenca >= 0 ? 'positive-value' : 'negative-value'}">

                    ${diferenca >= 0 ? '+' : '-'} ${formatMoney(Math.abs(diferenca))}

                </div>

                <div class="metric-sub">${diferenca >= 0 ? 'Acima da meta projetada' : 'Abaixo da meta projetada'}</div>

            </div>

            <!-- 🔥 Card 5: Baixa Anterior (branco, igual aos outros) -->

            <div class="metric-card" id="baixaAnteriorCardEquipe">

                <div class="metric-title">RECEBIDO BAIXA ANTERIOR</div>

                <div class="metric-value" style="font-size: 1.5rem; color: #0F3B6F;">CARREGANDO...</div>

                <div class="metric-sub" style="color: #5F7F9E; font-size: 0.65rem;">Aguardando dados...</div>

            </div>

        </div>

        <div class="ranking-operador">

            <h4> Ranking da Equipe - Top ${rankingMembros.length}</h4>

            ${rankingMembros.length > 0 ? `<ul class="ranking-list">${rankingMembros.map((m, idx) => {
                const isGestorOuSupervisor = currentUser?.cargo === 'gestor' || currentUser?.cargo === 'supervisor';
                const userIndex = rankingMembros.findIndex(x => x.id === currentUser.id);
                const isCurrentUser = m.id === currentUser.id;
                const isImmediatelyAbove = userIndex !== -1 && idx === userIndex - 1;
                const isImmediatelyBelow = userIndex !== -1 && idx === userIndex + 1;

                let valorDisplay = '';
                let badgeDisputa = '';

                if (isImmediatelyAbove && userIndex !== -1) {
                    const currentUserObj = rankingMembros[userIndex];
                    const gap = Math.max(0, m.recebido - (currentUserObj ? currentUserObj.recebido : 0));
                    valorDisplay = '';
                    badgeDisputa = `<span style="color: #DC2626; background: #FEE2E2; padding: 4px 10px; border-radius: 20px; font-weight: 700; font-size: 0.75rem; display: inline-flex; align-items: center; gap: 4px; margin-left: 8px;"><span style="font-size: 10px;">▼</span> Falta ${formatMoney(gap)}</span>`;
                } else if (isImmediatelyBelow && userIndex !== -1) {
                    const currentUserObj = rankingMembros[userIndex];
                    const lead = Math.max(0, (currentUserObj ? currentUserObj.recebido : 0) - m.recebido);
                    valorDisplay = '';
                    badgeDisputa = `<span style="color: #16A34A; background: #DCFCE7; padding: 4px 10px; border-radius: 20px; font-weight: 700; font-size: 0.75rem; display: inline-flex; align-items: center; gap: 4px; margin-left: 8px;"><span style="font-size: 10px;">▲</span> Vantagem de ${formatMoney(lead)}</span>`;
                } else if (isCurrentUser) {
                    valorDisplay = `<span style="font-weight: 800; color: #1E6DC3;">${formatMoney(m.recebido)}</span>`;
                    badgeDisputa = `<span style="color: #1E6DC3; background: #DBEAFE; padding: 4px 10px; border-radius: 20px; font-weight: 800; font-size: 0.75rem; margin-left: 8px;">Você (${formatMoney(m.recebido)})</span>`;
                } else if (isGestorOuSupervisor) {
                    valorDisplay = `<span style="font-weight: 700; color: #0F3B6F;">${formatMoney(m.recebido)}</span>`;
                    badgeDisputa = '';
                } else {
                    valorDisplay = '';
                    badgeDisputa = '';
                }

                return `
                <li style="${isCurrentUser ? 'background: #EFF6FF; border: 2px solid #1E6DC3; border-radius: 12px; padding: 12px; margin: 6px 0;' : m.cargo === 'supervisor' ? 'background: #FFF3CD; border-radius: 12px; padding: 12px; margin: 4px 0;' : ''}">
                    <div class="ranking-position" style="border: none; padding: 0; overflow: hidden;">${getFotoRanking(m.id, m.nome)}</div>
                    <div class="ranking-name" style="${isCurrentUser ? 'font-weight: 800; color: #1E6DC3;' : m.cargo === 'supervisor' ? 'font-weight: 800; color: #856404;' : ''}; display: flex; align-items: center; justify-content: space-between; width: 100%;">
                        <span>${idx + 1}º ${m.nome} ${m.cargo === 'supervisor' ? '(Supervisor)' : ''}</span>
                        <div style="display: flex; align-items: center; gap: 8px;">
                            ${valorDisplay}
                            ${badgeDisputa}
                        </div>
                    </div>
                </li>
            `}).join('')}</ul>` : '<p class="no-data-message">Nenhum membro encontrado nesta equipe.</p>'}

        </div>

    `;

            document.getElementById('visaoEquipeContent').innerHTML = html;

            // 🔥 BUSCAR BAIXA ANTERIOR DA EQUIPE

            calcularRecebidoBaixaAnteriorEquipe(equipeDoUsuario.id).then(baixaAnterior => {

                const card = document.getElementById('baixaAnteriorCardEquipe');

                if (card) {

                    card.innerHTML = `

                <div class="metric-title">RECEBIDO BAIXA ANTERIOR</div>

                <div class="metric-value" style="font-size: 1.5rem; color: #0F3B6F;">${formatMoney(baixaAnterior.valor)}</div>

                <div class="metric-sub" style="color: #5F7F9E; font-size: 0.65rem;">${baixaAnterior.mensagem}</div>

            `;

                }

            }).catch(error => {

                console.error('Erro ao carregar baixa anterior da equipe:', error);

                const card = document.getElementById('baixaAnteriorCardEquipe');

                if (card) {

                    card.innerHTML = `

                <div class="metric-title">RECEBIDO BAIXA ANTERIOR</div>

                <div class="metric-value" style="font-size: 1.5rem; color: #DC3545;">R$ 0,00</div>

                <div class="metric-sub" style="color: #5F7F9E; font-size: 0.65rem;">Erro ao carregar dados</div>

            `;

                }

            });

        }

        function carregarVisaoSetor() {

            const mes = new Date().getMonth() + 1;

            const ano = new Date().getFullYear();

            const metaSetor = getMetaSetor();

            let totalRecebidoSetor = 0;

            let dadosEquipes = [];

            for (let eq of equipes) {

                let totalEquipe = 0;

                let membrosCount = 0;

                const membros = usuarios.filter(u => u.equipe_id === eq.id && isCargoNoSetor(u.cargo) && u.status === 'ativo');

                for (let m of membros) {

                    const metaUsuario = metas.find(meta => String(meta?.usuario_id) === String(m.id) && meta?.mes === mes && meta?.ano === ano);

                    if (metaUsuario && metaUsuario.recebido) {

                        totalEquipe += metaUsuario.recebido;

                        totalRecebidoSetor += metaUsuario.recebido;

                        membrosCount++;

                    }

                }

                const supervisorEquipe = usuarios.find(u => u.equipe_id === eq.id && u.cargo === 'supervisor' && u.status === 'ativo');

                if (supervisorEquipe) {

                    const metaSup = metas.find(meta => String(meta?.usuario_id) === String(supervisorEquipe.id) && meta?.mes === mes && meta?.ano === ano);

                    if (metaSup && metaSup.recebido) {

                        totalEquipe += metaSup.recebido;

                        totalRecebidoSetor += metaSup.recebido;

                        membrosCount++;

                    }

                }

                const responsavelEquipe = usuarios.find(u => u.equipe_id === eq.id && isCargoResponsavelEquipe(u.cargo) && u.status === 'ativo');

                dadosEquipes.push({

                    nome: eq.nome,

                    total: totalEquipe,

                    membros: membrosCount,

                    id: eq.id,

                    responsavel: responsavelEquipe

                });

            }

            // Incluir operadores sem equipe vinculada (para não divergir do total da empresa)
            const membrosSemEquipe = usuarios.filter(u => (!u.equipe_id || u.equipe_id === '') && isCargoNoSetor(u.cargo) && u.status === 'ativo');

            let totalSemEquipe = 0;

            let countSemEquipe = 0;

            for (let m of membrosSemEquipe) {

                const metaUsuario = metas.find(meta => String(meta?.usuario_id) === String(m.id) && meta?.mes === mes && meta?.ano === ano);

                if (metaUsuario && metaUsuario.recebido) {

                    totalSemEquipe += metaUsuario.recebido;

                    totalRecebidoSetor += metaUsuario.recebido;

                    countSemEquipe++;

                }

            }

            if (totalSemEquipe > 0 || countSemEquipe > 0) {

                dadosEquipes.push({

                    nome: 'Sem Equipe',

                    total: totalSemEquipe,

                    membros: countSemEquipe,

                    id: 'sem_equipe',

                    responsavel: null

                });

            }

            if (dadosEquipes.length === 0 || totalRecebidoSetor === 0) {

                document.getElementById('visaoSetorContent').innerHTML = `

            <div class="no-data-message" style="text-align: center; padding: 40px;">

                <p>Nenhum dado encontrado para o setor.</p>

                <p>Não há registros de recebimento para o período atual.</p>

                <p style="margin-top: 15px; font-size: 0.8rem; color: #666;">Dica: Importe dados ou verifique se as metas estão cadastradas.</p>

            </div>

        `;

                return;

            }

            dadosEquipes.sort((a, b) => b.total - a.total);

            const faltaParaMetaSetor = Math.max(0, metaSetor - totalRecebidoSetor);

            const projecaoSetor = metaSetor > 0 ? (totalRecebidoSetor / (metaSetor / getDiasUteis() * getDiasPassados())) * 100 : 0;

            const projecaoSetorFinal = Math.min(Math.max(projecaoSetor, 0), 200);

            const projecaoHex = getProjecaoColorHex(projecaoSetorFinal);

            const esperadoSetor = metaSetor > 0 ? (metaSetor / getDiasUteis()) * getDiasPassados() : 0;

            const diferenca = totalRecebidoSetor - esperadoSetor;

            const circumference = 2 * Math.PI * 80;

            const dashArray = (Math.min(projecaoSetorFinal, 100) / 100) * circumference;

            const equipeDoUsuario = currentUser?.equipe_id ? equipes.find(e => e.id === currentUser.equipe_id) : null;

            const getFotoRanking = (usuario) => {

                if (!usuario) {

                    return `<span style="width: 30px; height: 30px; border-radius: 50%; background: #6C757D; color: white; display: inline-flex; align-items: center; justify-content: center; font-weight: 700; font-size: 13px; cursor: default;">?</span>`;

                }

                const fotoUrl = normalizarFotoUrl(usuario.foto);

                if (fotoUrl) {

                    return `<img src="${fotoUrl}" 

                         style="width: 30px; height: 30px; border-radius: 50%; object-fit: cover; border: 2px solid #28A745; cursor: pointer; transition: transform 0.2s, box-shadow 0.2s;"

                         onerror="this.onerror=null; this.style.display='none'; if(this.nextElementSibling) this.nextElementSibling.style.display='inline-flex';"

                         onclick="event.stopPropagation(); abrirVisualizadorImagem('${fotoUrl}', '${usuario.nome}')"

                         onmouseenter="this.style.transform='scale(1.15)'; this.style.boxShadow='0 0 20px rgba(40,167,69,0.5)'"

                         onmouseleave="this.style.transform='scale(1)'; this.style.boxShadow='none'"><span style="display: none; width: 30px; height: 30px; border-radius: 50%; background: #1E6DC3; color: white; align-items: center; justify-content: center; font-weight: 700; font-size: 13px; cursor: default;">${(usuario.nome || '?').charAt(0).toUpperCase()}</span>`;

                }

                return `<span style="width: 30px; height: 30px; border-radius: 50%; background: #1E6DC3; color: white; display: inline-flex; align-items: center; justify-content: center; font-weight: 700; font-size: 13px; cursor: default;">${usuario.nome.charAt(0).toUpperCase()}</span>`;

            };

            // 🔥 5 CARDS EM UMA LINHA

            const html = `

        <div style="margin-bottom: 20px;">

            ${equipeDoUsuario ? `<div style="text-align: center; margin-bottom: 20px; color: #5F7F9E; font-size: 0.85rem;">Sua equipe: <strong>${equipeDoUsuario.nome}</strong></div>` : ''}

        </div>

        <div class="supervisor-metrics-grid" style="grid-template-columns: repeat(5, 1fr);">

            <!-- Card 1: Total Recebido -->

            <div class="metric-card">

                <div class="metric-title">TOTAL RECEBIDO DO SETOR</div>

                <div class="metric-value">${formatMoney(totalRecebidoSetor)}</div>

                <div class="metric-sub">Meta do Setor: ${formatMoney(metaSetor)}</div>

                ${faltaParaMetaSetor > 0 ? `<div class="metric-sub" style="color: #DC3545; font-weight: 700; margin-top: 8px; font-size: 0.95rem;">Falta: ${formatMoney(faltaParaMetaSetor)}</div>` : `<div class="metric-sub" style="color: #28A745; font-weight: 700; margin-top: 8px; font-size: 0.95rem;"> META DO SETOR BATIDA!</div>`}

            </div>

            <!-- Card 2: Projeção -->

            <div class="metric-card">

                <div class="metric-title"> PROJEÇÃO DO SETOR</div>

                <div class="circle-chart-container">

                    <div class="circle-chart">

                        <svg viewBox="0 0 200 200">

                            <circle class="bg-circle" cx="100" cy="100" r="80" stroke="#E2E8F0" fill="none" stroke-width="12"/>

                            <circle class="progress-circle" cx="100" cy="100" r="80" stroke="${projecaoHex}" fill="none" stroke-width="12" stroke-dasharray="${dashArray} ${circumference}" stroke-linecap="round"/>

                        </svg>

                        <div class="percentage-text" style="color: ${projecaoHex}">${projecaoSetorFinal.toFixed(1)}%</div>

                    </div>

                </div>

            </div>

            <!-- Card 3: Valor Esperado -->

            <div class="metric-card">

                <div class="metric-title">VALOR ESPERADO</div>

                <div class="metric-value">${formatMoney(esperadoSetor)}</div>

                <div class="metric-sub">Com base em ${getDiasPassados()} de ${getDiasUteis()} dias úteis</div>

            </div>

            <!-- Card 4: Diferença -->

            <div class="metric-card">

                <div class="metric-title">DIFERENÇA PARA PROJEÇÃO</div>

                <div class="metric-value ${diferenca >= 0 ? 'positive-value' : 'negative-value'}">

                    ${diferenca >= 0 ? '+' : '-'} ${formatMoney(Math.abs(diferenca))}

                </div>

                <div class="metric-sub">${diferenca >= 0 ? 'Acima da meta projetada' : 'Abaixo da meta projetada'}</div>

            </div>

            <!-- 🔥 Card 5: Baixa Anterior (branco, igual aos outros) -->

            <div class="metric-card" id="baixaAnteriorCardSetor">

                <div class="metric-title">RECEBIDO BAIXA ANTERIOR</div>

                <div class="metric-value" style="font-size: 1.5rem; color: #0F3B6F;">CARREGANDO...</div>

                <div class="metric-sub" style="color: #5F7F9E; font-size: 0.65rem;">Aguardando dados...</div>

            </div>

        </div>

        <div class="ranking-operador">

            <h4>Equipes do Setor - Ranking por Recebimento</h4>

            ${dadosEquipes.filter(e => e.total > 0).length > 0 ? `

                <ul class="ranking-list">

                    ${dadosEquipes.filter(e => e.total > 0).map((eq, idx) => `

                        <li style="${equipeDoUsuario && eq.id === equipeDoUsuario.id ? 'background: #EFF6FF; border-radius: 12px; padding: 12px; margin: 4px 0;' : ''}">

                            <div class="ranking-position" style="${equipeDoUsuario && eq.id === equipeDoUsuario.id ? 'background: #28A745; border: none; padding: 0; overflow: hidden;' : 'border: none; padding: 0; overflow: hidden;'}">${getFotoRanking(eq.responsavel)}</div>

                            <div class="ranking-name" style="${equipeDoUsuario && eq.id === equipeDoUsuario.id ? 'font-weight: 800; color: #1E6DC3;' : ''}">

                                ${eq.nome} ${equipeDoUsuario && eq.id === equipeDoUsuario.id ? ' (Sua Equipe)' : ''}

                                ${eq.responsavel ? `<span style="font-size: 0.7rem; color: #5F7F9E; display: block;">Responsável: ${eq.responsavel.nome}</span>` : ''}

                            </div>

                            <div class="ranking-value">${formatMoney(eq.total)}</div>

                            <div class="ranking-proj">${eq.membros} membro(s)</div>

                        </li>

                    `).join('')}

                </ul>

            ` : '<p class="no-data-message">Nenhuma equipe com dados de recebimento encontrada.</p>'}

        </div>

    `;

            document.getElementById('visaoSetorContent').innerHTML = html;

            // 🔥 BUSCAR BAIXA ANTERIOR DO SETOR

            calcularRecebidoBaixaAnteriorSetor().then(baixaAnterior => {

                const card = document.getElementById('baixaAnteriorCardSetor');

                if (card) {

                    card.innerHTML = `

                <div class="metric-title">RECEBIDO BAIXA ANTERIOR</div>

                <div class="metric-value" style="font-size: 1.5rem; color: #0F3B6F;">${formatMoney(baixaAnterior.valor)}</div>

                <div class="metric-sub" style="color: #5F7F9E; font-size: 0.65rem;">${baixaAnterior.mensagem}</div>

            `;

                }

            }).catch(error => {

                console.error('Erro ao carregar baixa anterior do setor:', error);

                const card = document.getElementById('baixaAnteriorCardSetor');

                if (card) {

                    card.innerHTML = `

                <div class="metric-title">RECEBIDO BAIXA ANTERIOR</div>

                <div class="metric-value" style="font-size: 1.5rem; color: #DC3545;">R$ 0,00</div>

                <div class="metric-sub" style="color: #5F7F9E; font-size: 0.65rem;">Erro ao carregar dados</div>

            `;

                }

            });

        }

        function carregarEliteDashboard() {

            // O Elite tem a mesma visão que o Operador

            carregarOperadorDashboard();

        }

        // ============================================

        // FUNÇÃO DE QUARTIL PARA SUPERVISOR

        // ============================================

        function calcularQuartilSupervisor(supervisorId, equipeId) {

            const mes = new Date().getMonth() + 1;

            const ano = new Date().getFullYear();

            // Buscar a equipe do supervisor

            const equipe = equipes.find(e => e.id === equipeId);

            if (!equipe) return null;

            // Buscar meta da equipe

            const metaEquipeObj = metasEquipe.find(me => me?.equipe_id === equipeId && me?.mes === mes && me?.ano === ano);

            const metaEquipe = metaEquipeObj?.meta || 0;

            // Buscar todos os membros da equipe (operadores + elite)

            const membros = usuarios.filter(u => u.equipe_id === equipeId && (u.cargo === 'operador' || u.cargo === 'elite') && u.status === 'ativo');

            // Somar recebido de todos os membros

            let totalRecebidoEquipe = 0;

            for (const membro of membros) {

                const metaMembro = metas.find(m => m?.usuario_id === membro.id && m?.mes === mes && m?.ano === ano);

                if (metaMembro) {

                    totalRecebidoEquipe += metaMembro.recebido || 0;

                }

            }

            // Somar também o recebido do próprio supervisor (se ele tiver)

            const metaSupervisor = metas.find(m => m?.usuario_id === supervisorId && m?.mes === mes && m?.ano === ano);

            if (metaSupervisor) {

                totalRecebidoEquipe += metaSupervisor.recebido || 0;

            }

            // Calcular projeção da equipe

            const projecaoEquipe = calcularProjecao(metaEquipe, totalRecebidoEquipe);

            const diasPassados = getDiasPassados();

            const diasUteis = getDiasUteis();

            const esperadoEquipe = (metaEquipe / diasUteis) * diasPassados;

            let quartilAtual = '';

            let mensagem = '';

            let icone = '';

            let corBg = '';

            let valorNecessario = 0;

            let percentualMeta = (totalRecebidoEquipe / metaEquipe) * 100;

            // Classificação por quartil baseada na PROJEÇÃO da equipe

            if (projecaoEquipe >= 100) {

                quartilAtual = '1º Quartil - Excelente!';

                if (metaEquipe > 0 && totalRecebidoEquipe >= metaEquipe) {

                    mensagem = `PARABÉNS! Meta da equipe batida e projeção superior a 100%!`;

                } else if (metaEquipe > 0) {

                    const faltaMeta = metaEquipe - totalRecebidoEquipe;

                    mensagem = `Faltam ${formatMoney(faltaMeta)} para bater a meta da equipe! • ${percentualMeta.toFixed(1)}% da meta alcançada.`;

                } else {

                    mensagem = `Sua equipe está no Topo! Projeção superior a 100%!`;

                }

                icone = '';

                corBg = '#28A745';

                valorNecessario = 0;

            }

            else if (projecaoEquipe >= 80) {

                quartilAtual = '2º Quartil';

                const recebidoNecessario100 = esperadoEquipe;

                valorNecessario = Math.max(0, recebidoNecessario100 - totalRecebidoEquipe);

                if (valorNecessario > 0) {

                    mensagem = `Faltam ${formatMoney(valorNecessario)} para o 1º Quartil • ${percentualMeta.toFixed(1)}% da meta alcançada.`;

                } else {

                    mensagem = `Sua equipe já atingiu a meta para o 1º Quartil! • ${percentualMeta.toFixed(1)}% da meta alcançada.`;

                }

                icone = '';

                corBg = '#1E6DC3';

            }

            else if (projecaoEquipe >= 40) {

                quartilAtual = '3º Quartil';

                const recebidoNecessario80 = (80 * esperadoEquipe) / 100;

                valorNecessario = Math.max(0, recebidoNecessario80 - totalRecebidoEquipe);

                if (valorNecessario > 0) {

                    mensagem = `Faltam ${formatMoney(valorNecessario)} para o 2º Quartil<br><span style="font-size: 0.95rem; opacity: 1;">${percentualMeta.toFixed(1)}% da meta alcançada.</span>`;

                } else {

                    mensagem = `Sua equipe já atingiu a meta para o 2º Quartil!<br><span style="font-size: 0.95rem; opacity: 1;">${percentualMeta.toFixed(1)}% da meta alcançada.</span>`;

                }

                icone = '';

                corBg = '#FFC107';

            }

            else {

                quartilAtual = '4º Quartil - Crítico';

                const recebidoNecessario40 = (40 * esperadoEquipe) / 100;

                valorNecessario = Math.max(0, recebidoNecessario40 - totalRecebidoEquipe);

                if (valorNecessario > 0) {

                    mensagem = `Faltam ${formatMoney(valorNecessario)} para o 3º Quartil • ${percentualMeta.toFixed(1)}% da meta alcançada.`;

                } else {

                    mensagem = `Sua equipe já atingiu a meta para o 3º Quartil! • ${percentualMeta.toFixed(1)}% da meta alcançada.`;

                }

                icone = '';

                corBg = '#DC3545';

            }

            return {

                quartilAtual,

                mensagem,

                icone,

                corBg,

                projecao: projecaoEquipe,

                totalRecebido: totalRecebidoEquipe,

                metaEquipe: metaEquipe

            };

        }

        // ============================================

        // FUNÇÃO DE QUARTIL PARA GESTOR (SETOR)

        // ============================================

        function calcularQuartilGestor() {

            const mes = new Date().getMonth() + 1;

            const ano = new Date().getFullYear();

            // Buscar meta do setor

            const metaSetor = getMetaSetor();

            if (metaSetor === 0) return null;

            // Calcular total recebido do setor (soma de todos os usuários ativos)

            let totalRecebidoSetor = 0;

            const usuariosAtivos = usuarios.filter(u => u.status === 'ativo');

            for (const usuario of usuariosAtivos) {

                const metaUsuario = metas.find(m => m?.usuario_id === usuario.id && m?.mes === mes && m?.ano === ano);

                if (metaUsuario) {

                    totalRecebidoSetor += metaUsuario.recebido || 0;

                }

            }

            // Calcular projeção do setor

            const projecaoSetor = calcularProjecao(metaSetor, totalRecebidoSetor);

            const diasPassados = getDiasPassados();

            const diasUteis = getDiasUteis();

            const esperadoSetor = (metaSetor / diasUteis) * diasPassados;

            let quartilAtual = '';

            let mensagem = '';

            let icone = '';

            let corBg = '';

            let percentualMeta = (totalRecebidoSetor / metaSetor) * 100;

            // Classificação por quartil baseada na PROJEÇÃO do setor

            if (projecaoSetor >= 100) {

                quartilAtual = '1º Quartil - Excelente!';

                if (metaSetor > 0 && totalRecebidoSetor >= metaSetor) {

                    mensagem = `PARABÉNS! Meta do setor batida e projeção superior a 100%!<br><span style="font-size: 0.85rem; opacity: 0.9;">${percentualMeta.toFixed(1)}% da meta alcançada.</span>`;

                } else if (metaSetor > 0) {

                    const faltaMeta = metaSetor - totalRecebidoSetor;

                    mensagem = `Faltam ${formatMoney(faltaMeta)} para bater a meta do setor!<br><span style="font-size: 0.85rem; opacity: 0.9;">${percentualMeta.toFixed(1)}% da meta alcançada.</span>`;

                } else {

                    mensagem = `Setor está no Topo! Projeção superior a 100%!<br><span style="font-size: 0.85rem; opacity: 0.9;">${percentualMeta.toFixed(1)}% da meta alcançada.</span>`;

                }

                icone = '';

                corBg = '#28A745';

            }

            else if (projecaoSetor >= 80) {

                quartilAtual = '2º Quartil';

                const recebidoNecessario100 = esperadoSetor;

                const valorNecessario = Math.max(0, recebidoNecessario100 - totalRecebidoSetor);

                if (valorNecessario > 0) {

                    mensagem = `Faltam ${formatMoney(valorNecessario)} para o 1º Quartil<br><span style="font-size: 0.85rem; opacity: 0.9;">${percentualMeta.toFixed(1)}% da meta alcançada.</span>`;

                } else {

                    mensagem = `Setor já atingiu a meta para o 1º Quartil!<br><span style="font-size: 0.85rem; opacity: 0.9;">${percentualMeta.toFixed(1)}% da meta alcançada.</span>`;

                }

                icone = '';

                corBg = '#1E6DC3';

            }

            else if (projecaoSetor >= 40) {

                quartilAtual = '3º Quartil';

                const recebidoNecessario80 = (80 * esperadoSetor) / 100;

                const valorNecessario = Math.max(0, recebidoNecessario80 - totalRecebidoSetor);

                if (valorNecessario > 0) {

                    mensagem = `Faltam ${formatMoney(valorNecessario)} para o 2º Quartil<br><span style="font-size: 0.85rem; opacity: 0.9;">${percentualMeta.toFixed(1)}% da meta alcançada.</span>`;

                } else {

                    mensagem = `Setor já atingiu a meta para o 2º Quartil!<br><span style="font-size: 0.85rem; opacity: 0.9;">${percentualMeta.toFixed(1)}% da meta alcançada.</span>`;

                }

                icone = '️';

                corBg = '#FFC107';

            }

            else {

                quartilAtual = '4º Quartil - Crítico';

                const recebidoNecessario40 = (40 * esperadoSetor) / 100;

                const valorNecessario = Math.max(0, recebidoNecessario40 - totalRecebidoSetor);

                if (valorNecessario > 0) {

                    mensagem = `Faltam ${formatMoney(valorNecessario)} para o 3º Quartil<br><span style="font-size: 0.85rem; opacity: 0.9;">${percentualMeta.toFixed(1)}% da meta alcançada.</span>`;

                } else {

                    mensagem = `Setor já atingiu a meta para o 3º Quartil!<br><span style="font-size: 0.85rem; opacity: 0.9;">${percentualMeta.toFixed(1)}% da meta alcançada.</span>`;

                }

                icone = '⚡';

                corBg = '#DC3545';

            }

            return {

                quartilAtual,

                mensagem,

                icone,

                corBg,

                projecao: projecaoSetor,

                totalRecebido: totalRecebidoSetor,

                metaSetor: metaSetor

            };

        }

        function carregarSupervisorDashboard() {

            const mes = new Date().getMonth() + 1;

            const ano = new Date().getFullYear();

            const hoje = new Date();

            const supervisorEquipe = equipes.find(e => e.id === currentUser.equipe_id);

            if (!supervisorEquipe) {

                document.getElementById('supervisorDashboardContent').innerHTML = `

            <div class="no-data-message">

                <p>Voce nao esta associado a nenhuma equipe.</p>

                <p>Entre em contato com o gestor para ser vinculado a uma equipe.</p>

            </div>`;

                document.getElementById('supervisorDashboardContent').classList.remove('hidden');

                document.getElementById('gestorDashboardContent').classList.add('hidden');

                document.getElementById('operadorDashboardContent').classList.add('hidden');

                document.getElementById('eliteDashboardContent').classList.add('hidden');

                document.getElementById('motivationalMessage').innerHTML = "Visao Geral da Equipe";

                return;

            }

            const diasPassados = getDiasPassados();

            const diasRestantes = getDiasRestantes();

            const totalDias = getDiasUteis();

            const hojeNum = hoje.getDate();

            const membros = usuarios.filter(u =>

                u.equipe_id === supervisorEquipe.id &&

                (u.cargo === 'operador' || u.cargo === 'elite' || u.cargo === 'supervisor') &&

                u.status === 'ativo'

            );

            const membrosIds = membros.map(m => m.id);

            const metaEquipeObj = metasEquipe.find(me => me?.equipe_id === supervisorEquipe.id && me?.mes === mes && me?.ano === ano);

            const metaEquipe = metaEquipeObj?.meta || 100000;

            let totalRecebido = 0;

            let totalDireto = 0;

            let totalExtra = 0;

            let dadosMembros = [];

            for (let m of membros) {

                const mo = metas.find(meta => meta?.usuario_id === m.id && meta?.mes === mes && meta?.ano === ano);

                if (mo) {

                    const recebido = mo.recebido || 0;

                    const direto = mo.direto || 0;

                    const extra = mo.extra || 0;

                    const metaValor = mo.meta || 0;

                    const projecao = calcularProjecao(metaValor, recebido);

                    const alcance = metaValor > 0 ? (recebido / metaValor) * 100 : 0;

                    totalRecebido += recebido;

                    totalDireto += direto;

                    totalExtra += extra;

                    dadosMembros.push({

                        id: m.id,

                        nome: m.nome,

                        foto: m.foto,

                        cargo: m.cargo,

                        recebido: recebido,

                        direto: direto,

                        extra: extra,

                        meta: metaValor,

                        projecao: projecao,

                        alcance: alcance,

                        cor: getProjecaoColor(projecao)

                    });

                }

            }

            const projecaoEquipe = calcularProjecao(metaEquipe, totalRecebido);

            const projecaoHex = getProjecaoColorHex(projecaoEquipe);

            const esperadoEquipe = calcularEsperado(metaEquipe);

            const diferenca = totalRecebido - esperadoEquipe;

            const circumference = 2 * Math.PI * 80;

            const dashArray = (projecaoEquipe / 100) * circumference;

            const mediaDiariaAtual = diasPassados > 0 ? totalRecebido / diasPassados : 0;

            const metaDiariaNecessaria = diasRestantes > 0 ? Math.max(0, (metaEquipe - totalRecebido) / diasRestantes) : 0;

            const estaAdiantado = metaDiariaNecessaria <= mediaDiariaAtual;

            const percentualTempo = (diasPassados / totalDias) * 100;

            const percentualMeta = metaEquipe > 0 ? (totalRecebido / metaEquipe) * 100 : 0;

            const estaAdiantadoMeta = percentualMeta > percentualTempo;

            const faltaParaMeta = Math.max(0, metaEquipe - totalRecebido);

            const quartilInfo = calcularQuartilSupervisor(currentUser.id, supervisorEquipe.id);

            const quartilCard = quartilInfo ? `

        <div class="metric-card" style="background: linear-gradient(135deg, #0A2F44, ${quartilInfo.corBg}); color: white;">

            <div class="metric-title" style="color: rgba(255,255,255,0.9);">ANALISE POR QUARTIL</div>

            <div class="metric-value" style="color: white; font-size: 1rem;">${quartilInfo.quartilAtual}</div>

            <div class="metric-sub" style="color: rgba(255,255,255,0.9); margin-top: 8px; font-size: 0.85rem;">${quartilInfo.mensagem}</div>

        </div>

    ` : '';

            const getFotoRanking = (usuarioId, nome) => {

                const user = usuarios.find(u => u.id === usuarioId);

                const fotoUrl = normalizarFotoUrl(user?.foto);

                if (fotoUrl) {

                    return `<img src="${fotoUrl}" 

                         style="width: 28px; height: 28px; border-radius: 50%; object-fit: cover; border: 2px solid #28A745; cursor: pointer; transition: transform 0.2s, box-shadow 0.2s;"

                         onerror="this.onerror=null; this.style.display='none'; if(this.nextElementSibling) this.nextElementSibling.style.display='inline-flex';"

                         onclick="event.stopPropagation(); abrirVisualizadorImagem('${fotoUrl}', '${nome}')"

                         onmouseenter="this.style.transform='scale(1.15)'; this.style.boxShadow='0 0 20px rgba(40,167,69,0.5)'"

                         onmouseleave="this.style.transform='scale(1)'; this.style.boxShadow='none'"><span style="display: none; width: 28px; height: 28px; border-radius: 50%; background: #1E6DC3; color: white; align-items: center; justify-content: center; font-weight: 700; font-size: 12px; cursor: default;">${(nome || '?').charAt(0).toUpperCase()}</span>`;

                }

                return `<span style="width: 28px; height: 28px; border-radius: 50%; background: #1E6DC3; color: white; display: inline-flex; align-items: center; justify-content: center; font-weight: 700; font-size: 12px; cursor: default;">${nome.charAt(0).toUpperCase()}</span>`;

            };

            // ====== HTML ======

            const cardsHtml = `

        
            <!-- BOTAO EXPORTAR INFORMATIVO SUPERVISOR -->
            <div style="display: flex; justify-content: flex-end; margin-bottom: 20px;">
                <button onclick="window.abrirModalInformativo('supervisor')" class="btn" style="background: linear-gradient(135deg, #0F3B6F, #1E6DC3); color: white; border: none; padding: 10px 22px; border-radius: 12px; font-weight: 700; font-size: 0.9rem; cursor: pointer; display: inline-flex; align-items: center; gap: 8px; box-shadow: 0 4px 12px rgba(15, 59, 111, 0.25);">Exportar Informativo</button>
            </div>
    
        <div class="supervisor-metrics-grid" style="grid-template-columns: repeat(4, 1fr);">

            <div class="metric-card">

                <div class="metric-title">Total Recebido da Equipe</div>

                <div class="metric-value">${formatMoney(totalRecebido)}</div>

                <div class="metric-sub">Meta: ${formatMoney(metaEquipe)}</div>

                ${faltaParaMeta > 0 ? `<div class="metric-sub" style="color: #DC3545; font-weight: 700; margin-top: 8px; font-size: 0.95rem;">Falta: ${formatMoney(faltaParaMeta)}</div>` : `<div class="metric-sub" style="color: #28A745; font-weight: 700; margin-top: 8px; font-size: 0.95rem;">META BATIDA!</div>`}

            </div>

            <div class="metric-card">

                <div class="metric-title">Projecao da Equipe</div>

                <div class="circle-chart-container">

                    <div class="circle-chart">

                        <svg viewBox="0 0 200 200">

                            <circle class="bg-circle" cx="100" cy="100" r="80" stroke="#E2E8F0" fill="none" stroke-width="12"/>

                            <circle class="progress-circle" cx="100" cy="100" r="80" stroke="${projecaoHex}" fill="none" stroke-width="12" stroke-dasharray="${dashArray} ${circumference}" stroke-linecap="round"/>

                        </svg>

                        <div class="percentage-text" style="color: ${projecaoHex}">${projecaoEquipe.toFixed(1)}%</div>

                    </div>

                </div>

            </div>

            <div class="metric-card">

                <div class="metric-title">Valor Esperado</div>

                <div class="metric-value">${formatMoney(esperadoEquipe)}</div>

                <div class="metric-sub">Com base em ${diasPassados} de ${totalDias} dias</div>

            </div>

            <div class="metric-card">

                <div class="metric-title">Diferenca</div>

                <div class="metric-value ${diferenca >= 0 ? 'positive-value' : 'negative-value'}">

                    ${diferenca >= 0 ? '+' : '-'} ${formatMoney(Math.abs(diferenca))}

                </div>

                <div class="metric-sub">${diferenca >= 0 ? 'Acima da meta projetada' : 'Abaixo da meta projetada'}</div>

            </div>

        </div>

        <div class="supervisor-metrics-grid" style="grid-template-columns: repeat(4, 1fr); margin-top: 20px;">

            <div class="metric-card">

                <div class="metric-title">Recebimento Direto</div>

                <div class="metric-value" style="color: #1E6DC3;">${formatMoney(totalDireto)}</div>

                <div class="metric-sub"></div>

            </div>

            <div class="metric-card">

                <div class="metric-title">Recebimento Extra</div>

                <div class="metric-value" style="color: #FFC107;">${formatMoney(totalExtra)}</div>

                <div class="metric-sub"></div>

            </div>

            <div class="metric-card" id="baixaAnteriorCardSupervisor" style="background: linear-gradient(135deg, #0A2F44, #1A5D8F); color: white;">

                <div class="metric-title" style="color: rgba(255,255,255,0.9);">RECEBIDO BAIXA ANTERIOR</div>

                <div class="metric-value" style="color: white; font-size: 1rem;">CARREGANDO...</div>

                <div class="metric-sub" style="color: rgba(255,255,255,0.8); font-size: 0.7rem;">Aguardando dados...</div>

            </div>

            ${quartilCard}

        </div>

    `;

            const metasDiariasHtml = `

        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin: 20px 0;">

            <div style="background: white; border-radius: 20px; padding: 20px; text-align: center; box-shadow: 0 2px 8px rgba(0,0,0,0.06);">

                <div style="font-size: 0.7rem; color: #5F7F9E; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px;">Media Diaria Atual</div>

                <div style="font-size: 1.5rem; font-weight: 700; color: #1E6DC3;">${formatMoney(mediaDiariaAtual)}</div>

                <div style="font-size: 0.7rem; color: #5F7F9E; margin-top: 5px;">Por dia ate agora</div>

            </div>

            <div style="background: white; border-radius: 20px; padding: 20px; text-align: center; box-shadow: 0 2px 8px rgba(0,0,0,0.06);">

                <div style="font-size: 0.7rem; color: #5F7F9E; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px;">Necessario por Dia</div>

                <div style="font-size: 1.5rem; font-weight: 700; color: ${metaDiariaNecessaria > mediaDiariaAtual ? '#DC3545' : '#28A745'};">${formatMoney(metaDiariaNecessaria)}</div>

                <div style="font-size: 0.7rem; color: #5F7F9E; margin-top: 5px;">${diasRestantes} dias restantes</div>

            </div>

            <div style="background: white; border-radius: 20px; padding: 20px; text-align: center; box-shadow: 0 2px 8px rgba(0,0,0,0.06);">

                <div style="font-size: 0.7rem; color: #5F7F9E; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px;">Status</div>

                <div style="font-size: 1.5rem; font-weight: 700; color: ${estaAdiantado ? '#28A745' : '#DC3545'};">${estaAdiantado ? 'No Ritmo' : 'Atrasado'}</div>

                <div style="font-size: 0.7rem; color: #5F7F9E; margin-top: 5px;">${estaAdiantado ? 'Meta viavel' : 'Necessario acelerar'}</div>

            </div>

        </div>

    `;

            const progressoHtml = `

        <div style="background: white; border-radius: 20px; padding: 24px; margin: 20px 0; box-shadow: 0 2px 8px rgba(0,0,0,0.06);">

            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">

                <h4 style="color: #0F3B6F; margin: 0;">Progresso do Mes</h4>

                <span style="font-size: 0.8rem; color: ${estaAdiantadoMeta ? '#28A745' : '#DC3545'}; font-weight: 700;">

                    ${estaAdiantadoMeta ? 'Adiantado' : 'Atrasado'} ${Math.abs(percentualMeta - percentualTempo).toFixed(1)}%

                </span>

            </div>

            <div style="margin-bottom: 8px;">

                <div style="display: flex; justify-content: space-between; font-size: 0.7rem; color: #5F7F9E;">

                    <span>Inicio</span>

                    <span>${diasPassados} dias</span>

                    <span>${totalDias} dias</span>

                </div>

                <div style="position: relative; height: 24px; background: #E2E8F0; border-radius: 20px; overflow: visible;">

                    <div style="width: ${Math.min(percentualTempo, 100)}%; height: 100%; background: linear-gradient(90deg, #1E6DC3, #3A86FF); border-radius: 20px; transition: width 0.5s;"></div>

                    <div style="position: absolute; top: -22px; left: ${Math.min(percentualTempo, 95)}%; transform: translateX(-50%); font-size: 0.6rem; font-weight: 700; color: #1E6DC3;">

                        ${percentualTempo.toFixed(0)}%

                    </div>

                </div>

            </div>

            <div>

                <div style="display: flex; justify-content: space-between; font-size: 0.7rem; color: #5F7F9E;">

                    <span>Meta</span>

                    <span>${percentualMeta.toFixed(0)}% alcancada</span>

                    <span>100%</span>

                </div>

                <div style="height: 24px; background: #E2E8F0; border-radius: 20px; overflow: hidden;">

                    <div style="width: ${Math.min(percentualMeta, 100)}%; height: 100%; background: ${percentualMeta >= 100 ? '#28A745' : '#FFC107'}; border-radius: 20px; transition: width 0.5s;"></div>

                </div>

            </div>

        </div>

    `;

            let tabelaHtml = '';

            if (dadosMembros.length > 0) {

                const membrosOrdenados = [...dadosMembros].sort((a, b) => b.recebido - a.recebido);

                tabelaHtml = `

            <div style="background: white; border-radius: 20px; overflow: hidden; border: 1px solid #E9F0F8; margin: 20px 0;">

                <div style="padding: 16px 20px; background: linear-gradient(95deg, #F8FAFE, #FFFFFF); border-bottom: 1px solid #E9F0F8;">

                    <h4 style="color: #0F3B6F; margin: 0; font-size: 0.95rem;">Membros da Equipe</h4>

                </div>

                <div style="overflow-x: auto; padding: 0 4px;">

                    <table style="width: 100%; border-collapse: collapse; font-size: 0.8rem;">

                        <thead>

                            <tr style="background: #F1F5F9;">

                                <th style="padding: 10px 8px; text-align: left; font-weight: 600; color: #0F3B6F; font-size: 0.7rem; text-transform: uppercase;">Membro</th>

                                <th style="padding: 10px 8px; text-align: right; font-weight: 600; color: #0F3B6F; font-size: 0.7rem; text-transform: uppercase;">Recebido</th>

                                <th style="padding: 10px 8px; text-align: right; font-weight: 600; color: #0F3B6F; font-size: 0.7rem; text-transform: uppercase;">Direto</th>

                                <th style="padding: 10px 8px; text-align: right; font-weight: 600; color: #0F3B6F; font-size: 0.7rem; text-transform: uppercase;">Extra</th>

                                <th style="padding: 10px 8px; text-align: right; font-weight: 600; color: #0F3B6F; font-size: 0.7rem; text-transform: uppercase;">Meta</th>

                                <th style="padding: 10px 8px; text-align: center; font-weight: 600; color: #0F3B6F; font-size: 0.7rem; text-transform: uppercase;">Alcance</th>

                                <th style="padding: 10px 8px; text-align: center; font-weight: 600; color: #0F3B6F; font-size: 0.7rem; text-transform: uppercase;">Projecao</th>

                            </tr>

                        </thead>

                        <tbody>

                            ${membrosOrdenados.map((m, idx) => {

                    const rowBg = m.cargo === 'supervisor' ? 'background: #FFF8E7;' : (idx % 2 === 0 ? 'background: #FFFFFF;' : 'background: #F8FAFE;');

                    return `

                                    <tr style="border-bottom: 1px solid #EDF2F7; ${rowBg}">

                                        <td style="padding: 10px 8px; display: flex; align-items: center; gap: 10px;">

                                            <span style="width: 28px; height: 28px; border-radius: 50%; overflow: hidden; flex-shrink: 0;">${getFotoRanking(m.id, m.nome)}</span>

                                            <span style="font-weight: ${m.cargo === 'supervisor' ? '700' : '500'}; color: ${m.cargo === 'supervisor' ? '#856404' : '#0A2540'};">${m.nome} ${m.cargo === 'supervisor' ? '(Supervisor)' : ''}</span>

                                        </td>

                                        <td style="padding: 10px 8px; text-align: right; font-weight: 600; color: #0F3B6F;">${formatMoney(m.recebido)}</td>

                                        <td style="padding: 10px 8px; text-align: right; color: #1E6DC3;">${formatMoney(m.direto)}</td>

                                        <td style="padding: 10px 8px; text-align: right; color: #FFC107;">${formatMoney(m.extra)}</td>

                                        <td style="padding: 10px 8px; text-align: right; color: #5F7F9E;">${formatMoney(m.meta)}</td>

                                        <td style="padding: 10px 8px; text-align: center;">

                                            <div style="display: flex; align-items: center; gap: 4px; justify-content: center;">

                                                <div style="background: #E2E8F0; border-radius: 10px; height: 4px; width: 40px; overflow: hidden;">

                                                    <div style="width: ${Math.min(m.alcance, 100)}%; height: 100%; background: ${getProjecaoColorHex(m.alcance)}; border-radius: 10px;"></div>

                                                </div>

                                                <span style="font-size: 0.7rem; font-weight: 600; color: ${getProjecaoColorHex(m.alcance)}; min-width: 35px;">${m.alcance.toFixed(0)}%</span>

                                            </div>

                                        </td>

                                        <td style="padding: 10px 8px; text-align: center;">

                                            <span style="display: inline-block; padding: 2px 10px; border-radius: 20px; font-weight: 600; font-size: 0.7rem; background: ${getProjecaoColorHex(m.projecao)}; color: white;">${m.projecao.toFixed(1)}%</span>

                                        </td>

                                    </tr>

                                `;

                }).join('')}

                        </tbody>

                    </table>

                </div>

                <div style="padding: 8px 16px; background: #F8FAFE; border-top: 1px solid #E9F0F8; display: flex; gap: 16px; flex-wrap: wrap; font-size: 0.65rem; color: #5F7F9E;">

                    <span>${dadosMembros.length} membros</span>

                    <span>Total: ${formatMoney(totalRecebido)}</span>

                    <span>Media: ${formatMoney(totalRecebido / Math.max(dadosMembros.length, 1))}</span>

                </div>

            </div>

        `;

            } else {

                tabelaHtml = '<p style="text-align:center; padding:20px; color: #94A3B8;">Nenhum membro encontrado nesta equipe.</p>';

            }

            // ====== EVOLUCAO DIARIA ======

            let evolucaoHtml = `

        <div style="background: white; border-radius: 20px; padding: 20px; margin: 20px 0; box-shadow: 0 2px 8px rgba(0,0,0,0.06);">

            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">

                <h4 style="color: #0F3B6F; margin: 0; font-size: 0.95rem;">Evolucao Diaria da Equipe</h4>

                <span style="font-size: 0.7rem; color: #5F7F9E;">Recebimento por dia (dados reais)</span>

            </div>

            <div id="evolucaoGraficoContainer" style="display: flex; align-items: flex-end; gap: 4px; height: 120px; padding-bottom: 25px; position: relative;">

                <div style="width: 100%; text-align: center; padding: 20px; color: #94A3B8; font-size: 0.85rem;">

                    Carregando dados...

                </div>

            </div>

            <div id="evolucaoResumo" style="display: flex; justify-content: space-between; font-size: 0.6rem; color: #5F7F9E; margin-top: 5px;">

                <span>Total: ${formatMoney(totalRecebido)}</span>

                <span>Media: ${formatMoney(totalRecebido / Math.max(diasPassados, 1))}</span>

                <span style="color: #6C757D;">Hoje: --</span>

            </div>

            <div id="evolucaoInfo" style="margin-top: 8px; font-size: 0.6rem; color: #94A3B8; text-align: center; border-top: 1px solid #E9F0F8; padding-top: 8px;">

                Buscando dados da tabela recebimentos...

            </div>

        </div>

    `;

            // ====== HTML FINAL ======

            const html = `

        ${cardsHtml}

        ${metasDiariasHtml}

        ${progressoHtml}

        ${tabelaHtml}

        ${evolucaoHtml}

    `;

            document.getElementById('supervisorDashboardContent').innerHTML = html;

            document.getElementById('supervisorDashboardContent').classList.remove('hidden');

            document.getElementById('gestorDashboardContent').classList.add('hidden');

            document.getElementById('operadorDashboardContent').classList.add('hidden');

            document.getElementById('eliteDashboardContent').classList.add('hidden');

            document.getElementById('motivationalMessage').innerHTML = `Visao Geral da Equipe - ${supervisorEquipe.nome}`;

            // ====== BUSCAR BAIXA ANTERIOR ======

            calcularRecebidoBaixaAnteriorEquipe(supervisorEquipe.id).then(baixaAnterior => {

                const card = document.getElementById('baixaAnteriorCardSupervisor');

                if (card) {

                    card.innerHTML = `

                <div class="metric-title" style="color: rgba(255,255,255,0.9);">RECEBIDO BAIXA ANTERIOR</div>

                <div class="metric-value" style="color: #17A2B8; font-size: 1.5rem;">${formatMoney(baixaAnterior.valor)}</div>

                <div class="metric-sub" style="color: rgba(255,255,255,0.8); font-size: 0.65rem;">${baixaAnterior.mensagem}</div>

            `;

                }

            }).catch(error => {

                console.error('Erro ao carregar baixa anterior da equipe:', error);

            });

            // ====== BUSCAR DADOS REAIS DOS RECEBIMENTOS ======

            (async function buscarRecebimentosReais() {

                try {

                    const anoAtual = hoje.getFullYear();

                    const mesAtual = String(hoje.getMonth() + 1).padStart(2, '0');

                    const diaAtual = String(hoje.getDate()).padStart(2, '0');

                    const hojeStr = `${anoAtual}-${mesAtual}-${diaAtual}`;

                    const primeiroDiaStr = `${anoAtual}-${mesAtual}-01`;

                    const dadosPorDia = {};

                    let totalRecebidoReal = 0;

                    for (const membroId of membrosIds) {

                        try {

                            const url = `${SUPABASE_URL}/rest/v1/recebimentos?usuario_id=eq.${membroId}&data_pagamento=gte.${primeiroDiaStr}&data_pagamento=lte.${hojeStr}&select=data_pagamento,valor_recebido&order=data_pagamento.asc`;

                            const res = await fetch(url, {

                                headers: {

                                    'apikey': SUPABASE_ANON_KEY,

                                    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`

                                }

                            });

                            if (res.ok) {

                                const data = await res.json();

                                for (const r of data) {

                                    if (!r.data_pagamento) continue;

                                    const dataStr = r.data_pagamento;

                                    let dia = 0;

                                    if (typeof dataStr === 'string' && dataStr.includes('-')) {

                                        const partes = dataStr.split('-');

                                        if (partes.length === 3) {

                                            dia = parseInt(partes[2], 10);

                                        }

                                    }

                                    if (dia > 0 && dia <= 31) {

                                        if (!dadosPorDia[dia]) dadosPorDia[dia] = 0;

                                        dadosPorDia[dia] += r.valor_recebido || 0;

                                        totalRecebidoReal += r.valor_recebido || 0;

                                    }

                                }

                            }

                        } catch (e) {

                            console.warn('Erro ao buscar recebimentos:', e);

                        }

                    }

                    if (dadosPorDia[1] === undefined || dadosPorDia[1] === 0) {

                        if (dadosPorDia[2] && dadosPorDia[2] > 30000) {

                            const dadosCorrigidos = {};

                            for (const dia in dadosPorDia) {

                                const diaNum = parseInt(dia, 10);

                                const novoDia = diaNum - 1;

                                if (novoDia >= 1) {

                                    dadosCorrigidos[novoDia] = dadosPorDia[diaNum];

                                }

                            }

                            for (const dia in dadosCorrigidos) {

                                dadosPorDia[dia] = dadosCorrigidos[dia];

                            }

                            delete dadosPorDia[0];

                        }

                    }

                    atualizarEvolucaoDiaria(dadosPorDia, totalRecebido);

                } catch (e) {

                    console.warn('Erro ao buscar recebimentos:', e);

                    const container = document.getElementById('evolucaoGraficoContainer');

                    if (container) {

                        container.innerHTML = `

                    <div style="width: 100%; text-align: center; padding: 20px; color: #DC3545; font-size: 0.85rem;">

                        Erro ao carregar dados. Tente novamente.

                    </div>

                `;

                    }

                }

            })();

        }

        // ============================================

        // FUNÇÃO COMPLETA DO DASHBOARD DO GESTOR

        // ============================================

        async function carregarDashboardGestor() {

            const mes = new Date().getMonth() + 1;

            const ano = new Date().getFullYear();

            const hoje = new Date();

            const metaSetor = getMetaSetor();

            // Buscar todos os usuários ativos (todos os cargos)

            const usuariosAtivos = usuarios.filter(u => u.status === 'ativo');

            // Calcular total recebido do setor

            let totalRecebidoSetor = 0;

            let totalDiretoSetor = 0;

            let totalExtraSetor = 0;

            for (const user of usuariosAtivos) {

                const metaUser = metas.find(m => m?.usuario_id === user.id && m?.mes === mes && m?.ano === ano);

                if (metaUser) {

                    totalRecebidoSetor += metaUser.recebido || 0;

                    totalDiretoSetor += metaUser.direto || 0;

                    totalExtraSetor += metaUser.extra || 0;

                }

            }

            // Calcular projeções do setor

            const projecaoSetor = calcularProjecao(metaSetor, totalRecebidoSetor);

            const projecaoHex = getProjecaoColorHex(projecaoSetor);

            const esperadoSetor = calcularEsperado(metaSetor);

            const diferenca = totalRecebidoSetor - esperadoSetor;

            const circumference = 2 * Math.PI * 80;

            const dashArray = (projecaoSetor / 100) * circumference;

            const faltaParaMetaSetor = Math.max(0, metaSetor - totalRecebidoSetor);

            // Calcular quartil do gestor

            const quartilInfo = calcularQuartilGestor();

            const quartilCard = quartilInfo ? `

        <div class="metric-card" style="background: linear-gradient(135deg, #0A2F44, ${quartilInfo.corBg}); color: white;">

            <div class="metric-title" style="color: rgba(255,255,255,0.9);">ANÁLISE POR QUARTIL</div>

            <div class="metric-value" style="color: white; font-size: 1rem;">${quartilInfo.quartilAtual}</div>

            <div class="metric-sub" style="color: rgba(255,255,255,0.9); margin-top: 8px; font-size: 0.85rem;">${quartilInfo.mensagem}</div>

        </div>

    ` : '';

            // Dias úteis

            const diasPassados = getDiasPassados();

            const diasRestantes = getDiasRestantes();

            const totalDias = getDiasUteis();

            // Médias diárias

            const mediaDiariaAtual = diasPassados > 0 ? totalRecebidoSetor / diasPassados : 0;

            const metaDiariaNecessaria = diasRestantes > 0 ? Math.max(0, (metaSetor - totalRecebidoSetor) / diasRestantes) : 0;

            const estaAdiantado = metaDiariaNecessaria <= mediaDiariaAtual;

            // Percentuais de progresso

            const percentualTempo = (diasPassados / totalDias) * 100;

            const percentualMeta = metaSetor > 0 ? (totalRecebidoSetor / metaSetor) * 100 : 0;

            const estaAdiantadoMeta = percentualMeta > percentualTempo;

            // ====== CARDS PRINCIPAIS ======

            const cardsHtml = `
<!-- BOTAO EXPORTAR INFORMATIVO GESTOR -->
            <div style="display: flex; justify-content: flex-end; margin-bottom: 20px;">
                <button onclick="window.abrirModalInformativo('gestor')" class="btn" style="background: linear-gradient(135deg, #0F3B6F, #1E6DC3); color: white; border: none; padding: 10px 22px; border-radius: 12px; font-weight: 700; font-size: 0.9rem; cursor: pointer; display: inline-flex; align-items: center; gap: 8px; box-shadow: 0 4px 12px rgba(15, 59, 111, 0.25);">Exportar Informativo</button>
            </div>

        <div class="supervisor-metrics-grid" style="grid-template-columns: repeat(4, 1fr);">

            <div class="metric-card">

                <div class="metric-title">TOTAL RECEBIDO DO SETOR</div>

                <div class="metric-value">${formatMoney(totalRecebidoSetor)}</div>

                <div class="metric-sub">Meta do Setor: ${formatMoney(metaSetor)}</div>

                ${faltaParaMetaSetor > 0 ? `<div class="metric-sub" style="color: #DC3545; font-weight: 700; margin-top: 8px; font-size: 0.95rem;">Falta: ${formatMoney(faltaParaMetaSetor)}</div>` : `<div class="metric-sub" style="color: #28A745; font-weight: 700; margin-top: 8px; font-size: 0.95rem;"> META BATIDA!</div>`}

            </div>

            <div class="metric-card">

                <div class="metric-title">RECEBIMENTO DIRETO</div>

                <div class="metric-value" style="color: #1E6DC3;">${formatMoney(totalDiretoSetor)}</div>

                <div class="metric-sub"></div>

            </div>

            <div class="metric-card">

                <div class="metric-title">RECEBIMENTO EXTRA</div>

                <div class="metric-value" style="color: #FFC107;">${formatMoney(totalExtraSetor)}</div>

                <div class="metric-sub"></div>

            </div>

            <div class="metric-card">

                <div class="metric-title">PROJEÇÃO DO SETOR</div>

                <div class="circle-chart-container">

                    <div class="circle-chart">

                        <svg viewBox="0 0 200 200">

                            <circle class="bg-circle" cx="100" cy="100" r="80" stroke="#E2E8F0" fill="none" stroke-width="12"/>

                            <circle class="progress-circle" cx="100" cy="100" r="80" stroke="${projecaoHex}" fill="none" stroke-width="12" stroke-dasharray="${dashArray} ${circumference}" stroke-linecap="round"/>

                        </svg>

                        <div class="percentage-text" style="color: ${projecaoHex}">${projecaoSetor.toFixed(1)}%</div>

                    </div>

                </div>

            </div>

        </div>

        <div class="supervisor-metrics-grid" style="grid-template-columns: repeat(4, 1fr); margin-top: 20px;">

            <div class="metric-card">

                <div class="metric-title">VALOR ESPERADO</div>

                <div class="metric-value">${formatMoney(esperadoSetor)}</div>

                <div class="metric-sub">Com base em ${diasPassados} de ${totalDias} dias</div>

            </div>

            <div class="metric-card">

                <div class="metric-title">DIFERENÇA PARA PROJEÇÃO</div>

                <div class="metric-value ${diferenca >= 0 ? 'positive-value' : 'negative-value'}">

                    ${diferenca >= 0 ? '+' : '-'} ${formatMoney(Math.abs(diferenca))}

                </div>

                <div class="metric-sub">${diferenca >= 0 ? 'Acima da meta projetada' : 'Abaixo da meta projetada'}</div>

            </div>

            <div class="metric-card" id="baixaAnteriorCardGestor" style="background: linear-gradient(135deg, #0A2F44, #1A5D8F); color: white;">

                <div class="metric-title" style="color: rgba(255,255,255,0.9);">RECEBIDO BAIXA ANTERIOR</div>

                <div class="metric-value" style="color: white; font-size: 1rem;">CARREGANDO...</div>

                <div class="metric-sub" style="color: rgba(255,255,255,0.8); font-size: 0.7rem;">Aguardando dados...</div>

            </div>

            ${quartilCard}

        </div>

    `;

            // ====== MÉTRICAS DIÁRIAS ======

            const metasDiariasHtml = `

        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin: 20px 0;">

            <div style="background: white; border-radius: 20px; padding: 20px; text-align: center; box-shadow: 0 2px 8px rgba(0,0,0,0.06);">

                <div style="font-size: 0.7rem; color: #5F7F9E; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px;">Média Diária Atual</div>

                <div style="font-size: 1.5rem; font-weight: 700; color: #1E6DC3;">${formatMoney(mediaDiariaAtual)}</div>

                <div style="font-size: 0.7rem; color: #5F7F9E; margin-top: 5px;">Por dia até agora</div>

            </div>

            <div style="background: white; border-radius: 20px; padding: 20px; text-align: center; box-shadow: 0 2px 8px rgba(0,0,0,0.06);">

                <div style="font-size: 0.7rem; color: #5F7F9E; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px;">Necessário por Dia</div>

                <div style="font-size: 1.5rem; font-weight: 700; color: ${metaDiariaNecessaria > mediaDiariaAtual ? '#DC3545' : '#28A745'};">${formatMoney(metaDiariaNecessaria)}</div>

                <div style="font-size: 0.7rem; color: #5F7F9E; margin-top: 5px;">${diasRestantes} dias restantes</div>

            </div>

            <div style="background: white; border-radius: 20px; padding: 20px; text-align: center; box-shadow: 0 2px 8px rgba(0,0,0,0.06);">

                <div style="font-size: 0.7rem; color: #5F7F9E; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px;">Status</div>

                <div style="font-size: 1.5rem; font-weight: 700; color: ${estaAdiantado ? '#28A745' : '#DC3545'};">${estaAdiantado ? 'No Ritmo' : 'Atrasado'}</div>

                <div style="font-size: 0.7rem; color: #5F7F9E; margin-top: 5px;">${estaAdiantado ? 'Meta viável' : 'Necessário acelerar'}</div>

            </div>

        </div>

    `;

            // ====== PROGRESSO DO MÊS ======

            const progressoHtml = `

        <div style="background: white; border-radius: 20px; padding: 24px; margin: 20px 0; box-shadow: 0 2px 8px rgba(0,0,0,0.06);">

            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">

                <h4 style="color: #0F3B6F; margin: 0;">Progresso do Mês - Setor</h4>

                <span style="font-size: 0.8rem; color: ${estaAdiantadoMeta ? '#28A745' : '#DC3545'}; font-weight: 700;">

                    ${estaAdiantadoMeta ? 'Adiantado' : 'Atrasado'} ${Math.abs(percentualMeta - percentualTempo).toFixed(1)}%

                </span>

            </div>

            <div style="margin-bottom: 8px;">

                <div style="display: flex; justify-content: space-between; font-size: 0.7rem; color: #5F7F9E;">

                    <span>Início</span>

                    <span>${diasPassados} dias</span>

                    <span>${totalDias} dias</span>

                </div>

                <div style="position: relative; height: 24px; background: #E2E8F0; border-radius: 20px; overflow: visible;">

                    <div style="width: ${Math.min(percentualTempo, 100)}%; height: 100%; background: linear-gradient(90deg, #1E6DC3, #3A86FF); border-radius: 20px; transition: width 0.5s;"></div>

                    <div style="position: absolute; top: -22px; left: ${Math.min(percentualTempo, 95)}%; transform: translateX(-50%); font-size: 0.6rem; font-weight: 700; color: #1E6DC3;">

                        ${percentualTempo.toFixed(0)}%

                    </div>

                </div>

            </div>

            <div>

                <div style="display: flex; justify-content: space-between; font-size: 0.7rem; color: #5F7F9E;">

                    <span>Meta</span>

                    <span>${percentualMeta.toFixed(0)}% alcançada</span>

                    <span>100%</span>

                </div>

                <div style="height: 24px; background: #E2E8F0; border-radius: 20px; overflow: hidden;">

                    <div style="width: ${Math.min(percentualMeta, 100)}%; height: 100%; background: ${percentualMeta >= 100 ? '#28A745' : '#FFC107'}; border-radius: 20px; transition: width 0.5s;"></div>

                </div>

            </div>

        </div>

    `;

            // ====== EVOLUÇÃO DIÁRIA DO SETOR ======

            let evolucaoHtml = `

        <div style="background: white; border-radius: 20px; padding: 20px; margin: 20px 0; box-shadow: 0 2px 8px rgba(0,0,0,0.06);">

            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">

                <h4 style="color: #0F3B6F; margin: 0; font-size: 0.95rem;">Evolução Diária do Setor</h4>

                <span style="font-size: 0.7rem; color: #5F7F9E;">Recebimento por dia (dados reais)</span>

            </div>

            <div id="evolucaoSetorGraficoContainer" style="display: flex; align-items: flex-end; gap: 4px; height: 120px; padding-bottom: 25px; position: relative;">

                <div style="width: 100%; text-align: center; padding: 20px; color: #94A3B8; font-size: 0.85rem;">

                    Carregando dados...

                </div>

            </div>

            <div id="evolucaoSetorResumo" style="display: flex; justify-content: space-between; font-size: 0.6rem; color: #5F7F9E; margin-top: 5px;">

                <span>Total: ${formatMoney(totalRecebidoSetor)}</span>

                <span>Média: ${formatMoney(totalRecebidoSetor / Math.max(diasPassados, 1))}</span>

                <span style="color: #6C757D;">Hoje: --</span>

            </div>

            <div id="evolucaoSetorInfo" style="margin-top: 8px; font-size: 0.6rem; color: #94A3B8; text-align: center; border-top: 1px solid #E9F0F8; padding-top: 8px;">

                Buscando dados da tabela recebimentos...

            </div>

        </div>

    `;

            // ====== RANKING DE EQUIPES ======

            let rankingEquipesHtml = '';

            const dadosEquipes = [];

            for (const eq of equipes) {

                let totalEquipe = 0;

                const membros = usuarios.filter(u => u.equipe_id === eq.id && (u.cargo === 'operador' || u.cargo === 'elite') && u.status === 'ativo');

                for (const m of membros) {

                    const metaUser = metas.find(meta => meta?.usuario_id === m.id && meta?.mes === mes && meta?.ano === ano);

                    if (metaUser) totalEquipe += metaUser.recebido || 0;

                }

                const supervisorEq = usuarios.find(u => u.equipe_id === eq.id && u.cargo === 'supervisor' && u.status === 'ativo');

                if (supervisorEq) {

                    const metaSup = metas.find(meta => meta?.usuario_id === supervisorEq.id && meta?.mes === mes && meta?.ano === ano);

                    if (metaSup) totalEquipe += metaSup.recebido || 0;

                }

                dadosEquipes.push({

                    id: eq.id,

                    nome: eq.nome,

                    total: totalEquipe,

                    membros: membros.length,

                    supervisor: supervisorEq?.nome || 'Não definido'

                });

            }

            dadosEquipes.sort((a, b) => b.total - a.total);

            if (dadosEquipes.length > 0 && dadosEquipes.some(e => e.total > 0)) {

                rankingEquipesHtml = `

        <div style="background: white; border-radius: 20px; padding: 20px; margin: 20px 0; box-shadow: 0 2px 8px rgba(0,0,0,0.06);">

            <h4 style="color: #0F3B6F; margin-bottom: 15px;">Ranking das Equipes</h4>

            <ul class="ranking-list">

                ${dadosEquipes.filter(e => e.total > 0).map((eq, idx) => {

                    // Calcular a projeção da equipe

                    const metaEquipeObj = metasEquipe.find(me => me?.equipe_id === eq.id && me?.mes === mes && me?.ano === ano);

                    const metaEquipe = metaEquipeObj?.meta || 0;

                    const projecaoEquipe = calcularProjecao(metaEquipe, eq.total);

                    // Definir cor baseada nas regras:

                    // 100% ou mais = Verde

                    // 80% a 99.99% = Azul

                    // 40% a 79.99% = Amarelo

                    // Menos de 40% = Vermelho

                    let corProjecao = '#28A745'; // Verde (padrão)

                    let corFundo = '#28A74520';

                    let corBorda = '#28A74540';

                    if (projecaoEquipe >= 100) {

                        corProjecao = '#28A745'; // Verde

                        corFundo = '#28A74520';

                        corBorda = '#28A74540';

                    } else if (projecaoEquipe >= 80) {

                        corProjecao = '#1E6DC3'; // Azul

                        corFundo = '#1E6DC320';

                        corBorda = '#1E6DC340';

                    } else if (projecaoEquipe >= 40) {

                        corProjecao = '#FFC107'; // Amarelo

                        corFundo = '#FFC10720';

                        corBorda = '#FFC10740';

                    } else {

                        corProjecao = '#DC3545'; // Vermelho

                        corFundo = '#DC354520';

                        corBorda = '#DC354540';

                    }

                    return `

                    <li style="${idx < 3 ? 'background: #FFF8E7; border-radius: 12px; padding: 12px; margin: 4px 0;' : ''}">

                        <div class="ranking-position" style="${idx === 0 ? 'background: #FFD700; color: #000;' : idx === 1 ? 'background: #C0C0C0; color: #000;' : idx === 2 ? 'background: #CD7F32; color: #000;' : ''}">${idx + 1}</div>

                        <div class="ranking-name">${eq.nome}</div>

                        <div style="display: flex; align-items: center; gap: 15px; flex-wrap: wrap;">

                            <span style="font-size: 0.7rem; color: #5F7F9E;">${eq.membros} membros</span>

                            <div class="ranking-value">${formatMoney(eq.total)}</div>

                            <span style="display: inline-block; padding: 2px 12px; border-radius: 20px; font-weight: 700; font-size: 0.75rem; background: ${corFundo}; color: ${corProjecao}; border: 1px solid ${corBorda};">

                                ${projecaoEquipe.toFixed(2)}%

                            </span>

                        </div>

                    </li>

                `}).join('')}

            </ul>

        </div>

    `;

            }

            // ====== HTML FINAL ======

            const html = `

        ${cardsHtml}

        ${metasDiariasHtml}

        ${progressoHtml}

        ${evolucaoHtml}

        ${rankingEquipesHtml}

    `;

            const gDiv = document.getElementById('gestorDashboardContent'); if (gDiv) gDiv.innerHTML = html;
            const vsDiv = document.getElementById('visaoSetorContent'); if (vsDiv) vsDiv.innerHTML = html;

            document.getElementById('gestorDashboardContent').classList.remove('hidden');

            document.getElementById('supervisorDashboardContent').classList.add('hidden');

            document.getElementById('operadorDashboardContent').classList.add('hidden');

            document.getElementById('eliteDashboardContent').classList.add('hidden');

            document.getElementById('motivationalMessage').innerHTML = `Visão Geral do Setor - ${currentUser.nome}`;

            // ====== BUSCAR BAIXA ANTERIOR DO SETOR ======

            calcularRecebidoBaixaAnteriorSetor().then(baixaAnterior => {

                const card = document.getElementById('baixaAnteriorCardGestor');

                if (card) {

                    card.innerHTML = `

                <div class="metric-title" style="color: rgba(255,255,255,0.9);">RECEBIDO BAIXA ANTERIOR</div>

                <div class="metric-value" style="color: #17A2B8; font-size: 1.5rem;">${formatMoney(baixaAnterior.valor)}</div>

                <div class="metric-sub" style="color: rgba(255,255,255,0.8); font-size: 0.65rem;">${baixaAnterior.mensagem}</div>

            `;

                }

            }).catch(error => {

                console.error('Erro ao carregar baixa anterior do setor:', error);

            });

            // ====== BUSCAR DADOS REAIS DOS RECEBIMENTOS DO SETOR ======

            (async function buscarRecebimentosReaisSetor() {

                try {

                    const anoAtual = hoje.getFullYear();

                    const mesAtual = String(hoje.getMonth() + 1).padStart(2, '0');

                    const diaAtual = String(hoje.getDate()).padStart(2, '0');

                    const hojeStr = `${anoAtual}-${mesAtual}-${diaAtual}`;

                    const primeiroDiaStr = `${anoAtual}-${mesAtual}-01`;

                    const dadosPorDia = {};

                    let totalRecebidoReal = 0;

                    const userIds = usuarios.filter(u => u.status === 'ativo').map(u => u.id);

                    for (const userId of userIds) {

                        try {

                            const url = `${SUPABASE_URL}/rest/v1/recebimentos?usuario_id=eq.${userId}&data_pagamento=gte.${primeiroDiaStr}&data_pagamento=lte.${hojeStr}&select=data_pagamento,valor_recebido&order=data_pagamento.asc`;

                            const res = await fetch(url, {

                                headers: {

                                    'apikey': SUPABASE_ANON_KEY,

                                    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`

                                }

                            });

                            if (res.ok) {

                                const data = await res.json();

                                for (const r of data) {

                                    if (!r.data_pagamento) continue;

                                    const dataStr = r.data_pagamento;

                                    let dia = 0;

                                    if (typeof dataStr === 'string' && dataStr.includes('-')) {

                                        const partes = dataStr.split('-');

                                        if (partes.length === 3) {

                                            dia = parseInt(partes[2], 10);

                                        }

                                    }

                                    if (dia > 0 && dia <= 31) {

                                        if (!dadosPorDia[dia]) dadosPorDia[dia] = 0;

                                        dadosPorDia[dia] += r.valor_recebido || 0;

                                        totalRecebidoReal += r.valor_recebido || 0;

                                    }

                                }

                            }

                        } catch (e) {

                            console.warn('Erro ao buscar recebimentos:', e);

                        }

                    }

                    if (dadosPorDia[1] === undefined || dadosPorDia[1] === 0) {

                        if (dadosPorDia[2] && dadosPorDia[2] > 30000) {

                            const dadosCorrigidos = {};

                            for (const dia in dadosPorDia) {

                                const diaNum = parseInt(dia, 10);

                                const novoDia = diaNum - 1;

                                if (novoDia >= 1) {

                                    dadosCorrigidos[novoDia] = dadosPorDia[diaNum];

                                }

                            }

                            for (const dia in dadosCorrigidos) {

                                dadosPorDia[dia] = dadosCorrigidos[dia];

                            }

                            delete dadosPorDia[0];

                        }

                    }

                    atualizarEvolucaoSetor(dadosPorDia, totalRecebidoSetor);

                } catch (e) {

                    console.warn('Erro ao buscar recebimentos do setor:', e);

                    const container = document.getElementById('evolucaoSetorGraficoContainer');

                    if (container) {

                        container.innerHTML = `

                    <div style="width: 100%; text-align: center; padding: 20px; color: #DC3545; font-size: 0.85rem;">

                        Erro ao carregar dados. Tente novamente.

                    </div>

                `;

                    }

                }

            })();

            // Botão analítico

            const btnAnalitico = document.getElementById('btnAnalitico');

            if (btnAnalitico) btnAnalitico.style.display = 'inline-block';

        }

        function atualizarEvolucaoSetor(dadosPorDia, totalMetas) {

            const container = document.getElementById('evolucaoSetorGraficoContainer');

            if (!container) return;

            const metaSetor = getMetaSetor();

            // 🔥 CORREÇÃO: Meta diária do setor

            const metaDiariaSetor = metaSetor / getDiasUteis();

            if (!dadosPorDia || Object.keys(dadosPorDia).length === 0) {

                container.innerHTML = `

            <div style="width: 100%; text-align: center; padding: 30px; color: #94A3B8; font-size: 0.85rem;">

                Nenhum recebimento encontrado para o setor.

            </div>

        `;

                return;

            }

            // Ajustar dados para exibição

            let dadosExibicao = {};

            const totalRecebidoReal = Object.values(dadosPorDia).reduce((sum, val) => sum + val, 0);

            if (totalRecebidoReal > 0 && Math.abs(totalRecebidoReal - totalMetas) > 0.01) {

                const fatorAjuste = totalMetas / totalRecebidoReal;

                for (const dia in dadosPorDia) {

                    dadosExibicao[dia] = dadosPorDia[dia] * fatorAjuste;

                }

            } else {

                dadosExibicao = { ...dadosPorDia };

            }

            // 🔥 CORREÇÃO: Passar metaDiariaSetor em vez de totalMetas

            renderizarGraficoMisto(

                'evolucaoSetorGraficoContainer',

                dadosExibicao,

                metaDiariaSetor,

                'Evolução do Setor',

                'Meta Diária do Setor'

            );

            const info = document.getElementById('evolucaoSetorInfo');

            if (info) {

                const totalExibido = Object.values(dadosExibicao).reduce((sum, val) => sum + val, 0);

                info.innerHTML = `${Object.keys(dadosPorDia).length} dias com recebimento | Total: ${formatMoney(totalExibido)} | Meta diária do setor: ${formatMoney(metaDiariaSetor)}`;

            }

        }

        // ============================================

        // FUNÇÃO PARA ATUALIZAR EVOLUÇÃO DIÁRIA DO SUPERVISOR

        // ============================================

        function atualizarEvolucaoDiaria(dadosPorDia, totalMetas) {

            const container = document.getElementById('evolucaoGraficoContainer');

            if (!container) return;

            const diasPassados = getDiasPassados();

            const mes = new Date().getMonth() + 1;

            const ano = new Date().getFullYear();

            const metaEquipeObj = metasEquipe.find(me => me?.equipe_id === currentUser.equipe_id && me?.mes === mes && me?.ano === ano);

            const metaEquipe = metaEquipeObj?.meta || 0;

            const metaDiariaEquipe = metaEquipe / getDiasUteis();

            if (!dadosPorDia || Object.keys(dadosPorDia).length === 0) {

                container.innerHTML = `

            <div style="width: 100%; text-align: center; padding: 30px; color: #94A3B8; font-size: 0.85rem;">

                Nenhum recebimento encontrado para esta equipe.

            </div>

        `;

                return;

            }

            let dadosExibicao = {};

            const totalRecebidoReal = Object.values(dadosPorDia).reduce((sum, val) => sum + val, 0);

            if (totalRecebidoReal > 0 && Math.abs(totalRecebidoReal - totalMetas) > 0.01) {

                const fatorAjuste = totalMetas / totalRecebidoReal;

                for (const dia in dadosPorDia) {

                    dadosExibicao[dia] = dadosPorDia[dia] * fatorAjuste;

                }

            } else {

                dadosExibicao = { ...dadosPorDia };

            }

            renderizarGraficoMisto(

                'evolucaoGraficoContainer',

                dadosExibicao,

                metaDiariaEquipe,

                'Evolução da Equipe',

                'Meta Diária da Equipe'

            );

            const info = document.getElementById('evolucaoInfo');

            if (info) {

                const totalExibido = Object.values(dadosExibicao).reduce((sum, val) => sum + val, 0);

                info.innerHTML = `${Object.keys(dadosPorDia).length} dias com recebimento | Total: ${formatMoney(totalExibido)} | Meta diária da equipe: ${formatMoney(metaDiariaEquipe)}`;

            }

        }

        function carregarDashboard() {

            if (!currentUser) return;

            document.getElementById('diasPassadosDisplay').innerHTML = getDiasPassados();

            document.getElementById('diasRestantesDisplay').innerHTML = getDiasRestantes();

            document.getElementById('totalDiasDisplay').innerHTML = getDiasUteis();

            const btnAnalitico = document.getElementById('btnAnalitico');

            // 🔥 Criar quadrante para todos os perfis

            criarQuadranteFlutuante();

            iniciarAtualizacaoQuadrante();

            if (currentUser.cargo === 'gestor') {

                document.getElementById('supervisorDashboardContent').classList.add('hidden');

                document.getElementById('operadorDashboardContent').classList.add('hidden');

                document.getElementById('eliteDashboardContent').classList.add('hidden');

                document.getElementById('gestorDashboardContent').classList.remove('hidden');

                carregarDashboardGestor();

                if (btnAnalitico) btnAnalitico.style.display = 'inline-block';

            } else if (currentUser.cargo === 'supervisor') {

                document.getElementById('gestorDashboardContent').classList.add('hidden');

                document.getElementById('operadorDashboardContent').classList.add('hidden');

                document.getElementById('eliteDashboardContent').classList.add('hidden');

                document.getElementById('supervisorDashboardContent').classList.remove('hidden');

                carregarSupervisorDashboard();

                if (btnAnalitico) btnAnalitico.style.display = 'inline-block';

            } else if (currentUser.cargo === 'operador' || currentUser.cargo === 'elite') {

                document.getElementById('gestorDashboardContent').classList.add('hidden');

                document.getElementById('supervisorDashboardContent').classList.add('hidden');

                document.getElementById('eliteDashboardContent').classList.add('hidden');

                document.getElementById('operadorDashboardContent').classList.remove('hidden');

                carregarOperadorDashboard();

                if (btnAnalitico) btnAnalitico.style.display = 'inline-block';

            }

            setTimeout(function () {

                const btn = document.getElementById('btnAnalitico');

                if (btn) {

                    btn.style.display = 'inline-block';

                    btn.style.visibility = 'visible';

                }

            }, 100);

        }

        // ============================================

        // FUNÇÕES ADMIN E CRUD

        // ============================================

        function carregarEquipesTabGestor() {

            const mes = new Date().getMonth() + 1, ano = new Date().getFullYear();

            let html = '';

            for (let eq of equipes) {

                let metaEquipe = metasEquipe.find(me => me?.equipe_id === eq.id && me?.mes === mes && me?.ano === ano);

                let metaValor = metaEquipe?.meta || 100000;

                // MEMBROS: operadores + elite (sem o supervisor)

                let membros = usuarios.filter(u => u.equipe_id === eq.id && (u.cargo === 'operador' || u.cargo === 'elite') && u.status === 'ativo');

                // 🔥 CORREÇÃO: Buscar o supervisor/gestor da equipe

                let supervisorEquipe = usuarios.find(u => u.equipe_id === eq.id && (u.cargo === 'supervisor' || u.cargo === 'gestor') && u.status === 'ativo');

                let totalRecebido = 0;

                // Soma dos operadores e elite

                for (let m of membros) {

                    let mo = metas.find(meta => meta?.usuario_id === m.id && meta?.mes === mes && meta?.ano === ano);

                    if (mo) totalRecebido += mo.recebido || 0;

                }

                // 🔥 CORREÇÃO: Somar também o recebido do supervisor/gestor (se existir)

                if (supervisorEquipe) {

                    let metaSupervisor = metas.find(meta => meta?.usuario_id === supervisorEquipe.id && meta?.mes === mes && meta?.ano === ano);

                    if (metaSupervisor) totalRecebido += metaSupervisor.recebido || 0;

                }

                let alcance = calcularAlcance(metaValor, totalRecebido);

                let supervisor = usuarios.find(u => u.equipe_id === eq.id && (u.cargo === 'supervisor' || u.cargo === 'gestor'));

                let isCollapsed = equipesCollapsed[eq.id] || false;

                html += `<div class="equipe-card-modern"><div class="equipe-header" onclick="toggleEquipe('${eq.id}')"><div class="equipe-nome">${eq.nome}</div><div class="equipe-stats">${formatMoney(totalRecebido)} / ${formatMoney(metaValor)}</div><span class="equipe-collapse-icon" id="equipe-icon-${eq.id}">${isCollapsed ? '▶' : '▼'}</span></div>

            <div class="equipe-content ${isCollapsed ? 'collapsed' : ''}" id="equipe-content-${eq.id}"><div class="equipe-info-grid"><div class="equipe-info-item"><div class="equipe-info-label">Membros</div><div class="equipe-info-value">${membros.length + (supervisorEquipe ? 1 : 0)}</div></div><div class="equipe-info-item"><div class="equipe-info-label">Alcance</div><div class="equipe-info-value">${alcance.toFixed(1)}%</div></div><div class="equipe-info-item"><div class="equipe-info-label"> Responsável</div><div class="equipe-info-value">${supervisor?.nome || 'Não definido'}</div></div></div>

                <div class="progress-bar-simple"><div class="progress-fill" style="width: ${Math.min(alcance, 100)}%; background: ${alcance >= 100 ? '#1E7B4B' : '#1E6DC3'};">${formatMoney(totalRecebido)}</div></div>

                <div class="equipe-actions"><button onclick="abrirModalEditarEquipe('${eq.id}', '${eq.nome}', ${metaValor}, '${supervisor?.id || ''}')" class="btn-edit-equipe">Editar</button><button onclick="abrirModalExcluirEquipe('${eq.id}', '${eq.nome}')" class="btn-delete-equipe">Excluir</button></div></div></div>`;

            }

            // Exibir operadores sem equipe vinculada para acompanhamento do gestor
            let membrosSemEquipe = usuarios.filter(u => (!u.equipe_id || u.equipe_id === '') && (u.cargo === 'operador' || u.cargo === 'elite') && u.status === 'ativo');
            if (membrosSemEquipe.length > 0) {
                let totalRecebidoSemEq = 0;
                for (let m of membrosSemEquipe) {
                    let mo = metas.find(meta => String(meta?.usuario_id) === String(m.id) && meta?.mes === mes && meta?.ano === ano);
                    if (mo) totalRecebidoSemEq += mo.recebido || 0;
                }
                let isCollapsedSemEq = equipesCollapsed['sem_equipe'] || false;
                html += `<div class="equipe-card-modern" style="border-left: 4px solid #FFC107;"><div class="equipe-header" onclick="toggleEquipe('sem_equipe')"><div class="equipe-nome" style="color: #856404;">⚠️ Sem Equipe Vinculada</div><div class="equipe-stats">${formatMoney(totalRecebidoSemEq)}</div><span class="equipe-collapse-icon" id="equipe-icon-sem_equipe">${isCollapsedSemEq ? '▶' : '▼'}</span></div>
            <div class="equipe-content ${isCollapsedSemEq ? 'collapsed' : ''}" id="equipe-content-sem_equipe"><div class="equipe-info-grid"><div class="equipe-info-item"><div class="equipe-info-label">Membros</div><div class="equipe-info-value">${membrosSemEquipe.length}</div></div><div class="equipe-info-item"><div class="equipe-info-label">Operadores</div><div class="equipe-info-value" style="font-size:0.75rem;">${membrosSemEquipe.map(u => u.nome).join(', ')}</div></div></div>
                <div class="progress-bar-simple"><div class="progress-fill" style="width: 100%; background: #FFC107; color: #0F2E52;">${formatMoney(totalRecebidoSemEq)}</div></div>
                <p style="font-size: 0.75rem; color: #64748B; margin-top: 8px;">Dica: Edite esses operadores na aba "Operadores" para vinculá-los às suas respectivas equipes.</p></div></div>`;
            }

            document.getElementById('equipesContainer').innerHTML = html || '<p style="text-align:center; padding:40px;">Nenhuma equipe cadastrada. Clique em "Nova Equipe" para começar.</p>';

        }

        window.abrirModalEditarEquipe = async (id, nomeAtual, metaAtual, supervisorAtual) => {

            const supervisoresDisponiveis = usuarios.filter(u => u.cargo === 'supervisor' || u.cargo === 'gestor');

            let options = '<option value="">Nenhum</option>';

            for (let sup of supervisoresDisponiveis) { options += `<option value="${sup.id}" ${sup.id == supervisorAtual ? 'selected' : ''}>${sup.nome} (${sup.cargo})</option>`; }

            document.getElementById('editModal').innerHTML = `<div class="modal-overlay"><div class="modal-content"><h3>Editar Equipe: ${nomeAtual}</h3><div class="modal-field"><label> Nome da Equipe</label><input type="text" id="edit_equipe_nome" value="${nomeAtual}"></div><div class="modal-field"><label> Meta da Equipe (R$)</label><input type="text" id="edit_equipe_meta" value="${formatMoney(metaAtual)}" oninput="formatarInputMoeda(this)"></div><div class="modal-field"><label> Responsável</label><select id="edit_equipe_supervisor">${options}</select></div><div class="modal-actions"><button class="btn-modal-cancel" onclick="fecharModal()">Cancelar</button><button class="btn-modal-save" onclick="salvarEdicaoEquipe('${id}', '${nomeAtual}')">Salvar</button></div></div></div>`;

            document.getElementById('editModal').style.display = 'block';

        };

        window.salvarEdicaoEquipe = async (id, nomeAntigo) => {

            const novoNome = document.getElementById('edit_equipe_nome').value;

            const novaMeta = parseMoneyToNumber(document.getElementById('edit_equipe_meta').value);

            const supervisorId = document.getElementById('edit_equipe_supervisor').value || null;

            const mes = new Date().getMonth() + 1;

            const ano = new Date().getFullYear();

            // 1. Atualizar nome da equipe se mudou

            if (novoNome && novoNome !== nomeAntigo) {

                await updateIn('equipes', id, { nome: novoNome });

            }

            // 2. Atualizar supervisor (remover do antigo e adicionar novo)

            const supervisorAntigo = usuarios.find(u => u.equipe_id === Number(id) && (u.cargo === 'supervisor' || u.cargo === 'gestor'));

            if (supervisorAntigo && supervisorAntigo.id !== Number(supervisorId)) {

                await updateIn('usuarios', supervisorAntigo.id, { equipe_id: null });

            }

            if (supervisorId) {

                await updateIn('usuarios', supervisorId, { equipe_id: id });

            }

            // 3. Atualizar ou criar meta da equipe (CORREÇÃO AQUI!)

            // Primeiro, buscar se já existe meta para esta equipe no mês/ano atual

            const metaExistente = metasEquipe.find(me => Number(me?.equipe_id) === Number(id) && Number(me?.mes) === Number(mes) && Number(me?.ano) === Number(ano));
            await updateMetaEquipe(Number(id), mes, ano, novaMeta, metaExistente?.id);

            await registrarHistorico('edicao', `Equipe "${nomeAntigo}" editada${novoNome !== nomeAntigo ? ` para "${novoNome}"` : ''}`);

            fecharModal();

            await atualizarDadosImediatos();

            showToast(' Equipe atualizada com sucesso!');

        };

        window.abrirModalExcluirEquipe = (id, nome) => {

            document.getElementById('editModal').innerHTML = `<div class="modal-overlay"><div class="modal-content"><h3>️ Confirmar Exclusão de Equipe</h3><p style="margin: 20px 0; text-align: center;">Tem certeza que deseja EXCLUIR a equipe <strong>${nome}</strong>?</p><div class="modal-actions"><button class="btn-modal-cancel" onclick="fecharModal()">Cancelar</button><button class="btn-danger" style="flex: 1;" onclick="confirmarExcluirEquipe('${id}', '${nome}')">Confirmar Exclusão</button></div></div></div>`;

            document.getElementById('editModal').style.display = 'block';

        };

        window.confirmarExcluirEquipe = async (id, nome) => {

            const membros = usuarios.filter(u => u.equipe_id === id);

            for (let m of membros) { await updateIn('usuarios', m.id, { equipe_id: null }); }

            const metasEq = metasEquipe.filter(me => me.equipe_id === id);

            for (let me of metasEq) { await deleteFrom('metas_equipe', me.id); }

            await deleteFrom('equipes', id);

            await registrarHistorico('exclusao', `Equipe "${nome}" excluída`);

            fecharModal();

            await atualizarDadosImediatos();

            showToast(` Equipe excluída!`);

        };

        function carregarOperadoresTabGestor() {

            const mes = new Date().getMonth() + 1;

            const ano = new Date().getFullYear();

            const hoje = new Date();

            const anoHoje = hoje.getFullYear();

            const mesHoje = String(hoje.getMonth() + 1).padStart(2, '0');

            const diaHoje = String(hoje.getDate()).padStart(2, '0');

            const dataHojeStr = `${anoHoje}-${mesHoje}-${diaHoje}`;

            const operadoresTab = document.getElementById('operadoresTab');

            operadoresTab.innerHTML = `

        <div class="admin-table">

            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; flex-wrap: wrap; gap: 15px;">

                <h3 style="color:#0F3B6F; margin:0;"> Lista de Usuários</h3>

                <div style="display: flex; gap: 10px; flex-wrap: wrap;">

                    <button onclick="abrirModalResetRecebimentos()" class="btn-danger" style="background: #DC3545; color: white; border: none; padding: 10px 24px; border-radius: 40px; cursor: pointer; font-weight: 700; transition: 0.2s;"> Reset</button>

                    <button onclick="abrirImportacaoExcel()" class="btn-importar"> Importar Excel</button>

                </div>

            </div>

            <div id="filtrosContainerModern" class="filtros-container-modern"></div>

            <div class="operadores-table-container" id="operadoresTableContainer"></div>

        </div>

    `;

            // Atualiza as referências

            const filtrosContainer = document.getElementById('filtrosContainerModern');

            const tabelaContainer = document.getElementById('operadoresTableContainer');

            // ============================================

            // BUSCAR DADOS DOS USUÁRIOS

            // ============================================

            const usuariosAtivos = usuarios.filter(u =>

                (u.cargo === 'operador' || u.cargo === 'elite' || u.cargo === 'supervisor' || u.cargo === 'gestor') &&

                u.status === 'ativo'

            );

            const dadosUsuarios = usuariosAtivos.map(usr => {

                const metaObj = metas.find(m => m?.usuario_id === usr.id && m?.mes === mes && m?.ano === ano) || {

                    meta: 0,

                    direto: 0,

                    extra: 0,

                    recebido: 0,

                    por_fora_direto: 0,

                    por_fora_extra: 0

                };

                const projecao = calcularProjecao(metaObj.meta, metaObj.recebido);

                let cargoLabel = '';

                if (usr.cargo === 'operador') cargoLabel = ' Operador';

                else if (usr.cargo === 'elite') cargoLabel = 'Elite';

                else if (usr.cargo === 'supervisor') cargoLabel = '️ Supervisor';

                else if (usr.cargo === 'gestor') cargoLabel = ' Gestor';

                return {

                    id: usr.id,

                    nome: usr.nome,

                    classe: usr.classe || 'Sem classe',

                    equipe: getEquipeNome(usr.equipe_id),

                    cargo: cargoLabel,

                    status: usr.status || 'ativo',

                    meta: metaObj.meta,

                    direto: metaObj.direto,

                    extra: metaObj.extra,

                    recebido: metaObj.recebido,

                    por_fora_direto: metaObj.por_fora_direto || 0,

                    por_fora_extra: metaObj.por_fora_extra || 0,

                    por_fora: (metaObj.por_fora_direto || 0) + (metaObj.por_fora_extra || 0),

                    projecao: projecao,

                    projecaoCor: getProjecaoColor(projecao),

                    hoje: 0

                };

            }).filter(u => u.status !== 'inativo');

            // ============================================

            // BUSCAR RECEBIMENTOS DE HOJE

            // ============================================

            (async function buscarRecebimentosHoje() {

                try {

                    const url = `${SUPABASE_URL}/rest/v1/recebimentos?data_pagamento=eq.${dataHojeStr}&select=usuario_id,valor_recebido`;

                    const res = await fetch(url, {

                        headers: {

                            'apikey': SUPABASE_ANON_KEY,

                            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`

                        }

                    });

                    if (res.ok) {

                        const registros = await res.json();

                        const totais = {};

                        for (const reg of registros) {

                            const userId = reg.usuario_id;

                            if (!totais[userId]) totais[userId] = 0;

                            totais[userId] += reg.valor_recebido || 0;

                        }

                        for (const user of dadosUsuarios) {

                            user.hoje = totais[user.id] || 0;

                        }

                    }

                } catch (e) {

                    console.warn('Erro ao buscar recebimentos do dia:', e);

                }

            })();

            // ============================================

            // GERAR FILTROS

            // ============================================

            const classesDisponiveis = [...new Set(dadosUsuarios.map(u => u.classe))];

            const equipesDisponiveis = [...new Set(dadosUsuarios.map(u => u.equipe))];

            const multiSelectClassHtml = `

        <div class="multi-select-container" id="multiSelectClass">

            <div class="multi-select-btn" onclick="toggleMultiSelect('class')">

                <span id="classSelectedText">${filtrosOperadores.classes.length > 0 ? `${filtrosOperadores.classes.length} classe(s) selecionada(s)` : 'Todas as classes'}</span>

                <span>▼</span>

            </div>

            <div class="multi-select-dropdown" id="multiSelectClassDropdown">

                ${classesDisponiveis.map(c => `<label><input type="checkbox" value="${c}" ${filtrosOperadores.classes.includes(c) ? 'checked' : ''} onchange="atualizarFiltroClass()"> ${c}</label>`).join('')}

            </div>

        </div>

    `;

            const multiSelectEquipeHtml = `

        <div class="multi-select-container" id="multiSelectEquipe">

            <div class="multi-select-btn" onclick="toggleMultiSelect('equipe')">

                <span id="equipeSelectedText">${filtrosOperadores.equipes.length > 0 ? `${filtrosOperadores.equipes.length} equipe(s) selecionada(s)` : 'Todas as equipes'}</span>

                <span>▼</span>

            </div>

            <div class="multi-select-dropdown" id="multiSelectEquipeDropdown">

                ${equipesDisponiveis.map(e => `<label><input type="checkbox" value="${e}" ${filtrosOperadores.equipes.includes(e) ? 'checked' : ''} onchange="atualizarFiltroEquipe()"> ${e}</label>`).join('')}

            </div>

        </div>

    `;

            const filtrosHtml = `

        <div class="filtros-grid">

            <div class="filtro-item">

                <label>Ordenar por</label>

                <select id="filtroOrdenacao" onchange="aplicarFiltros()">

                    <option value="projecao_desc" ${filtrosOperadores.ordenacao === 'projecao_desc' ? 'selected' : ''}>Projeção (maior → menor)</option>

                    <option value="projecao_asc" ${filtrosOperadores.ordenacao === 'projecao_asc' ? 'selected' : ''}>Projeção (menor → maior)</option>

                    <option value="recebido_desc" ${filtrosOperadores.ordenacao === 'recebido_desc' ? 'selected' : ''}>Total Recebido (maior → menor)</option>

                    <option value="recebido_asc" ${filtrosOperadores.ordenacao === 'recebido_asc' ? 'selected' : ''}>Total Recebido (menor → maior)</option>

                    <option value="direto_desc" ${filtrosOperadores.ordenacao === 'direto_desc' ? 'selected' : ''}>Direto (maior → menor)</option>

                    <option value="direto_asc" ${filtrosOperadores.ordenacao === 'direto_asc' ? 'selected' : ''}>Direto (menor → maior)</option>

                    <option value="extra_desc" ${filtrosOperadores.ordenacao === 'extra_desc' ? 'selected' : ''}>Extra (maior → menor)</option>

                    <option value="extra_asc" ${filtrosOperadores.ordenacao === 'extra_asc' ? 'selected' : ''}>Extra (menor → maior)</option>

                    <option value="hoje_desc" ${filtrosOperadores.ordenacao === 'hoje_desc' ? 'selected' : ''}> Hoje (maior → menor)</option>

                    <option value="hoje_asc" ${filtrosOperadores.ordenacao === 'hoje_asc' ? 'selected' : ''}> Hoje (menor → maior)</option>

                    <option value="nome_asc" ${filtrosOperadores.ordenacao === 'nome_asc' ? 'selected' : ''}>Nome (A → Z)</option>

                </select>

            </div>

            <div class="filtro-item">

                <label>Classe</label>

                ${multiSelectClassHtml}

            </div>

            <div class="filtro-item">

                <label>Equipe</label>

                ${multiSelectEquipeHtml}

            </div>

            <div class="filtro-item">

                <label>Buscar por nome</label>

                <input type="text" id="filtroBusca" placeholder="Digite o nome..." value="${filtrosOperadores.busca}" oninput="atualizarFiltroBusca()">

            </div>

        </div>

        <div class="filtro-actions">

            <button class="btn-limpar" onclick="limparFiltros()">Limpar Filtros</button>

            <button class="btn-aplicar" onclick="aplicarFiltros()">Aplicar Filtros</button>

        </div>

        <div class="filtro-resumo" id="filtroResumo"></div>

    `;

            filtrosContainer.innerHTML = filtrosHtml;

            // ============================================

            // FUNÇÕES AUXILIARES DOS FILTROS

            // ============================================

            window.toggleMultiSelect = (tipo) => {

                const dropdown = document.getElementById(`multiSelect${tipo.charAt(0).toUpperCase() + tipo.slice(1)}Dropdown`);

                if (dropdown) dropdown.classList.toggle('show');

            };

            window.atualizarFiltroClass = () => {

                const checkboxes = document.querySelectorAll('#multiSelectClassDropdown input[type="checkbox"]');

                filtrosOperadores.classes = Array.from(checkboxes).filter(cb => cb.checked).map(cb => cb.value);

                const textSpan = document.getElementById('classSelectedText');

                if (textSpan) {

                    textSpan.innerText = filtrosOperadores.classes.length > 0 ?

                        `${filtrosOperadores.classes.length} classe(s) selecionada(s)` :

                        'Todas as classes';

                }

            };

            window.atualizarFiltroEquipe = () => {

                const checkboxes = document.querySelectorAll('#multiSelectEquipeDropdown input[type="checkbox"]');

                filtrosOperadores.equipes = Array.from(checkboxes).filter(cb => cb.checked).map(cb => cb.value);

                const textSpan = document.getElementById('equipeSelectedText');

                if (textSpan) {

                    textSpan.innerText = filtrosOperadores.equipes.length > 0 ?

                        `${filtrosOperadores.equipes.length} equipe(s) selecionada(s)` :

                        'Todas as equipes';

                }

            };

            window.atualizarFiltroBusca = () => {

                filtrosOperadores.busca = document.getElementById('filtroBusca').value;

            };

            // Fechar dropdowns ao clicar fora

            document.addEventListener('click', (e) => {

                if (!e.target.closest('.multi-select-container')) {

                    document.querySelectorAll('.multi-select-dropdown').forEach(drop => drop.classList.remove('show'));

                }

            });

            // ============================================

            // APLICAR FILTROS E RENDERIZAR TABELA

            // ============================================

            window.aplicarFiltros = () => {

                const ordenacao = document.getElementById('filtroOrdenacao').value;

                filtrosOperadores.ordenacao = ordenacao;

                salvarFiltrosOperadores();

                let dadosFiltrados = [...dadosUsuarios];

                if (filtrosOperadores.classes.length > 0) {

                    dadosFiltrados = dadosFiltrados.filter(u => filtrosOperadores.classes.includes(u.classe));

                }

                if (filtrosOperadores.equipes.length > 0) {

                    dadosFiltrados = dadosFiltrados.filter(u => filtrosOperadores.equipes.includes(u.equipe));

                }

                if (filtrosOperadores.busca) {

                    dadosFiltrados = dadosFiltrados.filter(u =>

                        u.nome.toLowerCase().includes(filtrosOperadores.busca.toLowerCase())

                    );

                }

                // Ordenação

                const [campo, ordem] = ordenacao.split('_');

                dadosFiltrados.sort((a, b) => {

                    let valA, valB;

                    switch (campo) {

                        case 'projecao': valA = a.projecao; valB = b.projecao; break;

                        case 'recebido': valA = a.recebido; valB = b.recebido; break;

                        case 'direto': valA = a.direto; valB = b.direto; break;

                        case 'extra': valA = a.extra; valB = b.extra; break;

                        case 'por_fora': valA = a.por_fora || 0; valB = b.por_fora || 0; break;

                        case 'hoje': valA = a.hoje || 0; valB = b.hoje || 0; break;

                        case 'nome': valA = a.nome; valB = b.nome; break;

                        default: valA = a.projecao; valB = b.projecao;

                    }

                    if (ordem === 'desc') return valB - valA;

                    if (ordem === 'asc') return valA - valB;

                    if (campo === 'nome') return ordem === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);

                    return 0;

                });

                // ============================================

                // RENDERIZAR TABELA

                // ============================================

                const tabelaHtml = `

            <table class="operadores-table">

                <thead>

                    <tr>

                        <th style="width: 44px; text-align: center;"></th>

                        <th style="cursor: pointer;" onclick="ordenarPor('nome')">Nome <span class="sort-indicator">${ordenacao === 'nome_asc' ? '↑' : ordenacao === 'nome_desc' ? '↓' : ''}</span></th>

                        <th>Função</th>

                        <th>Classe</th>

                        <th>Equipe</th>

                        <th style="cursor: pointer;" onclick="ordenarPor('direto')">Direto <span class="sort-indicator">${ordenacao === 'direto_desc' ? '↓' : ordenacao === 'direto_asc' ? '↑' : ''}</span></th>

                        <th style="cursor: pointer;" onclick="ordenarPor('extra')">Extra <span class="sort-indicator">${ordenacao === 'extra_desc' ? '↓' : ordenacao === 'extra_asc' ? '↑' : ''}</span></th>

                        <th style="cursor: pointer;" onclick="ordenarPor('recebido')">Total <span class="sort-indicator">${ordenacao === 'recebido_desc' ? '↓' : ordenacao === 'recebido_asc' ? '↑' : ''}</span></th>

                        <th style="cursor: pointer; background: #28A745; color: white; border-radius: 8px;" onclick="ordenarPor('hoje')">Hoje <span class="sort-indicator">${ordenacao === 'hoje_desc' ? '↓' : ordenacao === 'hoje_asc' ? '↑' : ''}</span></th>

                        <th style="cursor: pointer;" onclick="ordenarPor('projecao')">Projeção <span class="sort-indicator">${ordenacao === 'projecao_desc' ? '↓' : ordenacao === 'projecao_asc' ? '↑' : ''}</span></th>

                        <th style="cursor: pointer;" onclick="ordenarPor('por_fora')">Por fora <span class="sort-indicator">${ordenacao === 'por_fora_desc' ? '↓' : ordenacao === 'por_fora_asc' ? '↑' : ''}</span></th>

                    </tr>

                </thead>

                <tbody>

                    ${dadosFiltrados.map((u, idx) => {

                    const usuarioCompleto = usuarios.find(usr => usr.id === u.id);

                    const fotoBase64 = usuarioCompleto?.foto || null;

                    const hasPhoto = !!fotoBase64;

                    //  CÓDIGO NOVO:

                    let fotoHtml = '';

                    if (hasPhoto) {

                        fotoHtml = `<img src="${fotoBase64}" 

                     alt="${u.nome}" 

                     style="width: 36px; height: 36px; border-radius: 50%; object-fit: cover; border: 2px solid #28A745; cursor: pointer; transition: transform 0.2s, box-shadow 0.2s;"

                     onerror="this.style.display='none'; this.parentElement.innerHTML='<span style=\\'font-size:14px;font-weight:700;color:#1E6DC3;\\'>${u.nome.charAt(0).toUpperCase()}</span>'"

                     onclick="event.stopPropagation(); abrirVisualizadorImagem('${fotoBase64}', '${u.nome}')"

                     onmouseenter="this.style.transform='scale(1.12)'; this.style.boxShadow='0 0 20px rgba(40,167,69,0.5)'"

                     onmouseleave="this.style.transform='scale(1)'; this.style.boxShadow='none'">`;

                    } else {

                        fotoHtml = `<span style="font-size: 14px; font-weight: 700; color: #1E6DC3; cursor: default;">${u.nome.charAt(0).toUpperCase()}</span>`;

                    }

                    return `

                            <tr class="clickable-row" onclick="abrirModalEdicaoRapida('${u.id}', '${u.nome}', '${u.classe}', '${u.equipe}')" style="cursor: pointer;">

                                <td><div class="user-photo-thumb ${hasPhoto ? 'has-photo' : ''}">${fotoHtml}</div></td>

                                <td><strong>${u.nome}</strong></td>

                                <td>${u.cargo}</td>

                                <td>${u.classe}</td>

                                <td>${u.equipe}</td>

                                <td>${formatMoney(u.direto)}</td>

                                <td>${formatMoney(u.extra)}</td>

                                <td><strong>${formatMoney(u.recebido)}</strong></td>

                                <td style="font-weight: 700; color: ${(u.hoje || 0) > 0 ? '#28A745' : '#6C757D'};">${formatMoney(u.hoje || 0)}</td>

                                <td><span class="badge-proj ${u.projecaoCor}">${u.projecao.toFixed(1)}%</span></td>

                                <td style="font-weight: 600; color: ${(u.por_fora || 0) !== 0 ? '#1E6DC3' : '#6C757D'};" onclick="event.stopPropagation(); abrirModalPorFora('${u.id}', '${u.nome}')">${formatMoney(u.por_fora || 0)}</td>

                            </tr>

                        `;

                }).join('')}

                </tbody>

            </table>

            ${dadosFiltrados.length === 0 ? '<p style="text-align:center; padding:40px;">Nenhum usuário encontrado.</p>' : ''}

        `;

                tabelaContainer.innerHTML = tabelaHtml;

                // ============================================

                // RESUMO DOS FILTROS

                // ============================================

                const resumoHtml = [];

                if (filtrosOperadores.classes.length > 0) {

                    resumoHtml.push(`<span>Classes: ${filtrosOperadores.classes.join(', ')} <span class="remove-filtro" onclick="removerFiltroClasses()">✖</span></span>`);

                }

                if (filtrosOperadores.equipes.length > 0) {

                    resumoHtml.push(`<span>Equipes: ${filtrosOperadores.equipes.join(', ')} <span class="remove-filtro" onclick="removerFiltroEquipes()">✖</span></span>`);

                }

                if (filtrosOperadores.busca) {

                    resumoHtml.push(`<span>Busca: "${filtrosOperadores.busca}" <span class="remove-filtro" onclick="removerFiltroBusca()">✖</span></span>`);

                }

                document.getElementById('filtroResumo').innerHTML = resumoHtml.length > 0 ?

                    `<span>Filtros ativos:</span> ${resumoHtml.join('')}` : '';

            };

            // ============================================

            // FUNÇÕES DE ORDENAÇÃO E LIMPEZA

            // ============================================

            window.ordenarPor = (campo) => {

                let novaOrdenacao;

                if (filtrosOperadores.ordenacao.startsWith(campo)) {

                    const direcao = filtrosOperadores.ordenacao.endsWith('desc') ? 'asc' : 'desc';

                    novaOrdenacao = `${campo}_${direcao}`;

                } else {

                    novaOrdenacao = `${campo}_desc`;

                }

                document.getElementById('filtroOrdenacao').value = novaOrdenacao;

                aplicarFiltros();

            };

            window.limparFiltros = () => {

                filtrosOperadores.classes = [];

                filtrosOperadores.equipes = [];

                filtrosOperadores.busca = '';

                filtrosOperadores.ordenacao = 'projecao_desc';

                salvarFiltrosOperadores();

                document.querySelectorAll('#multiSelectClassDropdown input').forEach(cb => cb.checked = false);

                document.querySelectorAll('#multiSelectEquipeDropdown input').forEach(cb => cb.checked = false);

                document.getElementById('filtroBusca').value = '';

                document.getElementById('filtroOrdenacao').value = 'projecao_desc';

                document.getElementById('classSelectedText').innerText = 'Todas as classes';

                document.getElementById('equipeSelectedText').innerText = 'Todas as equipes';

                aplicarFiltros();

            };

            window.removerFiltroClasses = () => {

                filtrosOperadores.classes = [];

                document.querySelectorAll('#multiSelectClassDropdown input').forEach(cb => cb.checked = false);

                document.getElementById('classSelectedText').innerText = 'Todas as classes';

                salvarFiltrosOperadores();

                aplicarFiltros();

            };

            window.removerFiltroEquipes = () => {

                filtrosOperadores.equipes = [];

                document.querySelectorAll('#multiSelectEquipeDropdown input').forEach(cb => cb.checked = false);

                document.getElementById('equipeSelectedText').innerText = 'Todas as equipes';

                salvarFiltrosOperadores();

                aplicarFiltros();

            };

            window.removerFiltroBusca = () => {

                filtrosOperadores.busca = '';

                document.getElementById('filtroBusca').value = '';

                salvarFiltrosOperadores();

                aplicarFiltros();

            };

            // ============================================

            // CARREGAR DADOS DO DIA E APLICAR FILTROS

            // ============================================

            (async function carregarDadosDoDia() {

                try {

                    const url = `${SUPABASE_URL}/rest/v1/recebimentos?data_pagamento=eq.${dataHojeStr}&select=usuario_id,valor_recebido`;

                    const res = await fetch(url, {

                        headers: {

                            'apikey': SUPABASE_ANON_KEY,

                            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`

                        }

                    });

                    if (res.ok) {

                        const registros = await res.json();

                        const totais = {};

                        for (const reg of registros) {

                            const userId = reg.usuario_id;

                            if (!totais[userId]) totais[userId] = 0;

                            totais[userId] += reg.valor_recebido || 0;

                        }

                        for (const user of dadosUsuarios) {

                            user.hoje = totais[user.id] || 0;

                        }

                    }

                } catch (e) {

                    console.warn('Erro ao buscar recebimentos do dia:', e);

                }

                aplicarFiltros();

            })();

        }

        window.abrirModalEdicaoRapida = (usuarioId, nome, classeAtual, equipeAtual) => {

            equipeAtual = equipeAtual || 'Sem equipe';

            classeAtual = classeAtual || '';

            // Busca o usuário para pegar o equipe_id atual

            const user = usuarios.find(u => u.id == usuarioId);

            const equipeIdAtual = user?.equipe_id || '';

            // Recarregar equipes para garantir que estão atualizadas

            const equipesAtualizadas = [...equipes];

            const equipesOptions = equipesAtualizadas.map(eq => `<option value="${eq.id}" ${equipeIdAtual == eq.id ? 'selected' : ''}>${eq.nome}</option>`).join('');

            const classesOptions = classes.map(c => `<option value="${c.nome}" ${classeAtual === c.nome ? 'selected' : ''}>${c.nome}</option>`).join('');

            const cargosOptions = `<option value="operador">Operador</option><option value="elite">Elite</option><option value="supervisor">Supervisor</option><option value="gestor"> Gestor</option>`;

            document.getElementById('editModal').innerHTML = `<div class="modal-overlay"><div class="modal-content"><h3>Editar Usuário: ${nome}</h3>

        <div class="modal-field"><label>Nome</label><input type="text" id="edit_rapida_nome" value="${nome}"></div>

        <div class="modal-field"><label>Login</label><input type="text" id="edit_rapida_login" value="${user?.login || ''}"></div>

        <div class="modal-field"><label>Senha</label><div class="password-field"><input type="password" id="edit_rapida_senha" placeholder="Deixe em branco para manter"><button type="button" class="btn-toggle-password" onclick="toggleSenhaVisivelRapida()">👁️ Exibir</button></div></div>

        <div class="modal-field"><label>Função</label><select id="edit_rapida_cargo">${cargosOptions}</select></div>

        <div class="modal-field"><label>Equipe</label>

            <select id="edit_rapida_equipe">

                <option value="">-- Sem equipe --</option>

                ${equipesOptions}

            </select>

        </div>

        <div class="modal-field"><label> Classe</label><select id="edit_rapida_classe">${classesOptions}</select></div>

        <div class="modal-field"><label>Meta (R$)</label><input type="text" id="edit_rapida_meta" placeholder="Meta individual" oninput="formatarInputMoeda(this)"></div>

        <div class="modal-actions" style="justify-content: space-between;">

            <button class="btn-danger" onclick="excluirUsuarioCompleto('${usuarioId}', '${nome}')" style="background: #DC3545; color: white; border: none; padding: 12px 20px; border-radius: 40px; cursor: pointer; font-weight: 600;">️ EXCLUIR USUÁRIO</button>

            <div style="display: flex; gap: 12px;">

                <button class="btn-modal-cancel" onclick="fecharModal()">Cancelar</button>

                <button class="btn-modal-save" onclick="salvarEdicaoRapida('${usuarioId}', '${nome}')">Salvar</button>

            </div>

        </div>

    </div></div>`;

            if (user) {

                document.getElementById('edit_rapida_cargo').value = user.cargo;

                document.getElementById('edit_rapida_classe').value = user.classe || '';

                const metaAtual = metas.find(m => String(m?.usuario_id) === String(usuarioId) && m?.mes === new Date().getMonth() + 1 && m?.ano === new Date().getFullYear());

                if (metaAtual) {

                    document.getElementById('edit_rapida_meta').value = formatMoney(metaAtual.meta);

                }

            }

            document.getElementById('editModal').style.display = 'block';

        };

        window.toggleSenhaVisivelRapida = () => { const senhaInput = document.getElementById('edit_rapida_senha'); if (senhaInput) { senhaInput.type = senhaInput.type === 'password' ? 'text' : 'password'; } };

        window.salvarEdicaoRapida = async (usuarioId, nomeAntigo) => {

            try {

                const novoNome = document.getElementById('edit_rapida_nome').value;

                const novoLogin = document.getElementById('edit_rapida_login').value;

                const novaSenha = document.getElementById('edit_rapida_senha').value;

                const novaEquipeId = document.getElementById('edit_rapida_equipe').value || null;

                const novaClasse = document.getElementById('edit_rapida_classe').value;

                const novaFuncao = document.getElementById('edit_rapida_cargo').value;

                const metaStr = document.getElementById('edit_rapida_meta').value;

                const novaMeta = parseMoneyToNumber(metaStr);

                const mes = new Date().getMonth() + 1;

                const ano = new Date().getFullYear();

                let data = {

                    nome: novoNome,

                    login: novoLogin,

                    equipe_id: novaEquipeId,

                    classe: novaClasse,

                    cargo: novaFuncao

                };

                if (novaSenha && novaSenha.trim() !== '') data.senha = novaSenha;

                await updateIn('usuarios', usuarioId, data);

                let metaExistente = metas.find(m => String(m?.usuario_id) === String(usuarioId) && m?.mes === mes && m?.ano === ano);

                if (!isNaN(novaMeta) && novaMeta >= 0) {

                    await updateMeta(Number(usuarioId), mes, ano, { meta: novaMeta }, metaExistente?.id);

                }

                await registrarHistorico('edicao', `Usuário "${nomeAntigo}" editado`);

                fecharModal();

                await atualizarDadosImediatos();

                showToast(` Usuário ${novoNome} atualizado com sucesso!`);

            } catch (error) {

                console.error('Erro ao salvar edição:', error);

                showToast(' Erro ao salvar alterações. Verifique o console.');

            }

        };

        window.abrirModalPorFora = (usuarioId, nome) => {

            const mes = new Date().getMonth() + 1;

            const ano = new Date().getFullYear();

            const metaAtual = metas.find(m => m?.usuario_id == usuarioId && m?.mes === mes && m?.ano === ano) || {

                meta: 0, direto: 0, extra: 0, recebido: 0, por_fora_direto: 0, por_fora_extra: 0

            };

            const porForaDireto = metaAtual.por_fora_direto || 0;

            const porForaExtra = metaAtual.por_fora_extra || 0;

            document.getElementById('editModal').innerHTML = `

                <div class="modal-overlay">

                    <div class="modal-content" style="max-width: 450px;">

                        <h3 style="color: #0F3B6F; margin-bottom: 20px;">Correção de Valor (Por fora)<br><span style="font-size: 0.95rem; font-weight: normal; color: #64748B;">Operador: ${nome}</span></h3>

                        <div style="background: #F8FAFC; border-radius: 12px; padding: 15px; margin-bottom: 20px;">

                            <div style="display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 0.9rem;">

                                <span style="color: #64748B;">Ajuste Direto Atual:</span>

                                <strong style="color: ${porForaDireto !== 0 ? '#1E6DC3' : '#64748B'};">${formatMoney(porForaDireto)}</strong>

                            </div>

                            <div style="display: flex; justify-content: space-between; font-size: 0.9rem;">

                                <span style="color: #64748B;">Ajuste Extra Atual:</span>

                                <strong style="color: ${porForaExtra !== 0 ? '#FFC107' : '#64748B'};">${formatMoney(porForaExtra)}</strong>

                            </div>

                        </div>

                        <div class="modal-field">

                            <label>Novo Valor de Correção (R$)</label>

                            <input type="text" id="por_fora_valor_input" placeholder="Digite o valor (use - para negativo)" oninput="formatarInputMoedaComSinal(this)">

                        </div>

                        <div class="modal-actions" style="display: flex; flex-direction: column; gap: 10px; margin-top: 25px;">

                            <div style="display: flex; gap: 10px; width: 100%;">

                                <button class="btn-modal-save" onclick="salvarPorFora('${usuarioId}', 'direto', '${nome.replace(/'/g, "\\'")}')" style="flex: 1; background: #1E6DC3;">Lançar Direto</button>

                                <button class="btn-modal-save" onclick="salvarPorFora('${usuarioId}', 'extra', '${nome.replace(/'/g, "\\'")}')" style="flex: 1; background: #FFC107; color: #0F2E52;">Lançar Extra</button>

                            </div>

                            <div style="display: flex; gap: 10px; width: 100%;">

                                <button class="btn-danger" onclick="salvarPorFora('${usuarioId}', 'zerar', '${nome.replace(/'/g, "\\'")}')" style="flex: 1; background: #DC3545; color: white;">Zerar Ajustes</button>

                                <button class="btn-modal-cancel" onclick="fecharModal()" style="flex: 1;">Cancelar</button>

                            </div>

                        </div>

                    </div>

                </div>

            `;

            document.getElementById('editModal').style.display = 'block';

        };

        window.salvarPorFora = async (usuarioId, tipo, nomeOperador) => {

            try {

                const mes = new Date().getMonth() + 1;

                const ano = new Date().getFullYear();

                const valorInput = document.getElementById('por_fora_valor_input')?.value || '';

                const valorParsed = parseMoneyToNumber(valorInput);

                if (tipo !== 'zerar' && isNaN(valorParsed)) {

                    showToast('Por favor, informe um valor de correção válido.');

                    return;

                }

                let metaExistente = metas.find(m => String(m?.usuario_id) === String(usuarioId) && m?.mes === mes && m?.ano === ano);

                if (tipo === 'zerar') {

                    await updateMeta(Number(usuarioId), mes, ano, {

                        por_fora_direto: 0,

                        por_fora_extra: 0

                    }, metaExistente?.id);

                    await registrarHistorico('edicao', `Ajustes "Por fora" de ${nomeOperador} foram zerados`);

                } else if (tipo === 'direto') {

                    await updateMeta(Number(usuarioId), mes, ano, {

                        por_fora_direto: valorParsed

                    }, metaExistente?.id);

                    await registrarHistorico('edicao', `Ajuste "Por fora" Direto de ${nomeOperador} atualizado para ${formatMoney(valorParsed)}`);

                } else if (tipo === 'extra') {

                    await updateMeta(Number(usuarioId), mes, ano, {

                        por_fora_extra: valorParsed

                    }, metaExistente?.id);

                    await registrarHistorico('edicao', `Ajuste "Por fora" Extra de ${nomeOperador} atualizado para ${formatMoney(valorParsed)}`);

                }

                fecharModal();

                await atualizarDadosImediatos();

                showToast('Ajuste "Por fora" atualizado com sucesso!');

            } catch (error) {

                console.error('Erro ao salvar ajuste por fora:', error);

                showToast('Erro ao salvar ajuste. Verifique o console.');

            }

        };

        function carregarAdminReformuladoGestor() {

            atualizarDiasUteis();

            const mes = new Date().getMonth() + 1, ano = new Date().getFullYear();

            let container = document.getElementById('adminClassesContainer');

            let html = '';

            let classesDoBanco = [...classes];

            classesDoBanco.sort((a, b) => a.nome.localeCompare(b.nome));

            for (let classe of classesDoBanco) {

                let ops = usuarios.filter(u => u.classe === classe.nome && (u.cargo === 'operador' || u.cargo === 'elite') && u.status === 'ativo');

                let expanded = classesExpandidas[classe.nome] || false;

                let classVazia = ops.length === 0;

                if (classVazia) {

                    html += `<div class="admin-class-card class-vazia" data-classe="${classe.nome}" data-id="${classe.id}">

                    <div class="admin-class-header" onclick="toggleAdminClass('${classe.nome}')">

                        <h3> ${classe.nome} <span class="admin-class-badge">0 membros</span></h3>

                        <span>${expanded ? '▼' : '▶'}</span>

                    </div>

                    <div class="class-meta-input-area">

                        <span class="class-meta-label">Classe sem membros</span>

                        <div style="display: flex; gap: 10px;">

                            <button onclick="abrirModalEditarClasse('${classe.nome}')" class="btn-edit-equipe" style="background: #1E6DC3;">Editar</button>

                            <button onclick="abrirModalExcluirClasse('${classe.nome}')" class="btn-delete-equipe">️ Excluir</button>

                        </div>

                    </div>

                    <div class="admin-operadores-list" id="class-list-${classe.nome}">

                        <div class="class-vazia-message"> Nenhum membro nesta classe.</div>

                    </div>

                </div>`;

                } else {

                    let metaTotal = 0, recebidoTotal = 0;

                    for (let op of ops) { let m = metas.find(x => x?.usuario_id === op.id && x?.mes === mes && x?.ano === ano); if (m) { metaTotal += m.meta || 0; recebidoTotal += m.recebido || 0; } }

                    html += `<div class="admin-class-card" data-classe="${classe.nome}" data-id="${classe.id}">

                    <div class="admin-class-header" onclick="toggleAdminClass('${classe.nome}')">

                        <h3> ${classe.nome} <span class="admin-class-badge">${ops.length} membros</span></h3>

                        <span>${expanded ? '▼' : '▶'}</span>

                    </div>

                    <div class="class-meta-input-area">

                        <span class="class-meta-label">Meta Total: ${formatMoney(metaTotal)} | Recebido: ${formatMoney(recebidoTotal)}</span>

                        <div style="display: flex; gap: 10px;">

                            <input type="text" id="meta_classe_${classe.nome}" placeholder="Meta por Membro (R$)" value="${formatMoney(ops.length ? Math.round((metaTotal / ops.length) || 0) : 0)}" style="width: 200px; padding: 8px; border-radius: 12px; border: 1px solid #CBD5E1;" oninput="formatarInputMoeda(this)">

                            <button onclick="salvarMetaClasse('${classe.nome}')" class="btn-success">Definir Meta</button>

                            <button onclick="abrirModalEditarClasse('${classe.nome}')" class="btn-edit-equipe" style="background: #1E6DC3;">Editar</button>

                            <button onclick="abrirModalExcluirClasse('${classe.nome}')" class="btn-delete-equipe"> Excluir</button>

                        </div>

                    </div>

                    <div class="admin-operadores-list" id="class-list-${classe.nome}">

                        ${ops.map(op => {

                        let mo = metas.find(m => m?.usuario_id === op.id && m?.mes === mes && m?.ano === ano) || { meta: 0, recebido: 0, direto: 0, extra: 0 };

                        let proj = calcularProjecao(mo.meta, mo.recebido);

                        let projColor = getProjecaoColor(proj);

                        let statusText = op.status === 'inativo' ? 'Desligado' : 'Ativo';

                        let statusClass = op.status === 'inativo' ? 'status-inactive' : 'status-active';

                        let equipeNome = getEquipeNome(op.equipe_id);

                        let cargoIcon = op.cargo === 'elite' ? '' : '';

                        const fotoUrl = normalizarFotoUrl(op.foto);

                        let fotoMiniHtml = '';

                        if (fotoUrl) {

                            fotoMiniHtml = `<img src="${fotoUrl}" 

                         style="width: 28px; height: 28px; border-radius: 50%; object-fit: cover; border: 2px solid #28A745; cursor: pointer; margin-right: 8px; transition: transform 0.2s, box-shadow 0.2s; flex-shrink: 0;"

                         onerror="this.onerror=null; this.style.display='none'; if(this.nextElementSibling) this.nextElementSibling.style.display='inline-flex';"

                         onclick="event.stopPropagation(); abrirVisualizadorImagem('${fotoUrl}', '${op.nome}')"

                         onmouseenter="this.style.transform='scale(1.15)'; this.style.boxShadow='0 0 20px rgba(40,167,69,0.5)'"

                         onmouseleave="this.style.transform='scale(1)'; this.style.boxShadow='none'"><span style="display: none; width: 28px; height: 28px; border-radius: 50%; background: #1E6DC3; color: white; align-items: center; justify-content: center; font-weight: 700; font-size: 13px; margin-right: 8px; flex-shrink: 0; cursor: default;">${op.nome.charAt(0).toUpperCase()}</span>`;

                        } else {

                            fotoMiniHtml = `<span style="width: 28px; height: 28px; border-radius: 50%; background: #1E6DC3; color: white; display: inline-flex; align-items: center; justify-content: center; font-weight: 700; font-size: 13px; margin-right: 8px; flex-shrink: 0; cursor: default;">${op.nome.charAt(0).toUpperCase()}</span>`;

                        }

                        return `<div class="operador-mini-card" data-id="${op.id}" data-nome="${op.nome}" data-classe="${classe.nome}">

    <div class="drag-handle" draggable="true">⋮⋮</div>

    <div class="operador-content" onclick="abrirModalEdicaoCompleta('${op.id}')" style="display: flex; align-items: center; gap: 4px;">

        ${fotoMiniHtml}

        <div style="flex: 1; min-width: 0;">

            <div class="nome">${cargoIcon}${op.nome}<span class="proj-percent ${projColor}">${proj.toFixed(1)}%</span><span class="status-badge ${statusClass}">${statusText}</span></div>

            <div class="info-row"><span>Meta:</span><span class="values">${formatMoney(mo.meta)}</span></div>

            <div class="info-row"><span>Recebido:</span><span class="values">${formatMoney(mo.recebido)}</span></div>

            <div class="info-row"><span>⚡ Direto:</span><span>${formatMoney(mo.direto)}</span> <span>✨ Extra:</span><span>${formatMoney(mo.extra)}</span></div>

            <div class="equipe-badge">${equipeNome}</div>

        </div>

    </div>

</div>`;

                    }).join('')}

                    </div>

                </div>`;

                }

            }

            container.innerHTML = html;

            for (let classe of classesDoBanco) {

                let div = document.getElementById(`class-list-${classe.nome}`);

                if (div && classesExpandidas[classe.nome]) div.classList.add('expanded');

                else if (div) div.classList.remove('expanded');

            }

            setupDragAndDrop();

        }

        window.salvarMetaClasse = async (classe) => {

            let inputElement = document.getElementById(`meta_classe_${classe}`);

            if (!inputElement) return;

            let metaPorMembro = parseMoneyToNumber(inputElement.value);

            if (isNaN(metaPorMembro) || metaPorMembro < 0) return;

            let ops = usuarios.filter(u => String(u.classe || '').trim().toLowerCase() === String(classe || '').trim().toLowerCase() && (u.cargo === 'operador' || u.cargo === 'elite') && u.status === 'ativo');

            if (ops.length === 0) return;

            const mes = new Date().getMonth() + 1, ano = new Date().getFullYear();

            for (let op of ops) {

                let existente = metas.find(m => String(m?.usuario_id) === String(op.id) && m?.mes === mes && m?.ano === ano);

                await updateMeta(op.id, mes, ano, { meta: metaPorMembro }, existente?.id);

            }

            await registrarHistorico('edicao', `Meta de R$ ${formatMoney(metaPorMembro)} definida para classe "${classe}"`);

            await atualizarDadosImediatos();

            showToast(` Meta individual de R$ ${formatMoney(metaPorMembro)} definida!`);

        };

        window.abrirModalEditarClasse = (classeNome) => {

            document.getElementById('editModal').innerHTML = `<div class="modal-overlay"><div class="modal-content"><h3> Editar Classe</h3><div class="modal-field"><label> Nome da Classe</label><input type="text" id="edit_classe_nome" value="${classeNome}"></div><div class="modal-actions"><button class="btn-modal-cancel" onclick="fecharModal()">Cancelar</button><button class="btn-modal-save" onclick="confirmarEditarClasse('${classeNome}')">Salvar</button></div></div></div>`;

            document.getElementById('editModal').style.display = 'block';

        };

        window.confirmarEditarClasse = async (classeAntiga) => {

            const novoNome = document.getElementById('edit_classe_nome').value;

            if (novoNome && novoNome !== classeAntiga) {

                const existe = classes.find(c => c.nome === novoNome);

                if (existe) { showToast(' Já existe uma classe com este nome!'); return; }

                const classeObj = classes.find(c => c.nome === classeAntiga);

                if (classeObj) {

                    await updateIn('classes', classeObj.id, { nome: novoNome });

                    const usuariosDaClasse = usuarios.filter(u => u.classe === classeAntiga);

                    for (let user of usuariosDaClasse) { await updateIn('usuarios', user.id, { classe: novoNome }); }

                    await registrarHistorico('edicao', `Classe "${classeAntiga}" renomeada para "${novoNome}"`);

                    fecharModal();

                    await atualizarDadosImediatos();

                    showToast(` Classe renomeada!`);

                }

            } else { fecharModal(); }

        };

        window.abrirModalExcluirClasse = (classeNome) => {

            const usuariosDaClasse = usuarios.filter(u => u.classe === classeNome && (u.cargo === 'operador' || u.cargo === 'elite') && u.status === 'ativo');

            let mensagem = usuariosDaClasse.length > 0 ? `<p style="margin: 20px 0; text-align: center;">Tem certeza que deseja EXCLUIR a classe <strong>${classeNome}</strong> e todos os <strong>${usuariosDaClasse.length}</strong> membros ativos dela?</p><p style="margin-bottom: 20px; text-align: center; color: #dc3545;">Esta ação não pode ser desfeita!</p>` : `<p style="margin: 20px 0; text-align: center;">Tem certeza que deseja EXCLUIR a classe vazia <strong>${classeNome}</strong>?</p>`;

            document.getElementById('editModal').innerHTML = `<div class="modal-overlay"><div class="modal-content"><h3>Confirmar Exclusão de Classe</h3>${mensagem}<div class="modal-actions"><button class="btn-modal-cancel" onclick="fecharModal()">Cancelar</button><button class="btn-danger" style="flex: 1;" onclick="confirmarExcluirClasse('${classeNome}')">Confirmar Exclusão</button></div></div></div>`;

            document.getElementById('editModal').style.display = 'block';

        };

        window.confirmarExcluirClasse = async (classeNome) => {

            const classeObj = classes.find(c => c.nome === classeNome);

            if (classeObj) {

                const usuariosDaClasse = usuarios.filter(u => u.classe === classeNome);

                for (let user of usuariosDaClasse) {

                    const metasUser = metas.filter(m => m.usuario_id === user.id);

                    for (let meta of metasUser) { await deleteFrom('metas', meta.id); }

                    await deleteFrom('usuarios', user.id);

                }

                await deleteFrom('classes', classeObj.id);

                await registrarHistorico('exclusao', `Classe "${classeNome}" excluída`);

            }

            fecharModal();

            await atualizarDadosImediatos();

            showToast(` Classe "${classeNome}" excluída!`);

        };

        // ============================================

        // FUNÇÕES CRUD

        // ============================================

        window.abrirModalCriarEquipe = () => {

            const supervisoresDisponiveis = usuarios.filter(u => u.cargo === 'supervisor' || u.cargo === 'gestor');

            let supervisorOptions = '<option value="">Nenhum</option>';

            for (let sup of supervisoresDisponiveis) { supervisorOptions += `<option value="${sup.id}">${sup.nome} (${sup.cargo === 'gestor' ? 'Gestor' : 'Supervisor'})</option>`; }

            document.getElementById('editModal').innerHTML = `<div class="modal-overlay"><div class="modal-content"><h3>Criar Nova Equipe</h3><div class="modal-field"><label> Nome da Equipe</label><input type="text" id="nova_equipe_nome" placeholder="Ex: Equipe Comercial"></div><div class="modal-field"><label>Meta da Equipe (R$)</label><input type="text" id="nova_equipe_meta" placeholder="R$ 1.000.000,00" oninput="formatarInputMoeda(this)"></div><div class="modal-field"><label>Responsável</label><select id="nova_equipe_supervisor">${supervisorOptions}</select></div><div class="modal-actions"><button class="btn-modal-cancel" onclick="fecharModal()">Cancelar</button><button class="btn-modal-save" onclick="confirmarCriarEquipe()">Criar Equipe</button></div></div></div>`;

            document.getElementById('editModal').style.display = 'block';

        };

        window.confirmarCriarEquipe = async () => {

            const nome = document.getElementById('nova_equipe_nome').value.trim();

            const metaStr = document.getElementById('nova_equipe_meta').value;

            const supervisorId = document.getElementById('nova_equipe_supervisor').value || null;

            if (!nome) { showToast('Por favor, insira um nome para a equipe!'); return; }

            const meta = parseMoneyToNumber(metaStr);

            if (isNaN(meta) || meta <= 0) { showToast(' Por favor, insira uma meta válida!'); return; }

            const mes = new Date().getMonth() + 1, ano = new Date().getFullYear();

            const result = await insertInto('equipes', { nome });

            if (result && result[0]) {

                const novaEquipeId = result[0].id;

                if (supervisorId) { await updateIn('usuarios', supervisorId, { equipe_id: novaEquipeId }); }

                await updateMetaEquipe(novaEquipeId, mes, ano, meta);

                await registrarHistorico('criacao', `Equipe "${nome}" criada com meta de ${formatMoney(meta)}`);

                fecharModal();

                await atualizarDadosImediatos();

                showToast(` Equipe "${nome}" criada com sucesso!`);

            } else { showToast(' Erro ao criar equipe.'); }

        };

        window.abrirModalEditarSupervisor = async (id) => {

            const sup = usuarios.find(u => String(u.id) === String(id));

            if (!sup) {

                console.error('Supervisor não encontrado. ID:', id);

                showToast('Erro ao carregar supervisor');

                return;

            }

            let equipeOptions = '<option value="">Sem equipe</option>';

            for (let eq of equipes) { equipeOptions += `<option value="${eq.id}" ${sup.equipe_id === eq.id ? 'selected' : ''}>${eq.nome}</option>`; }

            document.getElementById('editModal').innerHTML = `<div class="modal-overlay"><div class="modal-content"><h3> Editar ${sup.cargo === 'gestor' ? 'Gestor' : 'Supervisor'}: ${sup.nome}</h3>

            <div class="modal-field"><label>Nome</label><input type="text" id="edit_nome_sup" value="${sup.nome.replace(/"/g, '&quot;')}"></div>

            <div class="modal-field"><label>Login</label><input type="text" id="edit_login_sup" value="${sup.login || ''}"></div>

            <div class="modal-field"><label>Senha</label><div class="password-field"><input type="password" id="edit_senha_sup" placeholder="Nova senha (deixe em branco para manter)"><button type="button" class="btn-toggle-password" onclick="toggleSenhaVisivelSupervisor()">👁️ Exibir</button></div></div>

            <div class="modal-field"><label>Função</label><select id="edit_funcao_sup"><option value="supervisor" ${sup.cargo === 'supervisor' ? 'selected' : ''}>Supervisor</option><option value="gestor" ${sup.cargo === 'gestor' ? 'selected' : ''}>Gestor</option></select></div>

            <div class="modal-field"><label>Equipe</label><select id="edit_equipe_sup">${equipeOptions}</select></div>

            <div class="modal-actions"><button class="btn-modal-cancel" onclick="fecharModal()">Cancelar</button><button class="btn-modal-save" onclick="salvarSupervisorEditado('${sup.id}')">Salvar</button></div></div></div>`;

            document.getElementById('editModal').style.display = 'block';

        };

        window.toggleSenhaVisivelSupervisor = () => { const senhaInput = document.getElementById('edit_senha_sup'); if (senhaInput) { senhaInput.type = senhaInput.type === 'password' ? 'text' : 'password'; } };

        window.salvarSupervisorEditado = async (id) => {

            const nome = document.getElementById('edit_nome_sup').value;

            const login = document.getElementById('edit_login_sup').value;

            const senha = document.getElementById('edit_senha_sup').value;

            const funcao = document.getElementById('edit_funcao_sup').value;

            const equipe_id = document.getElementById('edit_equipe_sup').value || null;

            let data = { nome, login, equipe_id, cargo: funcao };

            if (senha && senha.trim() !== '') data.senha = senha;

            await updateIn('usuarios', id, data);

            await registrarHistorico('edicao', `Usuário "${nome}" editado`);

            fecharModal();

            await atualizarDadosImediatos();

            showToast(' Usuário atualizado com sucesso!');

        };

        window.abrirModalConfiguracoesUsuario = () => {

            const metaSetorAtual = getMetaSetor();

            const cargoNorm = normalizarCargo(currentUser?.cargo);

            const isGestor = cargoNorm === 'gestor' || cargoNorm === 'gestora';

            document.getElementById('editModal').innerHTML = `<div class="modal-overlay"><div class="modal-content"><h3> Configurações</h3><div class="modal-field"><label> Nome</label><input type="text" id="edit_meu_nome" value="${currentUser.nome}"></div><div class="modal-field"><label> Login</label><input type="text" id="edit_meu_login" value="${currentUser.login}"></div><div class="modal-field"><label> Nova Senha</label><div class="password-field"><input type="password" id="edit_meu_senha" placeholder="Deixe em branco para manter"><button type="button" class="btn-toggle-password" onclick="toggleSenhaVisivelMinhas()">👁️ Exibir</button></div></div>${isGestor ? `<div class="modal-field"><label> META DO SETOR (R$)</label><div class="password-field"><input type="text" id="meta_setor_config" value="${formatMoney(metaSetorAtual)}" oninput="formatarInputMoeda(this)"></div><div class="metric-sub" style="margin-top: 5px;">Usada para cálculos da Visão do Setor</div></div>` : ''}<div class="modal-actions"><button class="btn-modal-cancel" onclick="fecharModal()">Cancelar</button><button class="btn-modal-save" onclick="salvarConfiguracoesUsuario()">Salvar</button></div></div></div>`;

            document.getElementById('editModal').style.display = 'block';

        };

        window.toggleSenhaVisivelMinhas = () => { const senhaInput = document.getElementById('edit_meu_senha'); if (senhaInput) { senhaInput.type = senhaInput.type === 'password' ? 'text' : 'password'; } };

        async function salvarConfiguracoesBanco(dadosAtualizados) {

            configuracoes = { ...configuracoes, ...dadosAtualizados };

            localStorage.setItem('configuracoes', JSON.stringify(configuracoes));

            try {

                const payload = {

                    total_dias_uteis: Number(configuracoes.total_dias_uteis),

                    dias_passados: Number(configuracoes.dias_passados),

                    meta_setor: Number(configuracoes.meta_setor)

                };

                let salvo = false;

                if (configuracoes.id) {

                    const res = await fetch(`${SUPABASE_URL}/rest/v1/configuracoes?id=eq.${configuracoes.id}`, {

                        method: 'PATCH',

                        headers: {

                            'apikey': SUPABASE_ANON_KEY,

                            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,

                            'Content-Type': 'application/json',

                            'Prefer': 'return=representation'

                        },

                        body: JSON.stringify(payload)

                    });

                    if (res.ok) {

                        const rows = await res.json();

                        if (Array.isArray(rows) && rows.length > 0) salvo = true;

                    }

                }

                if (!salvo) {

                    const rows = await fetchFromSupabase('configuracoes?select=*');

                    const rowComId = Array.isArray(rows) ? rows.find(r => r.id !== null && r.id !== undefined) : null;

                    if (rowComId) {

                        configuracoes.id = rowComId.id;

                        localStorage.setItem('configuracoes', JSON.stringify(configuracoes));

                        const res = await fetch(`${SUPABASE_URL}/rest/v1/configuracoes?id=eq.${rowComId.id}`, {

                            method: 'PATCH',

                            headers: {

                                'apikey': SUPABASE_ANON_KEY,

                                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,

                                'Content-Type': 'application/json',

                                'Prefer': 'return=representation'

                            },

                            body: JSON.stringify(payload)

                        });

                        if (res.ok) salvo = true;

                    } else if (Array.isArray(rows) && rows.length > 0) {

                        await fetch(`${SUPABASE_URL}/rest/v1/configuracoes`, {

                            method: 'PATCH',

                            headers: {

                                'apikey': SUPABASE_ANON_KEY,

                                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,

                                'Content-Type': 'application/json'

                            },

                            body: JSON.stringify(payload)

                        });

                        salvo = true;

                    } else {

                        const res = await insertInto('configuracoes', payload);

                        if (res && res[0] && res[0].id) configuracoes.id = res[0].id;

                        localStorage.setItem('configuracoes', JSON.stringify(configuracoes));

                        salvo = true;

                    }

                }

                return salvo;

            } catch (e) {

                console.error('Erro ao salvar configuracoes no banco:', e);

                return false;

            }

        }

        window.salvarConfiguracoesUsuario = async () => {

            const novoNome = document.getElementById('edit_meu_nome').value;

            const novoLogin = document.getElementById('edit_meu_login').value;

            const novaSenha = document.getElementById('edit_meu_senha').value;

            let data = { nome: novoNome, login: novoLogin };

            if (novaSenha && novaSenha.trim() !== '') data.senha = novaSenha;

            await updateIn('usuarios', currentUser.id, data);

            const cargoNorm = normalizarCargo(currentUser?.cargo);

            if (cargoNorm === 'gestor' || cargoNorm === 'gestora') {

                const metaSetorInput = document.getElementById('meta_setor_config');

                if (metaSetorInput) {

                    const novaMetaSetor = parseMoneyToNumber(metaSetorInput.value || '0');

                    await salvarConfiguracoesBanco({ meta_setor: novaMetaSetor });

                }

            }

            await registrarHistorico('edicao', `Usuário "${currentUser.nome}" alterou suas configurações`);

            const usuarioAtualizado = usuarios.find(u => u.id === currentUser.id);

            if (usuarioAtualizado) { currentUser = { ...usuarioAtualizado, ...data }; localStorage.setItem('currentUser', JSON.stringify(currentUser)); document.getElementById('userNameDisplay').innerHTML = `${getSaudacao()}, ${currentUser.nome.split(' ')[0]}`; }

            fecharModal();

            await atualizarDadosImediatos();

            atualizarDiasUteis();

            showToast(' Configurações atualizadas!');

        };

        function carregarSupervisoresGestor() {

            let supervisores = usuarios.filter(u => u.cargo === 'supervisor' || u.cargo === 'gestor');

            let container = document.getElementById('supervisoresContainer');

            //  CABEÇALHO SEM O BOTÃO RESET

            let headerHtml = `

        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 25px; flex-wrap: wrap; gap: 10px;">

            <h3 style="color:#0F3B6F; margin: 0;">Gestão de Supervisores</h3>

            <div style="display: flex; gap: 10px; flex-wrap: wrap;">

                <button onclick="abrirModalAdicionarSupervisor()" class="btn-success"> Adicionar Supervisor</button>

            </div>

        </div>

    `;

            if (supervisores.length === 0) {

                container.innerHTML = headerHtml + '<p style="text-align:center; padding:40px;">Nenhum supervisor cadastrado.</p>';

                return;

            }

            let html = '';

            for (let sup of supervisores) {

                let equipeResp = equipes.find(e => e.id === sup.equipe_id);

                const supFoto = normalizarFotoUrl(sup.foto);

                const hasPhoto = !!supFoto;

                let fotoHtml = '';

                if (hasPhoto) {

                    fotoHtml = `<img src="${supFoto}" 

                     alt="${sup.nome}" 

                     style="width: 40px; height: 40px; border-radius: 50%; object-fit: cover; border: 2px solid #28A745; cursor: pointer; transition: transform 0.2s, box-shadow 0.2s;"

                     onerror="this.onerror=null; this.style.display='none'; this.parentElement.innerHTML='<span style=\\'font-size: 16px; font-weight: 700; color: #1E6DC3; cursor: default;\\'>${sup.nome.charAt(0).toUpperCase()}</span>'"

                     onclick="event.stopPropagation(); abrirVisualizadorImagem('${supFoto}', '${sup.nome}')"

                     onmouseenter="this.style.transform='scale(1.1)'; this.style.boxShadow='0 0 20px rgba(40,167,69,0.5)'"

                     onmouseleave="this.style.transform='scale(1)'; this.style.boxShadow='none'">`;

                } else {

                    fotoHtml = `<span style="font-size: 16px; font-weight: 700; color: #1E6DC3; cursor: default;">${sup.nome.charAt(0).toUpperCase()}</span>`;

                }

                html += `<div class="supervisor-card">

            <div class="supervisor-avatar ${hasPhoto ? 'has-photo' : ''}">${fotoHtml}</div>

            <div class="supervisor-info">

                <div class="name"> ${sup.nome}</div>

                <div class="details">

                    Login: ${sup.login} • Função: ${sup.cargo === 'gestor' ? 'Gestor' : 'Supervisor'} • Equipe: ${equipeResp?.nome || 'Sem equipe'}

                </div>

            </div>

            <div class="supervisor-actions">

                <button onclick="abrirModalEditarSupervisor('${sup.id}')" class="btn-success" style="padding:6px 18px;">Editar</button>

                ${sup.id !== currentUser.id ? `<button onclick="abrirModalExcluirSupervisor('${sup.id}', '${sup.nome}')" class="btn-danger" style="padding:6px 18px;">️ Excluir</button>` : ''}

                ${sup.id === currentUser.id ? '<span style="font-size:0.7rem; color:#6C757D;">(Você)</span>' : ''}

            </div>

        </div>`;

            }

            container.innerHTML = headerHtml + html;

        }

        window.abrirModalExcluirSupervisor = (id, nome) => {

            if (id === currentUser.id) { showToast(' Você não pode excluir a si mesmo!'); return; }

            document.getElementById('editModal').innerHTML = `<div class="modal-overlay"><div class="modal-content"><h3> Confirmar Exclusão</h3><p style="margin: 20px 0; text-align: center;">Tem certeza que deseja EXCLUIR permanentemente ${nome}?</p><div class="modal-actions"><button class="btn-modal-cancel" onclick="fecharModal()">Cancelar</button><button class="btn-danger" style="flex: 1;" onclick="confirmarExcluirSupervisor('${id}', '${nome}')">Confirmar Exclusão</button></div></div></div>`;

            document.getElementById('editModal').style.display = 'block';

        };

        window.confirmarExcluirSupervisor = async (id, nome) => {

            await deleteFrom('usuarios', id);

            await registrarHistorico('exclusao', `${nome} excluído do sistema`);

            fecharModal();

            await atualizarDadosImediatos();

            showToast(' Usuário excluído!');

        };

        window.fecharModal = () => { document.getElementById('editModal').style.display = 'none'; document.getElementById('editModal').innerHTML = ''; };

        window.salvarDiasUteis = async () => {

            const totalDiasInput = document.getElementById('totalDiasUteisConfig');

            const diasPassadosInput = document.getElementById('diasPassadosConfig');

            const metaSetorInput = document.getElementById('metaSetorConfigAdmin');

            const totalDias = totalDiasInput ? parseInt(totalDiasInput.value) : getDiasUteis();

            const diasPassados = diasPassadosInput ? parseInt(diasPassadosInput.value) : getDiasPassados();

            const novaMetaSetor = metaSetorInput ? parseMoneyToNumber(metaSetorInput.value || '0') : getMetaSetor();

            if (isNaN(totalDias) || totalDias <= 0) {

                showToast(' Informe um valor válido para Total de Dias Úteis');

                return;

            }

            if (isNaN(diasPassados) || diasPassados < 0 || diasPassados > totalDias) {

                showToast(` Dias passados deve ser entre 0 e ${totalDias}`);

                return;

            }

            // Atualiza estado local imediatamente
            configuracoes.total_dias_uteis = totalDias;

            configuracoes.dias_passados = diasPassados;

            configuracoes.meta_setor = novaMetaSetor;

            localStorage.setItem('configuracoes', JSON.stringify(configuracoes));

            // Salva no banco
            await salvarConfiguracoesBanco({

                total_dias_uteis: totalDias,

                dias_passados: diasPassados,

                meta_setor: novaMetaSetor

            });

            await registrarHistorico('edicao', `Configurações gerais alteradas: Total Dias=${totalDias}, Passados=${diasPassados}, Meta Setor=${formatMoney(novaMetaSetor)}`);

            // Atualiza a tela imediatamente
            atualizarDiasUteis();

            await atualizarDadosImediatos();

            atualizarDiasUteis();

            showToast(` Configurações salvas com sucesso!`);

        };

        window.toggleEquipe = (equipeId) => {

            equipesCollapsed[equipeId] = !equipesCollapsed[equipeId];

            salvarEquipesCollapsed();

            const contentDiv = document.getElementById(`equipe-content-${equipeId}`);

            const iconSpan = document.getElementById(`equipe-icon-${equipeId}`);

            if (contentDiv) {

                if (equipesCollapsed[equipeId]) {

                    contentDiv.classList.add('collapsed');

                    if (iconSpan) iconSpan.innerHTML = '▶';

                } else {

                    contentDiv.classList.remove('collapsed');

                    if (iconSpan) iconSpan.innerHTML = '▼';

                }

            }

        };

        window.toggleAdminClass = (classe) => {

            classesExpandidas[classe] = !classesExpandidas[classe];

            localStorage.setItem('classesExpandidas', JSON.stringify(classesExpandidas));

            let div = document.getElementById(`class-list-${classe}`);

            if (div) div.classList.toggle('expanded');

        };

        window.abrirModalNovaClasse = () => {

            document.getElementById('editModal').innerHTML = `<div class="modal-overlay"><div class="modal-content"><h3> Criar Nova Classe</h3><div class="modal-field"><label>Nome da Classe</label><input type="text" id="nova_classe_nome" placeholder="Ex: Premium, VIP"></div><div class="modal-actions"><button class="btn-modal-cancel" onclick="fecharModal()">Cancelar</button><button class="btn-modal-save" onclick="confirmarNovaClasse()">Criar</button></div></div></div>`;

            document.getElementById('editModal').style.display = 'block';

        };

        window.confirmarNovaClasse = async () => {

            const nomeClasse = document.getElementById('nova_classe_nome').value.trim();

            if (!nomeClasse) { showToast(' Insira um nome!'); return; }

            if (classes.find(c => c.nome === nomeClasse)) { showToast(' Classe já existe!'); return; }

            await insertInto('classes', { nome: nomeClasse });

            await registrarHistorico('criacao', `Classe "${nomeClasse}" criada`);

            fecharModal();

            await atualizarDadosImediatos();

            showToast(` Classe "${nomeClasse}" criada!`);

        };

        window.abrirModalNovoOperador = () => {

            const classesOptions = classes.map(c => `<option value="${c.nome}">${c.nome}</option>`).join('');

            const equipesOptions = equipes.map(eq => `<option value="${eq.id}">${eq.nome}</option>`).join('');

            document.getElementById('editModal').innerHTML = `<div class="modal-overlay"><div class="modal-content"><h3>Novo Usuário</h3><div class="modal-field"><label> Nome</label><input type="text" id="novo_operador_nome"></div><div class="modal-field"><label> Login</label><input type="text" id="novo_operador_login"></div><div class="modal-field"><label> Senha</label><div class="password-field"><input type="password" id="novo_operador_senha"><button type="button" class="btn-toggle-password" onclick="toggleSenhaVisivelNovo()">👁️ Exibir</button></div></div><div class="modal-field"><label> Função</label><select id="novo_operador_cargo"><option value="operador"> Operador</option><option value="elite">Elite</option><option value="supervisor"> Supervisor</option><option value="gestor">  Gestor</option></select></div><div class="modal-field"><label> Classe</label><select id="novo_operador_classe">${classesOptions}</select></div><div class="modal-field"><label> Equipe</label><select id="novo_operador_equipe"><option value="">Sem equipe</option>${equipesOptions}</select></div><div class="modal-field"><label>Meta (R$)</label><input type="text" id="novo_operador_meta" placeholder="Meta individual" oninput="formatarInputMoeda(this)"></div><div class="modal-actions"><button class="btn-modal-cancel" onclick="fecharModal()">Cancelar</button><button class="btn-modal-save" onclick="confirmarNovoOperador()">Criar</button></div></div></div>`;

            document.getElementById('editModal').style.display = 'block';

        };

        window.toggleSenhaVisivelNovo = () => { const senhaInput = document.getElementById('novo_operador_senha'); if (senhaInput) { senhaInput.type = senhaInput.type === 'password' ? 'text' : 'password'; } };

        window.confirmarNovoOperador = async () => {

            const nome = document.getElementById('novo_operador_nome').value;

            let login = document.getElementById('novo_operador_login').value;

            const senha = document.getElementById('novo_operador_senha').value;

            const cargo = document.getElementById('novo_operador_cargo').value;

            const classe = document.getElementById('novo_operador_classe').value;

            const equipe_id = document.getElementById('novo_operador_equipe').value || null;

            const meta = parseMoneyToNumber(document.getElementById('novo_operador_meta').value);

            if (!nome || !login || !senha || !classe) {

                showToast(' Preencha todos os campos!');

                return;

            }

            // Normaliza login para minúsculo

            login = login.toLowerCase().trim();

            // Verifica se login já existe (case-insensitive)

            if (usuarios.find(u => u.login?.toLowerCase() === login)) {

                showToast(' Login já existe!');

                return;

            }

            let novoId = 1;
            if (usuarios && usuarios.length > 0) {
                novoId = Math.max(...usuarios.map(u => Number(u.id) || 0)) + 1;
            }
            await insertInto('usuarios', { id: novoId, nome, login, senha, classe, equipe_id, cargo: cargo, status: 'ativo' });

            const novoUsuario = usuarios.find(u => u.login === login);

            if (novoUsuario && meta > 0) {

                const mes = new Date().getMonth() + 1, ano = new Date().getFullYear();

                await insertInto('metas', { usuario_id: novoUsuario.id, mes, ano, meta: meta, direto: 0, extra: 0, recebido: 0, por_fora_direto: 0, por_fora_extra: 0 });

            }

            await registrarHistorico('criacao', `Usuário "${nome}" (${cargo}) criado`);

            fecharModal();

            await atualizarDadosImediatos();

            showToast(' Usuário adicionado!');

        };

        window.abrirModalAdicionarSupervisor = () => {

            const equipesOptions = equipes.map(eq => `<option value="${eq.id}">${eq.nome}</option>`).join('');

            document.getElementById('editModal').innerHTML = `<div class="modal-overlay"><div class="modal-content"><h3>Adicionar Supervisor</h3><div class="modal-field"><label> Nome</label><input type="text" id="novo_supervisor_nome"></div><div class="modal-field"><label> Login</label><input type="text" id="novo_supervisor_login"></div><div class="modal-field"><label> Senha</label><div class="password-field"><input type="password" id="novo_supervisor_senha"><button type="button" class="btn-toggle-password" onclick="toggleSenhaVisivelNovoSup()">👁️ Exibir</button></div></div><div class="modal-field"><label> Função</label><select id="novo_supervisor_funcao"><option value="supervisor">Supervisor</option><option value="gestor">Gestor</option></select></div><div class="modal-field"><label>Equipe</label><select id="novo_supervisor_equipe"><option value="">Sem equipe</option>${equipesOptions}</select></div><div class="modal-actions"><button class="btn-modal-cancel" onclick="fecharModal()">Cancelar</button><button class="btn-modal-save" onclick="confirmarAdicionarSupervisor()">Adicionar</button></div></div></div>`;

            document.getElementById('editModal').style.display = 'block';

        };

        window.toggleSenhaVisivelNovoSup = () => { const senhaInput = document.getElementById('novo_supervisor_senha'); if (senhaInput) { senhaInput.type = senhaInput.type === 'password' ? 'text' : 'password'; } };

        window.confirmarAdicionarSupervisor = async () => {

            const nome = document.getElementById('novo_supervisor_nome').value;

            const login = document.getElementById('novo_supervisor_login').value;

            const senha = document.getElementById('novo_supervisor_senha').value;

            const funcao = document.getElementById('novo_supervisor_funcao').value;

            const equipe_id = document.getElementById('novo_supervisor_equipe').value || null;

            if (!nome || !login || !senha) { showToast(' Preencha todos os campos!'); return; }

            if (usuarios.find(u => u.login === login)) { showToast(' Login já existe!'); return; }

            let novoId = 1;
            if (usuarios && usuarios.length > 0) {
                novoId = Math.max(...usuarios.map(u => Number(u.id) || 0)) + 1;
            }
            await insertInto('usuarios', { id: novoId, nome, login, senha, equipe_id, cargo: funcao, status: 'ativo' });

            await registrarHistorico('criacao', `${funcao === 'gestor' ? 'Gestor' : 'Supervisor'} "${nome}" adicionado`);

            fecharModal();

            await atualizarDadosImediatos();

            showToast(` ${funcao === 'gestor' ? 'Gestor' : 'Supervisor'} adicionado!`);

        };

        function baixarModeloExcel() {

            const dados = [{ Login: 'exemplo_login', Direto: '0,00', Extra: '0,00' }];

            const ws = XLSX.utils.json_to_sheet(dados);

            const wb = XLSX.utils.book_new();

            XLSX.utils.book_append_sheet(wb, ws, 'Modelo');

            XLSX.writeFile(wb, 'modelo_importacao.xlsx');

            showToast(' Modelo baixado!');

        }

        function mostrarLoadingImportacao() {

            // Remove qualquer loading existente

            const existing = document.getElementById('importLoadingOverlay');

            if (existing) existing.remove();

            const loadingHtml = `

        <div id="importLoadingOverlay" style="position: fixed; bottom: 30px; right: 30px; z-index: 10010; background: #1F2A44; border-radius: 60px; padding: 16px 24px; box-shadow: 0 4px 20px rgba(0,0,0,0.3); display: flex; align-items: center; gap: 15px; backdrop-filter: blur(10px); border: 1px solid rgba(255,255,255,0.2);">

            <div class="loading-spinner" style="width: 24px; height: 24px; border: 3px solid rgba(255,255,255,0.3); border-top-color: #28A745; border-radius: 50%; animation: spin 0.8s linear infinite;"></div>

            <div style="color: white; font-weight: 500;">

                <span id="loadingMessage"> Processando importação...</span>

                <div id="loadingProgress" style="font-size: 0.75rem; opacity: 0.7; margin-top: 4px;"></div>

            </div>

        </div>

        <style>

            @keyframes spin {

                to { transform: rotate(360deg); }

            }

    `;

            document.body.insertAdjacentHTML('beforeend', loadingHtml);

        }

        function atualizarLoadingMensagem(mensagem, progresso = null) {

            const msgEl = document.getElementById('loadingMessage');

            const progressEl = document.getElementById('loadingProgress');

            if (msgEl) msgEl.innerText = mensagem;

            if (progressEl && progresso !== null) progressEl.innerText = progresso;

        }

        function fecharLoadingImportacao() {

            const loading = document.getElementById('importLoadingOverlay');

            if (loading) loading.remove();

        }

        function mostrarErroImportacao(mensagem) {

            const errorHtml = `

        <div id="importErrorToast" style="position: fixed; bottom: 100px; right: 30px; z-index: 10010; background: #DC3545; border-radius: 16px; padding: 16px 24px; box-shadow: 0 4px 20px rgba(0,0,0,0.3); display: flex; align-items: center; gap: 12px; backdrop-filter: blur(10px); border: 1px solid rgba(255,255,255,0.2); max-width: 400px;">

            <span style="font-size: 24px;"></span>

            <div style="color: white; font-weight: 500; flex: 1;">${mensagem}</div>

            <button onclick="this.parentElement.remove()" style="background: none; border: none; color: white; font-size: 18px; cursor: pointer;">✕</button>

        </div>

    `;

            document.body.insertAdjacentHTML('beforeend', errorHtml);

            setTimeout(() => {

                const toast = document.getElementById('importErrorToast');

                if (toast) toast.remove();

            }, 5000);

        }

        function mostrarSucessoImportacao(mensagem, detalhes = '') {

            const successHtml = `

        <div id="importSuccessToast" style="position: fixed; bottom: 30px; right: 30px; z-index: 10010; background: #28A745; border-radius: 16px; padding: 16px 24px; box-shadow: 0 4px 20px rgba(0,0,0,0.3); display: flex; align-items: center; gap: 12px; backdrop-filter: blur(10px); border: 1px solid rgba(255,255,255,0.2); max-width: 450px;">

            <span style="font-size: 28px;"></span>

            <div style="color: white;">

                <div style="font-weight: 700;">${mensagem}</div>

                ${detalhes ? `<div style="font-size: 0.75rem; opacity: 0.9; margin-top: 4px;">${detalhes}</div>` : ''}

            </div>

            <button onclick="this.parentElement.remove()" style="background: none; border: none; color: white; font-size: 18px; cursor: pointer; margin-left: 10px;">✕</button>

        </div>

    `;

            document.body.insertAdjacentHTML('beforeend', successHtml);

            setTimeout(() => {

                const toast = document.getElementById('importSuccessToast');

                if (toast) toast.remove();

            }, 6000);

        }

        function abrirImportacaoExcel() {

            if (currentUser.cargo !== 'gestor' && currentUser.cargo !== 'supervisor' && currentUser.cargo !== 'elite') {

                showToast(' Apenas gestor, supervisor e elite podem importar.');

                return;

            }

            // Criar modal de confirmação

            const modalHtml = `

        <div id="modalImportConfirm" class="modal-overlay" style="display: flex; z-index: 10005;">

            <div class="modal-content" style="max-width: 500px; text-align: center;">

                <div style="font-size: 48px; margin-bottom: 20px;"></div>

                <h3 style="color: #0F3B6F; margin-bottom: 15px;">Importar Dados</h3>

                <p style="margin-bottom: 20px; color: #334155;">

                    Selecione um arquivo Excel (.xlsx, .xls, .csv) com os dados de recebimento.

                </p>

                <p style="margin-bottom: 25px; font-size: 0.85rem; color: #5F7F9E;">

                    O arquivo deve conter as colunas: <strong>Cobradora, Recebido, Tipo comissão, Cliente, DtPgto</strong>

                </p>

                <div class="modal-actions" style="justify-content: center;">

                    <button id="btnSelecionarArquivo" class="btn-modal-save" style="background: #1E6DC3;">Selecionar Arquivo</button>

                    <button id="btnCancelarImport" class="btn-modal-cancel">Cancelar</button>

                </div>

                <div id="importErrorArea" style="margin-top: 15px;"></div>

            </div>

        </div>

    `;

            document.body.insertAdjacentHTML('beforeend', modalHtml);

            document.getElementById('btnSelecionarArquivo').onclick = () => {

                document.getElementById('modalImportConfirm').remove();

                const input = document.createElement('input');

                input.type = 'file';

                input.accept = '.xlsx, .xls, .csv';

                input.onchange = async (e) => {

                    const file = e.target.files[0];

                    if (!file) return;

                    // Mostrar tela de carregamento

                    mostrarLoadingImportacao();

                    const reader = new FileReader();

                    reader.onload = async (event) => {

                        try {

                            const data = new Uint8Array(event.target.result);

                            const workbook = XLSX.read(data, { type: 'array' });

                            const firstSheet = workbook.Sheets[workbook.SheetNames[0]];

                            const jsonData = XLSX.utils.sheet_to_json(firstSheet);

                            await processarImportacaoComFeedback(jsonData);

                        } catch (error) {

                            console.error('Erro ao ler arquivo:', error);

                            fecharLoadingImportacao();

                            mostrarErroImportacao(' Erro ao ler o arquivo. Verifique se o formato está correto.');

                        }

                    };

                    reader.readAsArrayBuffer(file);

                };

                input.click();

            };

            document.getElementById('btnCancelarImport').onclick = () => {

                document.getElementById('modalImportConfirm').remove();

            };

        }

        window.abrirModalEdicaoCompleta = async (userId) => {

            const user = usuarios.find(u => String(u.id) === String(userId));

            if (user) {

                await abrirModalEdicaoRapida(userId, user.nome, user.classe || '', getEquipeNome(user.equipe_id));

            } else {

                console.error('Usuário não encontrado. ID:', userId);

                showToast('Erro ao carregar usuário');

            }

        };

        async function atualizarDadosImediatos() {

            await carregarDados();

            inicializarPerfil();

            carregarDashboard();

            atualizarQuadranteFlutuante(); // 🔥 ADICIONE ESTA LINHA

            if (currentUser?.cargo === 'gestor') {
                carregarVisaoSetor();

                carregarEquipesTabGestor();

                carregarAdminReformuladoGestor();

                carregarSupervisoresGestor();

                carregarOperadoresTabGestor();

                carregarHistorico();

            } else if (currentUser?.cargo === 'supervisor') {

                carregarSupervisorDashboard();

                carregarVisaoSetor();

                carregarEquipesTabGestor();

                carregarAdminReformuladoGestor();

                carregarSupervisoresGestor();

                carregarOperadoresTabGestor();

                carregarHistorico();

            } else if (currentUser?.cargo === 'elite') {

                carregarEliteDashboard();

                carregarEquipesTabGestor();

                carregarAdminReformuladoGestor();

                carregarSupervisoresGestor();

                carregarOperadoresTabGestor();

                carregarHistorico();

            } else if (currentUser?.cargo === 'operador') {

                carregarOperadorDashboard();

            }

        }

        // ============================================

        // NAVEGAÇÃO DE ABAS

        // ============================================

        window.switchTab = function (tab, event) {

            document.querySelectorAll('.tab-content').forEach(function (el) { el.classList.add('hidden'); });

            document.getElementById(tab + 'Tab').classList.remove('hidden');

            document.querySelectorAll('.tab-btn').forEach(function (btn) { btn.classList.remove('active'); });

            if (event && event.target) {

                event.target.classList.add('active');

            } else {

                var btns = document.querySelectorAll('.tab-btn');

                for (var i = 0; i < btns.length; i++) {

                    var btn = btns[i];

                    if (btn.textContent.includes(tab === 'dashboard' ? 'Dashboard' : tab === 'admin' ? 'Admin' : tab === 'operadores' ? 'Operadores' : tab === 'equipes' ? 'Equipes' : tab === 'usuarios' ? 'Supervisores' : tab === 'historico' ? 'Historico' : tab === 'visaoEquipe' ? 'Equipe' : tab === 'detalhado' ? 'Detalhado' : 'Setor')) {

                        btn.classList.add('active');

                        break;

                    }

                }

            }

            if (tab === 'admin' && (currentUser?.cargo === 'gestor' || currentUser?.cargo === 'supervisor' || currentUser?.cargo === 'elite')) carregarAdminReformuladoGestor();

            if (tab === 'operadores' && (currentUser?.cargo === 'gestor' || currentUser?.cargo === 'supervisor' || currentUser?.cargo === 'elite')) carregarOperadoresTabGestor();

            if (tab === 'equipes' && (currentUser?.cargo === 'gestor' || currentUser?.cargo === 'supervisor' || currentUser?.cargo === 'elite')) carregarEquipesTabGestor();

            if (tab === 'usuarios' && (currentUser?.cargo === 'gestor' || currentUser?.cargo === 'supervisor' || currentUser?.cargo === 'elite')) carregarSupervisoresGestor();

            if (tab === 'historico' && (currentUser?.cargo === 'gestor' || currentUser?.cargo === 'supervisor' || currentUser?.cargo === 'elite')) carregarHistorico();

            if (tab === 'dashboard' && currentUser?.cargo === 'gestor') carregarDashboardGestor();

            if (tab === 'dashboard' && currentUser?.cargo === 'supervisor') carregarSupervisorDashboard();

            if (tab === 'dashboard' && currentUser?.cargo === 'operador') carregarOperadorDashboard();

            if (tab === 'dashboard' && currentUser?.cargo === 'elite') carregarEliteDashboard();

            if (tab === 'visaoEquipe') carregarVisaoEquipe();

            if (tab === 'visaoSetor') carregarVisaoSetor();

            if (tab === 'detalhado') {

                setTimeout(function () {

                    var buscaInput = document.getElementById('detalhadoBuscaOperador');

                    var eqSelect = document.getElementById('detalhadoFiltroEquipe');

                    var clsSelect = document.getElementById('detalhadoFiltroClasse');

                    if (currentUser && currentUser.cargo === 'operador') {

                        if (buscaInput) {

                            buscaInput.value = currentUser.nome;

                            buscaInput.disabled = true;

                            buscaInput.style.background = '#f0f0f0';

                            buscaInput.style.cursor = 'not-allowed';

                        }

                        // 🔥 OCULTAR OS FILTROS DE EQUIPE E CLASSE PARA OPERADOR (COM VERIFICAÇÃO)

                        if (eqSelect) {

                            var eqParent = eqSelect.closest('.filtro-item');

                            if (eqParent) eqParent.style.display = 'none';

                        }

                        if (clsSelect) {

                            var clsParent = clsSelect.closest('.filtro-item');

                            if (clsParent) clsParent.style.display = 'none';

                        }

                    } else {

                        if (buscaInput) {

                            buscaInput.disabled = false;

                            buscaInput.style.background = '';

                            buscaInput.style.cursor = '';

                            setupDetalhadoAutocomplete(buscaInput);

                        }

                        // 🔥 MOSTRAR OS FILTROS DE EQUIPE E CLASSE PARA OS DEMAIS

                        if (eqSelect) {

                            var eqParent = eqSelect.closest('.filtro-item');

                            if (eqParent) eqParent.style.display = '';

                        }

                        if (clsSelect) {

                            var clsParent = clsSelect.closest('.filtro-item');

                            if (clsParent) clsParent.style.display = '';

                        }

                    }

                    // Preencher selects de Equipe e Classe

                    if (eqSelect) {

                        eqSelect.innerHTML = '<option value="">Todas as equipes</option>';

                        for (var eq of equipes) {

                            eqSelect.innerHTML += '<option value="' + eq.id + '">' + eq.nome + '</option>';

                        }

                    }

                    if (clsSelect) {

                        clsSelect.innerHTML = '<option value="">Todas as classes</option>';

                        for (var cls of classes) {

                            clsSelect.innerHTML += '<option value="' + cls.nome + '">' + cls.nome + '</option>';

                        }

                    }

                }, 100);

                setTimeout(inicializarDetalhado, 200);

            }

        };

        // ============================================

        // CRIAR E MANTER BOTÃO ANALÍTICO

        // ============================================

        function garantirBotaoAnalitico() {

            let btn = document.getElementById('btnAnalitico');

            // Verificar se o usuário atual pode ter o botão (todos menos operador? ou todos?)

            // Vamos permitir para todos os perfis

            const podeTerBotao = currentUser && (currentUser.cargo === 'gestor' || currentUser.cargo === 'supervisor' || currentUser.cargo === 'elite' || currentUser.cargo === 'operador');

            if (!podeTerBotao) return;

            if (!btn) {

                btn = document.createElement('button');

                btn.id = 'btnAnalitico';

                btn.className = 'btn-analitico';

                btn.innerHTML = 'Analítico';

                btn.onclick = function () { abrirAnalitico(); };

                btn.style.cssText = 'display: inline-block; background: #28A745; color: white; border: none; padding: 12px 28px; border-radius: 40px; cursor: pointer; font-weight: 700; font-size: 0.9rem; margin-left: auto;';

                const motivationalDiv = document.getElementById('motivationalMessage');

                if (motivationalDiv && !document.getElementById('btnAnalitico')) {

                    motivationalDiv.appendChild(btn);

                }

            } else {

                btn.style.display = 'inline-block';

                btn.style.visibility = 'visible';

            }

        }

        document.addEventListener('DOMContentLoaded', garantirBotaoAnalitico);

        setTimeout(garantirBotaoAnalitico, 500);

        setTimeout(garantirBotaoAnalitico, 1500);

        const observerBotao = new MutationObserver(garantirBotaoAnalitico);

        observerBotao.observe(document.body, { childList: true, subtree: true });

        // ============================================

        // AUTH E LOGIN

        // ============================================

        async function checkAuth() {

            await carregarDados();

            // 🔥 FORÇAR ATUALIZAÇÃO DOS DIAS ÚTEIS LOGO APÓS CARREGAR DADOS

            setTimeout(atualizarDiasUteis, 200);

            let saved = localStorage.getItem('currentUser');

            if (saved) {

                currentUser = JSON.parse(saved);

                let userExists = usuarios.find(u => u.id === currentUser.id);

                if (!userExists) { localStorage.removeItem('currentUser'); mostrarLogin(); return; }

                currentUser = userExists;

                document.getElementById('userNameDisplay').innerHTML = `${getSaudacao()}, ${currentUser.nome.split(' ')[0]}`;

                inicializarPerfil();

                let tabsHtml = `<button class="tab-btn active" onclick="switchTab('dashboard', event)">Meu Dashboard</button>`;

                if (currentUser.cargo === 'elite') {
                    tabsHtml += `<button class="tab-btn" onclick="switchTab('visaoEquipe', event)">Visão da Equipe</button>`;
                    tabsHtml += `<button class="tab-btn" onclick="switchTab('visaoSetor', event)">Visão do Setor</button>`;
                    tabsHtml += `<button class="tab-btn" onclick="switchTab('admin', event)">Painel Admin</button><button class="tab-btn" onclick="switchTab('operadores', event)">Usuários</button><button class="tab-btn" onclick="switchTab('equipes', event)">Equipes</button><button class="tab-btn" onclick="switchTab('usuarios', event)">Supervisores</button><button class="tab-btn" onclick="switchTab('historico', event)">Histórico</button>`;
                } else if (currentUser.cargo === 'gestor') {
                    tabsHtml += `<button class="tab-btn" onclick="switchTab('visaoSetor', event)">Visão do Setor</button>`;
                    tabsHtml += `<button class="tab-btn" onclick="switchTab('admin', event)">Painel Admin</button><button class="tab-btn" onclick="switchTab('operadores', event)">Usuários</button><button class="tab-btn" onclick="switchTab('equipes', event)">Equipes</button><button class="tab-btn" onclick="switchTab('usuarios', event)">Supervisores</button><button class="tab-btn" onclick="switchTab('historico', event)">Histórico</button>`;
                } else if (currentUser.cargo === 'supervisor') {
                    tabsHtml += `<button class="tab-btn" onclick="switchTab('visaoEquipe', event)">Visão da Equipe</button>`;
                    tabsHtml += `<button class="tab-btn" onclick="switchTab('visaoSetor', event)">Visão do Setor</button>`;
                    tabsHtml += `<button class="tab-btn" onclick="switchTab('admin', event)">Painel Admin</button><button class="tab-btn" onclick="switchTab('operadores', event)">Usuários</button><button class="tab-btn" onclick="switchTab('equipes', event)">Equipes</button><button class="tab-btn" onclick="switchTab('usuarios', event)">Supervisores</button><button class="tab-btn" onclick="switchTab('historico', event)">Histórico</button>`;
                } else if (currentUser.cargo === 'operador') {
                    tabsHtml += `<button class="tab-btn" onclick="switchTab('visaoEquipe', event)">Visão da Equipe</button>`;
                    tabsHtml += `<button class="tab-btn" onclick="switchTab('visaoSetor', event)">Visão do Setor</button>`;
                }

                tabsHtml += `<button class="tab-btn" onclick="switchTab('detalhado', event)">Detalhado</button>`;

                document.getElementById('tabsContainer').innerHTML = tabsHtml;

                document.getElementById('totalDiasUteisConfig').value = getDiasUteis();

                document.getElementById('diasPassadosConfig').value = getDiasPassados();

                carregarDashboard();

                if (currentUser.cargo === 'gestor') {

                    carregarEquipesTabGestor();

                    carregarAdminReformuladoGestor();

                    carregarSupervisoresGestor();

                    carregarOperadoresTabGestor();

                    carregarHistorico();

                } else if (currentUser.cargo === 'supervisor') {

                    carregarSupervisorDashboard();

                    carregarEquipesTabGestor();

                    carregarAdminReformuladoGestor();

                    carregarSupervisoresGestor();

                    carregarOperadoresTabGestor();

                    carregarHistorico();

                    // 🔥 ADICIONE ESTAS LINHAS PARA O SUPERVISOR

                    carregarVisaoSetor();

                } else if (currentUser.cargo === 'elite') {

                    carregarEliteDashboard();

                    carregarEquipesTabGestor();

                    carregarAdminReformuladoGestor();

                    carregarSupervisoresGestor();

                    carregarOperadoresTabGestor();

                    carregarHistorico();

                    carregarVisaoEquipe();

                    carregarVisaoSetor();

                } else if (currentUser.cargo === 'operador') {

                    carregarOperadorDashboard();

                    carregarVisaoEquipe();

                    carregarVisaoSetor();

                }

            } else { mostrarLogin(); }

        }

        // ============================================

        // NOVAS FUNÇÕES COM SUPABASE STORAGE

        // ============================================

        const STORAGE_BUCKET = 'fotos-perfil';

        // 🔹 FUNÇÃO PARA UPLOAD DA FOTO

        async function salvarFotoPerfil(usuarioId, base64) {

            try {

                // Converter Base64 para Blob

                const response = await fetch(base64);

                const blob = await response.blob();

                // Nome único para o arquivo

                const extensao = blob.type.split('/')[1] || 'png';

                const nomeArquivo = `${usuarioId}-${Date.now()}.${extensao}`;

                const caminho = `usuarios/${nomeArquivo}`;

                // Upload para Storage

                const formData = new FormData();

                formData.append('file', blob, nomeArquivo);

                const uploadRes = await fetch(

                    `${SUPABASE_URL}/storage/v1/object/${STORAGE_BUCKET}/${caminho}`,

                    {

                        method: 'POST',

                        headers: {

                            'apikey': SUPABASE_ANON_KEY,

                            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`

                        },

                        body: formData

                    }

                );

                if (!uploadRes.ok) {

                    const errorText = await uploadRes.text();

                    console.error('Erro no upload:', errorText);

                    return false;

                }

                // URL pública da imagem

                const urlPublica = `${SUPABASE_URL}/storage/v1/object/public/${STORAGE_BUCKET}/${caminho}`;

                // Atualizar o campo 'foto' no banco com a URL pública

                const patchRes = await fetch(`${SUPABASE_URL}/rest/v1/usuarios?id=eq.${usuarioId}`, {

                    method: 'PATCH',

                    headers: {

                        'apikey': SUPABASE_ANON_KEY,

                        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,

                        'Content-Type': 'application/json'

                    },

                    body: JSON.stringify({ foto: urlPublica })

                });

                if (!patchRes.ok) {

                    console.error('Erro ao atualizar URL no banco');

                    return false;

                }

                // Atualizar o currentUser e a lista de usuários

                const usuarioAtualizado = usuarios.find(u => u.id === usuarioId);

                if (usuarioAtualizado) {

                    usuarioAtualizado.foto = urlPublica;

                }

                if (currentUser && currentUser.id === usuarioId) {

                    currentUser.foto = urlPublica;

                    localStorage.setItem('currentUser', JSON.stringify(currentUser));

                }

                // Atualizar a interface

                atualizarCirculoPerfil(urlPublica);

                console.log(' Foto salva com sucesso:', urlPublica);

                return true;

            } catch (error) {

                console.error(' Erro ao salvar foto:', error);

                return false;

            }

        }

        // 🔹 FUNÇÃO PARA REMOVER FOTO

        function removerFotoPerfil() {

            // Criar modal de confirmação

            const modalHtml = `

        <div id="modalConfirmRemoverFoto" class="modal-confirm-overlay" style="display: flex;">

            <div class="modal-confirm-content">

                <div class="modal-confirm-icon">️</div>

                <div class="modal-confirm-title">Remover Foto de Perfil</div>

                <div class="modal-confirm-message">

                    Tem certeza que deseja remover sua foto de perfil?

                </div>

                <div class="modal-confirm-actions">

                    <button class="btn-confirm-no" onclick="fecharModalConfirmRemover()">Cancelar</button>

                    <button class="btn-confirm-yes" onclick="confirmarRemoverFoto()">Sim, Remover</button>

                </div>

            </div>

        </div>

    `;

            document.body.insertAdjacentHTML('beforeend', modalHtml);

        }

        async function confirmarRemoverFoto() {

            fecharModalConfirmRemover();

            try {

                // Se tiver URL antiga, extrair o caminho para deletar do Storage

                if (currentUser.foto && currentUser.foto.includes('/storage/v1/object/public/')) {

                    const urlObj = new URL(currentUser.foto);

                    const pathParts = urlObj.pathname.split('/');

                    // Exemplo: /storage/v1/object/public/fotos-perfil/usuarios/123-123456.png

                    const caminhoStorage = pathParts.slice(5).join('/'); // Remove os primeiros 5 segmentos

                    // Deletar do Storage

                    await fetch(

                        `${SUPABASE_URL}/storage/v1/object/${STORAGE_BUCKET}/${caminhoStorage}`,

                        {

                            method: 'DELETE',

                            headers: {

                                'apikey': SUPABASE_ANON_KEY,

                                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`

                            }

                        }

                    );

                }

                // Atualizar banco para null

                await fetch(`${SUPABASE_URL}/rest/v1/usuarios?id=eq.${currentUser.id}`, {

                    method: 'PATCH',

                    headers: {

                        'apikey': SUPABASE_ANON_KEY,

                        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,

                        'Content-Type': 'application/json'

                    },

                    body: JSON.stringify({ foto: null })

                });

                // Atualizar localmente

                currentUser.foto = null;

                localStorage.setItem('currentUser', JSON.stringify(currentUser));

                const userIndex = usuarios.findIndex(u => u.id === currentUser.id);

                if (userIndex !== -1) {

                    usuarios[userIndex].foto = null;

                }

                // Atualizar UI

                atualizarCirculoPerfil(null);

                fecharModalPerfil();

                showToast(' Foto removida com sucesso!');

            } catch (error) {

                console.error(' Erro ao remover foto:', error);

                showToast(' Erro ao remover a foto.');

            }

        }

        // 🔹 FUNÇÃO PARA ATUALIZAR O CÍRCULO DE PERFIL (COM URL DO STORAGE)

        function atualizarCirculoPerfil(url) {

            const circle = document.getElementById('profileCircle');

            const initial = document.getElementById('profileInitial');

            const img = document.getElementById('profileImage');

            if (!circle) return;

            if (url) {

                img.src = url;

                img.style.display = 'block';

                img.onerror = function () {

                    // Fallback: se a imagem não carregar, mostrar inicial

                    img.style.display = 'none';

                    initial.style.display = 'block';

                    circle.style.background = 'linear-gradient(135deg, #1E6DC3, #0F3B6F)';

                    circle.style.border = '2px solid rgba(255,255,255,0.2)';

                    initial.textContent = currentUser?.nome?.charAt(0).toUpperCase() || '';

                };

                initial.style.display = 'none';

                circle.style.background = 'transparent';

                circle.style.border = '2px solid #28A745';

            } else {

                img.style.display = 'none';

                initial.style.display = 'block';

                circle.style.background = 'linear-gradient(135deg, #1E6DC3, #0F3B6F)';

                circle.style.border = '2px solid rgba(255,255,255,0.2)';

                if (currentUser) {

                    initial.textContent = currentUser.nome?.charAt(0).toUpperCase() || '';

                }

            }

        }

        // 🔹 FUNÇÃO PARA CARREGAR A FOTO DO PERFIL

        function inicializarPerfil() {

            if (!currentUser) return;

            const initial = document.getElementById('profileInitial');

            if (initial) {

                initial.textContent = currentUser.nome?.charAt(0).toUpperCase() || '';

            }

            if (currentUser.foto) {

                atualizarCirculoPerfil(currentUser.foto);

            }

            // Verificar se o usuário no banco tem foto mais recente

            const usuarioAtualizado = usuarios.find(u => u.id === currentUser.id);

            if (usuarioAtualizado && usuarioAtualizado.foto && !currentUser.foto) {

                currentUser.foto = usuarioAtualizado.foto;

                localStorage.setItem('currentUser', JSON.stringify(currentUser));

                atualizarCirculoPerfil(currentUser.foto);

            }

        }

        // 🔹 FUNÇÃO PARA FECHAR MODAL CONFIRMAR REMOVER

        function fecharModalConfirmRemover() {

            const modal = document.getElementById('modalConfirmRemoverFoto');

            if (modal) modal.remove();

        }

        let cropperInstance = null;

        let imagemOriginalPerfil = null;

        function abrirModalPerfil() {

            if (!currentUser) return;

            const usuario = usuarios.find(u => u.id === currentUser.id);

            if (!usuario) return;

            const modalExistente = document.getElementById('modalPerfil');

            if (modalExistente) modalExistente.remove();

            // Verificar se a foto é uma URL do Storage ou Base64 antigo

            const fotoUrl = normalizarFotoUrl(usuario.foto);

            const modalHtml = `

        <div id="modalPerfil" class="modal-perfil" style="display: flex;">

            <div class="modal-content">

                <div style="display: flex; justify-content: flex-end; margin-bottom: 10px;">

                    <button onclick="fecharModalPerfil()" style="background: none; border: none; font-size: 24px; cursor: pointer; color: #94A3B8;">✕</button>

                </div>

<div class="perfil-avatar-large" id="perfilAvatarLarge">

    ${fotoUrl

                    ? `<img src="${fotoUrl}" alt="Foto de perfil" id="perfilAvatarImg" 

             style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%; cursor: pointer; transition: transform 0.3s, box-shadow 0.3s;"

             onclick="abrirVisualizadorImagem('${fotoUrl}', '${usuario.nome}')"

             onmouseenter="this.style.transform='scale(1.05)'; this.style.boxShadow='0 0 30px rgba(40,167,69,0.3)'"

             onmouseleave="this.style.transform='scale(1)'; this.style.boxShadow='none'"

             onerror="this.style.display='none'; this.parentElement.innerHTML='<span class=\\'default-icon\\' style=\\'font-size:48px;\\'>${usuario.nome.charAt(0).toUpperCase()}</span>'">`

                    : `<span class="default-icon" style="font-size: 48px;">${usuario.nome.charAt(0).toUpperCase()}</span>`

                }

</div>

                <div class="perfil-info">

                    <div class="perfil-info-item">

                        <span class="label"> Nome</span>

                        <span class="value">${escapeHtml(usuario.nome)}</span>

                    </div>

                    <div class="perfil-info-item">

                        <span class="label"> Login</span>

                        <span class="value">${escapeHtml(usuario.login)}</span>

                    </div>

                    <div class="perfil-info-item" style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap;">

                        <span class="label">Senha</span>

                        <div style="display: flex; align-items: center; gap: 10px;">

                            <span class="value senha" id="perfilSenhaDisplay">${'•'.repeat(usuario.senha ? usuario.senha.length : 0)}</span>

                            <span class="value senha" id="perfilSenhaReal" style="display: none; font-weight: 700; color: #1E6DC3;">${escapeHtml(usuario.senha || '')}</span>

                            <button onclick="toggleSenhaPerfil()" style="background: none; border: none; cursor: pointer; font-size: 18px; padding: 4px 8px; border-radius: 8px; transition: background 0.2s;" 

                                    onmouseenter="this.style.background='#E2E8F0'" onmouseleave="this.style.background='none'"

                                    title="Mostrar/Esconder senha">

                                <span id="perfilSenhaIcon">👁️</span>

                            </button>

                        </div>

                    </div>

                    <div class="perfil-info-item">

                        <span class="label"> Função</span>

                        <span class="value">${usuario.cargo === 'gestor' ? ' Gestor' : usuario.cargo === 'supervisor' ? ' Supervisor' : usuario.cargo === 'elite' ? 'Elite' : ' Operador'}</span>

                    </div>

                    <div class="perfil-info-item">

                        <span class="label"> Classe</span>

                        <span class="value">${escapeHtml(usuario.classe || 'Sem classe')}</span>

                    </div>

                </div>

                <div class="perfil-actions">

                    <button class="btn-foto" onclick="abrirModalCrop()">

                        ${fotoUrl ? 'Alterar Foto' : 'Adicionar Foto'}

                    </button>

                    ${fotoUrl ? `<button class="btn-foto-remover" onclick="removerFotoPerfil()"> Remover Foto</button>` : ''}

                    <button class="btn-fechar-perfil" onclick="fecharModalPerfil()">Fechar</button>

                </div>

                <div id="perfilMensagem" style="margin-top: 15px; font-size: 0.85rem; color: #1E6DC3;"></div>

            </div>

        </div>

    `;

            document.body.insertAdjacentHTML('beforeend', modalHtml);

            document.getElementById('modalPerfil').addEventListener('click', function (e) {

                if (e.target === this) fecharModalPerfil();

            });

        }

        function toggleSenhaPerfil() {

            const display = document.getElementById('perfilSenhaDisplay');

            const real = document.getElementById('perfilSenhaReal');

            const icon = document.getElementById('perfilSenhaIcon');

            if (!display || !real || !icon) return;

            if (display.style.display === 'none') {

                // Mostrar pontos, esconder senha real

                display.style.display = 'inline';

                real.style.display = 'none';

                icon.textContent = '👁️';

            } else {

                // Mostrar senha real, esconder pontos

                display.style.display = 'none';

                real.style.display = 'inline';

                icon.textContent = '🙈';

            }

        }

        function fecharModalPerfil() {

            const modal = document.getElementById('modalPerfil');

            if (modal) modal.remove();

            fecharModalCrop();

        }

        // ============================================

        // FUNÇÕES DE CROP

        // ============================================

        function abrirModalCrop() {

            // Criar input file oculto

            const input = document.createElement('input');

            input.type = 'file';

            input.accept = 'image/*';

            input.onchange = function (e) {

                const file = e.target.files[0];

                if (!file) return;

                // Validar tamanho (máx 5MB)

                if (file.size > 5 * 1024 * 1024) {

                    showToast(' A imagem deve ter no máximo 5MB.');

                    return;

                }

                // Validar tipo

                if (!file.type.startsWith('image/')) {

                    showToast(' Por favor, selecione uma imagem válida.');

                    return;

                }

                const reader = new FileReader();

                reader.onload = function (event) {

                    imagemOriginalPerfil = event.target.result;

                    abrirModalCropEditor(imagemOriginalPerfil);

                };

                reader.readAsDataURL(file);

            };

            input.click();

        }

        function abrirModalCropEditor(imagemUrl) {

            // Fechar modal de perfil temporariamente

            const modalPerfil = document.getElementById('modalPerfil');

            if (modalPerfil) modalPerfil.style.display = 'none';

            // Criar modal de crop

            const modalHtml = `

        <div id="modalCrop" class="modal-crop-overlay" style="display: flex;">

            <div class="modal-crop-content">

                <div class="modal-crop-header">

                    <h3>✂️ Ajustar Foto de Perfil</h3>

                    <button onclick="fecharModalCrop()">✕</button>

                </div>

                <div class="crop-container">

                    <img id="cropImage" src="${imagemUrl}" alt="Selecione a área para recortar">

                    <div class="crop-guide-overlay">

                        <div class="crop-guide-circle"></div>

                    </div>

                </div>

                <div class="crop-preview-container">

                    <div class="crop-preview-box">

                        <div class="crop-preview-circle" id="cropPreviewCircle">

                            <img id="cropPreviewImg" src="${imagemUrl}" alt="Preview">

                        </div>

                        <span>Preview</span>

                    </div>

                    <div class="crop-preview-box" style="color: rgba(255,255,255,0.4); font-size: 0.65rem;">

                        <span>Arraste para ajustar</span>

                        <br>

                        <span>Role para zoom</span>

                    </div>

                </div>

                <div class="crop-actions">

                    <button class="btn-crop-reset" onclick="resetarCrop()">↺ Resetar</button>

                    <button class="btn-crop-cancel" onclick="fecharModalCrop()">Cancelar</button>

                    <button class="btn-crop-confirm" onclick="confirmarCrop()"> Salvar Foto</button>

                </div>

            </div>

        </div>

    `;

            document.body.insertAdjacentHTML('beforeend', modalHtml);

            // 🔥 CORREÇÃO: Usar setTimeout para garantir que o DOM foi renderizado

            setTimeout(function () {

                const image = document.getElementById('cropImage');

                if (!image) {

                    console.error(' Elemento cropImage não encontrado');

                    showToast(' Erro ao carregar o editor de imagem');

                    return;

                }

                // Função para inicializar o cropper

                function initCropper() {

                    if (cropperInstance) {

                        cropperInstance.destroy();

                        cropperInstance = null;

                    }

                    try {

                        cropperInstance = new Cropper(image, {

                            aspectRatio: 1,

                            viewMode: 1,

                            dragMode: 'move',

                            autoCropArea: 0.8,

                            restore: false,

                            guides: false,

                            center: false,

                            highlight: false,

                            cropBoxMovable: true,

                            cropBoxResizable: true,

                            toggleDragModeOnDblclick: false,

                            minContainerWidth: 300,

                            minContainerHeight: 300,

                            ready: function () {

                                try {

                                    // 🔥 CORREÇÃO: Verificar se o método existe antes de chamar

                                    if (this && typeof this.getContainerData === 'function') {

                                        const containerData = this.getContainerData();

                                        if (containerData && containerData.width && containerData.height) {

                                            const cropBoxData = {

                                                left: containerData.width * 0.1,

                                                top: containerData.height * 0.1,

                                                width: containerData.width * 0.8,

                                                height: containerData.height * 0.8

                                            };

                                            this.setCropBoxData(cropBoxData);

                                            atualizarPreviewCrop();

                                        }

                                    } else {

                                        // Fallback: tentar definir crop box manualmente

                                        setTimeout(function () {

                                            try {

                                                if (cropperInstance && typeof cropperInstance.setCropBoxData === 'function') {

                                                    const container = cropperInstance.getContainerData();

                                                    if (container) {

                                                        const cropBoxData = {

                                                            left: container.width * 0.1,

                                                            top: container.height * 0.1,

                                                            width: container.width * 0.8,

                                                            height: container.height * 0.8

                                                        };

                                                        cropperInstance.setCropBoxData(cropBoxData);

                                                        atualizarPreviewCrop();

                                                    }

                                                }

                                            } catch (e) {

                                            }

                                        }, 100);

                                    }

                                } catch (e) {

                                }

                            },

                            crop: function () {

                                atualizarPreviewCrop();

                            }

                        });

                        console.log(' Cropper inicializado com sucesso');

                    } catch (e) {

                        console.error(' Erro ao inicializar Cropper:', e);

                        showToast(' Erro ao processar a imagem. Tente novamente.');

                    }

                }

                // Se a imagem já estiver carregada, inicializa imediatamente

                if (image.complete && image.naturalWidth > 0) {

                    initCropper();

                } else {

                    // Aguarda a imagem carregar

                    image.onload = function () {

                        console.log(' Imagem carregada, inicializando Cropper...');

                        initCropper();

                    };

                    image.onerror = function () {

                        showToast(' Erro ao carregar a imagem. Tente novamente.');

                    };

                }

            }, 100);

        }

        function atualizarPreviewCrop() {

            if (!cropperInstance) return;

            const previewImg = document.getElementById('cropPreviewImg');

            if (!previewImg) return;

            try {

                const canvas = cropperInstance.getCroppedCanvas({

                    width: 200,

                    height: 200,

                    imageSmoothingEnabled: true,

                    imageSmoothingQuality: 'high'

                });

                previewImg.src = canvas.toDataURL('image/jpeg', 0.9);

            } catch (e) { }

        }

        function resetarCrop() {

            if (!cropperInstance) return;

            try {

                cropperInstance.reset();

                cropperInstance.clear();

                // 🔥 CORREÇÃO: Verificar se getContainerData existe

                if (typeof cropperInstance.getContainerData === 'function') {

                    const containerData = cropperInstance.getContainerData();

                    if (containerData && containerData.width && containerData.height) {

                        const cropBoxData = {

                            left: containerData.width * 0.1,

                            top: containerData.height * 0.1,

                            width: containerData.width * 0.8,

                            height: containerData.height * 0.8

                        };

                        cropperInstance.setCropBoxData(cropBoxData);

                        atualizarPreviewCrop();

                    }

                } else {

                }

            } catch (e) {

            }

        }

        function confirmarCrop() {

            if (!cropperInstance) return;

            try {

                const canvas = cropperInstance.getCroppedCanvas({

                    width: 400,

                    height: 400,

                    imageSmoothingEnabled: true,

                    imageSmoothingQuality: 'high'

                });

                if (!canvas) {

                    showToast(' Erro ao processar a imagem.');

                    return;

                }

                const base64 = canvas.toDataURL('image/png');

                processarFotoRecortada(base64);

            } catch (error) {

                showToast(' Erro ao processar a imagem. Tente novamente.');

            }

        }

        async function processarFotoRecortada(base64) {

            const mensagemEl = document.getElementById('perfilMensagem');

            if (mensagemEl) mensagemEl.textContent = ' Salvando foto...';

            try {

                const sucesso = await salvarFotoPerfil(currentUser.id, base64);

                if (sucesso) {

                    fecharModalCrop();

                    const modalPerfil = document.getElementById('modalPerfil');

                    if (modalPerfil) modalPerfil.style.display = 'flex';

                    const avatarLarge = document.querySelector('.perfil-avatar-large');

                    if (avatarLarge) {

                        avatarLarge.innerHTML = `<img src="${base64}" alt="Foto de perfil">`;

                    }

                    atualizarCirculoPerfil(base64);

                    currentUser.foto = base64;

                    localStorage.setItem('currentUser', JSON.stringify(currentUser));

                    const userIndex = usuarios.findIndex(u => u.id === currentUser.id);

                    if (userIndex !== -1) {

                        usuarios[userIndex].foto = base64;

                    }

                    if (mensagemEl) mensagemEl.textContent = ' Foto atualizada com sucesso!';

                    const actionsDiv = document.querySelector('.perfil-actions');

                    if (actionsDiv && !document.querySelector('.btn-foto-remover')) {

                        const removerBtn = document.createElement('button');

                        removerBtn.className = 'btn-foto-remover';

                        removerBtn.textContent = ' Remover Foto';

                        removerBtn.onclick = removerFotoPerfil;

                        actionsDiv.insertBefore(removerBtn, actionsDiv.querySelector('.btn-fechar-perfil'));

                    }

                    const btnFoto = document.querySelector('.btn-foto');

                    if (btnFoto) btnFoto.textContent = 'Alterar Foto';

                    showToast(' Foto de perfil atualizada!');

                } else {

                    if (mensagemEl) mensagemEl.textContent = ' Erro ao salvar a foto. Tente novamente.';

                    showToast(' Erro ao salvar a foto.');

                }

            } catch (error) {

                if (mensagemEl) mensagemEl.textContent = ' Erro ao processar a imagem.';

                showToast(' Erro ao processar a imagem.');

            }

        }

        function fecharModalCrop() {

            if (cropperInstance) {

                cropperInstance.destroy();

                cropperInstance = null;

            }

            const modal = document.getElementById('modalCrop');

            if (modal) modal.remove();

            const modalPerfil = document.getElementById('modalPerfil');

            if (modalPerfil && modalPerfil.style.display === 'none') {

                modalPerfil.style.display = 'flex';

            }

        }

        function fecharModalConfirmRemover() {

            const modal = document.getElementById('modalConfirmRemoverFoto');

            if (modal) modal.remove();

        }

        // Chamar inicialização após carregar os dados

        // Adicione esta linha dentro da função checkAuth(), após carregar o usuário:

        // inicializarPerfil();

        function mostrarLogin() {

            let div = document.createElement('div');

            div.id = 'loginScreen';

            div.style = 'position:fixed; inset:0; background:radial-gradient(#0F2B4F,#03152A); display:flex; align-items:center; justify-content:center; z-index:10000;';

            div.innerHTML = `

        <div class="login-container" style="max-width: 450px;">

            <h2>Controle Receptivo</h2>

            <div class="subtitle">Sistema de Gestão de Metas</div>

            <input type="text" id="loginUser" class="login-input" placeholder="Usuário">

            <div class="password-field" style="margin: 12px 0;">

                <input type="password" id="loginSenha" class="login-input" placeholder="Senha" style="margin: 0;">

                <button type="button" class="btn-toggle-password" onclick="toggleLoginPassword()" style="padding: 12px 16px;">👁️</button>

            </div>

            <button onclick="window.fazerLogin()" class="login-btn">Entrar</button>

            

            <div id="loginError" class="error-message"></div>

        </div>

    `;

            document.body.appendChild(div);

            //  ADICIONE ESTA FUNÇÃO PARA CAPTURAR O ENTER

            function setupEnterLogin() {

                const loginInput = document.getElementById('loginUser');

                const senhaInput = document.getElementById('loginSenha');

                const handleEnter = (e) => {

                    if (e.key === 'Enter') {

                        e.preventDefault();

                        window.fazerLogin();

                    }

                };

                if (loginInput) loginInput.addEventListener('keypress', handleEnter);

                if (senhaInput) senhaInput.addEventListener('keypress', handleEnter);

            }

            // Aguarda os elementos serem criados e adiciona os eventos

            setTimeout(setupEnterLogin, 50);

            window.fazerLogin = async () => {

                await carregarDados();

                let login = document.getElementById('loginUser').value;

                let senha = document.getElementById('loginSenha').value;

                // Normaliza: converte login para minúsculo para comparação

                let loginNormalizado = login.toLowerCase().trim();

                // Busca ignorando maiúsculo/minúsculo no login, mas senha permanece original

                let user = usuarios.find(u =>

                    u.login?.toLowerCase().trim() === loginNormalizado &&

                    u.senha === senha

                );

                if (user) {

                    localStorage.setItem('currentUser', JSON.stringify(user));

                    location.reload();

                } else {

                    document.getElementById('loginError').innerText = 'Usuário ou senha inválidos';

                }

            };

            window.toggleLoginPassword = () => {

                const senhaInput = document.getElementById('loginSenha');

                if (senhaInput) {

                    senhaInput.type = senhaInput.type === 'password' ? 'text' : 'password';

                }

            };

            window.abrirPrimeiroAcesso = () => {

                document.getElementById('loginScreen').remove();

                mostrarModalPrimeiroAcesso();

            };

        }

        function mostrarModalPrimeiroAcesso() {

            let div = document.createElement('div');

            div.id = 'primeiroAcessoScreen';

            div.style = 'position:fixed; inset:0; background:rgba(0,0,0,0.85); backdrop-filter:blur(8px); display:flex; align-items:center; justify-content:center; z-index:10001;';

            div.innerHTML = `

        <div class="login-container" style="max-width: 500px;">

            <h2> Primeiro Acesso</h2>

            <div class="subtitle">Crie sua conta de operador para acessar o sistema</div>

            <div class="modal-field">

                <label> Nome Completo</label>

                <input type="text" id="primeiro_nome" class="login-input" placeholder="Ex: João Silva">

            </div>

            <div class="modal-field">

                <label> Login (usuário)</label>

                <input type="text" id="primeiro_login" class="login-input" placeholder="Ex: joao_silva">

            </div>

            <div class="modal-field">

                <label> Nova Senha</label>

                <div class="password-field">

                    <input type="password" id="primeiro_senha" class="login-input" placeholder="Mínimo 4 caracteres">

                    <button type="button" class="btn-toggle-password" onclick="togglePrimeiroSenha()">👁️</button>

                </div>

            </div>

            <div class="modal-field">

                <label> Confirmar Senha</label>

                <div class="password-field">

                    <input type="password" id="primeiro_senha_confirm" class="login-input" placeholder="Digite a senha novamente">

                    <button type="button" class="btn-toggle-password" onclick="togglePrimeiroSenhaConfirm()">👁️</button>

                </div>

            </div>

            <button onclick="window.confirmarPrimeiroAcesso()" class="login-btn" style="margin-top: 20px;"> Criar Conta e Entrar</button>

            <button onclick="window.voltarParaLogin()" class="login-btn" style="background: #6C757D; margin-top: 12px;">← Voltar ao Login</button>

            <div id="primeiroError" class="error-message"></div>

        </div>

    `;

            document.body.appendChild(div);

            window.togglePrimeiroSenha = () => {

                const input = document.getElementById('primeiro_senha');

                if (input) input.type = input.type === 'password' ? 'text' : 'password';

            };

            window.togglePrimeiroSenhaConfirm = () => {

                const input = document.getElementById('primeiro_senha_confirm');

                if (input) input.type = input.type === 'password' ? 'text' : 'password';

            };

            window.confirmarPrimeiroAcesso = async () => {

                const nome = document.getElementById('primeiro_nome').value.trim();

                let login = document.getElementById('primeiro_login').value.trim();

                const senha = document.getElementById('primeiro_senha').value;

                const senhaConfirm = document.getElementById('primeiro_senha_confirm').value;

                if (!nome || !login || !senha) {

                    document.getElementById('primeiroError').innerHTML = 'Preencha todos os campos!';

                    return;

                }

                if (senha !== senhaConfirm) {

                    document.getElementById('primeiroError').innerHTML = 'As senhas não coincidem!';

                    return;

                }

                if (senha.length < 4) {

                    document.getElementById('primeiroError').innerHTML = 'A senha deve ter pelo menos 4 caracteres!';

                    return;

                }

                await carregarDados();

                // Normaliza login para minúsculo na verificação (case-insensitive)

                const loginNormalizado = login.toLowerCase();

                // Verifica se o usuário já existe (ignorando maiúsculo/minúsculo)

                const usuarioExistente = usuarios.find(u => u.login?.toLowerCase() === loginNormalizado);

                if (usuarioExistente) {

                    document.getElementById('primeiroError').innerHTML = `

            <div style="background: #FFF3CD; color: #856404; padding: 15px; border-radius: 16px; text-align: center;">

                <strong> Este login já está cadastrado!</strong><br><br>

                Se você já possui cadastro, utilize o botão <strong>"← Voltar ao Login"</strong> para acessar.<br><br>

                Caso não lembre suas credenciais, procure o seu <strong>líder ou supervisor</strong> para obter ajuda.

            </div>

        `;

                    return;

                }

                //  CORREÇÃO: Verificar se a classe "Geral" existe, se não, criar ou usar primeira classe disponível

                let classeParaUsar = 'Geral';

                const classeGeralExiste = classes.find(c => c.nome === 'Geral');

                if (!classeGeralExiste) {

                    // Se não existe a classe "Geral", tenta criar

                    try {

                        const createRes = await fetch(`${SUPABASE_URL}/rest/v1/classes`, {

                            method: 'POST',

                            headers: {

                                'apikey': SUPABASE_ANON_KEY,

                                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,

                                'Content-Type': 'application/json'

                            },

                            body: JSON.stringify({ nome: 'Geral' })

                        });

                        if (createRes.ok) {

                            // Recarregar classes

                            const classesRes = await fetch(`${SUPABASE_URL}/rest/v1/classes?select=*`, {

                                headers: {

                                    'apikey': SUPABASE_ANON_KEY,

                                    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`

                                }

                            });

                            if (classesRes.ok) {

                                classes = await classesRes.json();

                            }

                        } else {

                            // Se não conseguiu criar, usa a primeira classe existente

                            if (classes.length > 0) {

                                classeParaUsar = classes[0].nome;

                            } else {

                                document.getElementById('primeiroError').innerHTML = ' Nenhuma classe disponível. Contate o administrador.';

                                return;

                            }

                        }

                    } catch (e) {

                        if (classes.length > 0) {

                            classeParaUsar = classes[0].nome;

                        } else {

                            document.getElementById('primeiroError').innerHTML = ' Erro ao configurar classe. Contate o administrador.';

                            return;

                        }

                    }

                }

                // Salva o login em minúsculo para padronização

                login = loginNormalizado;

                // Criar usuário como OPERADOR (fixo)
                let novoId = 1;
                if (usuarios && usuarios.length > 0) {
                    novoId = Math.max(...usuarios.map(u => Number(u.id) || 0)) + 1;
                }
                const result = await insertInto('usuarios', {
                    id: novoId,
                    nome: nome,
                    login: login,
                    senha: senha,
                    cargo: 'operador',
                    classe: classeParaUsar,
                    status: 'ativo',
                    equipe_id: null
                });

                if (result && result.success) {

                    const mes = new Date().getMonth() + 1;

                    const ano = new Date().getFullYear();

                    await insertInto('metas', {

                        usuario_id: null, // Será atualizado após buscar o ID

                        mes: mes,

                        ano: ano,

                        meta: 0,

                        direto: 0,

                        extra: 0,

                        recebido: 0,

                        por_fora_direto: 0,

                        por_fora_extra: 0

                    });

                    await registrarHistorico('criacao', `Novo operador "${nome}" criado via Primeiro Acesso`);

                    await carregarDados();

                    const novoUser = usuarios.find(u => u.login === login);

                    if (novoUser) {

                        // Atualizar a meta com o ID correto

                        await updateIn('metas', novoUser.id, { usuario_id: novoUser.id });

                        localStorage.setItem('currentUser', JSON.stringify(novoUser));

                        location.reload();

                    } else {

                        alert('Conta criada! Faça login agora.');

                        document.getElementById('primeiroAcessoScreen').remove();

                        mostrarLogin();

                    }

                } else {

                    document.getElementById('primeiroError').innerHTML = 'Erro ao criar conta. Tente novamente.';

                }

            };

            window.voltarParaLogin = () => {

                document.getElementById('primeiroAcessoScreen').remove();

                mostrarLogin();

            };

        }

        window.fecharModalMovimento = fecharModalMovimento;

        window.confirmarMovimento = confirmarMovimento;

        // ============================================

        // FUNÇÃO FORÇADA PARA ATUALIZAR DIAS ÚTEIS

        // ============================================

        function atualizarDiasUteis() {

            // Obter valores das configurações

            const totalDias = getDiasUteis();

            const diasPassados = getDiasPassados();

            const diasRestantes = getDiasRestantes();

            // Tentar encontrar os elementos de várias formas

            let elPassados = document.getElementById('diasPassadosDisplay');

            let elRestantes = document.getElementById('diasRestantesDisplay');

            let elTotal = document.getElementById('totalDiasDisplay');

            // Se não encontrar, tentar buscar dentro do dashboard

            if (!elPassados) {

                const dashboard = document.getElementById('dashboardTab');

                if (dashboard) {

                    elPassados = dashboard.querySelector('#diasPassadosDisplay');

                    elRestantes = dashboard.querySelector('#diasRestantesDisplay');

                    elTotal = dashboard.querySelector('#totalDiasDisplay');

                }

            }

            // Se ainda não encontrou, recriar o card

            if (!elPassados) {

                const motivationalDiv = document.getElementById('motivationalMessage');

                if (motivationalDiv && motivationalDiv.parentNode) {

                    let existingCard = motivationalDiv.parentNode.querySelector('.dias-uteis-card');

                    if (existingCard) {

                        existingCard.remove();

                    }

                    const newCard = document.createElement('div');

                    newCard.className = 'dias-uteis-card';

                    newCard.innerHTML = `

                <div style="display: flex; justify-content: space-around;">

                    <div><span class="valor-grande" id="diasPassadosDisplay">${diasPassados}</span><br>Dias Úteis Passados</div>

                    <div><span class="valor-grande" id="diasRestantesDisplay">${diasRestantes}</span><br>Dias Restantes</div>

                    <div><span class="valor-grande" id="totalDiasDisplay">${totalDias}</span><br>Total Dias</div>

                </div>

            `;

                    motivationalDiv.parentNode.insertBefore(newCard, motivationalDiv.nextSibling);

                    elPassados = document.getElementById('diasPassadosDisplay');

                    elRestantes = document.getElementById('diasRestantesDisplay');

                    elTotal = document.getElementById('totalDiasDisplay');

                }

            }

            // Atualizar os valores no card

            if (elPassados) {

                elPassados.innerHTML = diasPassados;

                if (elRestantes) elRestantes.innerHTML = diasRestantes;

                if (elTotal) elTotal.innerHTML = totalDias;

            }

            // Atualizar os inputs de configuração se existirem na tela

            const inputTotal = document.getElementById('totalDiasUteisConfig');

            const inputPassados = document.getElementById('diasPassadosConfig');

            const inputMetaAdmin = document.getElementById('metaSetorConfigAdmin');

            if (inputTotal) inputTotal.value = totalDias;

            if (inputPassados) inputPassados.value = diasPassados;

            if (inputMetaAdmin) inputMetaAdmin.value = formatMoney(getMetaSetor());

        }

        // Funções globais seguras

        window.getDiasUteis = getDiasUteis;

        window.getDiasPassados = getDiasPassados;

        window.getDiasRestantes = getDiasRestantes;

        window.getMetaSetor = getMetaSetor;

        // Chamar a função em intervalos regulares até funcionar

        let tentativasDiasUteis = 0;

        const intervalDiasUteis = setInterval(function () {

            tentativasDiasUteis++;

            if (document.getElementById('diasPassadosDisplay') || tentativasDiasUteis > 20) {

                clearInterval(intervalDiasUteis);

                atualizarDiasUteis();

            }

        }, 500);

        // ============================================

        // QUADRANTE FLUTUANTE - TOTAL DO DIA (ARRÁSTAVEL)

        // ============================================

        let floatingCard = null;

        let dailyTotalInterval = null;

        let isDraggingCard = false;

        let dragStartX = 0, dragStartY = 0;

        let cardStartLeft = 0, cardStartTop = 0;

        let tentativaCriacao = 0;

        const MAX_TENTATIVAS = 10;

        function criarQuadranteFlutuante() {

            // Verificar se já existe

            if (document.getElementById('floatingDailyCard')) return;

            // Verificar se currentUser está disponível

            if (!currentUser || !currentUser.cargo) {

                tentativaCriacao++;

                if (tentativaCriacao < MAX_TENTATIVAS) {

                    setTimeout(criarQuadranteFlutuante, 500);

                }

                return;

            }

            // Resetar tentativas

            tentativaCriacao = 0;

            // Determinar o título baseado no cargo

            let titulo = '';

            if (currentUser.cargo === 'gestor') {

                titulo = 'RECEBIDO DO SETOR (HOJE)';

            } else if (currentUser.cargo === 'supervisor') {

                titulo = 'RECEBIDO DA EQUIPE (HOJE)';

            } else {

                titulo = 'SEU RECEBIDO HOJE';

            }

            // Criar o elemento do quadrante

            const card = document.createElement('div');

            card.id = 'floatingDailyCard';

            card.className = 'floating-daily-card loading';

            card.innerHTML = `

        <div class="floating-daily-header" id="floatingDragHandle">

            <span class="daily-title">${titulo}</span>

            <button class="btn-minimize" id="minimizeBtn">−</button>

        </div>

        <div class="floating-daily-body" id="floatingDailyBody">

            <div class="daily-date" id="dailyDate">--/--/----</div>

            <div class="daily-value" id="dailyValue">CARREGANDO...</div>

            <div class="daily-sub">Clique para ver detalhes</div>

        </div>

    `;

            // Restaurar estado minimizado

            const wasMinimized = localStorage.getItem(`floatingCardMinimized_${currentUser.id}`) === 'true';

            if (wasMinimized) {

                card.classList.add('minimized');

                const minimizeBtn = card.querySelector('#minimizeBtn');

                if (minimizeBtn) minimizeBtn.textContent = '+';

            }

            // Restaurar posição salva (específica do usuário)

            const savedLeft = localStorage.getItem(`floatingCardLeft_${currentUser.id}`);

            const savedTop = localStorage.getItem(`floatingCardTop_${currentUser.id}`);

            if (savedLeft !== null && savedTop !== null) {

                const leftNum = parseFloat(savedLeft);

                const topNum = parseFloat(savedTop);

                if (!isNaN(leftNum) && !isNaN(topNum)) {

                    card.style.position = 'fixed';

                    card.style.left = leftNum + 'px';

                    card.style.top = topNum + 'px';

                    card.style.right = 'auto';

                    card.style.transform = 'none';

                } else {

                    // Posição padrão

                    card.style.right = '20px';

                    card.style.top = '50%';

                    card.style.transform = 'translateY(-50%)';

                }

            } else {

                // Posição padrão

                card.style.right = '20px';

                card.style.top = '50%';

                card.style.transform = 'translateY(-50%)';

            }

            document.body.appendChild(card);

            floatingCard = card;

            // Configurar eventos

            setupCardEvents();

            // Atualizar o valor imediatamente

            setTimeout(() => atualizarQuadranteFlutuante(), 200);

        }

        function setupCardEvents() {

            const card = document.getElementById('floatingDailyCard');

            if (!card) return;

            const dragHandle = document.getElementById('floatingDragHandle');

            const minimizeBtn = document.getElementById('minimizeBtn');

            const body = document.getElementById('floatingDailyBody');

            // Evento de minimizar

            if (minimizeBtn) {

                minimizeBtn.addEventListener('click', (e) => {

                    e.stopPropagation();

                    card.classList.toggle('minimized');

                    minimizeBtn.textContent = card.classList.contains('minimized') ? '+' : '−';

                    localStorage.setItem(`floatingCardMinimized_${currentUser.id}`, card.classList.contains('minimized'));

                });

            }

            // EVENTO DE CLICK APENAS NO CORPO (NÃO NO CABEÇALHO)

            if (body) {

                body.addEventListener('click', (e) => {

                    e.stopPropagation();

                    abrirAnaliticoComFiltroHoje();

                });

            }

            // EVENTOS DE DRAG APENAS NO CABEÇALHO

            if (dragHandle) {

                dragHandle.addEventListener('mousedown', startDrag);

            }

            function startDrag(e) {

                // Não arrastar se clicou no botão minimizar

                if (e.target.closest('.btn-minimize')) return;

                e.preventDefault();

                isDraggingCard = true;

                const rect = card.getBoundingClientRect();

                cardStartLeft = rect.left;

                cardStartTop = rect.top;

                dragStartX = e.clientX;

                dragStartY = e.clientY;

                card.style.position = 'fixed';

                card.style.left = cardStartLeft + 'px';

                card.style.top = cardStartTop + 'px';

                card.style.right = 'auto';

                card.style.transform = 'none';

                document.body.style.userSelect = 'none';

                document.body.style.cursor = 'grabbing';

                document.addEventListener('mousemove', onDrag);

                document.addEventListener('mouseup', stopDrag);

            }

            function onDrag(e) {

                if (!isDraggingCard) return;

                const dx = e.clientX - dragStartX;

                const dy = e.clientY - dragStartY;

                let newLeft = cardStartLeft + dx;

                let newTop = cardStartTop + dy;

                // Limitar dentro da janela

                const cardWidth = card.offsetWidth;

                const cardHeight = card.offsetHeight;

                newLeft = Math.max(10, Math.min(newLeft, window.innerWidth - cardWidth - 10));

                newTop = Math.max(10, Math.min(newTop, window.innerHeight - cardHeight - 10));

                card.style.left = newLeft + 'px';

                card.style.top = newTop + 'px';

            }

            function stopDrag() {

                if (!isDraggingCard) return;

                isDraggingCard = false;

                // Salvar apenas o valor numérico (sem 'px')

                const leftValue = parseFloat(card.style.left);

                const topValue = parseFloat(card.style.top);

                if (!isNaN(leftValue) && !isNaN(topValue)) {

                    localStorage.setItem(`floatingCardLeft_${currentUser.id}`, leftValue);

                    localStorage.setItem(`floatingCardTop_${currentUser.id}`, topValue);

                }

                document.body.style.userSelect = '';

                document.body.style.cursor = '';

                document.removeEventListener('mousemove', onDrag);

                document.removeEventListener('mouseup', stopDrag);

            }

        }

        async function buscarTotalDiaAtual() {

            if (!currentUser) return 0;

            const hoje = new Date();

            const ano = hoje.getFullYear();

            const mes = String(hoje.getMonth() + 1).padStart(2, '0');

            const dia = String(hoje.getDate()).padStart(2, '0');

            const dataHoje = `${ano}-${mes}-${dia}`;

            // Atualizar a data no card

            const dateElement = document.getElementById('dailyDate');

            if (dateElement) {

                dateElement.innerHTML = `${dia}/${mes}/${ano}`;

            }

            try {

                let totalHoje = 0;

                if (currentUser.cargo === 'gestor') {

                    // GESTOR: Buscar TODOS os registros do dia atual

                    const url = `${SUPABASE_URL}/rest/v1/recebimentos?select=valor_recebido&data_pagamento=eq.${dataHoje}`;

                    const res = await fetch(url, {

                        headers: {

                            'apikey': SUPABASE_ANON_KEY,

                            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`

                        }

                    });

                    if (res.ok) {

                        const registros = await res.json();

                        for (const reg of registros) {

                            totalHoje += reg.valor_recebido || 0;

                        }

                    } else {

                    }

                }

                else if (currentUser.cargo === 'supervisor') {

                    // SUPERVISOR: Buscar registros APENAS da equipe

                    const equipeDoUsuario = equipes.find(e => e.id === currentUser.equipe_id);

                    if (!equipeDoUsuario) {

                        return 0;

                    }

                    // Buscar todos os membros da equipe (operadores, elite, e o próprio supervisor)

                    const membrosDaEquipe = usuarios.filter(u =>

                        u.equipe_id === equipeDoUsuario.id &&

                        (u.cargo === 'operador' || u.cargo === 'elite' || u.cargo === 'supervisor') &&

                        u.status === 'ativo'

                    );

                    if (membrosDaEquipe.length === 0) {

                        return 0;

                    }

                    // Buscar registros de cada membro individualmente

                    for (const membro of membrosDaEquipe) {

                        const url = `${SUPABASE_URL}/rest/v1/recebimentos?select=valor_recebido&usuario_id=eq.${membro.id}&data_pagamento=eq.${dataHoje}`;

                        const res = await fetch(url, {

                            headers: {

                                'apikey': SUPABASE_ANON_KEY,

                                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`

                            }

                        });

                        if (res.ok) {

                            const registros = await res.json();

                            for (const reg of registros) {

                                totalHoje += reg.valor_recebido || 0;

                            }

                        }

                    }

                }

                else {

                    // OPERADOR / ELITE: Buscar apenas seus próprios registros

                    const url = `${SUPABASE_URL}/rest/v1/recebimentos?select=valor_recebido&usuario_id=eq.${currentUser.id}&data_pagamento=eq.${dataHoje}`;

                    const res = await fetch(url, {

                        headers: {

                            'apikey': SUPABASE_ANON_KEY,

                            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`

                        }

                    });

                    if (res.ok) {

                        const registros = await res.json();

                        for (const reg of registros) {

                            totalHoje += reg.valor_recebido || 0;

                        }

                    }

                }

                return totalHoje;

            } catch (error) {

                return 0;

            }

        }

        async function atualizarQuadranteFlutuante() {

            const card = document.getElementById('floatingDailyCard');

            const valueElement = document.getElementById('dailyValue');

            if (!card || !valueElement) {

                // Tenta criar novamente se não existir

                criarQuadranteFlutuante();

                return;

            }

            if (!currentUser || !currentUser.cargo) {

                return;

            }

            // Atualizar título dinamicamente (caso o usuário troque de perfil)

            const titleElement = card.querySelector('.daily-title');

            if (titleElement) {

                if (currentUser.cargo === 'gestor') {

                    titleElement.innerHTML = 'RECEBIDO DO SETOR (HOJE)';

                } else if (currentUser.cargo === 'supervisor') {

                    titleElement.innerHTML = 'RECEBIDO DA EQUIPE (HOJE)';

                } else {

                    titleElement.innerHTML = 'SEU RECEBIDO HOJE';

                }

            }

            // Mostrar loading

            card.classList.add('loading');

            valueElement.innerHTML = '';

            const total = await buscarTotalDiaAtual();

            // Remover loading e mostrar valor

            card.classList.remove('loading');

            if (total > 0) {

                valueElement.innerHTML = formatMoney(total);

                card.style.background = 'linear-gradient(135deg, #28A745, #1E7B4B)';

            } else {

                valueElement.innerHTML = 'R$ 0,00';

                card.style.background = 'linear-gradient(135deg, #6C757D, #495057)';

            }

        }

        function iniciarAtualizacaoQuadrante() {

            // Aguardar um pouco antes de tentar criar

            setTimeout(() => {

                criarQuadranteFlutuante();

                // Atualizar o valor após criar

                setTimeout(() => atualizarQuadranteFlutuante(), 500);

            }, 500);

        }

        function pararAtualizacaoQuadrante() {

            if (dailyTotalInterval) {

                clearInterval(dailyTotalInterval);

                dailyTotalInterval = null;

            }

        }

        async function abrirAnaliticoComFiltroHoje() {

            if (!currentUser) return;

            const hoje = new Date();

            const ano = hoje.getFullYear();

            const mes = String(hoje.getMonth() + 1).padStart(2, '0');

            const dia = String(hoje.getDate()).padStart(2, '0');

            const dataHoje = `${ano}-${mes}-${dia}`;

            // Abrir o analítico normalmente

            await abrirAnalitico();

            // Aguardar o modal ser criado e aplicar o filtro da data atual

            setTimeout(() => {

                const inputDataInicio = document.getElementById('analiticoDataInicio');

                const inputDataFim = document.getElementById('analiticoDataFim');

                const btnBuscar = document.getElementById('btnBuscarAnalitico');

                if (inputDataInicio && inputDataFim && btnBuscar) {

                    inputDataInicio.value = dataHoje;

                    inputDataFim.value = dataHoje;

                    btnBuscar.click();

                    showToast(`Filtrando registros de ${dia}/${mes}/${ano}`);

                }

            }, 500);

        }

        window.excluirUsuarioCompleto = async (usuarioId, nomeUsuario) => {
            // ADICIONE ESTA VERIFICAÇÃO AQUI
            if (!usuarioId || usuarioId === 'null' || usuarioId === 'undefined') {
                showToast('Erro: Ocorreu um problema ao identificar o ID do usuário para exclusão.');
                return;
            }

            // Criar modal de confirmação
            const modalHtml = `

        <div id="modalConfirmarExclusao" class="modal-overlay" style="display: flex; z-index: 10002;">

            <div class="modal-content" style="max-width: 500px; animation: fadeInUp 0.3s ease;">

                <div style="text-align: center; margin-bottom: 20px;">

                    <div style="font-size: 60px; margin-bottom: 10px;">️</div>

                    <h3 style="color: #DC3545; font-size: 1.5rem; margin-bottom: 10px;">EXCLUSÃO PERMANENTE</h3>

                    <p style="color: #334155; margin-bottom: 20px;">

                        Você está prestes a excluir o usuário:<br>

                        <strong style="color: #1E6DC3; font-size: 1.2rem;">${nomeUsuario}</strong>

                    </p>

                </div>

                <div style="background: #FFF3CD; border-left: 4px solid #FFC107; padding: 15px; border-radius: 12px; margin-bottom: 20px;">

                    <p style="color: #856404; margin: 0; font-size: 0.85rem;">

                        <strong>TODOS os dados serão removidos permanentemente:</strong>

                    </p>

                    <ul style="color: #856404; margin: 10px 0 0 20px; font-size: 0.85rem;">

                        <li>Dados pessoais (nome, login, senha)</li>

                        <li>Todas as metas cadastradas</li>

                        <li>Todos os registros de recebimentos</li>

                        <li>Histórico de ações do usuário</li>

                        <li>Vínculos com equipes e classes</li>

                    </ul>

                </div>

                <div style="background: #F8FAFE; border-radius: 12px; padding: 15px; margin-bottom: 20px;">

                    <label style="font-size: 0.8rem; font-weight: 700; color: #DC3545; display: block; margin-bottom: 8px;">

                         Digite <strong style="font-size: 1rem;">EXCLUIR</strong> para confirmar:

                    </label>

                    <input type="text" id="confirmarExclusaoTexto" placeholder="Digite EXCLUIR aqui" 

                           style="width: 100%; padding: 12px; border: 2px solid #E2E8F0; border-radius: 12px; font-size: 1rem; text-align: center; font-weight: 700;">

                    <div id="erroConfirmacao" style="color: #DC3545; font-size: 0.75rem; margin-top: 5px; display: none;">

                        Digite exatamente "EXCLUIR" (em maiúsculo)

                    </div>

                </div>

                <div class="modal-actions" style="display: flex; gap: 12px; justify-content: center;">

                    <button id="btnCancelarExclusao" class="btn-modal-cancel" style="padding: 12px 24px; background: #6C757D; color: white;">

                        Cancelar

                    </button>

                    <button id="btnConfirmarExclusao" class="btn-modal-save" style="padding: 12px 24px; background: #DC3545; color: white;" disabled>

                        Confirmar Exclusão

                    </button>

                </div>

            </div>

        </div>

    `;

            // Adicionar o modal ao corpo

            document.body.insertAdjacentHTML('beforeend', modalHtml);

            // Elementos do modal

            const modal = document.getElementById('modalConfirmarExclusao');

            const inputConfirmacao = document.getElementById('confirmarExclusaoTexto');

            const btnConfirmar = document.getElementById('btnConfirmarExclusao');

            const btnCancelar = document.getElementById('btnCancelarExclusao');

            const erroDiv = document.getElementById('erroConfirmacao');

            // Função para verificar o texto digitado

            const verificarTexto = () => {

                const textoDigitado = inputConfirmacao.value.trim();

                if (textoDigitado === 'EXCLUIR') {

                    btnConfirmar.disabled = false;

                    btnConfirmar.style.opacity = '1';

                    btnConfirmar.style.cursor = 'pointer';

                    erroDiv.style.display = 'none';

                } else {

                    btnConfirmar.disabled = true;

                    btnConfirmar.style.opacity = '0.5';

                    btnConfirmar.style.cursor = 'not-allowed';

                    if (textoDigitado.length > 0) {

                        erroDiv.style.display = 'block';

                    } else {

                        erroDiv.style.display = 'none';

                    }

                }

            };

            // Eventos

            inputConfirmacao.addEventListener('input', verificarTexto);

            // Cancelar

            btnCancelar.onclick = () => {

                modal.remove();

                showToast('Exclusão cancelada.');

            };

            // Confirmar exclusão

            btnConfirmar.onclick = async () => {

                const textoDigitado = inputConfirmacao.value.trim();

                if (textoDigitado !== 'EXCLUIR') {

                    erroDiv.style.display = 'block';

                    return;

                }

                // Fechar modal de confirmação

                modal.remove();

                // Mostrar loading

                showToast(' Processando exclusão...');

                try {

                    // 1. Buscar todas as metas do usuário

                    const metasDoUsuario = metas.filter(m => m?.usuario_id === Number(usuarioId));

                    for (const meta of metasDoUsuario) {

                        if (meta?.id) {

                            await deleteFrom('metas', meta.id);

                        }

                    }

                    // 2. Buscar todos os recebimentos do usuário

                    const url = `${SUPABASE_URL}/rest/v1/recebimentos?usuario_id=eq.${usuarioId}`;

                    const res = await fetch(url, {

                        headers: {

                            'apikey': SUPABASE_ANON_KEY,

                            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`

                        }

                    });

                    if (res.ok) {

                        const recebimentos = await res.json();

                        for (const recebimento of recebimentos) {

                            if (recebimento?.id) {

                                await fetch(`${SUPABASE_URL}/rest/v1/recebimentos?id=eq.${recebimento.id}`, {

                                    method: 'DELETE',

                                    headers: {

                                        'apikey': SUPABASE_ANON_KEY,

                                        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`

                                    }

                                });

                            }

                        }

                    }

                    // 3. Buscar registros no histórico relacionados ao usuário

                    const historicosDoUsuario = historico.filter(h => h.usuario_id === Number(usuarioId) || h.usuario_nome === nomeUsuario);

                    for (const hist of historicosDoUsuario) {

                        if (hist?.id) {

                            await fetch(`${SUPABASE_URL}/rest/v1/historico?id=eq.${hist.id}`, {

                                method: 'DELETE',

                                headers: {

                                    'apikey': SUPABASE_ANON_KEY,

                                    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`

                                }

                            });

                        }

                    }

                    // 4. Por fim, excluir o próprio usuário

                    await deleteFrom('usuarios', usuarioId);

                    // Registrar no histórico (usando o usuário atual, já que o excluído será removido)

                    await registrarHistorico('exclusao', `Usuário "${nomeUsuario}" e todos os seus dados (metas, recebimentos, histórico) foram EXCLUÍDOS permanentemente do sistema`);

                    // Fechar o modal de edição se estiver aberto

                    fecharModal();

                    // Recarregar todos os dados

                    await atualizarDadosImediatos();

                    showToast(`Usuário "${nomeUsuario}" e todos os seus dados foram excluídos permanentemente!`);

                } catch (error) {

                    showToast('Erro ao excluir usuário. Verifique o console.');

                }

            };

            // Fechar modal ao clicar fora (opcional)

            modal.addEventListener('click', (e) => {

                if (e.target === modal) {

                    modal.remove();

                    showToast('Exclusão cancelada.');

                }

            });

        };

        function abrirVisualizadorImagem(imagemUrl, nomeUsuario) {

            const urlFinal = normalizarFotoUrl(imagemUrl);

            if (!urlFinal) {

                showToast('Este usuário não possui foto de perfil.');

                return;

            }

            // Remove modal existente se houver

            const modalExistente = document.getElementById('modalVisualizadorImagem');

            if (modalExistente) modalExistente.remove();

            const modalHtml = `

        <div id="modalVisualizadorImagem" class="modal-visualizador" style="position: fixed; inset: 0; background: rgba(0,0,0,0.92); backdrop-filter: blur(15px); display: flex; align-items: center; justify-content: center; z-index: 20000; animation: fadeIn 0.3s ease; cursor: pointer; padding: 20px;">

            <div style="position: relative; max-width: 90vw; max-height: 90vh; display: flex; flex-direction: column; align-items: center;">

                <!-- Botão fechar -->

                <button onclick="fecharVisualizadorImagem()" style="position: absolute; top: -50px; right: -10px; background: rgba(255,255,255,0.15); border: none; color: white; font-size: 28px; cursor: pointer; width: 48px; height: 48px; border-radius: 50%; display: flex; align-items: center; justify-content: center; transition: all 0.3s; backdrop-filter: blur(4px); border: 1px solid rgba(255,255,255,0.1); z-index: 10;">

                    ✕

                </button>

                <!-- Nome do usuário -->

                <div style="color: rgba(255,255,255,0.8); font-size: 0.9rem; margin-bottom: 15px; font-weight: 600; letter-spacing: 0.5px; text-align: center;">

                    ${escapeHtml(nomeUsuario || 'Usuário')}

                </div>

                <!-- Imagem -->

                <div style="background: rgba(0,0,0,0.3); border-radius: 20px; padding: 8px; box-shadow: 0 20px 60px rgba(0,0,0,0.8); border: 1px solid rgba(255,255,255,0.08);">

                    <img src="${urlFinal}" alt="Foto de ${escapeHtml(nomeUsuario || 'perfil')}" 

                         style="display: block; max-width: 90vw; max-height: 75vh; width: auto; height: auto; border-radius: 14px; object-fit: contain; background: #0A0A1A;"

                         onerror="this.parentElement.innerHTML='<div style=\\'padding:60px; text-align:center; color:#94A3B8;\\'><div style=\\'font-size:48px; margin-bottom:15px;\\'>🖼️</div>Imagem não disponível</div>'">

                </div>

                <!-- Instruções -->

                <div style="color: rgba(255,255,255,0.3); font-size: 0.7rem; margin-top: 15px; text-align: center; letter-spacing: 0.3px;">

                    Clique em qualquer lugar para fechar

                </div>

            </div>

        </div>

    `;

            document.body.insertAdjacentHTML('beforeend', modalHtml);

            // Fechar ao clicar no fundo

            const modal = document.getElementById('modalVisualizadorImagem');

            modal.addEventListener('click', function (e) {

                if (e.target === this || e.target.closest('.modal-visualizador')) {

                    fecharVisualizadorImagem();

                }

            });

            // Fechar com tecla ESC

            document.addEventListener('keydown', function handler(e) {

                if (e.key === 'Escape') {

                    fecharVisualizadorImagem();

                    document.removeEventListener('keydown', handler);

                }

            });

        }

        function fecharVisualizadorImagem() {

            const modal = document.getElementById('modalVisualizadorImagem');

            if (modal) modal.remove();

        }

        checkAuth();

        async function migrarFotosParaStorage() {

            const usuariosComFoto = usuarios.filter(u => u.foto && u.foto.startsWith('data:image'));

            if (usuariosComFoto.length === 0) {

                return;

            }

            let sucessos = 0;

            let erros = 0;

            for (const user of usuariosComFoto) {

                try {

                    const resultado = await salvarFotoPerfil(user.id, user.foto);

                    if (resultado) {

                        sucessos++;

                    } else {

                        erros++;

                    }

                    await new Promise(resolve => setTimeout(resolve, 500));

                } catch (error) {

                    erros++;

                }

            }

            await carregarDados();

            carregarDashboard();

        }

        // ============================================

        // FUNÇÃO DE RESET DOS RECEBIMENTOS

        // ============================================

        function abrirModalResetRecebimentos() {

            // Verifica se o usuário tem permissão (apenas gestor ou supervisor)

            if (!currentUser || (currentUser.cargo !== 'gestor' && currentUser.cargo !== 'supervisor' && currentUser.cargo !== 'elite')) {

                showToast(' Apenas gestor, supervisor e elite podem realizar esta ação.');

                return;

            }

            // Remove modal existente se houver

            const modalExistente = document.getElementById('modalResetConfirm');

            if (modalExistente) modalExistente.remove();

            const modalHtml = `

        <div id="modalResetConfirm" style="display: flex;">

            <div class="modal-content">

                <div class="modal-icon"></div>

                <div class="modal-title">Reset de Recebimentos</div>

                <div class="modal-message">

                    Esta ação irá <strong style="color: #DC3545;">ZERAR</strong> todos os recebimentos de <strong>TODOS</strong> os usuários do sistema.

                </div>

                <div class="modal-warning">

                    <strong> ATENÇÃO:</strong> Esta ação é irreversível!

                    <ul>

                        <li><strong>Recebido Total</strong> de todos os usuários será zerado</li>

                        <li><strong>Recebido Direto</strong> de todos os usuários será zerado</li>

                        <li><strong>Recebido Extra</strong> de todos os usuários será zerado</li>

                        <li>As <strong>metas</strong> dos usuários <strong>NÃO</strong> serão alteradas</li>

                        <li>Os registros de recebimentos <strong>NÃO</strong> serão deletados</li>

                    </ul>

                </div>

                <div class="modal-confirm-input">

                    <label> Digite <strong style="color: #DC3545;">CONFIRMAR</strong> para prosseguir:</label>

                    <input type="text" id="resetConfirmInput" placeholder="Digite CONFIRMAR aqui" autocomplete="off">

                    <div class="error-message" id="resetErrorMsg">Digite exatamente "CONFIRMAR"</div>

                </div>

                <div class="modal-actions">

                    <button class="btn-cancel-reset" id="btnCancelarReset">Cancelar</button>

                    <button class="btn-confirm-reset" id="btnConfirmarReset" disabled>Confirmar Reset</button>

                </div>

            </div>

        </div>

    `;

            document.body.insertAdjacentHTML('beforeend', modalHtml);

            const modal = document.getElementById('modalResetConfirm');

            const input = document.getElementById('resetConfirmInput');

            const btnConfirmar = document.getElementById('btnConfirmarReset');

            const btnCancelar = document.getElementById('btnCancelarReset');

            const errorMsg = document.getElementById('resetErrorMsg');

            // Fechar modal ao clicar fora

            modal.addEventListener('click', (e) => {

                if (e.target === modal) {

                    modal.remove();

                }

            });

            // Verificar o texto digitado

            function verificarTexto() {

                const texto = input.value.trim();

                if (texto === 'CONFIRMAR') {

                    btnConfirmar.disabled = false;

                    btnConfirmar.style.opacity = '1';

                    btnConfirmar.style.cursor = 'pointer';

                    errorMsg.style.display = 'none';

                    input.classList.remove('error');

                } else {

                    btnConfirmar.disabled = true;

                    btnConfirmar.style.opacity = '0.5';

                    btnConfirmar.style.cursor = 'not-allowed';

                    if (texto.length > 0) {

                        errorMsg.style.display = 'block';

                        input.classList.add('error');

                    } else {

                        errorMsg.style.display = 'none';

                        input.classList.remove('error');

                    }

                }

            }

            input.addEventListener('input', verificarTexto);

            input.addEventListener('keypress', (e) => {

                if (e.key === 'Enter') {

                    e.preventDefault();

                    if (!btnConfirmar.disabled) {

                        btnConfirmar.click();

                    }

                }

            });

            // Cancelar

            btnCancelar.addEventListener('click', () => {

                modal.remove();

                showToast('Reset cancelado.');

            });

            // Confirmar reset

            btnConfirmar.addEventListener('click', async () => {

                const texto = input.value.trim();

                if (texto !== 'CONFIRMAR') {

                    errorMsg.style.display = 'block';

                    input.classList.add('error');

                    return;

                }

                // Desabilitar botões durante o processo

                btnConfirmar.disabled = true;

                btnConfirmar.textContent = ' Resetando...';

                btnCancelar.disabled = true;

                try {

                    await executarResetRecebimentos();

                } catch (error) {

                    showToast('Erro ao resetar recebimentos.');

                } finally {

                    modal.remove();

                }

            });

            // Focar no input

            setTimeout(() => input.focus(), 200);

        }

        // ============================================

        // FUNÇÃO QUE EXECUTA O RESET

        // ============================================

        // ============================================

        // FUNÇÃO QUE EXECUTA O RESET (CORRIGIDA)

        // ============================================

        async function executarResetRecebimentos() {

            const mes = new Date().getMonth() + 1;

            const ano = new Date().getFullYear();

            showToast(' Resetando recebimentos...');

            try {

                // Buscar todas as metas do mês/ano atual

                const metasDoMes = metas.filter(m => m?.mes === mes && m?.ano === ano);

                if (metasDoMes.length === 0) {

                    showToast(' Nenhuma meta encontrada para resetar.');

                    return;

                }

                let totalResetados = 0;

                let erros = 0;

                // Para cada meta, zerar APENAS os campos de recebimento

                // ️ A META (campo "meta") NÃO É ALTERADA!

                for (const meta of metasDoMes) {

                    try {

                        const success = await updateMeta(meta.usuario_id, mes, ano, {

                            direto: 0,      // Zera recebido direto

                            extra: 0,       // Zera recebido extra

                            recebido: 0,    // Zera total recebido (soma de direto + extra)

                            por_fora_direto: 0, // Zera o valor por fora direto

                            por_fora_extra: 0   // Zera o valor por fora extra

                        }, meta.id);

                        if (success) {

                            totalResetados++;

                        } else {

                            erros++;

                        }

                    } catch (e) {

                        erros++;

                    }

                }

                // Registrar no histórico

                await registrarHistorico('edicao',

                    `Reset de recebimentos: ${totalResetados} metas zeradas (direto=0, extra=0, recebido=0). As METAS foram mantidas intactas.`

                );

                // Recarregar dados

                await atualizarDadosImediatos();

                // Mostrar resultado

                if (erros === 0) {

                    showToast(` Reset concluído! ${totalResetados} recebimentos zerados. As metas foram mantidas.`);

                } else {

                    showToast(`️ Reset concluído com ${erros} erro(s). ${totalResetados} recebimentos zerados.`);

                }

            } catch (error) {

                showToast(' Erro ao resetar recebimentos. Tente novamente.');

            }

        }

        function renderizarGraficoMisto(containerId, dadosPorDia, metaDiaria, titulo = 'Evolução Diária', metaLabel = 'Meta Diária') {

            const container = document.getElementById(containerId);

            if (!container) return;

            // Se não houver dados, mostrar mensagem

            if (!dadosPorDia || Object.keys(dadosPorDia).length === 0) {

                container.innerHTML = `

            <div style="width: 100%; text-align: center; padding: 30px; color: #94A3B8; font-size: 0.85rem;">

                Nenhum dado disponível para exibir.

            </div>

        `;

                return;

            }

            const hojeNum = new Date().getDate();

            const diasExibir = Math.min(hojeNum, 31);

            const metaValor = metaDiaria || 0;

            // Coletar valores

            const valores = [];

            let maxValor = 0;

            for (let d = 1; d <= diasExibir; d++) {

                const valor = dadosPorDia[d] || 0;

                valores.push(valor);

                if (valor > maxValor) maxValor = valor;

            }

            // Usar o maior valor entre o máximo recebido e a meta para definir a escala

            const valorMaximoEscala = Math.max(maxValor, metaValor * 1.2, 1);

            const alturaMaxima = 150; // altura fixa em pixels para o gráfico

            // Calcular a posição Y da meta em pixels (de baixo para cima)

            const metaEmPixels = metaValor > 0 ? (metaValor / valorMaximoEscala) * alturaMaxima : 0;

            // Calcular largura dinâmica das barras

            const totalBarras = diasExibir;

            const barWidth = totalBarras > 25 ? '6px' : (totalBarras > 15 ? '10px' : (totalBarras > 8 ? '16px' : '22px'));

            // 🔥 CORREÇÃO: Aumentar o padding superior para dar espaço para as legendas

            const paddingTop = 30; // espaço extra no topo para as legendas

            // Construir o HTML do gráfico

            let html = `

        <div style="display: flex; flex-direction: column; height: 100%; width: 100%;">

            <!-- Legenda -->

            <div style="display: flex; justify-content: flex-end; gap: 20px; margin-bottom: 6px; font-size: 0.6rem; color: #5F7F9E; padding-right: 4px;">

                <span><span style="display: inline-block; width: 12px; height: 12px; background: #28A745; border-radius: 2px; vertical-align: middle;"></span> Acima da meta</span>

                <span><span style="display: inline-block; width: 12px; height: 12px; background: #1E6DC3; border-radius: 2px; vertical-align: middle;"></span> Abaixo da meta</span>

                <span><span style="display: inline-block; width: 20px; height: 2px; background: #DC3545; vertical-align: middle; margin: 0 4px;"></span> ${metaLabel}</span>

            </div>

            <!-- Área do gráfico com padding superior -->

            <div style="position: relative; height: ${alturaMaxima + paddingTop + 10}px; width: 100%; border-bottom: 1px solid #E2E8F0; padding-bottom: 5px; padding-top: ${paddingTop}px;">

                <!-- 🔥 LINHA HORIZONTAL DA META (ajustada para considerar o padding) -->

                ${metaValor > 0 ? `

                <div style="position: absolute; left: 0; right: 0; bottom: ${metaEmPixels + paddingTop}px; height: 2px; background: #DC3545; z-index: 5; box-shadow: 0 0 6px rgba(220, 53, 69, 0.4); pointer-events: none;">

                    <div style="position: absolute; right: -2px; top: -10px; font-size: 0.5rem; color: #DC3545; font-weight: 700; background: rgba(255,255,255,0.9); padding: 0 6px; border-radius: 4px; white-space: nowrap;">

                        ${formatMoney(metaValor)}

                    </div>

                    <div style="position: absolute; left: -2px; top: -10px; font-size: 0.5rem; color: #DC3545; font-weight: 700; background: rgba(255,255,255,0.9); padding: 0 6px; border-radius: 4px; white-space: nowrap;">

                        Meta

                    </div>

                </div>

                ` : ''}

                <!-- BARRAS -->

                <div style="display: flex; align-items: flex-end; justify-content: space-around; height: ${alturaMaxima}px; width: 100%; position: relative; z-index: 2; gap: 2px; padding: 0 4px; margin-top: 0;">

    `;

            for (let i = 0; i < diasExibir; i++) {

                const d = i + 1;

                const valor = valores[i] || 0;

                const alturaBarra = valorMaximoEscala > 0 ? (valor / valorMaximoEscala) * alturaMaxima : 0;

                const isToday = d === hojeNum;

                // Cor da barra

                let corBarra;

                let statusText = '';

                if (valor === 0) {

                    corBarra = '#E2E8F0';

                    statusText = 'Sem recebimento';

                } else if (metaValor > 0 && valor >= metaValor) {

                    corBarra = '#28A745';

                    statusText = 'Meta atingida!';

                } else if (metaValor > 0 && valor > 0 && valor < metaValor) {

                    corBarra = '#1E6DC3';

                    const falta = formatMoney(metaValor - valor);

                    statusText = `Faltam ${falta}`;

                } else {

                    corBarra = '#1E6DC3';

                    statusText = 'Abaixo da meta';

                }

                const todayBorder = isToday ? 'border: 2px solid #FFC107;' : '';

                const valorLabel = valor > 0 ? formatMoney(valor) : '';

                const labelColor = corBarra === '#28A745' ? '#28A745' : (corBarra === '#1E6DC3' ? '#1E6DC3' : '#94A3B8');

                let percentualMeta = 0;

                if (metaValor > 0 && valor > 0) {

                    percentualMeta = (valor / metaValor) * 100;

                }

                html += `

            <div style="flex: 1; display: flex; flex-direction: column; align-items: center; height: 100%; justify-content: flex-end; position: relative; min-width: ${barWidth};">

                <!-- TOOLTIP -->

                <div class="tooltip-valor" style="display: none; position: absolute; bottom: calc(100% + 8px); left: 50%; transform: translateX(-50%); background: #1F2A44; color: white; padding: 8px 14px; border-radius: 10px; font-size: 0.65rem; white-space: nowrap; z-index: 20; pointer-events: none; box-shadow: 0 4px 15px rgba(0,0,0,0.4); min-width: 140px; text-align: center; border: 1px solid rgba(255,255,255,0.1);">

                    <div style="font-weight: 700; font-size: 0.75rem; margin-bottom: 4px; color: ${corBarra === '#28A745' ? '#28A745' : (corBarra === '#1E6DC3' ? '#6CB4FF' : '#94A3B8')};">Dia ${String(d).padStart(2, '0')}</div>

                    <div style="display: flex; justify-content: space-between; gap: 20px; padding: 2px 0;">

                        <span style="color: #94A3B8;">Recebido</span>

                        <span style="font-weight: 700; color: #FFFFFF;">${formatMoney(valor)}</span>

                    </div>

                    ${metaValor > 0 ? `

                    <div style="display: flex; justify-content: space-between; gap: 20px; padding: 2px 0; border-top: 1px solid rgba(255,255,255,0.08); margin-top: 2px;">

                        <span style="color: #94A3B8;">Meta</span>

                        <span style="font-weight: 700; color: #DC3545;">${formatMoney(metaValor)}</span>

                    </div>

                    <div style="display: flex; justify-content: space-between; gap: 20px; padding: 2px 0;">

                        <span style="color: #94A3B8;">Status</span>

                        <span style="font-weight: 700; color: ${corBarra === '#28A745' ? '#28A745' : (corBarra === '#1E6DC3' ? '#6CB4FF' : '#94A3B8')};">${statusText}</span>

                    </div>

                    ${percentualMeta > 0 ? `

                    <div style="display: flex; justify-content: space-between; gap: 20px; padding: 2px 0; border-top: 1px solid rgba(255,255,255,0.08); margin-top: 2px;">

                        <span style="color: #94A3B8;">% da Meta</span>

                        <span style="font-weight: 700; color: ${percentualMeta >= 100 ? '#28A745' : '#FFC107'};">${percentualMeta.toFixed(1)}%</span>

                    </div>

                    ` : ''}

                    ` : ''}

                    ${isToday ? `<div style="margin-top: 4px; font-size: 0.5rem; color: #FFC107; border-top: 1px solid rgba(255,255,255,0.08); padding-top: 4px;"> Hoje</div>` : ''}

                </div>

                <!-- Barra -->

                <div style="width: ${barWidth}; height: ${Math.max(alturaBarra, 2)}px; background: ${corBarra}; border-radius: 3px 3px 0 0; min-height: 2px; transition: height 0.4s ease; position: relative; ${todayBorder} cursor: pointer;"

                     onmouseenter="this.parentElement.querySelector('.tooltip-valor').style.display='block'"

                     onmouseleave="this.parentElement.querySelector('.tooltip-valor').style.display='none'">

                    ${valor > 0 ? `<div style="position: absolute; bottom: calc(100% + 2px); left: 50%; transform: translateX(-50%); font-size: 0.4rem; font-weight: 700; color: ${labelColor}; white-space: nowrap; text-shadow: 0 0 4px rgba(255,255,255,0.8);">${valorLabel}</div>` : ''}

                </div>

                <!-- Rótulo do dia -->

                <div style="font-size: 0.5rem; color: ${isToday ? '#28A745' : '#5F7F9E'}; margin-top: 4px; font-weight: ${isToday ? '700' : '400'}; ${isToday ? 'background: #E8F5E9; padding: 0 6px; border-radius: 8px;' : ''}">

                    ${String(d).padStart(2, '0')}

                </div>

            </div>

        `;

            }

            html += `

                </div>

            </div>

        </div>

    `;

            container.innerHTML = html;

        }

        // ============================================

        // FUNÇÕES DE BAIXA ANTERIOR

        // ============================================

        // Calcular baixa anterior para a equipe

        async function calcularRecebidoBaixaAnteriorEquipe(equipeId) {

            try {

                // Buscar todos os membros da equipe

                const membros = usuarios.filter(u =>

                    u.equipe_id === equipeId &&

                    (u.cargo === 'operador' || u.cargo === 'elite' || u.cargo === 'supervisor') &&

                    u.status === 'ativo'

                );

                if (membros.length === 0) {

                    return { valor: 0, mensagem: 'Nenhum membro na equipe' };

                }

                const hoje = new Date();

                const diaSemana = hoje.getDay();

                let dataInicioStr, dataFimStr, diasConsiderados = [];

                const formatarData = (data) => {

                    const ano = data.getFullYear();

                    const mes = String(data.getMonth() + 1).padStart(2, '0');

                    const dia = String(data.getDate()).padStart(2, '0');

                    return `${ano}-${mes}-${dia}`;

                };

                // Definir período baseado no dia da semana

                if (diaSemana === 1) { // Segunda

                    const sexta = new Date(hoje);

                    sexta.setDate(hoje.getDate() - 3);

                    const domingo = new Date(hoje);

                    domingo.setDate(hoje.getDate() - 1);

                    dataInicioStr = formatarData(sexta);

                    dataFimStr = formatarData(domingo);

                    diasConsiderados = ['Sexta-feira', 'Sábado', 'Domingo'];

                } else {

                    const diaAnterior = new Date(hoje);

                    diaAnterior.setDate(hoje.getDate() - 1);

                    dataInicioStr = formatarData(diaAnterior);

                    dataFimStr = formatarData(diaAnterior);

                    const diasSemana = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];

                    diasConsiderados = [diasSemana[diaSemana - 1] || 'Ontem'];

                }

                let totalRecebido = 0;

                let registrosEncontrados = 0;

                // Buscar recebimentos de cada membro
                for (const membro of membros) {
                    // ADICIONE ESTA VERIFICAÇÃO AQUI
                    if (!membro.id || membro.id === 'null' || membro.id === 'undefined') continue;

                    const url = `${SUPABASE_URL}/rest/v1/recebimentos?usuario_id=eq.${membro.id}&data_pagamento=gte.${dataInicioStr}&data_pagamento=lte.${dataFimStr}&select=valor_recebido`;

                    const res = await fetch(url, {

                        headers: {

                            'apikey': SUPABASE_ANON_KEY,

                            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`

                        }

                    });

                    if (res.ok) {

                        const data = await res.json();

                        for (const reg of data) {

                            totalRecebido += reg.valor_recebido || 0;

                            registrosEncontrados++;

                        }

                    }

                }

                let mensagem = '';

                if (diasConsiderados.length === 1) {

                    const dataObj = new Date(dataInicioStr);

                    mensagem = `${diasConsiderados[0]} (${dataObj.toLocaleDateString('pt-BR')})`;

                } else {

                    const dataInicioObj = new Date(dataInicioStr);

                    const dataFimObj = new Date(dataFimStr);

                    mensagem = `${diasConsiderados.join(', ')} (${dataInicioObj.toLocaleDateString('pt-BR')} a ${dataFimObj.toLocaleDateString('pt-BR')})`;

                }

                mensagem += `\n${registrosEncontrados} registro(s) encontrado(s).`;

                return { valor: totalRecebido, mensagem, registros: registrosEncontrados };

            } catch (error) {

                return { valor: 0, mensagem: 'Erro ao carregar dados' };

            }

        }

        // Calcular baixa anterior para o setor

        async function calcularRecebidoBaixaAnteriorSetor() {

            try {

                const usuariosAtivos = usuarios.filter(u => u.status === 'ativo');

                if (usuariosAtivos.length === 0) {

                    return { valor: 0, mensagem: 'Nenhum usuário ativo' };

                }

                const hoje = new Date();

                const diaSemana = hoje.getDay();

                let dataInicioStr, dataFimStr, diasConsiderados = [];

                const formatarData = (data) => {

                    const ano = data.getFullYear();

                    const mes = String(data.getMonth() + 1).padStart(2, '0');

                    const dia = String(data.getDate()).padStart(2, '0');

                    return `${ano}-${mes}-${dia}`;

                };

                if (diaSemana === 1) {

                    const sexta = new Date(hoje);

                    sexta.setDate(hoje.getDate() - 3);

                    const domingo = new Date(hoje);

                    domingo.setDate(hoje.getDate() - 1);

                    dataInicioStr = formatarData(sexta);

                    dataFimStr = formatarData(domingo);

                    diasConsiderados = ['Sexta-feira', 'Sábado', 'Domingo'];

                } else {

                    const diaAnterior = new Date(hoje);

                    diaAnterior.setDate(hoje.getDate() - 1);

                    dataInicioStr = formatarData(diaAnterior);

                    dataFimStr = formatarData(diaAnterior);

                    const diasSemana = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];

                    diasConsiderados = [diasSemana[diaSemana - 1] || 'Ontem'];

                }

                let totalRecebido = 0;

                let registrosEncontrados = 0;

                for (const usuario of usuariosAtivos) {
                    // ADICIONE ESTA VERIFICAÇÃO AQUI
                    if (!usuario.id || usuario.id === 'null' || usuario.id === 'undefined') continue;

                    const url = `${SUPABASE_URL}/rest/v1/recebimentos?usuario_id=eq.${usuario.id}&data_pagamento=gte.${dataInicioStr}&data_pagamento=lte.${dataFimStr}&select=valor_recebido`;

                    const res = await fetch(url, {

                        headers: {

                            'apikey': SUPABASE_ANON_KEY,

                            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`

                        }

                    });

                    if (res.ok) {

                        const data = await res.json();

                        for (const reg of data) {

                            totalRecebido += reg.valor_recebido || 0;

                            registrosEncontrados++;

                        }

                    }

                }

                let mensagem = '';

                if (diasConsiderados.length === 1) {

                    const dataObj = new Date(dataInicioStr);

                    mensagem = `${diasConsiderados[0]} (${dataObj.toLocaleDateString('pt-BR')})`;

                } else {

                    const dataInicioObj = new Date(dataInicioStr);

                    const dataFimObj = new Date(dataFimStr);

                    mensagem = `${diasConsiderados.join(', ')} (${dataInicioObj.toLocaleDateString('pt-BR')} a ${dataFimObj.toLocaleDateString('pt-BR')})`;

                }

                mensagem += `\n${registrosEncontrados} registro(s) encontrado(s).`;

                return { valor: totalRecebido, mensagem, registros: registrosEncontrados };

            } catch (error) {

                return { valor: 0, mensagem: 'Erro ao carregar dados' };

            }

        }

        const TIPO_DOC_MAP = {

            // CARTÃO (padrão) - quando vazio ou não identificado

            '': 'CARTAO',

            'CARTAO': 'CARTAO',

            'CARTÃO': 'CARTAO',

            'CARTAO CREDITO': 'CARTAO',

            'CARTAO DEBITO': 'CARTAO',

            'CARTAO CRÉDITO': 'CARTAO',

            'CARTAO DÉBITO': 'CARTAO',

            'CREDITO': 'CARTAO',

            'CRÉDITO': 'CARTAO',

            'DEBITO': 'CARTAO',

            'DÉBITO': 'CARTAO',

            // BOLETO NEGOCIAÇÃO

            'BOLETO_NEGOCIACAO': 'BOLETO NEGOCIACAO',

            'BOLETO NEGOCIACAO': 'BOLETO NEGOCIACAO',

            'BOLETO NEGOCIAÇÃO': 'BOLETO NEGOCIACAO',

            'BOLETO NEGOCIACION': 'BOLETO NEGOCIACAO',

            'BOLETO NEGOCIAÇAO': 'BOLETO NEGOCIACAO',

            // BOLETO BANCÁRIO

            'BOLETO': 'BOLETO BANCARIO',

            'BOLETO BANCARIO': 'BOLETO BANCARIO',

            'BOLETO BANCÁRIO': 'BOLETO BANCARIO',

            // PIX

            'PIX': 'PIX',

            // PIX AUTOMÁTICO

            'PIX AUTOMATICO': 'PIX AUTOMATICO',

            'PIX AUTOMÁTICO': 'PIX AUTOMATICO',

            'PIX AUTOMATIZADO': 'PIX AUTOMATICO',

            // RECORRENTE

            'RECORRENTE': 'RECORRENTE'

        };

        const TIPO_DOC_CORES = {

            'CARTAO': '#1E6DC3',

            'BOLETO NEGOCIACAO': '#28A745',

            'PIX': '#FFC107',

            'PIX AUTOMATICO': '#DC3545',

            'BOLETO BANCARIO': '#17A2B8',

            'RECORRENTE': '#6C757D'

        };

        const TIPO_DOC_LABELS = {

            'CARTAO': 'Cartão',

            'BOLETO NEGOCIACAO': 'Boleto Negociação',

            'PIX': 'PIX',

            'PIX AUTOMATICO': 'PIX Automático',

            'BOLETO BANCARIO': 'Boleto Bancário',

            'RECORRENTE': 'Recorrente'

        };

        const TIPO_DOC_ORDEM = ['CARTAO', 'BOLETO NEGOCIACAO', 'PIX', 'PIX AUTOMATICO', 'BOLETO BANCARIO', 'RECORRENTE'];

        // ============================================

        // FUNÇÕES PARA SALVAR/CARREGAR FILTROS DO DETALHADO

        // ============================================

        function salvarFiltrosDetalhado() {

            try {

                const dataInicio = document.getElementById('detalhadoDataInicio')?.value || '';

                const dataFim = document.getElementById('detalhadoDataFim')?.value || '';

                const buscaOperador = document.getElementById('detalhadoBuscaOperador')?.value || '';

                const filtros = { dataInicio, dataFim, buscaOperador };

                localStorage.setItem(`detalhado_filtros_${currentUser?.id || 0}`, JSON.stringify(filtros));

            } catch (e) {

            }

        }

        function carregarFiltrosDetalhado() {

            try {

                const saved = localStorage.getItem(`detalhado_filtros_${currentUser?.id || 0}`);

                if (saved) {

                    const filtros = JSON.parse(saved);

                    return filtros;

                }

            } catch (e) {

            }

            return null;

        }

        function limparFiltrosDetalhadoSalvos() {

            try {

                localStorage.removeItem(`detalhado_filtros_${currentUser?.id || 0}`);

            } catch (e) {

            }

        }

        function renderizarResumoDetalhado(dadosPorTipo, totalGeral, container) {

            if (!container) return;

            //  Ordenar por ordem definida no TIPO_DOC_ORDEM

            const tiposOrdenados = Object.keys(dadosPorTipo).sort((a, b) => {

                const idxA = TIPO_DOC_ORDEM.indexOf(a);

                const idxB = TIPO_DOC_ORDEM.indexOf(b);

                return (idxA === -1 ? 999 : idxA) - (idxB === -1 ? 999 : idxB);

            });

            let html = '';

            // 🔥 MOSTRAR TODOS OS TIPOS ENCONTRADOS

            for (const tipo of tiposOrdenados) {

                const data = dadosPorTipo[tipo];

                const percentual = totalGeral > 0 ? (data.total / totalGeral) * 100 : 0;

                const cor = TIPO_DOC_CORES[tipo] || '#6C757D';

                const label = TIPO_DOC_LABELS[tipo] || tipo;

                html += `<div style="background: white; border-radius: 16px; padding: 16px; text-align: center; border-left: 4px solid ${cor}; box-shadow: 0 2px 8px rgba(0,0,0,0.06);">`;

                html += `<div style="font-size: 0.65rem; color: #5F7F9E; text-transform: uppercase; letter-spacing: 0.5px;">${label}</div>`;

                html += `<div style="font-size: 1.3rem; font-weight: 700; color: ${cor}; margin: 6px 0;">${formatMoney(data.total)}</div>`;

                html += `<div style="font-size: 0.75rem; color: #5F7F9E;">${percentual.toFixed(1)}% • ${data.contagem} registro(s)</div>`;

                html += '</div>';

            }

            // Card do Total Geral

            html += `<div style="background: linear-gradient(135deg, #0F3B6F, #1E6DC3); border-radius: 16px; padding: 16px; text-align: center; color: white; box-shadow: 0 2px 8px rgba(0,0,0,0.15);">`;

            html += `<div style="font-size: 0.65rem; opacity: 0.8; text-transform: uppercase; letter-spacing: 0.5px;">Total Geral (Agrupado)</div>`;

            html += `<div style="font-size: 1.3rem; font-weight: 700; margin: 6px 0;">${formatMoney(totalGeral)}</div>`;

            let totalContagem = 0;

            for (const key in dadosPorTipo) {

                totalContagem += dadosPorTipo[key].contagem;

            }

            html += `<div style="font-size: 0.75rem; opacity: 0.8;">${totalContagem} registros agrupados</div>`;

            html += '</div>';

            container.innerHTML = html;

        }

        function renderizarGraficoDetalhado(dadosPorTipo, totalGeral, container) {

            if (!container) return;

            var tiposOrdenados = Object.keys(dadosPorTipo).sort(function (a, b) {

                var idxA = TIPO_DOC_ORDEM.indexOf(a);

                var idxB = TIPO_DOC_ORDEM.indexOf(b);

                return (idxA === -1 ? 999 : idxA) - (idxB === -1 ? 999 : idxB);

            });

            var html = '';

            html += '<div style="display: flex; flex-direction: column;">';

            html += '<div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">';

            html += '<h4 style="color: #0F3B6F; margin: 0; font-size: 0.95rem;">Distribuicao por Forma de Pagamento</h4>';

            html += '<span style="font-size: 0.7rem; color: #5F7F9E;">Total: ' + formatMoney(totalGeral) + '</span>';

            html += '</div>';

            html += '<div style="display: flex; flex-direction: column; gap: 12px; padding: 5px 0;">';

            for (var i = 0; i < tiposOrdenados.length; i++) {

                var tipo = tiposOrdenados[i];

                var data = dadosPorTipo[tipo];

                var percentual = totalGeral > 0 ? (data.total / totalGeral) * 100 : 0;

                var cor = TIPO_DOC_CORES[tipo] || '#6C757D';

                var label = TIPO_DOC_LABELS[tipo] || tipo;

                html += '<div style="display: flex; align-items: center; gap: 12px;">';

                html += '<div style="width: 160px; font-size: 0.75rem; font-weight: 600; color: #0F3B6F; text-align: right; flex-shrink: 0;">' + label + '</div>';

                html += '<div style="flex: 1; height: 28px; background: #E9F0F8; border-radius: 14px; overflow: hidden; position: relative;">';

                html += '<div style="width: ' + Math.min(percentual, 100) + '%; height: 100%; background: ' + cor + '; border-radius: 14px; transition: width 0.8s ease; display: flex; align-items: center; justify-content: flex-end; padding-right: 8px; min-width: ' + (data.total > 0 ? '20px' : '0') + ';">';

                html += '<span style="font-size: 0.65rem; font-weight: 700; color: white; text-shadow: 0 1px 3px rgba(0,0,0,0.3);">' + percentual.toFixed(1) + '%</span>';

                html += '</div>';

                html += '</div>';

                html += '<div style="width: 120px; font-size: 0.75rem; font-weight: 700; color: ' + cor + '; text-align: left; flex-shrink: 0;">';

                html += formatMoney(data.total);

                html += '<span style="font-weight: 400; color: #94A3B8; font-size: 0.65rem;"> (' + data.contagem + ')</span>';

                html += '</div>';

                html += '</div>';

            }

            html += '</div></div>';

            container.innerHTML = html;

        }

        function renderizarTabelaDetalhado(dadosPorTipo, container) {

            if (!container) return;

            const todosRegistros = [];

            for (const tipo in dadosPorTipo) {

                for (const reg of dadosPorTipo[tipo].registros) {

                    reg.tipo_doc = tipo; // 🔥 GARANTIR QUE O TIPO ESTÁ CORRETO

                    todosRegistros.push(reg);

                }

            }

            todosRegistros.sort((a, b) => (b.data_pagamento || '').localeCompare(a.data_pagamento || ''));

            if (todosRegistros.length === 0) {

                container.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 20px; color: #94A3B8;">Nenhum registro encontrado</td></tr>';

                return;

            }

            const userMap = {};

            for (const u of usuarios) {

                userMap[u.id] = u.nome;

            }

            let html = '';

            for (const reg of todosRegistros) {

                const nomeUsuario = userMap[reg.usuario_id] || reg.operador_nome || '-';

                const tipoDoc = reg.tipo_doc || 'CARTAO';

                const label = TIPO_DOC_LABELS[tipoDoc] || tipoDoc;

                const cor = TIPO_DOC_CORES[tipoDoc] || '#6C757D';

                let dataPgto = '-';

                if (reg.data_pagamento) {

                    const dataStr = reg.data_pagamento.split('T')[0];

                    const partes = dataStr.split('-');

                    if (partes.length === 3) dataPgto = `${partes[2]}/${partes[1]}/${partes[0]}`;

                    else dataPgto = dataStr;

                }

                html += `<tr style="border-bottom: 1px solid #EDF2F7;">`;

                html += `<td style="padding: 8px 6px; font-weight: 500;">${escapeHtml(nomeUsuario)}</td>`;

                html += `<td style="padding: 8px 6px;">${escapeHtml(reg.cliente || '-')}</td>`;

                html += `<td style="padding: 8px 6px; font-weight: 600;">${escapeHtml(reg.nr_documento || '-')}</td>`;

                html += `<td style="padding: 8px 6px;">`;

                html += `<span style="display: inline-block; padding: 2px 10px; border-radius: 12px; font-size: 0.65rem; font-weight: 600; background: ${cor}20; color: ${cor}; border: 1px solid ${cor}40;">${label}</span>`;

                html += `</td>`;

                html += `<td style="padding: 8px 6px; text-align: center;">${dataPgto}</td>`;

                html += `<td style="padding: 8px 6px; text-align: right; font-weight: 700; color: #0F3B6F;">${formatMoney(reg.valor_recebido || 0)}</td>`;

                html += `</tr>`;

            }

            container.innerHTML = html;

        }

        function resetarFiltrosDetalhado() {

            var hoje = new Date();

            var primeiroDia = new Date(hoje.getFullYear(), hoje.getMonth(), 1);

            var formatarData = function (data) {

                var ano = data.getFullYear();

                var mes = String(data.getMonth() + 1).padStart(2, '0');

                var dia = String(data.getDate()).padStart(2, '0');

                return ano + '-' + mes + '-' + dia;

            };

            document.getElementById('detalhadoDataInicio').value = formatarData(primeiroDia);

            document.getElementById('detalhadoDataFim').value = formatarData(hoje);

            // 🔥 Limpar busca, exceto se for operador (mantém o nome dele)

            var buscaInput = document.getElementById('detalhadoBuscaOperador');

            if (currentUser && currentUser.cargo === 'operador') {

                buscaInput.value = currentUser.nome;

            } else {

                buscaInput.value = '';

            }

            // 🔥 LIMPAR OS FILTROS SALVOS

            limparFiltrosDetalhadoSalvos();

            carregarDetalhado();

        }

        // ============================================

        // FUNÇÃO DE AUTOCOMPLETE PARA ABA DETALHADO

        // ============================================

        function setupDetalhadoAutocomplete(inputElement) {

            if (!inputElement) return;

            // Criar container de sugestões

            let sugestoesDiv = document.getElementById('detalhadoSugestoes');

            if (!sugestoesDiv) {

                sugestoesDiv = document.createElement('div');

                sugestoesDiv.id = 'detalhadoSugestoes';

                sugestoesDiv.style.cssText = `

            position: absolute;

            top: 100%;

            left: 0;

            right: 0;

            background: white;

            border: 1px solid #E2E8F0;

            border-radius: 12px;

            max-height: 200px;

            overflow-y: auto;

            z-index: 1000;

            display: none;

            margin-top: 2px;

            box-shadow: 0 4px 12px rgba(0,0,0,0.1);

        `;

                // Envolver o input em um container relativo

                const parent = inputElement.parentElement;

                if (parent) {

                    parent.style.position = 'relative';

                    parent.appendChild(sugestoesDiv);

                }

            }

            // Remover event listeners antigos

            inputElement.removeEventListener('input', handleDetalhadoInput);

            document.removeEventListener('click', handleDetalhadoClick);

            // Função para lidar com o input

            function handleDetalhadoInput() {

                const termo = this.value.toLowerCase().trim();

                if (termo === '') {

                    sugestoesDiv.style.display = 'none';

                    return;

                }

                // 🔥 CORREÇÃO: Mostrar TODOS os usuários ativos (incluindo o próprio)

                const usuariosAtivos = usuarios.filter(u => u.status === 'ativo');

                const usuariosFiltrados = usuariosAtivos

                    .filter(u => u.nome.toLowerCase().includes(termo) || (u.login && u.login.toLowerCase().includes(termo)))

                    .slice(0, 10);

                if (usuariosFiltrados.length === 0) {

                    sugestoesDiv.style.display = 'none';

                    return;

                }

                const getCargoLabel = (c) => {

                    if (c === 'gestor') return 'Gestor';

                    if (c === 'supervisor') return 'Supervisor';

                    if (c === 'elite') return 'Elite';

                    return 'Operador';

                };

                const isCurrentUser = (id) => id === currentUser.id;

                sugestoesDiv.innerHTML = usuariosFiltrados.map(u => `

            <div class="detalhado-sugestao-item" 

                 data-id="${u.id}" 

                 data-nome="${u.nome}"

                 style="padding: 10px 12px; cursor: pointer; border-bottom: 1px solid #EDF2F7; display: flex; justify-content: space-between; align-items: center; transition: background 0.2s; ${isCurrentUser(u.id) ? 'background: #EFF6FF;' : ''}">

                <div>

                    <strong>${escapeHtml(u.nome)}</strong>

                    ${isCurrentUser(u.id) ? '<span style="font-size: 0.65rem; color: #1E6DC3; font-weight: 700; margin-left: 6px;">(Você)</span>' : ''}

                    <span style="font-size: 0.7rem; color: #5F7F9E; margin-left: 8px;">${getCargoLabel(u.cargo)}</span>

                </div>

                <div style="font-size: 0.7rem; color: #94A3B8;">${u.login || ''}</div>

            </div>

        `).join('');

                // Adicionar eventos aos itens

                document.querySelectorAll('.detalhado-sugestao-item').forEach(el => {

                    el.addEventListener('click', function () {

                        const nome = this.getAttribute('data-nome');

                        inputElement.value = nome;

                        sugestoesDiv.style.display = 'none';

                        // Disparar o filtro automaticamente

                        salvarFiltrosDetalhado();

                        carregarDetalhado();

                    });

                    el.addEventListener('mouseenter', function () { this.style.background = '#F1F5F9'; });

                    el.addEventListener('mouseleave', function () {

                        const isCurrent = this.getAttribute('data-id') == currentUser.id;

                        this.style.background = isCurrent ? '#EFF6FF' : '';

                    });

                });

                sugestoesDiv.style.display = 'block';

            }

            function handleDetalhadoClick(e) {

                if (!inputElement.contains(e.target) && !sugestoesDiv.contains(e.target)) {

                    sugestoesDiv.style.display = 'none';

                }

            }

            inputElement.addEventListener('input', handleDetalhadoInput);

            document.addEventListener('click', handleDetalhadoClick);

        }

        // ============================================

        // FUNÇÃO PARA APLICAR FILTROS DO DETALHADO

        // ============================================

        function aplicarFiltrosDetalhado() {

            salvarFiltrosDetalhado();

            carregarDetalhado();

        }

        function carregarDetalhado() {

            const dataInicio = document.getElementById('detalhadoDataInicio')?.value;

            const dataFim = document.getElementById('detalhadoDataFim')?.value;

            const buscaOperador = document.getElementById('detalhadoBuscaOperador')?.value || '';

            const resumoContainer = document.getElementById('detalhadoResumo');

            const graficoContainer = document.getElementById('detalhadoGraficoContainer');

            const tabelaBody = document.getElementById('detalhadoTabelaBody');

            const totalRegistrosSpan = document.getElementById('detalhadoTotalRegistros');

            const hoje = new Date();

            const primeiroDia = new Date(hoje.getFullYear(), hoje.getMonth(), 1);

            const formatarData = (data) => {

                const ano = data.getFullYear();

                const mes = String(data.getMonth() + 1).padStart(2, '0');

                const dia = String(data.getDate()).padStart(2, '0');

                return `${ano}-${mes}-${dia}`;

            };

            const inicio = dataInicio || formatarData(primeiroDia);

            const fim = dataFim || formatarData(hoje);

            carregarRegistrosRecebimentos().then(registros => {

                if (!registros || registros.length === 0) {

                    if (resumoContainer) resumoContainer.innerHTML = '<div style="text-align:center;padding:20px;color:#94A3B8;">Nenhum registro encontrado</div>';

                    if (graficoContainer) graficoContainer.innerHTML = '<div style="text-align:center;padding:40px;color:#94A3B8;">Nenhum dado para exibir</div>';

                    if (tabelaBody) tabelaBody.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:20px;color:#94A3B8;">Nenhum registro encontrado</td></tr>';

                    if (totalRegistrosSpan) totalRegistrosSpan.textContent = 'Total: 0 registros';

                    return;

                }

                // Filtrar por data

                let dadosFiltrados = registros.filter(reg => {

                    if (!reg.data_pagamento) return false;

                    const dataStr = reg.data_pagamento.split('T')[0];

                    return dataStr >= inicio && dataStr <= fim;

                });

                // Filtrar por operador

                if (buscaOperador && currentUser?.cargo !== 'operador') {

                    const operadorEncontrado = usuarios.find(u =>

                        u.nome.toLowerCase().includes(buscaOperador.toLowerCase()) ||

                        (u.login && u.login.toLowerCase().includes(buscaOperador.toLowerCase()))

                    );

                    if (operadorEncontrado) {

                        dadosFiltrados = dadosFiltrados.filter(reg => reg.usuario_id === operadorEncontrado.id);

                    }

                }

                if (currentUser?.cargo === 'operador') {

                    dadosFiltrados = dadosFiltrados.filter(reg => reg.usuario_id === currentUser.id);

                }

                // 🔥 CORREÇÃO PRINCIPAL: Agrupar por tipo de documento com o mapeamento correto

                const dadosPorTipo = {};

                let totalGeral = 0;

                for (const reg of dadosFiltrados) {

                    // 🔥 NORMALIZAÇÃO DO TIPO DE DOCUMENTO

                    let tipoDoc = (reg.tp_doc || '').toString().trim().toUpperCase();

                    // Se estiver vazio ou null, define como CARTAO

                    if (!tipoDoc || tipoDoc === '' || tipoDoc === 'NULL') {

                        tipoDoc = 'CARTAO';

                    }

                    // Aplica o mapeamento

                    tipoDoc = TIPO_DOC_MAP[tipoDoc] || 'CARTAO';

                    if (!dadosPorTipo[tipoDoc]) {

                        dadosPorTipo[tipoDoc] = {

                            total: 0,

                            contagem: 0,

                            registros: []

                        };

                    }

                    dadosPorTipo[tipoDoc].total += reg.valor_recebido || 0;

                    dadosPorTipo[tipoDoc].contagem++;

                    dadosPorTipo[tipoDoc].registros.push(reg);

                    totalGeral += reg.valor_recebido || 0;

                }

                // Renderizar resumo

                if (resumoContainer) {

                    renderizarResumoDetalhado(dadosPorTipo, totalGeral, resumoContainer);

                }

                // Renderizar gráfico

                if (graficoContainer) {

                    renderizarGraficoDetalhado(dadosPorTipo, totalGeral, graficoContainer);

                }

                // Renderizar tabela

                if (tabelaBody) {

                    renderizarTabelaDetalhado(dadosPorTipo, tabelaBody);

                }

                if (totalRegistrosSpan) {

                    totalRegistrosSpan.textContent = `Total: ${dadosFiltrados.length} registros`;

                }

            }).catch(error => {

                if (resumoContainer) resumoContainer.innerHTML = '<div style="text-align:center;padding:20px;color:#DC3545;">Erro ao carregar dados</div>';

            });

        }

        function inicializarDetalhado() {

            var hoje = new Date();

            var primeiroDia = new Date(hoje.getFullYear(), hoje.getMonth(), 1);

            var formatarData = function (data) {

                var ano = data.getFullYear();

                var mes = String(data.getMonth() + 1).padStart(2, '0');

                var dia = String(data.getDate()).padStart(2, '0');

                return ano + '-' + mes + '-' + dia;

            };

            var dataInicioInput = document.getElementById('detalhadoDataInicio');

            var dataFimInput = document.getElementById('detalhadoDataFim');

            var buscaOperadorInput = document.getElementById('detalhadoBuscaOperador');

            if (dataInicioInput) dataInicioInput.value = formatarData(primeiroDia);

            if (dataFimInput) dataFimInput.value = formatarData(hoje);

            // 🔥 Se for operador, preencher o campo com o nome dele e bloquear

            if (currentUser && currentUser.cargo === 'operador') {

                if (buscaOperadorInput) {

                    buscaOperadorInput.value = currentUser.nome;

                    buscaOperadorInput.disabled = true;

                    buscaOperadorInput.style.background = '#f0f0f0';

                    buscaOperadorInput.style.cursor = 'not-allowed';

                }

            } else {

                // Para outros perfis, limpar o campo se existir

                if (buscaOperadorInput) {

                    buscaOperadorInput.value = '';

                    buscaOperadorInput.disabled = false;

                    buscaOperadorInput.style.background = '';

                    buscaOperadorInput.style.cursor = '';

                    // 🔥 ADICIONAR AUTOCOMPLETE PARA BUSCA DE OPERADOR

                    // Aguardar o DOM estar pronto

                    setTimeout(function () {

                        setupDetalhadoAutocomplete(buscaOperadorInput);

                    }, 100);

                }

            }

            setTimeout(carregarDetalhado, 300);

        }

        // Adicionar a aba Detalhado apos o carregamento

        document.addEventListener('DOMContentLoaded', function () {

            setTimeout(function () {

                var tabsContainer = document.getElementById('tabsContainer');

                if (!tabsContainer) return;

                var abaExistente = tabsContainer.querySelector('.tab-btn[data-tab="detalhado"]');

                if (abaExistente) return;

                var btn = document.createElement('button');

                btn.className = 'tab-btn';

                btn.setAttribute('data-tab', 'detalhado');

                btn.textContent = 'Detalhado';

                btn.onclick = function (e) { switchTab('detalhado', e); };

                var dashboardBtn = tabsContainer.querySelector('.tab-btn:first-child');

                if (dashboardBtn) {

                    dashboardBtn.parentNode.insertBefore(btn, dashboardBtn.nextSibling);

                } else {

                    tabsContainer.appendChild(btn);

                }

            }, 500);

        });

        // ============================================

        // FILTROS DE REGISTROS DETALHADOS (PAGINAÇÃO 200)

        // ============================================

        let registrosDetalhadosFiltrados = [];

        let paginaDetalhadoAtual = 1;

        const ITENS_POR_PAGINA_DETALHADO = 200;

        // Função para limpar os filtros de registros

        function limparFiltrosRegistrosDetalhado() {

            document.getElementById('detalhadoFiltroCliente').value = '';

            document.getElementById('detalhadoFiltroDocumento').value = '';

            document.getElementById('detalhadoFiltroFormaPgto').value = '';

            document.getElementById('detalhadoFiltroDataPgto').value = '';

            aplicarFiltrosRegistrosDetalhado();

        }

        // Função para aplicar os filtros de registros

        function aplicarFiltrosRegistrosDetalhado() {

            const cliente = document.getElementById('detalhadoFiltroCliente')?.value?.toLowerCase() || '';

            const documento = document.getElementById('detalhadoFiltroDocumento')?.value?.toLowerCase() || '';

            const formaPgto = document.getElementById('detalhadoFiltroFormaPgto')?.value || '';

            const dataPgto = document.getElementById('detalhadoFiltroDataPgto')?.value || '';

            // Buscar os registros atuais que já foram filtrados pelos filtros principais

            const todosRegistros = window.registrosDetalhadosAtuais || [];

            let filtrados = todosRegistros.filter(reg => {

                // Filtro por Cliente

                if (cliente) {

                    const nomeCliente = (reg.cliente || '').toLowerCase();

                    if (!nomeCliente.includes(cliente)) return false;

                }

                // Filtro por Documento

                if (documento) {

                    const nrDoc = (reg.nr_documento || '').toLowerCase();

                    if (!nrDoc.includes(documento)) return false;

                }

                // Filtro por Forma de Pagamento

                if (formaPgto) {

                    const tipoDoc = (reg.tp_doc || '').toUpperCase().trim();

                    if (tipoDoc !== formaPgto) return false;

                }

                // Filtro por Data de Pagamento

                if (dataPgto) {

                    const dataReg = reg.data_pagamento ? reg.data_pagamento.split('T')[0] : '';

                    if (dataReg !== dataPgto) return false;

                }

                return true;

            });

            registrosDetalhadosFiltrados = filtrados;

            paginaDetalhadoAtual = 1;

            renderizarTabelaDetalhadoComPaginacao();

        }

        // Função para renderizar a tabela com paginação

        function renderizarTabelaDetalhadoComPaginacao() {

            const tbody = document.getElementById('detalhadoTabelaBody');

            const pagContainer = document.getElementById('detalhadoPagination');

            const totalSpan = document.getElementById('detalhadoTotalRegistros');

            const totalRegistros = registrosDetalhadosFiltrados.length;

            const totalPaginas = Math.ceil(totalRegistros / ITENS_POR_PAGINA_DETALHADO);

            // Atualizar total

            if (totalSpan) {

                totalSpan.textContent = `Total: ${totalRegistros} registros`;

            }

            if (totalRegistros === 0) {

                tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 40px; color: #94A3B8;">Nenhum registro encontrado</td></tr>';

                pagContainer.innerHTML = '';

                return;

            }

            // Calcular índices da página atual

            const inicio = (paginaDetalhadoAtual - 1) * ITENS_POR_PAGINA_DETALHADO;

            const fim = Math.min(inicio + ITENS_POR_PAGINA_DETALHADO, totalRegistros);

            const dadosPagina = registrosDetalhadosFiltrados.slice(inicio, fim);

            // Gerar HTML da tabela

            const userMap = {};

            for (const u of usuarios) {

                userMap[u.id] = u.nome;

            }

            let html = '';

            for (const reg of dadosPagina) {

                const nomeUsuario = userMap[reg.usuario_id] || reg.operador_nome || '-';

                const tipoDoc = (reg.tp_doc || 'CARTAO').toUpperCase().trim();

                const label = TIPO_DOC_LABELS[tipoDoc] || tipoDoc;

                const cor = TIPO_DOC_CORES[tipoDoc] || '#6C757D';

                let dataPgto = '-';

                if (reg.data_pagamento) {

                    const dataStr = reg.data_pagamento.split('T')[0];

                    const partes = dataStr.split('-');

                    if (partes.length === 3) dataPgto = `${partes[2]}/${partes[1]}/${partes[0]}`;

                    else dataPgto = dataStr;

                }

                html += `<tr style="border-bottom: 1px solid #EDF2F7;">`;

                html += `<td style="padding: 8px 6px; font-weight: 500;">${escapeHtml(nomeUsuario)}</td>`;

                html += `<td style="padding: 8px 6px;">${escapeHtml(reg.cliente || '-')}</td>`;

                html += `<td style="padding: 8px 6px; font-weight: 600;">${escapeHtml(reg.nr_documento || '-')}</td>`;

                html += `<td style="padding: 8px 6px;">`;

                html += `<span style="display: inline-block; padding: 2px 10px; border-radius: 12px; font-size: 0.65rem; font-weight: 600; background: ${cor}20; color: ${cor}; border: 1px solid ${cor}40;">${label}</span>`;

                html += `</td>`;

                html += `<td style="padding: 8px 6px; text-align: center;">${dataPgto}</td>`;

                html += `<td style="padding: 8px 6px; text-align: right; font-weight: 700; color: #0F3B6F;">${formatMoney(reg.valor_recebido || 0)}</td>`;

                html += `</tr>`;

            }

            tbody.innerHTML = html;

            // Gerar paginação

            if (totalPaginas <= 1) {

                pagContainer.innerHTML = '';

                return;

            }

            let pagHtml = '';

            pagHtml += `<button onclick="mudarPaginaDetalhado(${paginaDetalhadoAtual - 1})" ${paginaDetalhadoAtual === 1 ? 'disabled' : ''} style="background: #E2E8F0; border: none; padding: 8px 14px; border-radius: 12px; cursor: pointer; font-weight: 600; transition: all 0.2s;">◀ Anterior</button>`;

            // Mostrar páginas

            const maxBotoes = 7;

            let inicioBotoes = Math.max(1, paginaDetalhadoAtual - Math.floor(maxBotoes / 2));

            let fimBotoes = Math.min(totalPaginas, inicioBotoes + maxBotoes - 1);

            if (fimBotoes - inicioBotoes < maxBotoes - 1) {

                inicioBotoes = Math.max(1, fimBotoes - maxBotoes + 1);

            }

            if (inicioBotoes > 1) {

                pagHtml += `<button onclick="mudarPaginaDetalhado(1)" style="background: #E2E8F0; border: none; padding: 8px 14px; border-radius: 12px; cursor: pointer; font-weight: 600; transition: all 0.2s;">1</button>`;

                if (inicioBotoes > 2) pagHtml += `<span style="padding: 0 4px;">...</span>`;

            }

            for (let i = inicioBotoes; i <= fimBotoes; i++) {

                pagHtml += `<button onclick="mudarPaginaDetalhado(${i})" class="${paginaDetalhadoAtual === i ? 'active' : ''}" style="${paginaDetalhadoAtual === i ? 'background: #1E6DC3; color: white;' : 'background: #E2E8F0;'} border: none; padding: 8px 14px; border-radius: 12px; cursor: pointer; font-weight: 600; transition: all 0.2s;">${i}</button>`;

            }

            if (fimBotoes < totalPaginas) {

                if (fimBotoes < totalPaginas - 1) pagHtml += `<span style="padding: 0 4px;">...</span>`;

                pagHtml += `<button onclick="mudarPaginaDetalhado(${totalPaginas})" style="background: #E2E8F0; border: none; padding: 8px 14px; border-radius: 12px; cursor: pointer; font-weight: 600; transition: all 0.2s;">${totalPaginas}</button>`;

            }

            pagHtml += `<button onclick="mudarPaginaDetalhado(${paginaDetalhadoAtual + 1})" ${paginaDetalhadoAtual === totalPaginas ? 'disabled' : ''} style="background: #E2E8F0; border: none; padding: 8px 14px; border-radius: 12px; cursor: pointer; font-weight: 600; transition: all 0.2s;">Próximo ▶</button>`;

            pagContainer.innerHTML = pagHtml;

        }

        // Função para mudar de página

        function mudarPaginaDetalhado(pagina) {

            const totalPaginas = Math.ceil(registrosDetalhadosFiltrados.length / ITENS_POR_PAGINA_DETALHADO);

            if (pagina >= 1 && pagina <= totalPaginas) {

                paginaDetalhadoAtual = pagina;

                renderizarTabelaDetalhadoComPaginacao();

            }

        }

        // ============================================

        // FUNÇÃO ATUALIZADA DE CARREGAR DETALHADO

        // ============================================

        function carregarDetalhado() {

            const dataInicio = document.getElementById('detalhadoDataInicio')?.value;

            const dataFim = document.getElementById('detalhadoDataFim')?.value;

            const buscaOperador = document.getElementById('detalhadoBuscaOperador')?.value || '';

            const filtroEquipe = document.getElementById('detalhadoFiltroEquipe')?.value || '';

            const filtroClasse = document.getElementById('detalhadoFiltroClasse')?.value || '';

            const resumoContainer = document.getElementById('detalhadoResumo');

            const graficoContainer = document.getElementById('detalhadoGraficoContainer');

            const totalRegistrosSpan = document.getElementById('detalhadoTotalRegistros');

            const hoje = new Date();

            const primeiroDia = new Date(hoje.getFullYear(), hoje.getMonth(), 1);

            const formatarData = (data) => {

                const ano = data.getFullYear();

                const mes = String(data.getMonth() + 1).padStart(2, '0');

                const dia = String(data.getDate()).padStart(2, '0');

                return `${ano}-${mes}-${dia}`;

            };

            const inicio = dataInicio || formatarData(primeiroDia);

            const fim = dataFim || formatarData(hoje);

            carregarRegistrosRecebimentos().then(registros => {

                if (!registros || registros.length === 0) {

                    if (resumoContainer) resumoContainer.innerHTML = '<div style="text-align:center;padding:20px;color:#94A3B8;">Nenhum registro encontrado</div>';

                    if (graficoContainer) graficoContainer.innerHTML = '<div style="text-align:center;padding:40px;color:#94A3B8;">Nenhum dado para exibir</div>';

                    const tbody = document.getElementById('detalhadoTabelaBody');

                    if (tbody) tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:20px;color:#94A3B8;">Nenhum registro encontrado</td></tr>';

                    if (totalRegistrosSpan) totalRegistrosSpan.textContent = 'Total: 0 registros';

                    document.getElementById('detalhadoPagination').innerHTML = '';

                    return;

                }

                // Filtrar por data

                let dadosFiltrados = registros.filter(reg => {

                    if (!reg.data_pagamento) return false;

                    const dataStr = reg.data_pagamento.split('T')[0];

                    return dataStr >= inicio && dataStr <= fim;

                });

                // Filtrar por operador

                if (buscaOperador && currentUser?.cargo !== 'operador') {

                    const operadorEncontrado = usuarios.find(u =>

                        u.nome.toLowerCase().includes(buscaOperador.toLowerCase()) ||

                        (u.login && u.login.toLowerCase().includes(buscaOperador.toLowerCase()))

                    );

                    if (operadorEncontrado) {

                        dadosFiltrados = dadosFiltrados.filter(reg => reg.usuario_id === operadorEncontrado.id);

                    }

                }

                // Se for operador, filtrar apenas os registros dele

                if (currentUser?.cargo === 'operador') {

                    dadosFiltrados = dadosFiltrados.filter(reg => reg.usuario_id === currentUser.id);

                }

                // Filtrar por Equipe

                if (filtroEquipe) {

                    const equipeId = parseInt(filtroEquipe);

                    const usuariosDaEquipe = usuarios.filter(u => u.equipe_id === equipeId).map(u => u.id);

                    dadosFiltrados = dadosFiltrados.filter(reg => usuariosDaEquipe.includes(reg.usuario_id));

                }

                // Filtrar por Classe

                if (filtroClasse) {

                    const usuariosDaClasse = usuarios.filter(u => u.classe === filtroClasse).map(u => u.id);

                    dadosFiltrados = dadosFiltrados.filter(reg => usuariosDaClasse.includes(reg.usuario_id));

                }

                // Armazenar registros atuais para os filtros de registros

                window.registrosDetalhadosAtuais = dadosFiltrados;

                // Agrupar por tipo de documento

                const dadosPorTipo = {};

                let totalGeral = 0;

                for (const reg of dadosFiltrados) {

                    let tipoDoc = (reg.tp_doc || '').toString().trim().toUpperCase();

                    if (!tipoDoc || tipoDoc === '' || tipoDoc === 'NULL') {

                        tipoDoc = 'CARTAO';

                    }

                    tipoDoc = TIPO_DOC_MAP[tipoDoc] || 'CARTAO';

                    if (!dadosPorTipo[tipoDoc]) {

                        dadosPorTipo[tipoDoc] = {

                            total: 0,

                            contagem: 0,

                            registros: []

                        };

                    }

                    dadosPorTipo[tipoDoc].total += reg.valor_recebido || 0;

                    dadosPorTipo[tipoDoc].contagem++;

                    dadosPorTipo[tipoDoc].registros.push(reg);

                    totalGeral += reg.valor_recebido || 0;

                }

                // Renderizar resumo

                if (resumoContainer) {

                    renderizarResumoDetalhado(dadosPorTipo, totalGeral, resumoContainer);

                }

                // Renderizar gráfico

                if (graficoContainer) {

                    renderizarGraficoDetalhado(dadosPorTipo, totalGeral, graficoContainer);

                }

                // Configurar os registros filtrados para a tabela

                registrosDetalhadosFiltrados = dadosFiltrados;

                paginaDetalhadoAtual = 1;

                renderizarTabelaDetalhadoComPaginacao();

                if (totalRegistrosSpan) {

                    totalRegistrosSpan.textContent = `Total: ${dadosFiltrados.length} registros`;

                }

            }).catch(error => {

                if (resumoContainer) resumoContainer.innerHTML = '<div style="text-align:center;padding:20px;color:#DC3545;">Erro ao carregar dados</div>';

            });

        }

        // ============================================

        // FUNÇÃO ATUALIZADA DE RESETAR FILTROS

        // ============================================

        function resetarFiltrosDetalhadoCompleto() {

            var hoje = new Date();

            var primeiroDia = new Date(hoje.getFullYear(), hoje.getMonth(), 1);

            var formatarData = function (data) {

                var ano = data.getFullYear();

                var mes = String(data.getMonth() + 1).padStart(2, '0');

                var dia = String(data.getDate()).padStart(2, '0');

                return ano + '-' + mes + '-' + dia;

            };

            document.getElementById('detalhadoDataInicio').value = formatarData(primeiroDia);

            document.getElementById('detalhadoDataFim').value = formatarData(hoje);

            // Limpar busca, exceto se for operador

            var buscaInput = document.getElementById('detalhadoBuscaOperador');

            if (currentUser && currentUser.cargo === 'operador') {

                buscaInput.value = currentUser.nome;

                buscaInput.disabled = true;

                buscaInput.style.background = '#f0f0f0';

                buscaInput.style.cursor = 'not-allowed';

            } else {

                buscaInput.value = '';

                buscaInput.disabled = false;

                buscaInput.style.background = '';

                buscaInput.style.cursor = '';

            }

            // Resetar os filtros de equipe e classe

            document.getElementById('detalhadoFiltroEquipe').value = '';

            document.getElementById('detalhadoFiltroClasse').value = '';

            // Resetar os filtros de registros    document.getElementById('detalhadoFiltroCliente').value = '';

            document.getElementById('detalhadoFiltroDocumento').value = '';

            document.getElementById('detalhadoFiltroFormaPgto').value = '';

            document.getElementById('detalhadoFiltroDataPgto').value = '';

            limparFiltrosDetalhadoSalvos();

            carregarDetalhado();

        }

        // ============================================

        // FUNÇÃO ATUALIZADA DE INICIALIZAR DETALHADO

        // ============================================

        function inicializarDetalhado() {

            var hoje = new Date();

            var primeiroDia = new Date(hoje.getFullYear(), hoje.getMonth(), 1);

            var formatarData = function (data) {

                var ano = data.getFullYear();

                var mes = String(data.getMonth() + 1).padStart(2, '0');

                var dia = String(data.getDate()).padStart(2, '0');

                return ano + '-' + mes + '-' + dia;

            };

            var dataInicioInput = document.getElementById('detalhadoDataInicio');

            var dataFimInput = document.getElementById('detalhadoDataFim');

            var buscaOperadorInput = document.getElementById('detalhadoBuscaOperador');

            var filtroEquipeSelect = document.getElementById('detalhadoFiltroEquipe');

            var filtroClasseSelect = document.getElementById('detalhadoFiltroClasse');

            if (dataInicioInput) dataInicioInput.value = formatarData(primeiroDia);

            if (dataFimInput) dataFimInput.value = formatarData(hoje);

            // 🔥 Preencher selects de Equipe e Classe

            if (filtroEquipeSelect) {

                filtroEquipeSelect.innerHTML = '<option value="">Todas as equipes</option>';

                for (const eq of equipes) {

                    filtroEquipeSelect.innerHTML += `<option value="${eq.id}">${eq.nome}</option>`;

                }

            }

            if (filtroClasseSelect) {

                filtroClasseSelect.innerHTML = '<option value="">Todas as classes</option>';

                for (const cls of classes) {

                    filtroClasseSelect.innerHTML += `<option value="${cls.nome}">${cls.nome}</option>`;

                }

            }

            // 🔥 Se for operador, preencher o campo com o nome dele e bloquear

            if (currentUser && currentUser.cargo === 'operador') {

                if (buscaOperadorInput) {

                    buscaOperadorInput.value = currentUser.nome;

                    buscaOperadorInput.disabled = true;

                    buscaOperadorInput.style.background = '#f0f0f0';

                    buscaOperadorInput.style.cursor = 'not-allowed';

                }

            } else {

                if (buscaOperadorInput) {

                    buscaOperadorInput.value = '';

                    buscaOperadorInput.disabled = false;

                    buscaOperadorInput.style.background = '';

                    buscaOperadorInput.style.cursor = '';

                    // Autocomplete para busca de operador

                    setTimeout(function () {

                        setupDetalhadoAutocomplete(buscaOperadorInput);

                    }, 100);

                }

            }

            setTimeout(carregarDetalhado, 300);

        }

        // ============================================
        // ATUALIZAÇÃO EM TEMPO REAL (SUPABASE REALTIME)
        // ============================================
        try {
            if (window.supabase && typeof window.supabase.createClient === 'function') {
                const _realtimeClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
                _realtimeClient
                    .channel('realtime-dashboard-sync')
                    .on('postgres_changes', { event: '*', schema: 'public', table: 'metas' }, async () => {
                        console.log('⚡ [Realtime] Alteração em metas detectada. Atualizando...');
                        if (typeof atualizarDadosImediatos === 'function') await atualizarDadosImediatos();
                    })
                    .on('postgres_changes', { event: '*', schema: 'public', table: 'configuracoes' }, async () => {
                        console.log('⚡ [Realtime] Alteração em configuracoes detectada. Atualizando...');
                        if (typeof atualizarDiasUteis === 'function') atualizarDiasUteis();
                        if (typeof atualizarDadosImediatos === 'function') await atualizarDadosImediatos();
                        if (typeof atualizarDiasUteis === 'function') atualizarDiasUteis();
                    })
                    .on('postgres_changes', { event: '*', schema: 'public', table: 'recebimentos' }, async () => {
                        console.log('⚡ [Realtime] Novos recebimentos detectados. Atualizando...');
                        if (typeof atualizarDadosImediatos === 'function') await atualizarDadosImediatos();
                    })
                    .subscribe((status) => {
                        if (status === 'SUBSCRIBED') {
                            console.log(' Conectado ao Supabase Realtime para sincronização instantânea.');
                        }
                    });
            }
        } catch (errRealtime) {
            console.warn('Realtime sync fallback:', errRealtime);
        }

        // =========================================================================
        // RECURSOS EXECUTIVOS: EXPORTAR CARD, COPIAR RESUMO, TENDENCIA E RAIO-X
        // (Sem emojis, foco em tomada de decisão e apresentação de resultados)
        // =========================================================================

        // ============================================
        // MODAL INTERATIVO: GERADOR DE INFORMATIVOS
        // ============================================

        // =========================================================================
        // RECURSOS EXECUTIVOS: CENTRAL DE INFORMATIVOS PERSONALIZADA
        // (Sem emojis, foco em tomada de decisão e flexibilidade total)
        // =========================================================================

        // =========================================================================
        // RECURSOS EXECUTIVOS: CENTRAL DE INFORMATIVOS PERSONALIZADA
        // (Sem emojis, foco em tomada de decisão e flexibilidade total)
        // =========================================================================

        window.abrirModalInformativo = function (tipo) {
            const isGestor = tipo === 'gestor';
            const modalEl = document.getElementById('editModal');
            if (!modalEl) return;

            const modalHtml = `
            <div class="modal-overlay" style="display: flex; align-items: center; justify-content: center; position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background: rgba(15, 23, 42, 0.75); backdrop-filter: blur(6px); z-index: 99999; padding: 20px;">
                <div class="modal-content" style="background: white; border-radius: 20px; max-width: 820px; width: 100%; max-height: 90vh; overflow-y: auto; padding: 28px; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25); display: flex; flex-direction: column; gap: 20px; font-family: 'Segoe UI', Roboto, sans-serif;">
                    
                    <!-- CABEÇALHO DO MODAL (SEM EMOJIS) -->
                    <div style="display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 1px solid #E2E8F0; padding-bottom: 16px;">
                        <div>
                            <h3 style="margin: 0; color: #0F3B6F; font-size: 1.4rem; font-weight: 800;">
                                Exportar Informativo Personalizado
                            </h3>
                            <p style="margin: 4px 0 0 0; color: #64748B; font-size: 0.85rem;">
                                Selecione as seções e indicadores que deseja incluir no informativo (${isGestor ? 'Setor Geral' : 'Sua Equipe'}).
                            </p>
                        </div>
                        <button onclick="fecharModal()" style="background: none; border: none; font-size: 1.6rem; color: #94A3B8; cursor: pointer; padding: 4px; line-height: 1;">&times;</button>
                    </div>

                    <!-- GRID DE SELEÇÃO DE INFORMAÇÕES (SEM EMOJIS) -->
                    <div style="background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 14px; padding: 18px;">
                        <div style="font-weight: 700; color: #1E293B; font-size: 0.95rem; margin-bottom: 12px;">
                            Opções de exportação:
                        </div>
                        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(230px, 1fr)); gap: 12px;">
                            <label style="display: flex; align-items: center; gap: 8px; font-size: 0.85rem; color: #334155; cursor: pointer; font-weight: 600;">
                                <input type="checkbox" id="chkIndicadores" checked onchange="window.atualizarPreviewInformativo('${tipo}')" style="width: 17px; height: 17px; accent-color: #1E6DC3; cursor: pointer;">
                                Indicadores (Total, Meta, Projeção)
                            </label>

                            <label style="display: flex; align-items: center; gap: 8px; font-size: 0.85rem; color: #334155; cursor: pointer; font-weight: 600;">
                                <input type="checkbox" id="chkComposicao" checked onchange="window.atualizarPreviewInformativo('${tipo}')" style="width: 17px; height: 17px; accent-color: #1E6DC3; cursor: pointer;">
                                Recebimento Direto vs Extra
                            </label>

                            <label style="display: flex; align-items: center; gap: 8px; font-size: 0.85rem; color: #334155; cursor: pointer; font-weight: 600;">
                                <input type="checkbox" id="chkRitmo" checked onchange="window.atualizarPreviewInformativo('${tipo}')" style="width: 17px; height: 17px; accent-color: #1E6DC3; cursor: pointer;">
                                Ritmo da Operação e Dias Úteis
                            </label>

                            ${isGestor ? `
                            <label style="display: flex; align-items: center; gap: 8px; font-size: 0.85rem; color: #334155; cursor: pointer; font-weight: 600;">
                                <input type="checkbox" id="chkClasses" checked onchange="window.atualizarPreviewInformativo('${tipo}')" style="width: 17px; height: 17px; accent-color: #1E6DC3; cursor: pointer;">
                                Detalhamento por Classes (CRM, Digital)
                            </label>

                            <label style="display: flex; align-items: center; gap: 8px; font-size: 0.85rem; color: #334155; cursor: pointer; font-weight: 600;">
                                <input type="checkbox" id="chkEquipes" checked onchange="window.atualizarPreviewInformativo('${tipo}')" style="width: 17px; height: 17px; accent-color: #1E6DC3; cursor: pointer;">
                                Ranking das Equipes
                            </label>
                            ` : ''}

                            <label style="display: flex; align-items: center; gap: 8px; font-size: 0.85rem; color: #334155; cursor: pointer; font-weight: 600;">
                                <input type="checkbox" id="chkOperadores" checked onchange="window.atualizarPreviewInformativo('${tipo}')" style="width: 17px; height: 17px; accent-color: #1E6DC3; cursor: pointer;">
                                ${isGestor ? 'Top Operadores do Setor' : 'Ranking dos Operadores'}
                            </label>
                        </div>

                        <!-- FILTRO DE QUANTIDADE DO RANKING -->
                        <div style="margin-top: 14px; padding-top: 12px; border-top: 1px solid #E2E8F0; display: flex; align-items: center; gap: 12px; flex-wrap: wrap;">
                            <span style="font-size: 0.85rem; font-weight: 600; color: #475569;">Exibir no ranking:</span>
                            <select id="selQtdRanking" onchange="window.atualizarPreviewInformativo('${tipo}')" style="padding: 6px 12px; border-radius: 8px; border: 1px solid #CBD5E1; font-size: 0.85rem; color: #1E293B; background: white; font-weight: 600; cursor: pointer;">
                                <option value="3">Top 3</option>
                                <option value="5" selected>Top 5 (Padrão)</option>
                                <option value="10">Top 10</option>
                                <option value="todos">Todos</option>
                            </select>
                        </div>
                    </div>

                    <!-- PRÉ-VISUALIZAÇÃO EM TEMPO REAL -->
                    <div>
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                            <span style="font-weight: 700; color: #1E293B; font-size: 0.9rem;">Pré-visualização do Informativo:</span>
                            <span style="font-size: 0.75rem; color: #64748B;">Atualiza automaticamente ao alterar as opções</span>
                        </div>
                        <pre id="previewInformativoText" style="background: #0F172A; color: #F1F5F9; padding: 16px; border-radius: 12px; font-family: 'Consolas', 'Courier New', monospace; font-size: 0.8rem; line-height: 1.5; max-height: 220px; overflow-y: auto; white-space: pre-wrap; margin: 0; border: 1px solid #334155;"></pre>
                    </div>

                    <!-- BOTÕES DE AÇÃO INFERIORES (SEM EMOJIS) -->
                    <div style="display: flex; justify-content: flex-end; gap: 12px; border-top: 1px solid #E2E8F0; padding-top: 16px; flex-wrap: wrap;">
                        <button onclick="fecharModal()" class="btn" style="background: #E2E8F0; color: #475569; border: none; padding: 10px 18px; border-radius: 10px; font-weight: 700; font-size: 0.85rem; cursor: pointer;">
                            Cancelar
                        </button>
                        <button onclick="window.copiarInformativoPersonalizado('${tipo}')" class="btn" style="background: #0F3B6F; color: white; border: none; padding: 10px 20px; border-radius: 10px; font-weight: 700; font-size: 0.85rem; cursor: pointer; box-shadow: 0 2px 6px rgba(15, 59, 111, 0.2);">
                            Copiar Informativo
                        </button>
                        <button onclick="window.baixarInformativoPersonalizado('${tipo}')" class="btn" style="background: #1E6DC3; color: white; border: none; padding: 10px 20px; border-radius: 10px; font-weight: 700; font-size: 0.85rem; cursor: pointer; box-shadow: 0 2px 6px rgba(30, 109, 195, 0.25);">
                            Baixar Informativo
                        </button>
                    </div>

                </div>
            </div>
            `;

            modalEl.innerHTML = modalHtml;
            modalEl.style.display = 'block';

            // Atualiza preview inicial
            window.atualizarPreviewInformativo(tipo);
        };

        // GERA O TEXTO DO INFORMATIVO DINAMICAMENTE CONFORME AS OPÇÕES
        window.gerarTextoInformativoDinamico = function (tipo) {
            const isGestor = tipo === 'gestor';
            const mes = new Date().getMonth() + 1;
            const ano = new Date().getFullYear();
            const hojeStr = new Date().toLocaleDateString('pt-BR');
            const totalDias = getDiasUteis();
            const diasPass = getDiasPassados();
            const diasRest = getDiasRestantes();

            const chkIndicadores = document.getElementById('chkIndicadores')?.checked ?? true;
            const chkComposicao = document.getElementById('chkComposicao')?.checked ?? true;
            const chkRitmo = document.getElementById('chkRitmo')?.checked ?? true;
            const chkClasses = document.getElementById('chkClasses')?.checked ?? true;
            const chkEquipes = document.getElementById('chkEquipes')?.checked ?? true;
            const chkOperadores = document.getElementById('chkOperadores')?.checked ?? true;
            const qtdRankingVal = document.getElementById('selQtdRanking')?.value || '5';

            let textoPartes = [];

            if (isGestor) {
                const metaSetor = getMetaSetor();
                const usuariosAtivos = usuarios.filter(u => u.status === 'ativo');
                let totalRecebido = 0, totalDireto = 0, totalExtra = 0;

                for (const u of usuariosAtivos) {
                    const m = metas.find(meta => meta?.usuario_id === u.id && meta?.mes === mes && meta?.ano === ano);
                    if (m) {
                        totalRecebido += m.recebido || 0;
                        totalDireto += m.direto || 0;
                        totalExtra += m.extra || 0;
                    }
                }

                const alcance = metaSetor > 0 ? (totalRecebido / metaSetor) * 100 : 0;
                const projecao = calcularProjecao(metaSetor, totalRecebido);
                const falta = Math.max(0, metaSetor - totalRecebido);
                const mediaDiaria = diasPass > 0 ? totalRecebido / diasPass : 0;
                const metaDiariaNecessaria = diasRest > 0 ? falta / diasRest : 0;
                const pctDireto = totalRecebido > 0 ? (totalDireto / totalRecebido) * 100 : 0;
                const pctExtra = totalRecebido > 0 ? (totalExtra / totalRecebido) * 100 : 0;

                textoPartes.push('RELATÓRIO EXECUTIVO - CONTROLE RECEPTIVO (SETOR GERAL)');
                textoPartes.push('Data de Emissão: ' + hojeStr);
                textoPartes.push('Dias Úteis: ' + diasPass + ' de ' + totalDias + ' decorridos (' + diasRest + ' restantes)\n');

                if (chkIndicadores) {
                    textoPartes.push('--- INDICADORES PRINCIPAIS DO SETOR ---');
                    textoPartes.push('Total Recebido: ' + formatMoney(totalRecebido));
                    textoPartes.push('Meta do Setor: ' + formatMoney(metaSetor));
                    textoPartes.push('Alcance da Meta: ' + alcance.toFixed(2) + '%');
                    textoPartes.push('Projeção de Fechamento: ' + projecao.toFixed(2) + '%');
                    textoPartes.push('Falta para a Meta: ' + (falta === 0 ? 'META ATINGIDA!' : formatMoney(falta)) + '\n');
                }

                if (chkComposicao) {
                    textoPartes.push('--- COMPOSIÇÃO GERAL DO RECEBIMENTO ---');
                    textoPartes.push('Recebimento Direto: ' + formatMoney(totalDireto) + ' (' + pctDireto.toFixed(1) + '%)');
                    textoPartes.push('Recebimento Extra: ' + formatMoney(totalExtra) + ' (' + pctExtra.toFixed(1) + '%)\n');
                }

                if (chkClasses) {
                    const classesResumo = classes.map(cls => {
                        const opsDaClasse = usuarios.filter(u => String(u.classe || '').trim().toLowerCase() === String(cls.nome || '').trim().toLowerCase() && (u.cargo === 'operador' || u.cargo === 'elite') && u.status === 'ativo');
                        let totCls = 0, dirCls = 0, extCls = 0, metaCls = 0;
                        opsDaClasse.forEach(op => {
                            const mo = metas.find(x => String(x?.usuario_id) === String(op.id) && x?.mes === mes && x?.ano === ano);
                            if (mo) {
                                totCls += mo.recebido || 0;
                                dirCls += mo.direto || 0;
                                extCls += mo.extra || 0;
                                metaCls += mo.meta || 0;
                            }
                        });
                        const pctDir = totCls > 0 ? (dirCls / totCls) * 100 : 0;
                        const pctExt = totCls > 0 ? (extCls / totCls) * 100 : 0;
                        const alc = metaCls > 0 ? (totCls / metaCls) * 100 : 0;
                        return {
                            nome: cls.nome,
                            total: totCls,
                            direto: dirCls,
                            extra: extCls,
                            meta: metaCls,
                            pctDireto: pctDir,
                            pctExtra: pctExt,
                            alcance: alc,
                            count: opsDaClasse.length
                        };
                    }).filter(c => c.count > 0 || c.total > 0).sort((a, b) => b.total - a.total);

                    textoPartes.push('--- DETALHAMENTO POR CLASSE / CANAL DE OPERADORES ---');
                    classesResumo.forEach(c => {
                        textoPartes.push('• ' + c.nome.toUpperCase() + ' (' + c.count + ' operadores): ' + formatMoney(c.total) +
                            ' | Direto: ' + formatMoney(c.direto) + ' (' + c.pctDireto.toFixed(1) + '%)' +
                            ' | Extra: ' + formatMoney(c.extra) + ' (' + c.pctExtra.toFixed(1) + '%)' +
                            (c.meta > 0 ? ' | Meta: ' + formatMoney(c.meta) + ' (' + c.alcance.toFixed(1) + '%)' : '')
                        );
                    });
                    textoPartes.push('');
                }

                if (chkEquipes) {
                    let equipesRanking = equipes.map(eq => {
                        const membrosEq = usuarios.filter(u => u.equipe_id === eq.id && u.status === 'ativo');
                        let totEq = 0;
                        membrosEq.forEach(m => {
                            const mo = metas.find(x => x?.usuario_id === m.id && x?.mes === mes && x?.ano === ano);
                            if (mo) totEq += mo.recebido || 0;
                        });
                        return { nome: eq.nome, total: totEq };
                    }).sort((a, b) => b.total - a.total);

                    if (qtdRankingVal !== 'todos') {
                        equipesRanking = equipesRanking.slice(0, parseInt(qtdRankingVal, 10));
                    }

                    textoPartes.push('--- RANKING DAS EQUIPES DO SETOR ---');
                    equipesRanking.forEach((eq, i) => {
                        textoPartes.push((i + 1) + 'º Lugar - ' + eq.nome + ': ' + formatMoney(eq.total));
                    });
                    textoPartes.push('');
                }

                if (chkOperadores) {
                    let operadoresTopSetor = usuarios.filter(u => (u.cargo === 'operador' || u.cargo === 'elite') && u.status === 'ativo').map(op => {
                        const mo = metas.find(x => x?.usuario_id === op.id && x?.mes === mes && x?.ano === ano);
                        const eq = equipes.find(e => e.id === op.equipe_id);
                        return { nome: op.nome, equipe: eq ? eq.nome : 'Sem equipe', total: mo?.recebido || 0 };
                    }).sort((a, b) => b.total - a.total);

                    if (qtdRankingVal !== 'todos') {
                        operadoresTopSetor = operadoresTopSetor.slice(0, parseInt(qtdRankingVal, 10));
                    }

                    textoPartes.push('--- TOP OPERADORES DO SETOR GERAL ---');
                    operadoresTopSetor.forEach((op, i) => {
                        textoPartes.push((i + 1) + 'º Lugar - ' + op.nome + ' (' + op.equipe + '): ' + formatMoney(op.total));
                    });
                    textoPartes.push('');
                }

                if (chkRitmo) {
                    textoPartes.push('--- RITMO DA OPERAÇÃO ---');
                    textoPartes.push('Média Diária Atual: ' + formatMoney(mediaDiaria) + '/dia');
                    textoPartes.push('Meta Diária Necessária: ' + formatMoney(metaDiariaNecessaria) + '/dia');
                    textoPartes.push('Status Operacional: ' + (totalRecebido >= (metaSetor / Math.max(totalDias, 1) * diasPass) ? 'Acima do ritmo linear ideal' : 'Abaixo do ritmo linear ideal'));
                }

            } else {
                // Tipo Supervisor
                const supervisorEquipe = equipes.find(e => e.id === currentUser?.equipe_id);
                const nomeEquipe = supervisorEquipe ? supervisorEquipe.nome : 'Sua Equipe';
                const metaEqObj = metasEquipe.find(me => me?.equipe_id === supervisorEquipe?.id && me?.mes === mes && me?.ano === ano);
                const metaEquipe = metaEqObj?.meta || 100000;

                const membros = usuarios.filter(u => u.equipe_id === supervisorEquipe?.id && u.status === 'ativo');
                let totalRecebido = 0, totalDireto = 0, totalExtra = 0;
                let rankingMembros = [];

                for (const m of membros) {
                    const mo = metas.find(x => x?.usuario_id === m.id && x?.mes === mes && x?.ano === ano);
                    const rec = mo?.recebido || 0;
                    totalRecebido += rec;
                    totalDireto += mo?.direto || 0;
                    totalExtra += mo?.extra || 0;
                    rankingMembros.push({ nome: m.nome, recebido: rec });
                }

                rankingMembros.sort((a, b) => b.recebido - a.recebido);

                if (qtdRankingVal !== 'todos') {
                    rankingMembros = rankingMembros.slice(0, parseInt(qtdRankingVal, 10));
                }

                const alcance = metaEquipe > 0 ? (totalRecebido / metaEquipe) * 100 : 0;
                const projecao = calcularProjecao(metaEquipe, totalRecebido);
                const falta = Math.max(0, metaEquipe - totalRecebido);
                const mediaDiaria = diasPass > 0 ? totalRecebido / diasPass : 0;
                const metaDiariaNecessaria = diasRest > 0 ? falta / diasRest : 0;

                textoPartes.push('RELATÓRIO EXECUTIVO - EQUIPE ' + nomeEquipe.toUpperCase());
                textoPartes.push('Data de Emissão: ' + hojeStr);
                textoPartes.push('Dias Úteis: ' + diasPass + ' de ' + totalDias + ' decorridos (' + diasRest + ' restantes)\n');

                if (chkIndicadores) {
                    textoPartes.push('--- INDICADORES DA EQUIPE ---');
                    textoPartes.push('Total Recebido: ' + formatMoney(totalRecebido));
                    textoPartes.push('Meta da Equipe: ' + formatMoney(metaEquipe));
                    textoPartes.push('Alcance da Meta: ' + alcance.toFixed(2) + '%');
                    textoPartes.push('Projeção de Fechamento: ' + projecao.toFixed(2) + '%');
                    textoPartes.push('Falta para a Meta: ' + (falta === 0 ? 'META ATINGIDA!' : formatMoney(falta)) + '\n');
                }

                if (chkComposicao) {
                    textoPartes.push('--- COMPOSIÇÃO DA EQUIPE ---');
                    textoPartes.push('Recebimento Direto: ' + formatMoney(totalDireto));
                    textoPartes.push('Recebimento Extra: ' + formatMoney(totalExtra) + '\n');
                }

                if (chkOperadores) {
                    textoPartes.push('--- RANKING DOS OPERADORES DA EQUIPE ---');
                    rankingMembros.forEach((m, i) => {
                        textoPartes.push((i + 1) + 'º Lugar - ' + m.nome + ': ' + formatMoney(m.recebido));
                    });
                    textoPartes.push('');
                }

                if (chkRitmo) {
                    textoPartes.push('--- RITMO DA EQUIPE ---');
                    textoPartes.push('Média Diária Atual: ' + formatMoney(mediaDiaria) + '/dia');
                    textoPartes.push('Meta Diária Necessária: ' + formatMoney(metaDiariaNecessaria) + '/dia');
                }
            }

            return textoPartes.join('\n');
        };

        // ATUALIZA A PRÉ-VISUALIZAÇÃO NO MODAL
        window.atualizarPreviewInformativo = function (tipo) {
            const previewEl = document.getElementById('previewInformativoText');
            if (previewEl) {
                previewEl.textContent = window.gerarTextoInformativoDinamico(tipo);
            }
        };

        // COPIAR INFORMATIVO PERSONALIZADO
        window.copiarInformativoPersonalizado = async function (tipo) {
            const texto = window.gerarTextoInformativoDinamico(tipo);
            let copiou = false;

            if (navigator.clipboard && window.isSecureContext && typeof navigator.clipboard.writeText === 'function') {
                try {
                    await navigator.clipboard.writeText(texto);
                    copiou = true;
                } catch (e) {
                    copiou = false;
                }
            }

            if (!copiou) {
                try {
                    const ta = document.createElement('textarea');
                    ta.value = texto;
                    ta.style.position = 'fixed';
                    ta.style.left = '-9999px';
                    ta.style.top = '-9999px';
                    ta.style.opacity = '0';
                    document.body.appendChild(ta);
                    ta.focus();
                    ta.select();
                    ta.setSelectionRange(0, 99999);
                    copiou = document.execCommand('copy');
                    document.body.removeChild(ta);
                } catch (errFallback) {
                    console.warn('Fallback copy error:', errFallback);
                }
            }

            showToast('Informativo copiado com sucesso!');
        };

        // BAIXAR INFORMATIVO PERSONALIZADO (IMAGEM PNG DINÂMICA)
        window.baixarInformativoPersonalizado = function (tipo) {
            const isGestor = tipo === 'gestor';
            const mes = new Date().getMonth() + 1;
            const ano = new Date().getFullYear();
            const hojeStr = new Date().toLocaleDateString('pt-BR');
            const totalDias = getDiasUteis();
            const diasPass = getDiasPassados();
            const diasRest = getDiasRestantes();

            const chkIndicadores = document.getElementById('chkIndicadores')?.checked ?? true;
            const chkComposicao = document.getElementById('chkComposicao')?.checked ?? true;
            const chkRitmo = document.getElementById('chkRitmo')?.checked ?? true;
            const chkClasses = document.getElementById('chkClasses')?.checked ?? true;
            const chkEquipes = document.getElementById('chkEquipes')?.checked ?? true;
            const chkOperadores = document.getElementById('chkOperadores')?.checked ?? true;
            const qtdRankingVal = document.getElementById('selQtdRanking')?.value || '5';
            const limitRank = qtdRankingVal === 'todos' ? 10 : parseInt(qtdRankingVal, 10);

            let titulo = '';
            let subtitulo = '';
            let totalRecebido = 0;
            let metaValor = 0;
            let totalDireto = 0;
            let totalExtra = 0;
            let ranking = [];
            let classesResumo = [];

            if (isGestor) {
                titulo = 'RELATÓRIO EXECUTIVO - CONTROLE RECEPTIVO';
                subtitulo = 'Desempenho Geral do Setor';
                metaValor = getMetaSetor();
                const usuariosAtivos = usuarios.filter(u => u.status === 'ativo');

                for (const u of usuariosAtivos) {
                    const m = metas.find(meta => meta?.usuario_id === u.id && meta?.mes === mes && meta?.ano === ano);
                    if (m) {
                        totalRecebido += m.recebido || 0;
                        totalDireto += m.direto || 0;
                        totalExtra += m.extra || 0;
                    }
                }

                if (chkClasses) {
                    classesResumo = classes.map(cls => {
                        const opsDaClasse = usuarios.filter(u => String(u.classe || '').trim().toLowerCase() === String(cls.nome || '').trim().toLowerCase() && (u.cargo === 'operador' || u.cargo === 'elite') && u.status === 'ativo');
                        let totCls = 0, dirCls = 0, extCls = 0;
                        opsDaClasse.forEach(op => {
                            const mo = metas.find(x => String(x?.usuario_id) === String(op.id) && x?.mes === mes && x?.ano === ano);
                            if (mo) {
                                totCls += mo.recebido || 0;
                                dirCls += mo.direto || 0;
                                extCls += mo.extra || 0;
                            }
                        });
                        return {
                            nome: cls.nome,
                            total: totCls,
                            direto: dirCls,
                            extra: extCls,
                            count: opsDaClasse.length
                        };
                    }).filter(c => c.count > 0 || c.total > 0).sort((a, b) => b.total - a.total);
                }

                if (chkEquipes) {
                    let equipesList = equipes.map(eq => {
                        let tot = 0;
                        usuarios.filter(u => u.equipe_id === eq.id && u.status === 'ativo').forEach(m => {
                            const mo = metas.find(x => x?.usuario_id === m.id && x?.mes === mes && x?.ano === ano);
                            if (mo) tot += mo.recebido || 0;
                        });
                        return { label: eq.nome, valor: tot };
                    }).sort((a, b) => b.valor - a.valor);

                    ranking = equipesList.slice(0, limitRank);
                } else if (chkOperadores) {
                    let opList = usuarios.filter(u => (u.cargo === 'operador' || u.cargo === 'elite') && u.status === 'ativo').map(op => {
                        const mo = metas.find(x => x?.usuario_id === op.id && x?.mes === mes && x?.ano === ano);
                        return { label: op.nome, valor: mo?.recebido || 0 };
                    }).sort((a, b) => b.valor - a.valor);

                    ranking = opList.slice(0, limitRank);
                }

            } else {
                const supervisorEquipe = equipes.find(e => e.id === currentUser?.equipe_id);
                titulo = 'RELATÓRIO EXECUTIVO - ' + (supervisorEquipe ? supervisorEquipe.nome.toUpperCase() : 'EQUIPE');
                subtitulo = 'Acompanhamento de Resultados da Equipe';
                const metaEqObj = metasEquipe.find(me => me?.equipe_id === supervisorEquipe?.id && me?.mes === mes && me?.ano === ano);
                metaValor = metaEqObj?.meta || 100000;

                const membros = usuarios.filter(u => u.equipe_id === supervisorEquipe?.id && u.status === 'ativo');
                let rankingMembros = [];
                for (const m of membros) {
                    const mo = metas.find(x => x?.usuario_id === m.id && x?.mes === mes && x?.ano === ano);
                    const rec = mo?.recebido || 0;
                    totalRecebido += rec;
                    totalDireto += mo?.direto || 0;
                    totalExtra += mo?.extra || 0;
                    if (chkOperadores) {
                        rankingMembros.push({ label: m.nome, valor: rec });
                    }
                }
                ranking = rankingMembros.sort((a, b) => b.valor - a.valor).slice(0, limitRank);
            }

            const alcance = metaValor > 0 ? (totalRecebido / metaValor) * 100 : 0;
            const projecao = calcularProjecao(metaValor, totalRecebido);
            const falta = Math.max(0, metaValor - totalRecebido);
            const mediaDiaria = diasPass > 0 ? totalRecebido / diasPass : 0;
            const metaDiariaNecessaria = diasRest > 0 ? falta / diasRest : 0;
            const pctDireto = totalRecebido > 0 ? (totalDireto / totalRecebido) * 100 : 0;
            const pctExtra = totalRecebido > 0 ? (totalExtra / totalRecebido) * 100 : 0;

            const canvas = document.createElement('canvas');
            canvas.width = 1280;
            canvas.height = 720;
            const ctx = canvas.getContext('2d');

            // Fundo Gradiente Executivo
            const gradBg = ctx.createLinearGradient(0, 0, 1280, 720);
            gradBg.addColorStop(0, '#06152B');
            gradBg.addColorStop(0.5, '#0A2244');
            gradBg.addColorStop(1, '#0E3666');
            ctx.fillStyle = gradBg;
            ctx.fillRect(0, 0, 1280, 720);

            // Linha divisória superior
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(40, 95);
            ctx.lineTo(1240, 95);
            ctx.stroke();

            // Cabeçalho (Sem emojis)
            ctx.fillStyle = '#FFFFFF';
            ctx.font = '800 26px "Segoe UI", Roboto, sans-serif';
            ctx.fillText(titulo, 45, 50);

            ctx.fillStyle = '#93C5FD';
            ctx.font = '600 14px "Segoe UI", Roboto, sans-serif';
            ctx.fillText(subtitulo + ' | Data: ' + hojeStr + ' | Dias Úteis: ' + diasPass + ' de ' + totalDias + ' (' + diasRest + ' restantes)', 45, 78);

            function drawCard(x, y, w, h, r, bg, strokeColor) {
                ctx.fillStyle = bg;
                ctx.beginPath();
                if (typeof ctx.roundRect === 'function') {
                    ctx.roundRect(x, y, w, h, r);
                } else {
                    ctx.moveTo(x + r, y);
                    ctx.lineTo(x + w - r, y);
                    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
                    ctx.lineTo(x + w, y + h - r);
                    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
                    ctx.lineTo(x + r, y + h);
                    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
                    ctx.lineTo(x, y + r);
                    ctx.quadraticCurveTo(x, y, x + r, y);
                    ctx.closePath();
                }
                ctx.fill();
                if (strokeColor) {
                    ctx.strokeStyle = strokeColor;
                    ctx.stroke();
                }
            }

            // Badge de status
            const badgeText = projecao >= 100 ? 'PROJEÇÃO POSITIVA' : 'RITMO DE ATENÇÃO';
            const badgeBg = projecao >= 100 ? '#10B981' : '#F59E0B';
            drawCard(1045, 34, 190, 38, 19, badgeBg, null);
            ctx.fillStyle = '#FFFFFF';
            ctx.font = '700 13px "Segoe UI", Roboto, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(badgeText, 1140, 58);
            ctx.textAlign = 'left';

            // Layout Dinâmico
            let contentStartY = 115;
            let bottomBoxH = 370;

            if (chkIndicadores) {
                // Renderiza os 4 Cards Principais
                const cardW = 285, cardH = 135;

                // Total Recebido
                drawCard(45, contentStartY, cardW, cardH, 14, 'rgba(255, 255, 255, 0.06)', 'rgba(255, 255, 255, 0.12)');
                ctx.fillStyle = '#94A3B8';
                ctx.font = '700 12px "Segoe UI", Roboto, sans-serif';
                ctx.fillText(isGestor ? 'TOTAL RECEBIDO DO SETOR' : 'TOTAL RECEBIDO DA EQUIPE', 65, contentStartY + 32);
                ctx.fillStyle = '#34D399';
                ctx.font = '800 24px "Segoe UI", Roboto, sans-serif';
                ctx.fillText(formatMoney(totalRecebido), 65, contentStartY + 70);
                ctx.fillStyle = '#E2E8F0';
                ctx.font = '600 13px "Segoe UI", Roboto, sans-serif';
                ctx.fillText(alcance.toFixed(1) + '% da meta atingida', 65, contentStartY + 106);

                // Meta Planejada
                drawCard(350, contentStartY, cardW, cardH, 14, 'rgba(255, 255, 255, 0.06)', 'rgba(255, 255, 255, 0.12)');
                ctx.fillStyle = '#94A3B8';
                ctx.font = '700 12px "Segoe UI", Roboto, sans-serif';
                ctx.fillText(isGestor ? 'META DO SETOR' : 'META DA EQUIPE', 370, contentStartY + 32);
                ctx.fillStyle = '#FFFFFF';
                ctx.font = '800 24px "Segoe UI", Roboto, sans-serif';
                ctx.fillText(formatMoney(metaValor), 370, contentStartY + 70);
                ctx.fillStyle = '#F87171';
                ctx.font = '600 13px "Segoe UI", Roboto, sans-serif';
                ctx.fillText(falta === 0 ? 'Meta superada!' : 'Falta: ' + formatMoney(falta), 370, contentStartY + 106);

                // Projeção
                drawCard(655, contentStartY, cardW, cardH, 14, 'rgba(255, 255, 255, 0.06)', 'rgba(255, 255, 255, 0.12)');
                ctx.fillStyle = '#94A3B8';
                ctx.font = '700 12px "Segoe UI", Roboto, sans-serif';
                ctx.fillText('PROJEÇÃO DE FECHAMENTO', 675, contentStartY + 32);
                ctx.fillStyle = projecao >= 100 ? '#38BDF8' : '#FBBF24';
                ctx.font = '800 24px "Segoe UI", Roboto, sans-serif';
                ctx.fillText(projecao.toFixed(1) + '%', 675, contentStartY + 70);
                ctx.fillStyle = '#E2E8F0';
                ctx.font = '600 13px "Segoe UI", Roboto, sans-serif';
                ctx.fillText(projecao >= 100 ? 'No ritmo projetado' : 'Abaixo do ritmo linear', 675, contentStartY + 106);

                // Ritmo Diário
                drawCard(960, contentStartY, cardW, cardH, 14, 'rgba(255, 255, 255, 0.06)', 'rgba(255, 255, 255, 0.12)');
                ctx.fillStyle = '#94A3B8';
                ctx.font = '700 12px "Segoe UI", Roboto, sans-serif';
                ctx.fillText('RITMO DIÁRIO', 980, contentStartY + 32);
                ctx.fillStyle = '#60A5FA';
                ctx.font = '800 22px "Segoe UI", Roboto, sans-serif';
                ctx.fillText(formatMoney(mediaDiaria) + '/dia', 980, contentStartY + 70);
                ctx.fillStyle = '#F59E0B';
                ctx.font = '600 12px "Segoe UI", Roboto, sans-serif';
                ctx.fillText('Necessário: ' + formatMoney(metaDiariaNecessaria) + '/dia', 980, contentStartY + 106);

                contentStartY = 275;
                bottomBoxH = 390;
            } else {
                contentStartY = 115;
                bottomBoxH = 550;
            }

            // Determina se os blocos esquerdo e direito estão ativos
            const hasLeftBlock = chkComposicao || (isGestor && chkClasses) || chkRitmo;
            const hasRightBlock = ((isGestor && (chkEquipes || chkOperadores)) || (!isGestor && chkOperadores)) && ranking.length > 0;

            if (hasLeftBlock && hasRightBlock) {
                // Layout 2 Colunas
                renderLeftBlock(45, contentStartY, 585, bottomBoxH);
                renderRightBlock(650, contentStartY, 585, bottomBoxH);
            } else if (hasLeftBlock && !hasRightBlock) {
                // Layout 1 Coluna Larga (Esquerda)
                renderLeftBlock(45, contentStartY, 1190, bottomBoxH);
            } else if (!hasLeftBlock && hasRightBlock) {
                // Layout 1 Coluna Larga (Direita)
                renderRightBlock(45, contentStartY, 1190, bottomBoxH);
            }

            function renderLeftBlock(bx, by, bw, bh) {
                drawCard(bx, by, bw, bh, 14, 'rgba(255, 255, 255, 0.04)', 'rgba(255, 255, 255, 0.12)');
                let innerY = by + 35;

                ctx.fillStyle = '#FFFFFF';
                ctx.font = '700 16px "Segoe UI", Roboto, sans-serif';
                ctx.fillText(isGestor ? 'RAIO-X DE COMPOSIÇÃO: DIRETO VS EXTRA' : 'RAIO-X DA EQUIPE: DIRETO VS EXTRA', bx + 25, innerY);

                if (chkComposicao) {
                    innerY += 25;
                    const barW = bw - 50;
                    const wDireto = (pctDireto / 100) * barW;
                    drawCard(bx + 25, innerY, Math.max(wDireto, 6), 22, 6, '#1E6DC3', null);
                    drawCard(bx + 25 + wDireto, innerY, Math.max(barW - wDireto, 6), 22, 6, '#F59E0B', null);

                    innerY += 45;
                    ctx.fillStyle = '#60A5FA';
                    ctx.font = '700 14px "Segoe UI", Roboto, sans-serif';
                    ctx.fillText('Direto: ' + formatMoney(totalDireto) + ' (' + pctDireto.toFixed(1) + '%)', bx + 25, innerY);

                    ctx.fillStyle = '#FBBF24';
                    ctx.font = '700 14px "Segoe UI", Roboto, sans-serif';
                    ctx.fillText('Extra: ' + formatMoney(totalExtra) + ' (' + pctExtra.toFixed(1) + '%)', bx + 260, innerY);
                    innerY += 25;
                }

                if (isGestor && chkClasses && classesResumo.length > 0) {
                    innerY += 15;
                    const clsBoxH = chkRitmo ? 160 : (bh - (innerY - by) - 20);
                    drawCard(bx + 25, innerY, bw - 50, Math.max(clsBoxH, 100), 10, 'rgba(255, 255, 255, 0.05)', null);
                    ctx.fillStyle = '#E2E8F0';
                    ctx.font = '700 13px "Segoe UI", Roboto, sans-serif';
                    ctx.fillText('DESEMPENHO POR CLASSE DE OPERADORES (CANAIS)', bx + 45, innerY + 28);

                    let clsItemY = innerY + 58;
                    classesResumo.slice(0, 3).forEach((cls) => {
                        ctx.fillStyle = '#93C5FD';
                        ctx.font = '700 12px "Segoe UI", Roboto, sans-serif';
                        ctx.fillText('• ' + cls.nome.toUpperCase() + ' (' + cls.count + ' operadores):', bx + 45, clsItemY);

                        ctx.fillStyle = '#34D399';
                        ctx.font = '800 13px "Segoe UI", Roboto, sans-serif';
                        ctx.fillText(formatMoney(cls.total), bx + 250, clsItemY);

                        ctx.fillStyle = '#94A3B8';
                        ctx.font = '500 11px "Segoe UI", Roboto, sans-serif';
                        ctx.fillText('Dir: ' + formatMoney(cls.direto) + ' | Ext: ' + formatMoney(cls.extra), bx + 360, clsItemY);

                        clsItemY += 30;
                    });
                    innerY += clsBoxH;
                }

                if (chkRitmo) {
                    innerY += 15;
                    const ritmoBoxH = bh - (innerY - by) - 20;
                    if (ritmoBoxH > 60) {
                        drawCard(bx + 25, innerY, bw - 50, ritmoBoxH, 10, 'rgba(255, 255, 255, 0.05)', null);
                        ctx.fillStyle = '#E2E8F0';
                        ctx.font = '700 13px "Segoe UI", Roboto, sans-serif';
                        ctx.fillText(isGestor ? 'INDICADORES TEMPORAIS DO SETOR' : 'INDICADORES DE EXECUÇÃO TEMPORAL DA EQUIPE', bx + 45, innerY + 28);

                        ctx.fillStyle = '#94A3B8';
                        ctx.font = '600 12px "Segoe UI", Roboto, sans-serif';
                        ctx.fillText('• Dias Úteis Decorridos: ' + diasPass + ' de ' + totalDias + ' dias (' + ((diasPass/Math.max(totalDias,1))*100).toFixed(1) + '%)', bx + 45, innerY + 58);
                        ctx.fillText('• Meta Linear Esperada Hoje: ' + formatMoney((metaValor / Math.max(totalDias, 1)) * diasPass), bx + 45, innerY + 84);
                        ctx.fillText('• Saldo vs Meta Linear: ' + (totalRecebido >= (metaValor / Math.max(totalDias, 1) * diasPass) ? '+' : '') + formatMoney(totalRecebido - (metaValor / Math.max(totalDias, 1) * diasPass)), bx + 45, innerY + 110);
                    }
                }
            }

            function renderRightBlock(bx, by, bw, bh) {
                drawCard(bx, by, bw, bh, 14, 'rgba(255, 255, 255, 0.04)', 'rgba(255, 255, 255, 0.12)');
                ctx.fillStyle = '#FFFFFF';
                ctx.font = '700 16px "Segoe UI", Roboto, sans-serif';
                ctx.fillText(isGestor ? (chkEquipes ? 'RANKING DAS EQUIPES DO SETOR' : 'TOP OPERADORES DO SETOR') : 'RANKING DOS OPERADORES DA EQUIPE', bx + 25, by + 35);

                const countItems = ranking.length;
                if (countItems === 0) {
                    ctx.fillStyle = '#94A3B8';
                    ctx.font = '600 13px "Segoe UI", Roboto, sans-serif';
                    ctx.fillText('Nenhum dado selecionado para o ranking.', bx + 25, by + 80);
                    return;
                }

                const itemH = Math.min(46, Math.floor((bh - 70) / countItems) - 6);
                const itemGap = 6;
                let startRankY = by + 52;
                const posColors = ['#FEF3C7', '#E2E8F0', '#FED7AA', 'rgba(255,255,255,0.08)', 'rgba(255,255,255,0.08)', 'rgba(255,255,255,0.08)', 'rgba(255,255,255,0.08)', 'rgba(255,255,255,0.08)', 'rgba(255,255,255,0.08)', 'rgba(255,255,255,0.08)'];
                const posTextColors = ['#B45309', '#475569', '#C2410C', '#CBD5E1', '#CBD5E1', '#CBD5E1', '#CBD5E1', '#CBD5E1', '#CBD5E1', '#CBD5E1'];

                ranking.forEach((item, idx) => {
                    const curY = startRankY + idx * (itemH + itemGap);
                    drawCard(bx + 25, curY, bw - 50, itemH, 10, idx === 0 ? 'rgba(251, 191, 36, 0.08)' : 'rgba(255, 255, 255, 0.05)', idx === 0 ? 'rgba(251, 191, 36, 0.25)' : 'rgba(255, 255, 255, 0.08)');
                    drawCard(bx + 37, curY + Math.floor((itemH - 28)/2), 38, 28, 8, posColors[idx] || 'rgba(255,255,255,0.08)', null);

                    ctx.fillStyle = posTextColors[idx] || '#CBD5E1';
                    ctx.font = '800 13px "Segoe UI", Roboto, sans-serif';
                    ctx.textAlign = 'center';
                    ctx.fillText((idx + 1) + 'º', bx + 56, curY + Math.floor((itemH - 28)/2) + 19);
                    ctx.textAlign = 'left';

                    let nomeFormatado = String(item.label || 'N/A').toUpperCase();
                    ctx.fillStyle = idx === 0 ? '#FBBF24' : '#FFFFFF';
                    ctx.font = '700 14px "Segoe UI", Roboto, sans-serif';

                    const maxNameWidth = bw - 260;
                    if (ctx.measureText(nomeFormatado).width > maxNameWidth) {
                        while (ctx.measureText(nomeFormatado + '...').width > maxNameWidth && nomeFormatado.length > 0) {
                            nomeFormatado = nomeFormatado.slice(0, -1);
                        }
                        nomeFormatado += '...';
                    }
                    ctx.fillText(nomeFormatado, bx + 85, curY + Math.floor((itemH - 28)/2) + 19);

                    ctx.fillStyle = '#34D399';
                    ctx.font = '800 15px "Segoe UI", Roboto, sans-serif';
                    ctx.textAlign = 'right';
                    ctx.fillText(formatMoney(item.valor), bx + bw - 40, curY + Math.floor((itemH - 28)/2) + 20);
                    ctx.textAlign = 'left';
                });
            }

            // Rodapé
            ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
            ctx.font = '500 11px "Segoe UI", Roboto, sans-serif';
            ctx.fillText('Gerado automaticamente pelo Sistema de Gestão de Metas | Controle Receptivo', 45, 695);

            try {
                const link = document.createElement('a');
                const nomeArquivo = 'informativo_' + (isGestor ? 'setor' : 'equipe') + '_' + hojeStr.replace(/\//g, '_') + '.png';
                link.download = nomeArquivo;
                link.href = canvas.toDataURL('image/png');
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            } catch (errDownload) {
                console.warn('Erro no download:', errDownload);
            }

            showToast('Informativo baixado com sucesso!');
        };