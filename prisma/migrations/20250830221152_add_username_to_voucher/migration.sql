-- AlterTable
ALTER TABLE "public"."Voucher" ADD COLUMN     "username" TEXT[] DEFAULT ARRAY[]::TEXT[];
