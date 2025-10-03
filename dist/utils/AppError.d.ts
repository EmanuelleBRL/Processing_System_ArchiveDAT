declare class AppError {
    message: string;
    status: number;
    constructor(message: string, status?: number);
}
export { AppError };
