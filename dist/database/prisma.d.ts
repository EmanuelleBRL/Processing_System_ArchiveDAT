import { PrismaClient } from "@prisma/client";
declare const prisma: PrismaClient<{
    log: "query"[];
}, "query", import("@prisma/client/runtime/library").DefaultArgs>;
export { prisma };
