/*
  Warnings:

  - You are about to drop the column `orderId` on the `Voucher` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[shopifyOrderId]` on the table `Order` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `shopifyOrderId` to the `Voucher` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "public"."Voucher" DROP CONSTRAINT "Voucher_orderId_fkey";

-- AlterTable
ALTER TABLE "public"."Voucher" DROP COLUMN "orderId",
ADD COLUMN     "shopifyOrderId" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Order_shopifyOrderId_key" ON "public"."Order"("shopifyOrderId");

-- AddForeignKey
ALTER TABLE "public"."Voucher" ADD CONSTRAINT "Voucher_shopifyOrderId_fkey" FOREIGN KEY ("shopifyOrderId") REFERENCES "public"."Order"("shopifyOrderId") ON DELETE RESTRICT ON UPDATE CASCADE;
