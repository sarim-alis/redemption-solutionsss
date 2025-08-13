/*
  Warnings:

  - The `locationUsed` column on the `Order` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `redeemedAt` column on the `Order` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "Order" DROP COLUMN "locationUsed",
ADD COLUMN     "locationUsed" TEXT[],
DROP COLUMN "redeemedAt",
ADD COLUMN     "redeemedAt" TIMESTAMP(3)[];
