"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
require("dotenv/config");
const router_1 = require("./router");
const AppError_1 = require("./utils/AppError");
const PORT = 3333;
const app = (0, express_1.default)();
app.use(express_1.default.json());
app.use(router_1.routes);
app.use((error, request, response, next) => {
    if (error instanceof AppError_1.AppError) {
        return response.status(error.status).json({
            status: "Error",
            message: error.message
        });
    }
    return response.status(500).json({
        status: "Error",
        message: "Internal server error"
    });
});
app.listen(PORT, () => {
    console.log(`Server is running in port ${PORT}`);
});
//# sourceMappingURL=server.js.map