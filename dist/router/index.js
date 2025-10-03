"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.routes = void 0;
const express_1 = require("express");
const vendasRouter_1 = require("./vendasRouter");
const routes = (0, express_1.Router)();
exports.routes = routes;
routes.use("/vendas", vendasRouter_1.vendasRouter);
//# sourceMappingURL=index.js.map