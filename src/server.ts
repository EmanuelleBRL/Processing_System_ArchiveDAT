import express, { NextFunction, Request, Response } from "express";
import 'dotenv/config';
import cors from 'cors'; 
import { routes } from "./router";
import { AppError } from "./utils/AppError";

const PORT = process.env.PORT || 3333;

const app = express();

app.use(express.json());

app.use(cors()); 

// Suas rotas
app.use(routes)

app.use((error: Error, request: Request, response: Response, next: NextFunction) => {
    if (error instanceof AppError) {
        return response.status(error.status).json({
            status: "Error",
            message: error.message
        })
    }

    console.error(error); 

    return response.status(500).json({
        status: "Error",
        message: "Internal server error"
    })
})

app.listen(PORT, () => {
    console.log(`Server is running in port ${PORT}`)
})