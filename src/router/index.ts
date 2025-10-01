import { Router } from "express";
import { productsRouter } from "./productsRouter";

const routes = Router()

routes.use("/produtos", productsRouter)

export { routes }