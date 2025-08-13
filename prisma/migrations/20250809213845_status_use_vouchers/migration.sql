/*
  Warnings:

  - The `statusUse` column on the `Order` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "Order" DROP COLUMN "statusUse",
ADD COLUMN     "statusUse" BOOLEAN NOT NULL DEFAULT false;
