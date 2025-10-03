import express, { NextFunction, Request, Response } from "express";
import 'dotenv/config';
import cors from 'cors'; // 1. Importe o pacote cors
import { routes } from "./router";
import { AppError } from "./utils/AppError";

const PORT = process.env.PORT || 3333; // Boa prática: use a porta do ambiente ou 3333 como padrão

const app = express();

app.use(express.json());

// 2. Use o middleware do cors ANTES de definir as rotas
// Isso irá permitir que qualquer domínio acesse sua API.
app.use(cors()); 

// 3. Suas rotas
app.use(routes)

app.use((error: Error, request: Request, response: Response, next: NextFunction) => {
    if (error instanceof AppError) {
        return response.status(error.status).json({
            status: "Error",
            message: error.message
        })
    }

    console.error(error); // Adicione um log do erro para facilitar o debug

    return response.status(500).json({
        status: "Error",
        message: "Internal server error"
    })
})

app.listen(PORT, () => {
    console.log(`Server is running in port ${PORT}`)
})
