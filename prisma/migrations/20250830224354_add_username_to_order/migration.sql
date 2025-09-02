-- AlterTable
ALTER TABLE "public"."Order" ADD COLUMN     "username" TEXT[] DEFAULT ARRAY[]::TEXT[];
