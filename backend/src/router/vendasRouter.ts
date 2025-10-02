import { Router } from "express";
import { VendasController } from "../controller/vendasController";
import multer from 'multer';

const vendasRouter = Router();
const vendasController = new VendasController();

// Configuração do multer para receber arquivo em memória (Buffer)
const upload = multer({ storage: multer.memoryStorage() });

vendasRouter.post(
  "/upload",
  upload.single("file"),
  vendasController.upload.bind(vendasController)
);

export { vendasRouter };