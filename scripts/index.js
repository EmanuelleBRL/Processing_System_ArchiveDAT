document.getElementById('uploadForm').addEventListener('submit', async function(event) {
    event.preventDefault();

    const fileInput = document.getElementById('fileInput');
    const file = fileInput.files[0];
    const resultDiv = document.getElementById('result');

    if (!file) {
        alert('Por favor, selecione um arquivo.');
        return;
    }

    const formData = new FormData();
    formData.append('file', file);

    resultDiv.innerHTML = '<p>Enviando e processando o arquivo...</p>';

    try {
        const response = await fetch('processingsystemarchivedat-production.up.railway.app', {
            method: 'POST',
            body: formData
        });

        if (response.ok) {
            const vendas = await response.json();
            displayVendas(vendas);
        } else {
            const error = await response.json();
            resultDiv.innerHTML = '';
            alert(`Erro: ${error.message || 'Ocorreu um erro no servidor.'}`);
        }
    } catch (error) {
        console.error('Erro ao enviar o arquivo:', error);
        resultDiv.innerHTML = '';
        alert('Erro de conexão. Verifique se o backend está rodando.');
    }
});

function displayVendas(vendas) {
    const resultDiv = document.getElementById('result');

    if (!vendas || vendas.length === 0) {
        alert('Nenhuma venda encontrada no arquivo.');
        resultDiv.innerHTML = '<p>Aguardando o envio de um novo arquivo...</p>';
        return;
    }

    let table = '<table>';
    table += `
        <thead>
            <tr>
                <th>ID Venda</th>
                <th>Data</th>
                <th>Cliente</th>
                <th>Produto</th>
                <th>Qtd.</th>
                <th>Valor Unit.</th>
                <th>Valor Total</th>
            </tr>
        </thead>
    `;
    table += '<tbody>';
    vendas.forEach(venda => {
        table += `
            <tr>
                <td>${venda.id_venda}</td>
                <td>${venda.data_venda}</td>
                <td>${venda.cliente.nome} (ID: ${venda.cliente.id})</td>
                <td>${venda.produto.nome} (ID: ${venda.produto.id})</td>
                <td>${venda.quantidade}</td>
                <td>R$ ${venda.produto.valor_unitario.toFixed(2)}</td>
                <td>R$ ${venda.valor_total_venda.toFixed(2)}</td>
            </tr>
        `;
    });
    table += '</tbody></table>';

    resultDiv.innerHTML = table;
}

