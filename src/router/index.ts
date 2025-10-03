import { Router } from "express";
import { productsRouter } from "./productsRouter";
import { vendasRouter } from "./vendasRouter";

const routes = Router()

routes.use("/produtos", productsRouter)

routes.use("/vendas", vendasRouter)

export { routes }