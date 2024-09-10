/*
  Warnings:

  - You are about to alter the column `blockTimestamp` on the `Deposit` table. The data in that column could be lost. The data in that column will be cast from `BigInt` to `Integer`.
  - You are about to alter the column `fee` on the `Deposit` table. The data in that column could be lost. The data in that column will be cast from `BigInt` to `Integer`.

*/
-- DropIndex
DROP INDEX "Deposit_hash_key";

-- AlterTable
ALTER TABLE "Deposit" ALTER COLUMN "blockTimestamp" SET DATA TYPE INTEGER,
ALTER COLUMN "fee" SET DATA TYPE INTEGER;
