-- CreateTable
CREATE TABLE "produtos" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nome" TEXT NOT NULL,
    "valor_unitario" DECIMAL NOT NULL
);

-- CreateTable
CREATE TABLE "clientes" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nome" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "Vendas" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "produtos_id" INTEGER NOT NULL,
    "clinte_id" INTEGER NOT NULL,
    "quantidade" INTEGER NOT NULL,
    "data_venda " DATETIME NOT NULL,
    CONSTRAINT "Vendas_produtos_id_fkey" FOREIGN KEY ("produtos_id") REFERENCES "produtos" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Vendas_clinte_id_fkey" FOREIGN KEY ("clinte_id") REFERENCES "clientes" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
