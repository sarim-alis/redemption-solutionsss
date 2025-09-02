/*
  Warnings:

  - You are about to drop the column `address` on the `Employee` table. All the data in the column will be lost.
  - You are about to drop the `_EmployeeLocations` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `locationId` to the `Employee` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "public"."_EmployeeLocations" DROP CONSTRAINT "_EmployeeLocations_A_fkey";

-- DropForeignKey
ALTER TABLE "public"."_EmployeeLocations" DROP CONSTRAINT "_EmployeeLocations_B_fkey";

-- AlterTable
ALTER TABLE "public"."Employee" DROP COLUMN "address",
ADD COLUMN     "locationId" TEXT NOT NULL;

-- DropTable
DROP TABLE "public"."_EmployeeLocations";

-- AddForeignKey
ALTER TABLE "public"."Employee" ADD CONSTRAINT "Employee_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "public"."Location"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
