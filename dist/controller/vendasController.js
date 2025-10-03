"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.VendasController = void 0;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const iconv_lite_1 = __importDefault(require("iconv-lite"));
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
class DatFileParser {
    constructor() {
        this.vendaCounter = 1;
    }
    parseRecord(line) {
        console.log(`\n=== Processando linha ===`);
        console.log(`Linha completa (${line.length} chars): "${line}"`);
        // Padrão: [ID_PRODUTO(4)][NOME_PRODUTO(variável)][ID_CLIENTE(4)][NOME_CLIENTE(variável)][QTD(3)][VALOR(10)][DATA(10)]
        // 1. ID do Produto (primeiros 4 caracteres)
        const idProduto = line.substring(0, 4);
        console.log(`ID Produto: "${idProduto}"`);
        // 2. Procurar o ID do Cliente (próximo número de 4 dígitos começando com 0)
        // Padrão: ID cliente sempre começa com 0 e tem 4 dígitos (0201, 0202, 0203)
        const idClienteRegex = /0\d{3}/g;
        const matches = [...line.matchAll(idClienteRegex)];
        if (matches.length === 0) {
            throw new Error('ID do cliente não encontrado');
        }
        // O primeiro match após a posição 4 é o ID do cliente
        const idClienteMatch = matches[0];
        const idClientePos = idClienteMatch.index;
        const idCliente = idClienteMatch[0];
        console.log(`ID Cliente: "${idCliente}" na posição ${idClientePos}`);
        // 3. Nome do Produto (entre posição 4 e início do ID do cliente)
        const nomeProduto = line.substring(4, idClientePos).trim();
        console.log(`Nome Produto: "${nomeProduto}"`);
        // 4. Procurar a data no final (formato: YYYY-MM-DD, últimos 10 caracteres)
        const data = line.substring(line.length - 10).trim();
        console.log(`Data: "${data}"`);
        // 5. O valor vem antes da data (10 caracteres antes da data)
        const valorInicio = line.length - 20;
        const valorFim = line.length - 10;
        const valorStr = line.substring(valorInicio, valorFim).trim();
        console.log(`Valor: "${valorStr}"`);
        // 6. A quantidade vem antes do valor (3 caracteres)
        const qtdInicio = valorInicio - 3;
        const qtdStr = line.substring(qtdInicio, valorInicio).trim();
        console.log(`Quantidade: "${qtdStr}"`);
        // 7. Nome do Cliente (entre ID do cliente + 4 e início da quantidade)
        const nomeClienteInicio = idClientePos + 4;
        const nomeClienteFim = qtdInicio;
        const nomeCliente = line.substring(nomeClienteInicio, nomeClienteFim).trim();
        console.log(`Nome Cliente: "${nomeCliente}"`);
        // Conversões
        const quantidade = parseInt(qtdStr, 10);
        const valorUnitario = parseFloat(valorStr);
        const valorTotal = parseFloat((quantidade * valorUnitario).toFixed(2));
        const clienteId = parseInt(idCliente, 10);
        console.log(`Conversões - Qtd: ${quantidade}, Valor Unit: ${valorUnitario}, Total: ${valorTotal}`);
        const venda = {
            id_venda: this.vendaCounter++,
            data_venda: data,
            quantidade: quantidade,
            produto: {
                id: parseInt(idProduto, 10),
                nome: nomeProduto,
                valor_unitario: valorUnitario
            },
            cliente: {
                id: isNaN(clienteId) ? 0 : clienteId,
                nome: nomeCliente
            },
            valor_total_venda: valorTotal
        };
        return venda;
    }
    parse(buffer) {
        const vendas = [];
        this.vendaCounter = 1;
        const fileContent = iconv_lite_1.default.decode(buffer, 'latin1');
        const lines = fileContent.split(/\r?\n/);
        console.log(`\n========================================`);
        console.log(`Total de linhas no arquivo: ${lines.length}`);
        console.log(`========================================`);
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            if (line.trim().length === 0) {
                console.log(`Linha ${i + 1}: vazia, pulando...`);
                continue;
            }
            const cleanedLine = line.replace(/\t/g, '');
            if (cleanedLine.length < 30) {
                console.warn(`Linha ${i + 1}: muito curta (${cleanedLine.length} chars), pulando...`);
                continue;
            }
            try {
                const venda = this.parseRecord(cleanedLine);
                console.log(`✓ Venda ${venda.id_venda} processada com sucesso`);
                vendas.push(venda);
            }
            catch (error) {
                console.error(`✗ Erro ao processar linha ${i + 1}:`, error);
            }
        }
        console.log(`\n========================================`);
        console.log(`Total de vendas processadas: ${vendas.length}`);
        console.log(`========================================\n`);
        return vendas;
    }
}
class VendasController {
    constructor() {
        // RF06-RF10: Endpoint GET /vendas
        this.listarVendas = async (request, response, next) => {
            try {
                // Buscar todas as vendas com relacionamentos
                const vendas = await prisma.vendas.findMany({
                    include: {
                        produtos: true,
                        cliente: true
                    },
                    orderBy: {
                        dataVenda: 'desc'
                    }
                });
                // Formatar resposta conforme RF08-RF10
                const vendasFormatadas = vendas.map((venda) => ({
                    id_venda: venda.id,
                    data_venda: venda.dataVenda.toISOString().split('T')[0], // YYYY-MM-DD
                    nome_cliente: venda.cliente.nome,
                    nome_produto: venda.produtos.nome,
                    quantidade: venda.quantidade,
                    valor_unitario: Number(venda.produtos.valorUnitario),
                    valor_total_venda: Number(venda.produtos.valorUnitario) * venda.quantidade
                }));
                return response.status(200).json(vendasFormatadas);
            }
            catch (error) {
                return next(error);
            }
        };
        // Endpoint para visualizar arquivo sem salvar
        this.index = async (request, response, next) => {
            try {
                const filename = request.query.filename || 'vendas_29-09-2025.dat';
                const filePath = path.join(process.cwd(), filename);
                if (!fs.existsSync(filePath)) {
                    return response.status(404).json({
                        error: 'Arquivo não encontrado',
                        message: `O arquivo ${filename} não foi encontrado no servidor`
                    });
                }
                const buffer = fs.readFileSync(filePath);
                const vendas = this.parser.parse(buffer);
                return response.status(200).json(vendas);
            }
            catch (error) {
                return next(error);
            }
        };
        // RF01-RF02: Upload e processamento de arquivo
        this.upload = async (request, response, next) => {
            try {
                const file = request.file;
                if (!file) {
                    return response.status(400).json({
                        error: 'Nenhum arquivo enviado',
                        message: 'Por favor, envie um arquivo .dat'
                    });
                }
                const buffer = file.buffer;
                const vendas = this.parser.parse(buffer);
                // Salvar vendas no banco de dados
                console.log('\n========================================');
                console.log('Iniciando salvamento no banco de dados...');
                console.log('========================================\n');
                const resultado = await this.salvarVendasNoBanco(vendas);
                console.log('\n========================================');
                console.log('Resumo do processamento:');
                console.log(`Produtos criados: ${resultado.produtos_criados}`);
                console.log(`Produtos existentes: ${resultado.produtos_existentes}`);
                console.log(`Clientes criados: ${resultado.clientes_criados}`);
                console.log(`Clientes existentes: ${resultado.clientes_existentes}`);
                console.log(`Vendas criadas: ${resultado.vendas_criadas}`);
                console.log(`Erros: ${resultado.erros.length}`);
                console.log('========================================\n');
                return response.status(200).json({
                    message: 'Arquivo processado e vendas salvas com sucesso',
                    vendas_processadas: vendas.length,
                    resultado: resultado,
                    vendas: vendas
                });
            }
            catch (error) {
                return next(error);
            }
        };
        // Processar arquivo do servidor
        this.processar = async (request, response, next) => {
            try {
                const filename = request.query.filename || 'vendas_29-09-2025.dat';
                const filePath = path.join(process.cwd(), filename);
                if (!fs.existsSync(filePath)) {
                    return response.status(404).json({
                        error: 'Arquivo não encontrado'
                    });
                }
                const buffer = fs.readFileSync(filePath);
                const vendas = this.parser.parse(buffer);
                // Salvar vendas no banco de dados
                console.log('\n========================================');
                console.log('Iniciando processamento e salvamento...');
                console.log('========================================\n');
                const resultado = await this.salvarVendasNoBanco(vendas);
                console.log('\n========================================');
                console.log('Processamento concluído!');
                console.log('========================================\n');
                return response.status(200).json({
                    message: 'Vendas processadas e salvas com sucesso',
                    total: vendas.length,
                    resultado: resultado,
                    vendas: vendas
                });
            }
            catch (error) {
                return next(error);
            }
        };
        this.parser = new DatFileParser();
    }
    // Método auxiliar para salvar vendas no banco (RF03-RF05)
    async salvarVendasNoBanco(vendas) {
        const resultado = {
            produtos_criados: 0,
            produtos_existentes: 0,
            clientes_criados: 0,
            clientes_existentes: 0,
            vendas_criadas: 0,
            erros: []
        };
        for (const venda of vendas) {
            try {
                // RF04: Inteligência de Importação (Produto)
                let produto = await prisma.produtos.findUnique({
                    where: { id: venda.produto.id }
                });
                if (!produto) {
                    produto = await prisma.produtos.create({
                        data: {
                            id: venda.produto.id,
                            nome: venda.produto.nome,
                            valorUnitario: venda.produto.valor_unitario
                        }
                    });
                    resultado.produtos_criados++;
                    console.log(`✓ Produto criado: ${produto.nome}`);
                }
                else {
                    resultado.produtos_existentes++;
                    console.log(`→ Produto já existe: ${produto.nome}`);
                }
                // RF05: Inteligência de Importação (Cliente)
                let cliente = await prisma.clientes.findUnique({
                    where: { id: venda.cliente.id }
                });
                if (!cliente) {
                    cliente = await prisma.clientes.create({
                        data: {
                            id: venda.cliente.id,
                            nome: venda.cliente.nome
                        }
                    });
                    resultado.clientes_criados++;
                    console.log(`✓ Cliente criado: ${cliente.nome}`);
                }
                else {
                    resultado.clientes_existentes++;
                    console.log(`→ Cliente já existe: ${cliente.nome}`);
                }
                // RF03: Persistência de Vendas
                const vendaCriada = await prisma.vendas.create({
                    data: {
                        produtosId: produto.id,
                        clienteId: cliente.id,
                        quantidade: venda.quantidade,
                        dataVenda: new Date(venda.data_venda)
                    }
                });
                resultado.vendas_criadas++;
                console.log(`✓ Venda #${vendaCriada.id} criada`);
            }
            catch (error) {
                const mensagemErro = `Erro ao processar venda ${venda.id_venda}: ${error.message}`;
                resultado.erros.push(mensagemErro);
                console.error(`✗ ${mensagemErro}`);
            }
        }
        return resultado;
    }
}
exports.VendasController = VendasController;
//# sourceMappingURL=vendasController.js.map