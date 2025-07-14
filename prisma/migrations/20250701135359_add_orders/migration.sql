/*
  Warnings:

  - Added the required column `itemQuantity` to the `Order` table without a default value. This is not possible if the table is not empty.
  - Added the required column `processedAt` to the `Order` table without a default value. This is not possible if the table is not empty.
  - Made the column `totalPrice` on table `Order` required. This step will fail if there are existing NULL values in that column.
  - Made the column `currency` on table `Order` required. This step will fail if there are existing NULL values in that column.
  - Made the column `status` on table `Order` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "customerName" TEXT,
ADD COLUMN     "fulfillmentStatus" TEXT,
ADD COLUMN     "itemQuantity" INTEGER NOT NULL,
ADD COLUMN     "lineItems" JSONB,
ADD COLUMN     "processedAt" TIMESTAMP(3) NOT NULL,
ALTER COLUMN "totalPrice" SET NOT NULL,
ALTER COLUMN "currency" SET NOT NULL,
ALTER COLUMN "status" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "Voucher" ADD CONSTRAINT "Voucher_shopifyOrderId_fkey" FOREIGN KEY ("shopifyOrderId") REFERENCES "Order"("shopifyOrderId") ON DELETE RESTRICT ON UPDATE CASCADE;
