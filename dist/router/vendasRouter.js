"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.vendasRouter = void 0;
const express_1 = require("express");
const multer_1 = __importDefault(require("multer"));
const vendasController_1 = require("../controller/vendasController");
const vendasRouter = (0, express_1.Router)();
exports.vendasRouter = vendasRouter;
const vendasController = new vendasController_1.VendasController();
// Configurar multer para upload de arquivos em memória
const upload = (0, multer_1.default)({
    storage: multer_1.default.memoryStorage(),
    fileFilter: (req, file, cb) => {
        // Aceitar apenas arquivos .dat
        if (file.originalname.endsWith('.dat')) {
            cb(null, true);
        }
        else {
            cb(new Error('Apenas arquivos .dat são permitidos'));
        }
    }
});
// RF06-RF10: Endpoint principal - GET /vendas
// Retorna todas as vendas do banco com cálculo do valor total
vendasRouter.get('/', vendasController.listarVendas);
// RF01-RF02: Upload de arquivo .dat
// POST /vendas/upload (multipart/form-data)
vendasRouter.post('/upload', upload.single('file'), vendasController.upload);
// Endpoint auxiliar: processar arquivo do servidor
// GET /vendas/processar?filename=vendas_29-09-2025.dat
vendasRouter.get('/processar', vendasController.processar);
// Endpoint auxiliar: visualizar conteúdo do arquivo sem salvar
// GET /vendas/preview?filename=vendas_29-09-2025.dat
vendasRouter.get('/preview', vendasController.index);
//# sourceMappingURL=vendasRouter.js.map