/*
  Warnings:

  - You are about to drop the column `redeemed` on the `Voucher` table. All the data in the column will be lost.
  - You are about to drop the column `shopifyOrderId` on the `Voucher` table. All the data in the column will be lost.
  - Added the required column `orderId` to the `Voucher` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "Voucher_id_key";

-- AlterTable
ALTER TABLE "Voucher" DROP COLUMN "redeemed",
DROP COLUMN "shopifyOrderId",
ADD COLUMN     "orderId" TEXT NOT NULL,
ADD COLUMN     "used" BOOLEAN NOT NULL DEFAULT false;
