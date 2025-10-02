import { Request, Response, NextFunction } from "express";
import * as fs from 'fs';
import * as path from 'path';

import { ReadLine } from "readline";
import { Readline } from "readline/promises";
import readline from 'readline';
import { buffer } from "stream/consumers";

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
  // Posições corretas baseadas no layout do arquivo
  // OBS: Índices começam em 0 na programação
  private readonly fieldPositions = {
    codigoProduto: { start: 0, length: 4 },      // Posição 1-4 do arquivo
    nomeProduto: { start: 4, length: 50 },       // Posição 5-54 do arquivo
    codigoCliente: { start: 54, length: 4 },     // Posição 55-58 do arquivo
    nomeCliente: { start: 58, length: 50 },      // Posição 59-108 do arquivo
    quantidade: { start: 108, length: 3 },       // Posição 109-111 do arquivo
    valorUnitario: { start: 111, length: 10 },   // Posição 112-121 do arquivo
    data: { start: 121, length: 10 }             // Posição 122-131 do arquivo
  };
  
  //metodo para chamarmos o parseRecord
  //linha bufferizada do tipo venda
  public getParseRecord(lineBuffer : Buffer) : Venda{
    return this.parseRecord(lineBuffer);

  }
  private vendaCounter = 1;

  private extractField(buffer: Buffer, start: number, length: number): string {
    const slice = buffer.slice(start, start + length);
    return slice.toString('utf8').trim();
  }

  private parseRecord(lineBuffer: Buffer): Venda {
    const codigoProduto = this.extractField(
      lineBuffer,
      this.fieldPositions.codigoProduto.start,
      this.fieldPositions.codigoProduto.length
    );

    const nomeProduto = this.extractField(
      lineBuffer,
      this.fieldPositions.nomeProduto.start,
      this.fieldPositions.nomeProduto.length
    );

    const codigoCliente = this.extractField(
      lineBuffer,
      this.fieldPositions.codigoCliente.start,
      this.fieldPositions.codigoCliente.length
    );

    const nomeCliente = this.extractField(
      lineBuffer,
      this.fieldPositions.nomeCliente.start,
      this.fieldPositions.nomeCliente.length
    );

    const quantidadeStr = this.extractField(
      lineBuffer,
      this.fieldPositions.quantidade.start,
      this.fieldPositions.quantidade.length
    );

    const valorUnitarioStr = this.extractField(
      lineBuffer,
      this.fieldPositions.valorUnitario.start,
      this.fieldPositions.valorUnitario.length
    );

    const data = this.extractField(
      lineBuffer,
      this.fieldPositions.data.start,
      this.fieldPositions.data.length
    );

    // Conversões numéricas
    const quantidade = parseInt(quantidadeStr, 10);
    const valorUnitario = parseFloat(valorUnitarioStr);
    const valorTotal = parseFloat((quantidade * valorUnitario).toFixed(2));

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
        id: parseInt(codigoCliente, 10),
        nome: nomeCliente
      },
      valor_total_venda: valorTotal
    };

    return venda;
  }
   

  //percorre bit a bit nao e muito legal,fora que tem que gerenciar offsets manualmente
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

  index = async (request: Request, response: Response, next: NextFunction) => {
    try {
      // Pode receber o caminho do arquivo via query ou usar um padrão
      const filename = request.query.filename as string || 'vendas_29-09-2025.dat';
      const filePath = path.join(process.cwd(), filename);

      // Verifica se o arquivo existe
      if (!fs.existsSync(filePath)) {
        return response.status(404).json({
          error: 'Arquivo não encontrado',
          message: `O arquivo ${filename} não foi encontrado no servidor`
        });
      }
      
      //constante que possue uma interface de leitura
  
      /*
      const r1 = readline.createInterface({
        input : fs.createReadStream(filePath),
        crlfDelay: Infinity

      }) */
      
      //leitura atual com streams
      //logica de loteamento
      //criar um array repository que ira armazenar temporariamente os lotes e enviar para o banco

      /*
      const vendas : Venda[] = [];
      const lote : Venda [] = [];
      const TAMANHO_LOTE = 500;

    

      for await (const line of r1){
        const buffer = Buffer.from(line, 'utf8');

        const venda = this.parser.getParseRecord(buffer);
        lote.push(venda);

        if(lote.length >= TAMANHO_LOTE){
          await vendasRepository.insertMany(lote.splice(0, TAMANHO_LOTE));
        }
        
        if (lote.length > 0){
          await vendasRepository.insertMany(lote);
        }
        
      }
      
      */
     // return response.status(200).json(venda);

      // Lê o arquivo usando Buffer
      const buffer = fs.readFileSync(filePath);

      // Processa o arquivo e converte para JSON
      const vendas = this.parser.parse(buffer);

      // Retorna os dados
      return response.status(200).json(vendas);

    } catch (error) {
      return next(error);
    }
  }

  // Método alternativo para upload de arquivo
  upload = async (request: Request, response: Response, next: NextFunction) => {
    try {
      // Debug: veja o que está chegando
      console.log('request.file:', request.file);
      console.log('request.files:', request.files);
      console.log('request.body:', request.body);

      // Caso use multer ou outro middleware de upload
      const file = request.file;

      if (!file) {
        return response.status(400).json({
          error: 'Nenhum arquivo enviado',
          message: 'Por favor, envie um arquivo .dat',
          debug: {
            hasFile: !!request.file,
            hasFiles: !!request.files,
            bodyKeys: Object.keys(request.body || {})
          }
        });
      }

      // Lê o buffer do arquivo enviado
      const buffer = file.buffer;

      // Processa o arquivo
      const vendas = this.parser.parse(buffer);

      // Retorna os dados
      return response.status(200).json(vendas);

    } catch (error) {
      return next(error);
    }
  }

  // Método para processar e salvar no banco de dados
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

      // Aqui você pode inserir no banco de dados
      // await vendasRepository.insertMany(vendas);

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

// ============================================
// EXEMPLO DE ROTAS (vendasRouter)
// ============================================
/*
import { Router } from "express";
import { VendasController } from "@/controller/vendasController";
import multer from 'multer';

const vendasRouter = Router();
const vendasController = new VendasController();

// Configuração do multer para receber arquivo em memória
const upload = multer({ storage: multer.memoryStorage() });

// Rota GET - Lê arquivo que já está no servidor
vendasRouter.get("/", vendasController.index);

// Rota POST - Recebe arquivo via upload (para testar no Insomnia)
vendasRouter.post("/upload", upload.single('file'), vendasController.upload);

// Rota POST - Processa arquivo e retorna dados formatados
vendasRouter.post("/processar", upload.single('file'), vendasController.processar);

export { vendasRouter };

// ============================================
// COMO TESTAR NO INSOMNIA/POSTMAN
// ============================================
// 
// POST http://localhost:3000/vendas/upload
// 
// 1. Selecione método: POST
// 2. Body → Multipart Form
// 3. Adicione campo:
//    - Name: file
//    - Type: File
//    - Value: Selecione seu arquivo .dat
// 4. Send
//
*/