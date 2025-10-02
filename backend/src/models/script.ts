import { Request, Response, NextFunction } from "express";
import * as fs from 'fs';
import * as path from 'path';

interface Produto {
  id: number;
  nome: string;
  valor_unitario: number;
}

interface Cliente {
  id: number;
  nome: string;
}

interface Venda {
  id_venda: number;
  data_venda: string;
  quantidade: number;
  produto: Produto;
  cliente: Cliente;
  valor_total_venda: number;
}

class DatFileParser {
  private readonly fieldPositions = {
    codigoProduto: { start: 0, length: 4 },
    nomeProduto: { start: 4, length: 50 },
    codigoCliente: { start: 54, length: 4 },
    nomeCliente: { start: 58, length: 50 },
    quantidade: { start: 108, length: 3 },
    valorUnitario: { start: 111, length: 10 },
    data: { start: 121, length: 10 }
  };

  private vendaCounter = 1;

  private extractField(buffer: Buffer, start: number, length: number): string {
    return buffer.toString('utf8', start, start + length).trim();
  }

  private parseRecord(lineBuffer: Buffer): Venda {
    const codigoProduto = this.extractField(lineBuffer, this.fieldPositions.codigoProduto.start, this.fieldPositions.codigoProduto.length);
    const nomeProduto = this.extractField(lineBuffer, this.fieldPositions.nomeProduto.start, this.fieldPositions.nomeProduto.length);
    const codigoCliente = this.extractField(lineBuffer, this.fieldPositions.codigoCliente.start, this.fieldPositions.codigoCliente.length);
    const nomeCliente = this.extractField(lineBuffer, this.fieldPositions.nomeCliente.start, this.fieldPositions.nomeCliente.length);
    const quantidadeStr = this.extractField(lineBuffer, this.fieldPositions.quantidade.start, this.fieldPositions.quantidade.length);
    const valorUnitarioStr = this.extractField(lineBuffer, this.fieldPositions.valorUnitario.start, this.fieldPositions.valorUnitario.length);
    const data = this.extractField(lineBuffer, this.fieldPositions.data.start, this.fieldPositions.data.length);

    const quantidade = parseInt(quantidadeStr, 10);
    const valorUnitario = parseFloat(valorUnitarioStr) / 100;
    const valorTotal = parseFloat((quantidade * valorUnitario).toFixed(2));

    return {
      id_venda: this.vendaCounter++,
      data_venda: data,
      quantidade: quantidade,
      produto: {
        id: parseInt(codigoProduto, 10),
        nome: nomeProduto,
        valor_unitario: valorUnitario
      },
      cliente: {
        id: parseInt(codigoCliente, 10),
        nome: nomeCliente
      },
      valor_total_venda: valorTotal
    };
  }

  parse(buffer: Buffer): Venda[] {
    const vendas: Venda[] = [];
    this.vendaCounter = 1;
    let offset = 0;

    while (offset < buffer.length) {
      let endOfLine = offset;
      while (endOfLine < buffer.length && buffer[endOfLine] !== 0x0A) {
        endOfLine++;
      }

      if (endOfLine > offset) {
        const lineBuffer = buffer.slice(offset, endOfLine);
        try {
          const venda = this.parseRecord(lineBuffer);
          vendas.push(venda);
        } catch (error) {
          console.error(`Erro ao processar linha no offset ${offset}:`, error);
        }
      }

      offset = endOfLine + 1;
    }

    return vendas;
  }
}

class VendasController {
  private parser: DatFileParser;

  constructor() {
    this.parser = new DatFileParser();
  }

  // GET - lê arquivo já existente no servidor
  index = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const filename = req.query.filename as string || 'vendas_29-09-2025.dat';
      const filePath = path.join(process.cwd(), filename);

      if (!fs.existsSync(filePath)) {
        return res.status(404).json({
          error: 'Arquivo não encontrado',
          message: `O arquivo ${filename} não foi encontrado no servidor`
        });
      }

      const buffer = fs.readFileSync(filePath);
      const vendas = this.parser.parse(buffer);
      return res.status(200).json(vendas);

    } catch (error) {
      return next(error);
    }
  }

  // POST - recebe upload (com multer)
  upload = async (req: Request, res: Response, next: NextFunction) => {
    try {
      console.log("req.file:", req.file);

      const file = req.file;
      if (!file) {
        return res.status(400).json({
          error: 'Nenhum arquivo enviado',
          message: 'Por favor, envie um arquivo .dat'
        });
      }

      const buffer = file.buffer;
      const vendas = this.parser.parse(buffer);

      return res.status(200).json(vendas);

    } catch (error) {
      return next(error);
    }
  }

  // POST - processar arquivo do servidor
  processar = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const filename = req.query.filename as string || 'vendas_29-09-2025.dat';
      const filePath = path.join(process.cwd(), filename);

      if (!fs.existsSync(filePath)) {
        return res.status(404).json({ error: 'Arquivo não encontrado' });
      }

      const buffer = fs.readFileSync(filePath);
      const vendas = this.parser.parse(buffer);

      return res.status(200).json({
        message: 'Vendas processadas com sucesso',
        total: vendas.length,
        vendas
      });

    } catch (error) {
      return next(error);
    }
  }
}

export { VendasController };
