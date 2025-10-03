import { Request, Response, NextFunction } from "express";
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
declare class VendasController {
    private parser;
    constructor();
    listarVendas: (request: Request, response: Response, next: NextFunction) => Promise<void | Response<any, Record<string, any>>>;
    private salvarVendasNoBanco;
    index: (request: Request, response: Response, next: NextFunction) => Promise<void | Response<any, Record<string, any>>>;
    upload: (request: Request, response: Response, next: NextFunction) => Promise<void | Response<any, Record<string, any>>>;
    processar: (request: Request, response: Response, next: NextFunction) => Promise<void | Response<any, Record<string, any>>>;
}
export { VendasController };
