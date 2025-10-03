import { Request, Response, NextFunction } from "express";
import * as fs from 'fs';
import * as path from 'path';
import iconv from 'iconv-lite';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface Produto {
    id: number;
    nome: string;
    valor_unitario: number;
}

export interface Cliente {
    id: number;
    nome: string;
}

export interface Venda {
    id_venda: number;
    data_venda: string;
    quantidade: number;
    produto: Produto;
    cliente: Cliente;
    valor_total_venda: number;
}

class DatFileParser {
    private vendaCounter = 1;

    private parseRecord(line: string): Venda {
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
        const idClientePos = idClienteMatch.index!;
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

        const venda: Venda = {
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

    parse(buffer: Buffer): Venda[] {
        const vendas: Venda[] = [];
        this.vendaCounter = 1;

        const fileContent = iconv.decode(buffer, 'win1252');
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
            } catch (error) {
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
    private parser: DatFileParser;

    constructor() {
        this.parser = new DatFileParser();
    }

    // 🚀 MÉTODO AUXILIAR: Salvar o registro do arquivo no histórico
    private async salvarArquivoHistorico(filename: string) {
        // Extrai a data do arquivo (assumindo o formato 'vendas_DD-MM-YYYY.dat' ou similar)
        const match = filename.match(/vendas_(\d{2}-\d{2}-\d{4})\.dat/);
        
        // Se a data não puder ser extraída do nome do arquivo, usa a data atual
        const dateVenda = match 
            ? new Date(`${match[1].substring(6, 10)}-${match[1].substring(3, 5)}-${match[1].substring(0, 2)}T00:00:00.000Z`)
            : new Date(); 

        try {
            await (prisma as any).arquivoHistorico.upsert({
                where: { nomeArquivo: filename },
                update: { dataProcessamento: new Date() },
                create: {
                    nomeArquivo: filename,
                    dataVenda: dateVenda
                }
            });
            console.log(`✓ Arquivo ${filename} registrado/atualizado no histórico.`);
        } catch (error) {
            console.error(`✗ Erro ao salvar histórico do arquivo ${filename}:`, error);
        }
    }

    // 🚀 MÉTODO AUXILIAR: Listar Vendas por data (Usado pelo 'processar')
    private async listarVendasPorData(dataFiltro: string) {
        // dataFiltro deve estar no formato YYYY-MM-DD
        const dataInicio = new Date(`${dataFiltro}T00:00:00.000Z`);
        const dataFim = new Date(`${dataFiltro}T23:59:59.999Z`);

        // Busca no banco de dados as vendas dentro do intervalo de um dia
        const vendas = await prisma.vendas.findMany({
            where: {
                dataVenda: {
                    gte: dataInicio,
                    lte: dataFim,
                },
            },
            include: {
                produtos: true,
                cliente: true
            }
        });

        // Formata a resposta para o frontend
        return vendas.map((venda: any) => ({
            id_venda: venda.id,
            data_venda: venda.dataVenda.toISOString().split('T')[0],
            quantidade: venda.quantidade,
            valor_total_venda: Number(venda.produtos.valorUnitario) * venda.quantidade,
            produto: {
                id: venda.produtos.id,
                nome: venda.produtos.nome,
                valor_unitario: Number(venda.produtos.valorUnitario)
            },
            cliente: {
                id: venda.cliente.id,
                nome: venda.cliente.nome
            }
        }));
    }

    // 🚀 ENDPOINT: Listar Arquivos no Histórico
    listarHistorico = async (request: Request, response: Response, next: NextFunction) => {
        try {
            const arquivos = await (prisma as any).arquivoHistorico.findMany({
                orderBy: {
                    dataVenda: 'desc' // Ordena pela data mais recente
                }
            });

            // Formata a resposta para o frontend
            const historicoFormatado = arquivos.map((a: any) => {
                const dataExibicao = a.dataVenda.toLocaleDateString('pt-BR', {timeZone: 'UTC'}); 
                return {
                    filename: a.nomeArquivo,
                    data_exibicao: dataExibicao,
                    data_processamento: a.dataProcessamento,
                };
            });

            return response.status(200).json({ historico: historicoFormatado });
        } catch (error) {
            console.error('Erro no listarHistorico:', error);
            return next(error);
        }
    }

    // RF06-RF10: Endpoint GET /vendas (Lista todas as vendas do banco)
    listarVendas = async (request: Request, response: Response, next: NextFunction) => {
        try {
            const vendas = await prisma.vendas.findMany({
                include: {
                    produtos: true,
                    cliente: true
                },
                orderBy: {
                    dataVenda: 'desc'
                }
            });

            const vendasFormatadas = vendas.map((venda: any) => ({
                id_venda: venda.id,
                data_venda: venda.dataVenda.toISOString().split('T')[0], // YYYY-MM-DD
                nome_cliente: venda.cliente.nome,
                nome_produto: venda.produtos.nome,
                quantidade: venda.quantidade,
                valor_unitario: Number(venda.produtos.valorUnitario),
                valor_total_venda: Number(venda.produtos.valorUnitario) * venda.quantidade
            }));

            return response.status(200).json(vendasFormatadas);
        } catch (error) {
            return next(error);
        }
    }

    // Método auxiliar para salvar vendas no banco (RF03-RF05)
    private async salvarVendasNoBanco(vendas: Venda[]) {
        const resultado = {
            produtos_criados: 0,
            produtos_existentes: 0,
            clientes_criados: 0,
            clientes_existentes: 0,
            vendas_criadas: 0,
            erros: [] as string[]
        };

        for (const venda of vendas) {
            try {
                // ... (Lógica de upsert de Produto e Cliente, inalterada)
                let produto = await prisma.produtos.findUnique({ where: { id: venda.produto.id } });
                if (!produto) {
                    produto = await prisma.produtos.create({ data: { id: venda.produto.id, nome: venda.produto.nome, valorUnitario: venda.produto.valor_unitario } });
                    resultado.produtos_criados++;
                } else { resultado.produtos_existentes++; }

                let cliente = await prisma.clientes.findUnique({ where: { id: venda.cliente.id } });
                if (!cliente) {
                    cliente = await prisma.clientes.create({ data: { id: venda.cliente.id, nome: venda.cliente.nome } });
                    resultado.clientes_criados++;
                } else { resultado.clientes_existentes++; }
                
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

            } catch (error: any) {
                const mensagemErro = `Erro ao processar venda ${venda.id_venda}: ${error.message}`;
                resultado.erros.push(mensagemErro);
                console.error(`✗ ${mensagemErro}`);
            }
        }
        return resultado;
    }

    // RF01-RF02: Upload e processamento de arquivo
    upload = async (request: Request, response: Response, next: NextFunction) => {
        try {
            const file = (request as any).file;
            if (!file) { return response.status(400).json({ error: 'Nenhum arquivo enviado', message: 'Por favor, envie um arquivo .dat' }); }

            const buffer = file.buffer;
            const vendas = this.parser.parse(buffer);

            const resultado = await this.salvarVendasNoBanco(vendas);
            await this.salvarArquivoHistorico(file.originalname);

            return response.status(200).json({
                message: 'Arquivo processado e vendas salvas com sucesso',
                vendas_processadas: vendas.length,
                resultado: resultado,
                vendas: vendas,
                filename: file.originalname
            });
        } catch (error) {
            return next(error);
        }
    }

    // 🛑 MÉTODO processar CORRIGIDO PARA CARREGAR DO BANCO
    processar = async (request: Request, response: Response, next: NextFunction) => {
        try {
            const filename = request.query.filename as string;

            if (!filename) {
                // Se nenhum filename for fornecido, retorna 400 ou carrega o default (opção de design)
                return response.status(400).json({ error: 'Nome do arquivo não fornecido.' });
            }
            
            // 1. Extrai a data do filename (ex: 'vendas_29-09-2025.dat' -> '2025-09-29')
            const match = filename.match(/vendas_(\d{2}-\d{2}-\d{4})\.dat/);
            
            if (!match) {
                 return response.status(400).json({ error: 'Formato de nome de arquivo inválido. Esperado: vendas_DD-MM-YYYY.dat' });
            }

            const [_, datePart] = match; // datePart = DD-MM-YYYY
            const [day, month, year] = datePart.split('-');
            const dataFiltro = `${year}-${month}-${day}`; // dataFiltro = YYYY-MM-DD

            // 2. Busca os dados DIRETAMENTE do banco
            const vendas = await this.listarVendasPorData(dataFiltro);

            if (vendas.length === 0) {
                 return response.status(200).json({ message: `Nenhuma venda encontrada para a data ${dataFiltro}`, vendas: [] });
            }

            // 3. Opcional: Registra o arquivo no histórico (garantia)
            await this.salvarArquivoHistorico(filename); 

            // 4. Retorna as vendas formatadas (sem tentar ler o arquivo do disco)
            return response.status(200).json({
                message: 'Vendas carregadas do banco de dados com sucesso',
                total: vendas.length,
                vendas: vendas
            });
        } catch (error) {
            console.error("Erro no processar (carregamento do histórico):", error);
            // Retorna 500 para o frontend exibir a mensagem de erro
            return response.status(500).json({ error: 'Erro interno do servidor ao carregar dados.' }); 
        }
    }

    // Endpoint para visualizar arquivo sem salvar (Mantido, mas raramente usado após a correção)
    index = async (request: Request, response: Response, next: NextFunction) => {
        try {
            const filename = request.query.filename as string || 'vendas_29-09-2025.dat';
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
        } catch (error) {
            return next(error);
        }
    }
}

export { VendasController };