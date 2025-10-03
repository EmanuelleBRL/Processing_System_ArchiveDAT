"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.productsRouter = void 0;
const express_1 = require("express");
const productsController_1 = require("../controller/productsController");
const productsRouter = (0, express_1.Router)();
exports.productsRouter = productsRouter;
const productsController = new productsController_1.ProductsController();
productsRouter.get("/", productsController.index);
//# sourceMappingURL=productsRouter.js.map