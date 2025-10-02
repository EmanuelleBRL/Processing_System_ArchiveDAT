import { Request, Response, NextFunction } from "express";
import * as fs from 'fs';
import * as path from 'path';

// --- CORREÇÃO 3: Exportando as interfaces para uso externo ---
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
// -----------------------------------------------------------

class DatFileParser {
  // --- CORREÇÃO 1: Posições ajustadas e validadas ---
  private readonly fieldPositions = {
    // Campo        | Início (0-based) | Comprimento | Termina em (Exclusivo) | Posições do Arquivo (1-based)
    codigoProduto: { start: 0, length: 4 },      // 0 + 4 = 4             // Posição 1-4
    nomeProduto: { start: 4, length: 50 },       // 4 + 50 = 54           // Posição 5-54
    codigoCliente: { start: 54, length: 4 },     // 54 + 4 = 58           // Posição 55-58  <--- ID do Cliente (ex: 0201)
    nomeCliente: { start: 58, length: 50 },      // 58 + 50 = 108         // Posição 59-108 <--- Nome do Cliente
    quantidade: { start: 108, length: 3 },       // 108 + 3 = 111         // Posição 109-111
    valorUnitario: { start: 111, length: 10 },   // 111 + 10 = 121        // Posição 112-121
    data: { start: 121, length: 10 }             // 121 + 10 = 131        // Posição 122-131
  };
  // --------------------------------------------------

  private vendaCounter = 1;

  private extractField(buffer: Buffer, start: number, length: number): string {
    const slice = buffer.slice(start, start + length);
    return slice.toString('utf8').trim();
  }

  private parseRecord(lineBuffer: Buffer): Venda {
    const codigoProduto = this.extractField(lineBuffer, this.fieldPositions.codigoProduto.start, this.fieldPositions.codigoProduto.length);
    const nomeProduto = this.extractField(lineBuffer, this.fieldPositions.nomeProduto.start, this.fieldPositions.nomeProduto.length);
    const codigoCliente = this.extractField(lineBuffer, this.fieldPositions.codigoCliente.start, this.fieldPositions.codigoCliente.length);
    const nomeCliente = this.extractField(lineBuffer, this.fieldPositions.nomeCliente.start, this.fieldPositions.nomeCliente.length);
    
    // Debug: Log do que foi extraído
    console.log('Código Cliente extraído:', `"${codigoCliente}"`, 'Length:', codigoCliente.length);
    
    // O valor unitário pode vir com vírgula ou zeros extras. O .replace é uma precaução.
    const quantidadeStr = this.extractField(lineBuffer, this.fieldPositions.quantidade.start, this.fieldPositions.quantidade.length);
    const valorUnitarioStr = this.extractField(lineBuffer, this.fieldPositions.valorUnitario.start, this.fieldPositions.valorUnitario.length).replace(',', '.');
    const data = this.extractField(lineBuffer, this.fieldPositions.data.start, this.fieldPositions.data.length);

    // Conversões
    const quantidade = parseInt(quantidadeStr, 10);
    const valorUnitario = parseFloat(valorUnitarioStr);
    const valorTotal = parseFloat((quantidade * valorUnitario).toFixed(2));

    // Parse do ID do cliente com validação
    const clienteId = parseInt(codigoCliente, 10);
    console.log('Cliente ID parseado:', clienteId, 'isNaN:', isNaN(clienteId));
    
    const venda: Venda = {
      id_venda: this.vendaCounter++,
      data_venda: data,
      quantidade: quantidade,
      produto: {
        id: parseInt(codigoProduto, 10),
        nome: nomeProduto,
        valor_unitario: valorUnitario
      },
      cliente: {
        id: isNaN(clienteId) ? 0 : clienteId, // Proteção contra NaN
        nome: nomeCliente
      },
      valor_total_venda: valorTotal
    };

    return venda;
  }

  parse(buffer: Buffer): Venda[] {
    const vendas: Venda[] = [];
    this.vendaCounter = 1;

    const lines = buffer.toString("utf8").split(/\r?\n/);

    for (const line of lines) {
      if (line.trim().length === 0) continue;

      // --- CORREÇÃO 2: Limpa a linha de tabulações ANTES de criar o buffer ---
      const cleanedLine = line.replace(/\t/g, '');
      // -------------------------------------------------------------------------
      
      // Verificação de segurança: A linha deve ter no mínimo 131 caracteres de largura fixa
      if (cleanedLine.length < 131) {
          console.warn(`Aviso: Linha curta (${cleanedLine.length} chars) ou incompleta. Pulando.`);
          continue;
      }
      
      const lineBuffer = Buffer.from(cleanedLine, "utf8");
      
      try {
        const venda = this.parseRecord(lineBuffer);
        vendas.push(venda);
      } catch (error) {
        // Loga a linha que causou o erro para facilitar a depuração no arquivo .dat
        console.error(`Erro ao processar linha: "${cleanedLine}"`, error);
      }
    }

    return vendas;
  }
}

class VendasController {
  private parser: DatFileParser;

  constructor() {
    this.parser = new DatFileParser();
  }

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

  upload = async (request: Request, response: Response, next: NextFunction) => {
    try {
      // É necessário ter o middleware 'multer' ou similar configurado para que request.file exista
      const file = (request as any).file; 

      if (!file) {
        return response.status(400).json({
          error: 'Nenhum arquivo enviado',
          message: 'Por favor, envie um arquivo .dat'
        });
      }

      const buffer = file.buffer;
      const vendas = this.parser.parse(buffer);

      return response.status(200).json(vendas);
    } catch (error) {
      return next(error);
    }
  }

  processar = async (request: Request, response: Response, next: NextFunction) => {
    try {
      const filename = request.query.filename as string || 'vendas_29-09-2025.dat';
      const filePath = path.join(process.cwd(), filename);

      if (!fs.existsSync(filePath)) {
        return response.status(404).json({
          error: 'Arquivo não encontrado'
        });
      }

      const buffer = fs.readFileSync(filePath);
      const vendas = this.parser.parse(buffer);

      return response.status(200).json({
        message: 'Vendas processadas com sucesso',
        total: vendas.length,
        vendas: vendas
      });
    } catch (error) {
      return next(error);
    }
  }
}

export { VendasController };