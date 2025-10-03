import { Router } from "express";
import { vendasRouter } from "./vendasRouter";

const routes = Router()

routes.use("/vendas", vendasRouter)

export { routes }