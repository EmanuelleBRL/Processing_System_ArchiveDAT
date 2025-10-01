import { Request, Response, NextFunction } from "express";

class ProductsController {

    index(request: Request, response: Response, next: NextFunction) {
        try {
            return response.status(201).json({message: "ok"})
        } catch (error) {
            return next(error)
        }
    }
}

export { ProductsController }