// Aguarda o carregamento completo do HTML para executar o script
document.addEventListener('DOMContentLoaded', () => {
    // URL da sua API. Altere se for diferente.
    const API_URL = 'http://processingsystemarchivedat-production.up.railway.app'; // <-- URL ATUALIZADA

    const defaultFilename = 'vendas_29-09-2025.dat';

    // Função principal para buscar dados e renderizar o dashboard
    async function loadDashboardData(filename) {
        try {
            // Constrói a URL com o nome do arquivo (se fornecido)
            const url = new URL(`${API_URL}/vendas/processar`);
            if (filename) {
                url.searchParams.append('filename', filename);
            }

            const response = await fetch(url);

            if (!response.ok) {
                throw new Error(`Erro na API: ${response.statusText}`);
            }

            const data = await response.json();
            
            if (data.vendas && data.vendas.length > 0) {
                processAndRenderData(data.vendas);
            } else {
                showEmptyState();
            }

        } catch (error) {
            console.error("Falha ao buscar dados:", error);
            showErrorState();
        }
    }

    // Função para processar os dados e chamar as funções de renderização
    function processAndRenderData(vendas) {
        // --- 1. Cálculos dos KPIs ---
        const faturamentoTotal = vendas.reduce((sum, v) => sum + v.valor_total_venda, 0);
        const itensVendidos = vendas.reduce((sum, v) => sum + v.quantidade, 0);
        const clientesAtendidos = new Set(vendas.map(v => v.cliente.id)).size;
        const ticketMedio = faturamentoTotal / vendas.length;

        // --- 2. Renderização dos KPIs ---
        updateKPIs({ faturamentoTotal, ticketMedio, itensVendidos, clientesAtendidos });

        // --- 3. Cálculos e Renderização dos Rankings ---
        renderRankingFaturamento(vendas);
        renderRankingVolume(vendas);
        renderCampeoesCompra(vendas);
        
        // --- 4. Renderização do Feed de Vendas ---
        renderFeedVendas(vendas);
    }

    // Funções de atualização do DOM
    function updateKPIs(kpis) {
        document.getElementById('kpi-faturamento').textContent = formatCurrency(kpis.faturamentoTotal);
        document.getElementById('kpi-ticket-medio').textContent = formatCurrency(kpis.ticketMedio);
        document.getElementById('kpi-itens-vendidos').textContent = kpis.itensVendidos;
        document.getElementById('kpi-clientes-atendidos').textContent = kpis.clientesAtendidos;
    }

    function renderRankingFaturamento(vendas) {
        const ranking = {};
        vendas.forEach(venda => {
            const nome = venda.produto.nome;
            ranking[nome] = (ranking[nome] || 0) + venda.valor_total_venda;
        });

        const sorted = Object.entries(ranking).sort(([,a],[,b]) => b - a).slice(0, 3);
        
        const listElement = document.getElementById('ranking-faturamento');
        listElement.innerHTML = sorted.map((item, index) => `<li>${index + 1} - ${item[0]} (${formatCurrency(item[1])})</li>`).join('');
    }

    function renderRankingVolume(vendas) {
        const ranking = {};
        vendas.forEach(venda => {
            const nome = venda.produto.nome;
            ranking[nome] = (ranking[nome] || 0) + venda.quantidade;
        });

        const sorted = Object.entries(ranking).sort(([,a],[,b]) => b - a).slice(0, 3);
        
        const listElement = document.getElementById('ranking-volume');
        listElement.innerHTML = sorted.map((item, index) => `<li>${index + 1} - ${item[0]} (${item[1]} Un)</li>`).join('');
    }

    function renderCampeoesCompra(vendas) {
        const clientes = {};
        vendas.forEach(venda => {
            const id = venda.cliente.id;
            if (!clientes[id]) {
                clientes[id] = {
                    nome: venda.cliente.nome,
                    gasto: 0,
                    compras: 0,
                    itens: 0
                };
            }
            clientes[id].gasto += venda.valor_total_venda;
            clientes[id].compras += 1;
            clientes[id].itens += venda.quantidade;
        });

        const sorted = Object.values(clientes).sort((a, b) => b.gasto - a.gasto).slice(0, 3);

        const container = document.getElementById('campeoes-compra');
        container.innerHTML = sorted.map(cliente => `
            <div class="card champion-card">
                <h3>${cliente.nome}</h3>
                <p>Gastou: ${formatCurrency(cliente.gasto)}</p>
                <p>Fez ${cliente.compras} compras (${cliente.itens} itens no total)</p>
            </div>
        `).join('');
    }

    function renderFeedVendas(vendas) {
        const listElement = document.getElementById('feed-vendas');
        // Inverte a lista para mostrar as vendas mais recentes (últimas do arquivo) primeiro
        listElement.innerHTML = [...vendas].reverse().map(venda => 
            `<li>${venda.cliente.nome} comprou ${venda.quantidade}x ${venda.produto.nome}.</li>`
        ).join('');
    }

    // Funções para estados de erro e vazio
    function showEmptyState() {
        document.querySelector('.dash_container').innerHTML = '<h1>Nenhum dado de venda encontrado para este dia.</h1>';
    }

    function showErrorState() {
        document.querySelector('.dash_container').innerHTML = '<h1>Ocorreu um erro ao carregar os dados. Verifique o backend e tente novamente.</h1>';
    }

    // Função auxiliar para formatar valores monetários
    function formatCurrency(value) {
        return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    }

    // --- Inicia o carregamento dos dados ---
    loadDashboardData(defaultFilename);

    // --- Lógica de Upload ---
    const fileInput = document.querySelector('.upload_button');

    fileInput.addEventListener('change', async (event) => {
        const file = event.target.files[0];
        if (!file) {
            return;
        }

        // Validação do tipo de arquivo (opcional, o backend já faz isso)
        if (!file.name.endsWith('.dat')) {
            alert('Por favor, selecione um arquivo .dat');
            return;
        }

        const formData = new FormData();
        formData.append('file', file);

        // Mostra um estado de "carregando"
        fileInput.classList.add('uploading');

        try {
            const response = await fetch(`${API_URL}/vendas/upload`, {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Erro ao fazer upload do arquivo.');
            }

            // Sucesso no upload
            alert('Arquivo enviado com sucesso!');

            // A rota de upload já processa e retorna os dados, então podemos usá-los diretamente
            const data = await response.json();
            if (data.vendas && data.vendas.length > 0) {
                document.getElementById('dashboard-title').textContent = `Dashboard - ${file.name.replace('vendas_', '').replace('.dat', '')}`;
                processAndRenderData(data.vendas);
            } else {
                showEmptyState();
            }

        } catch (error) {
            console.error("Falha no upload:", error);
            alert(`Erro no upload: ${error.message}`);
        } finally {
            // Remove o estado de "carregando"
            fileInput.classList.remove('uploading');
            // Limpa o valor do input para permitir o upload do mesmo arquivo novamente
            fileInput.value = '';
        }
    });
});