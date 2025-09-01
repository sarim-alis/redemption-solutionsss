/*
  Warnings:

  - The `remainingBalance` column on the `Order` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "public"."Order" ADD COLUMN     "cashHistory" DOUBLE PRECISION[] DEFAULT ARRAY[]::DOUBLE PRECISION[],
DROP COLUMN "remainingBalance",
ADD COLUMN     "remainingBalance" DOUBLE PRECISION;
