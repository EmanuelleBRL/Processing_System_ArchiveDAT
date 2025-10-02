import { Router } from "express";
import { ProductsController } from "../controller/productsController";

const productsRouter = Router()
const productsController = new ProductsController()

productsRouter.get("/", productsController.index)

export { productsRouter }