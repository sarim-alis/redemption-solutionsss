/*
  Warnings:

  - You are about to drop the column `productType` on the `Order` table. All the data in the column will be lost.
  - You are about to drop the column `productId` on the `Voucher` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Voucher" DROP CONSTRAINT "Voucher_productId_fkey";

-- AlterTable
ALTER TABLE "Order" DROP COLUMN "productType";

-- AlterTable
ALTER TABLE "Voucher" DROP COLUMN "productId";
