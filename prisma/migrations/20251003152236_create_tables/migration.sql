-- CreateTable
CREATE TABLE "ArquivoHistorico" (
    "id" SERIAL NOT NULL,
    "nomeArquivo" TEXT NOT NULL,
    "dataProcessamento" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dataVenda" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ArquivoHistorico_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ArquivoHistorico_nomeArquivo_key" ON "ArquivoHistorico"("nomeArquivo");
