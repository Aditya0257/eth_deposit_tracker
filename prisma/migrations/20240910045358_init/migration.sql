-- CreateTable
CREATE TABLE "Deposit" (
    "id" SERIAL NOT NULL,
    "blockNumber" INTEGER NOT NULL,
    "blockTimestamp" BIGINT NOT NULL,
    "fee" BIGINT NOT NULL,
    "hash" TEXT NOT NULL,
    "pubkey" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Deposit_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Deposit_hash_key" ON "Deposit"("hash");
