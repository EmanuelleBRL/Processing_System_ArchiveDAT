// Aguarda o carregamento completo do HTML para executar o script
document.addEventListener('DOMContentLoaded', () => {
    // ⚠️ IMPORTANTE: Escolha apenas UMA das opções abaixo:
    
    // OPÇÃO 1: Para testar LOCALMENTE (backend rodando na sua máquina)
    const API_URL = 'processingsystemarchivedat-production.up.railway.app';
    
    // OPÇÃO 2: Para usar o backend no RAILWAY (comente a linha acima e descomente esta)
    // const API_URL = 'https://processingsystemarchivedat-production.up.railway.app';

    const defaultFilename = 'vendas_29-09-2025.dat';
    const dashContainer = document.querySelector('.dash_container');
    const historyListElement = document.getElementById('history-list');

    let currentLoadedFilename = defaultFilename;

    // HTML de base do dashboard para ser recriado após estados de erro/vazio
    const BASE_DASHBOARD_STRUCTURE = `
        <h1 id="dashboard-title">Dashboard - Carregando...</h1>
        <div class="kpi-grid">
            <div class="card kpi-card">
                <p class="kpi-title">Faturamento Total</p>
                <p class="kpi-value" id="kpi-faturamento">R$0,00</p>
            </div>
            <div class="card kpi-card">
                <p class="kpi-title">Ticket Médio</p>
                <p class="kpi-value" id="kpi-ticket-medio">R$0,00</p>
            </div>
            <div class="card kpi-card">
                <p class="kpi-title">Itens Vendidos</p>
                <p class="kpi-value" id="kpi-itens-vendidos">0</p>
            </div>
            <div class="card kpi-card">
                <p class="kpi-title">Clientes Atendidos</p>
                <p class="kpi-value" id="kpi-clientes-atendidos">0</p>
            </div>
        </div>
        <div class="card-row">
            <div class="card info-card">
                <h2>Mais Vendidos (por Faturamento):</h2>
                <ul id="ranking-faturamento"></ul>
            </div>
            <div class="card info-card">
                <h2>Campeões de Volume (por Unidades)</h2>
                <ul id="ranking-volume"></ul>
            </div>
        </div>
        <div class="dashboard-section">
            <h2>Campeões de Compra do Dia</h2>
            <div class="card-row three-cols" id="campeoes-compra"></div>
        </div>
        <div class="card info-card">
            <h2>Feed de Vendas</h2>
            <ul class="feed-list" id="feed-vendas"></ul>
        </div>
    `;

    // Função auxiliar para formatar valores monetários
    function formatCurrency(value) {
        return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    }

    // --- Funções de Estado e Utilitários ---
    function showEmptyState() {
        if (dashContainer) {
            dashContainer.innerHTML = '<h1>Nenhum dado de venda encontrado para este dia.</h1>';
        }
    }

    function showErrorState() {
        if (dashContainer) {
            dashContainer.innerHTML = '<h1>Ocorreu um erro ao carregar os dados. Verifique o backend e tente novamente.</h1>';
        }
    }
    
    function updateHistoryActiveClass(activeFilename) {
        if (!historyListElement) return;

        historyListElement.querySelectorAll('.archive').forEach(el => {
            el.classList.remove('archive_active');
        });

        const activeItem = historyListElement.querySelector(`[data-filename="${activeFilename}"]`);
        if (activeItem) {
            activeItem.classList.add('archive_active');
        }
    }

    // --- Funções de Renderização de Dados ---

    function updateKPIs(kpis) {
        if(document.getElementById('kpi-faturamento')) document.getElementById('kpi-faturamento').textContent = formatCurrency(kpis.faturamentoTotal);
        if(document.getElementById('kpi-ticket-medio')) document.getElementById('kpi-ticket-medio').textContent = formatCurrency(kpis.ticketMedio);
        if(document.getElementById('kpi-itens-vendidos')) document.getElementById('kpi-itens-vendidos').textContent = kpis.itensVendidos;
        if(document.getElementById('kpi-clientes-atendidos')) document.getElementById('kpi-clientes-atendidos').textContent = kpis.clientesAtendidos;
    }

    function renderRankingFaturamento(vendas) {
        const ranking = {};
        vendas.forEach(venda => {
            const nome = venda.produto.nome;
            ranking[nome] = (ranking[nome] || 0) + venda.valor_total_venda;
        });
        const sorted = Object.entries(ranking).sort(([,a],[,b]) => b - a).slice(0, 3);
        const listElement = document.getElementById('ranking-faturamento');
        if (listElement) {
            listElement.innerHTML = sorted.map((item, index) => 
                `<li>${index + 1} - ${item[0]} (${formatCurrency(item[1])})</li>`
            ).join('');
        }
    }

    function renderRankingVolume(vendas) {
        const ranking = {};
        vendas.forEach(venda => {
            const nome = venda.produto.nome;
            ranking[nome] = (ranking[nome] || 0) + venda.quantidade;
        });
        const sorted = Object.entries(ranking).sort(([,a],[,b]) => b - a).slice(0, 3);
        const listElement = document.getElementById('ranking-volume');
        if (listElement) {
            listElement.innerHTML = sorted.map((item, index) => 
                `<li>${index + 1} - ${item[0]} (${item[1]} Un)</li>`
            ).join('');
        }
    }

    function renderCampeoesCompra(vendas) {
        const clientes = {};
        vendas.forEach(venda => {
            const id = venda.cliente.id;
            if (!clientes[id]) {
                clientes[id] = { nome: venda.cliente.nome, gasto: 0, compras: 0, itens: 0 };
            }
            clientes[id].gasto += venda.valor_total_venda;
            clientes[id].compras += 1;
            clientes[id].itens += venda.quantidade;
        });
        const sorted = Object.values(clientes).sort((a, b) => b.gasto - a.gasto).slice(0, 3);
        const container = document.getElementById('campeoes-compra');
        if (container) {
            container.innerHTML = sorted.map(cliente => `
                <div class="card champion-card">
                    <h3>${cliente.nome}</h3>
                    <p>Gastou: ${formatCurrency(cliente.gasto)}</p>
                    <p>Fez ${cliente.compras} compras (${cliente.itens} itens no total)</p>
                </div>
            `).join('');
        }
    }

    function renderFeedVendas(vendas) {
        const listElement = document.getElementById('feed-vendas');
        if (listElement) {
            listElement.innerHTML = [...vendas].reverse().map(venda => 
                `<li>${venda.cliente.nome} comprou ${venda.quantidade}x ${venda.produto.nome}.</li>`
            ).join('');
        }
    }


    function processAndRenderData(vendas, filename) {
        // 🛑 GARANTIA: Restaura a estrutura completa se o dashboard estiver vazio ou em erro
        const currentTitleElement = document.getElementById('dashboard-title');
        if (!currentTitleElement || dashContainer.innerHTML.includes('Erro ao carregar os dados') || dashContainer.innerHTML.includes('Nenhum dado')) {
             dashContainer.innerHTML = BASE_DASHBOARD_STRUCTURE;
        }

        currentLoadedFilename = filename; 

        // --- 1. Cálculos dos KPIs ---
        const faturamentoTotal = vendas.reduce((sum, v) => sum + v.valor_total_venda, 0);
        const itensVendidos = vendas.reduce((sum, v) => sum + v.quantidade, 0);
        const clientesAtendidos = new Set(vendas.map(v => v.cliente.id)).size;
        const ticketMedio = vendas.length > 0 ? faturamentoTotal / vendas.length : 0;

        // --- 2. Renderização dos KPIs e Listas ---
        updateKPIs({ faturamentoTotal, ticketMedio, itensVendidos, clientesAtendidos });
        renderRankingFaturamento(vendas);
        renderRankingVolume(vendas);
        renderCampeoesCompra(vendas);
        renderFeedVendas(vendas);

        // Atualiza o título e a classe ativa do histórico
        const titleElement = document.getElementById('dashboard-title');
        if (titleElement) {
            const datePart = filename.replace('vendas_', '').replace('.dat', '').replace(/-/g, '/');
            titleElement.textContent = `Dashboard - ${datePart}`; 
            updateHistoryActiveClass(filename);
        }
    }
    
    // --- FUNÇÕES DE API E HISTÓRICO ---

    // Função principal: Carrega o dashboard
    async function loadDashboardData(filename) {
        try {
            const url = new URL(`${API_URL}/vendas/processar`);
            url.searchParams.append('filename', filename);

            const response = await fetch(url);

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || `Erro na API: ${response.statusText}`);
            }

            const data = await response.json();
            
            if (data.vendas && data.vendas.length > 0) {
                processAndRenderData(data.vendas, filename);
            } else {
                showEmptyState();
            }

        } catch (error) {
            console.error("Falha ao buscar dados (Carregamento):", error);
            showErrorState();
        }
    }
    
    // Renderiza o histórico (popula a barra lateral)
    function renderHistory(historyData) {
        if (!historyListElement) return;

        historyListElement.innerHTML = ''; 

        historyData.forEach((item) => {
            const div = document.createElement('div');
            div.setAttribute('data-filename', item.filename); 
            div.classList.add('archive');
            
            if (item.filename === currentLoadedFilename) {
                 div.classList.add('archive_active');
            }

            // Usando o ícone original ou placeholder, garantindo a estrutura
            div.innerHTML = `
                <p>${item.data_exibicao}</p> 
                <p>􀩚</p> 
            `;
            
            // Adiciona o listener para carregar os dados
            div.addEventListener('click', () => {
                loadDashboardData(item.filename);
            });

            historyListElement.appendChild(div);
        });
    }

    // Busca a lista de histórico no backend
    async function loadHistory() {
        try {
            const response = await fetch(`${API_URL}/vendas/historico`);

            if (!response.ok) {
                 console.error('Erro ao buscar histórico:', response.statusText);
                 // Continua mesmo com erro, para não travar o dashboard
                 return; 
            }

            const data = await response.json();
            if (data.historico && data.historico.length > 0) {
                renderHistory(data.historico);
            } else {
                if(historyListElement) historyListElement.innerHTML = '<p>Nenhum arquivo enviado.</p>';
            }

        } catch (error) {
            console.error("Falha ao carregar histórico:", error);
        }
    }

    // --- Lógica de Upload ---
    const fileInput = document.querySelector('.upload_button');

    fileInput.addEventListener('change', async (event) => {
        const file = event.target.files[0];
        if (!file) { return; }
        
        if (!file.name.endsWith('.dat')) { alert('Por favor, selecione um arquivo .dat'); fileInput.value = ''; return; }
        const formData = new FormData();
        formData.append('file', file);
        fileInput.disabled = true;

        try {
            const response = await fetch(`${API_URL}/vendas/upload`, {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || `Erro HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            alert('Arquivo enviado com sucesso!');

            if (data.vendas && data.vendas.length > 0) {
                const uploadedFilename = data.filename || file.name;
                
                // 1. Processa e renderiza os dados
                processAndRenderData(data.vendas, uploadedFilename); 
                
                // 2. ATUALIZA A LISTA DE HISTÓRICO
                await loadHistory(); 
            } else {
                showEmptyState();
            }

        } catch (error) {
            console.error("Falha no upload:", error);
            alert(`Erro no upload: ${error.message}`);
        } finally {
            fileInput.disabled = false;
            fileInput.value = '';
        }
    });

    // --- INÍCIO DA APLICAÇÃO ---
    // 1. Carrega o histórico de arquivos
    loadHistory();

    // 2. Carrega os dados do dashboard inicial
    loadDashboardData(defaultFilename);
});