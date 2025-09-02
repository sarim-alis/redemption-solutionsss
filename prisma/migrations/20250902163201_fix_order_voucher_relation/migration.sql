/*
  Warnings:

  - You are about to drop the column `shopifyOrderId` on the `Voucher` table. All the data in the column will be lost.
  - Added the required column `orderId` to the `Voucher` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "public"."Voucher" DROP CONSTRAINT "Voucher_shopifyOrderId_fkey";

-- DropIndex
DROP INDEX "public"."Order_shopifyOrderId_key";

-- AlterTable
ALTER TABLE "public"."Voucher" DROP COLUMN "shopifyOrderId",
ADD COLUMN     "orderId" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "public"."Voucher" ADD CONSTRAINT "Voucher_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "public"."Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
