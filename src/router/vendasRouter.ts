import { Router } from 'express';
import multer from 'multer';
import { VendasController } from '../controller/vendasController';

const vendasRouter = Router();
const vendasController = new VendasController();

// Configurar multer para upload de arquivos em memória
const upload = multer({
    storage: multer.memoryStorage(),
    fileFilter: (req, file, cb) => {
        // Aceitar apenas arquivos .dat
        if (file.originalname.endsWith('.dat')) {
            cb(null, true);
        } else {
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

export { vendasRouter }